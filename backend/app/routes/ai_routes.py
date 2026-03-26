from __future__ import annotations
import uuid
from datetime import datetime
from typing import Any, Dict

import pandas as pd
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel

from app.database import ai_collection, reports_collection, sdcc_collection
from app.dependencies import get_current_user
from app.services.sdcc.models import get_evaluator
from app.services.sdcc.orchestrator import run_sdcc_pipeline
from app.services.sdcc.metrics_calculator import calculate_metrics

router = APIRouter()

# ── Schemas ────────────────────────────────────────────────────────────────────

class ConnectorSchema(BaseModel):
    type: str
    endpoint: str
    headers: Dict[str, Any] = {}


class AISystemSchema(BaseModel):
    name: str
    description: str
    domain: str
    connector: ConnectorSchema


# ── Register AI system ─────────────────────────────────────────────────────────

@router.post("/register-ai")
def register_ai_system(ai_data: AISystemSchema, current_user=Depends(get_current_user)):
    existing = ai_collection.find_one({
        "name":     ai_data.name,
        "owner_id": str(current_user["_id"]),
    })
    if existing:
        raise HTTPException(status_code=400, detail="AI system already registered.")

    ai_collection.insert_one({
        "name":        ai_data.name,
        "description": ai_data.description,
        "domain":      ai_data.domain,
        "connector":   ai_data.connector.dict(),
        "owner_id":    str(current_user["_id"]),
        "created_at":  datetime.utcnow(),
        "status":      "active",
        "audit_runs":  0,
    })
    return {"message": "AI system registered successfully"}


# ── List AI systems ────────────────────────────────────────────────────────────

@router.get("/ai-systems")
def list_ai_systems(current_user=Depends(get_current_user)):
    systems = list(ai_collection.find(
        {"owner_id": str(current_user["_id"])},
        {"_id": 0, "connector.headers": 0},
    ))
    for s in systems:
        if isinstance(s.get("created_at"), datetime):
            s["created_at"] = s["created_at"].isoformat()
    return {"systems": systems}


# ── Ingest logs ────────────────────────────────────────────────────────────────

def _validate_columns(df: pd.DataFrame) -> dict:
    """
    Check that at least one of input/output columns is present.
    Returns a warnings dict.
    """
    lower_cols = [c.lower() for c in df.columns]

    INPUT_HINTS  = {"input", "prompt", "query", "question", "instruction",
                    "step_name", "task", "user_message"}
    OUTPUT_HINTS = {"output", "response", "answer", "completion", "result",
                    "summary", "prediction", "generated"}

    has_input  = any(any(h in c for h in INPUT_HINTS)  for c in lower_cols)
    has_output = any(any(h in c for h in OUTPUT_HINTS) for c in lower_cols)

    warnings = []
    if not has_input and not has_output:
        warnings.append(
            "No input or output columns detected. Rename your columns to include "
            "'input'/'prompt'/'query' and 'output'/'response'/'answer' for "
            "accurate model detection and metric computation."
        )
    elif not has_input:
        warnings.append(
            "No input column detected. Add an 'input' or 'prompt' column for "
            "richer metric computation (answer relevance, context recall, etc.)."
        )
    elif not has_output:
        warnings.append(
            "No output column detected. Add an 'output' or 'response' column — "
            "this is required for all text-quality metrics."
        )

    return {
        "has_input":  has_input,
        "has_output": has_output,
        "warnings":   warnings,
    }


@router.post("/sdcc/ingest/{ai_name}")
def ingest_logs(
    ai_name: str,
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
):
    result = run_sdcc_pipeline(ai_name, file, current_user)

    # Reconstruct df briefly to validate columns
    sample = result.get("sample_records", [])
    if sample:
        df_check = pd.DataFrame(sample)
        col_check = _validate_columns(df_check)
        result["column_warnings"] = col_check["warnings"]
        result["has_input_col"]   = col_check["has_input"]
        result["has_output_col"]  = col_check["has_output"]
    else:
        result["column_warnings"] = []
        result["has_input_col"]   = False
        result["has_output_col"]  = False

    sdcc_collection.update_one(
        {"ai_name": ai_name, "owner_id": str(current_user["_id"])},
        {"$set": {
            **result,
            "ai_name":    ai_name,
            "owner_id":   str(current_user["_id"]),
            "updated_at": datetime.utcnow(),
        }},
        upsert=True,
    )

    return {k: v for k, v in result.items() if k != "sample_records"}


# ── SDCC status ────────────────────────────────────────────────────────────────

@router.get("/sdcc/status/{ai_name}")
def get_sdcc_status(ai_name: str, current_user=Depends(get_current_user)):
    doc = sdcc_collection.find_one(
        {"ai_name": ai_name, "owner_id": str(current_user["_id"])},
        {"_id": 0, "sample_records": 0},
    )
    if not doc:
        raise HTTPException(
            status_code=404,
            detail="No ingested data found. Please upload logs first.",
        )
    return doc

# ── Principle descriptions ─────────────────────────────────────────────────────

_PRINCIPLE_DESCRIPTIONS: dict[str, str] = {
    "Fairness": (
        "AI solutions should be designed to reduce or eliminate bias against individuals, "
        "communities, and groups. Ongoing bias monitoring and equal error rates across groups "
        "must be maintained across the full model lifecycle."
    ),
    "Transparency": (
        "AI solutions should include responsible disclosure to provide stakeholders with a "
        "clear understanding of what is happening in each solution across the AI lifecycle, "
        "including training data sources, model architecture, and known limitations."
    ),
    "Explainability": (
        "AI solutions should be developed and delivered in a way that answers the questions "
        "of how and why a conclusion was drawn from the solution. Outputs must be interpretable "
        "to non-technical users, regulators, and affected individuals."
    ),
    "Accountability": (
        "Human oversight and responsibility should be embedded across the AI lifecycle to manage "
        "risk and comply with applicable laws and regulations. Clear governance structures, audit "
        "trails, and escalation procedures must assign and enforce accountability."
    ),
    "Data Integrity": (
        "Data used in AI solutions should be acquired in compliance with applicable laws and "
        "regulations and assessed for accuracy, completeness, appropriateness, and quality to "
        "drive trusted decisions. Robust data governance and lineage practices must be maintained."
    ),
    "Reliability": (
        "AI solutions should consistently operate in accordance with their intended purpose and "
        "scope and at the desired level of precision. Performance degradation, failures, and "
        "edge cases must be actively monitored and SLA compliance maintained."
    ),
    "Security": (
        "Robust and resilient practices should be implemented to safeguard AI solutions against "
        "bad actors, misinformation, or adverse events. A defence-in-depth approach covering "
        "input validation, output filtering, adversarial robustness, and continuous red-teaming."
    ),
    "Safety": (
        "AI solutions should be designed and implemented to safeguard against harm to people, "
        "businesses, and property. Safety must be embedded across the full AI lifecycle through "
        "proactive risk assessment, harm prevention controls, and human override mechanisms."
    ),
    "Privacy": (
        "AI solutions should be designed to comply with applicable privacy and data protection "
        "laws and regulations. Data minimisation, purpose limitation, consent management, "
        "anonymisation, and right-to-erasure must be embedded by design."
    ),
    "Sustainability": (
        "AI solutions should be designed to be energy efficient, reduce carbon emissions, and "
        "support a cleaner environment. Efficient model architectures, optimised training and "
        "inference pipelines, and responsible resource allocation reduce climate impact."
    ),
}

_COMPLIANCE_THRESHOLDS: dict[str, dict[str, int]] = {
    "classification":       {"EU_AI_Act": 75, "ISO_42001": 80, "NIST_AI_RMF": 70},
    "rag":                  {"EU_AI_Act": 70, "ISO_42001": 75, "NIST_AI_RMF": 65},
    "summarization":        {"EU_AI_Act": 70, "ISO_42001": 75, "NIST_AI_RMF": 65},
    "general_llm":          {"EU_AI_Act": 70, "ISO_42001": 75, "NIST_AI_RMF": 65},
    "automation":           {"EU_AI_Act": 80, "ISO_42001": 85, "NIST_AI_RMF": 75},
    "image_classification": {"EU_AI_Act": 75, "ISO_42001": 80, "NIST_AI_RMF": 70},
}

# Which library powers each metric — used in computation_notes
_METRIC_LIBRARY_MAP: dict[str, str] = {
    "rouge_l":            "rouge_score (fallback: n-gram overlap)",
    "rouge_1":            "rouge_score (fallback: n-gram overlap)",
    "rouge_2":            "rouge_score (fallback: n-gram overlap)",
    "bleu":               "sacrebleu (fallback: smoothed BLEU-4)",
    "bertscore":          "bert_score (fallback: sentence_transformers cosine similarity)",
    "faithfulness":       "sentence_transformers cosine similarity (fallback: Jaccard overlap)",
    "answer_relevance":   "sentence_transformers cosine similarity (fallback: Jaccard overlap)",
    "context_recall":     "unigram token recall",
    "hallucination_rate": "1 − faithfulness",
    "toxicity_rate":      "Detoxify classifier (fallback: keyword heuristic)",
    "safety_pass_rate":   "1 − toxicity_rate",
    "avg_coherence":      "sentence-length + TTR + discourse marker heuristic",
    "avg_perplexity":     "vocabulary entropy proxy",
    "roc_auc":            "scikit-learn roc_auc_score (fallback: N/A — needs label column)",
    "f1_score":           "scikit-learn f1_score (fallback: manual token overlap)",
    "precision":          "scikit-learn precision_score",
    "recall":             "scikit-learn recall_score",
    "class_balance":      "value_counts min/max ratio",
    "avg_confidence":     "mean of confidence/probability column",
    "step_success_rate":  "keyword inference from output text",
    "task_completion_rate": "keyword inference from output text",
    "error_rate":         "keyword inference from output text",
    "avg_step_latency_ms": "mean of latency column",
    "map_score":          "mean of map/confidence column (proxy)",
    "avg_iou":            "mean of iou column",
    "top_k_accuracy":     "proportion of outputs with confidence ≥ 0.5",
    "label_coverage":     "proportion of non-null label rows",
    "avg_inference_ms":   "mean of latency/inference_time column",
}


# ── Evaluate ───────────────────────────────────────────────────────────────────

@router.post("/evaluate/{ai_name}")
def evaluate_ai(ai_name: str, current_user=Depends(get_current_user)):
    sdcc_doc = sdcc_collection.find_one({
        "ai_name":  ai_name,
        "owner_id": str(current_user["_id"]),
    })
    if not sdcc_doc:
        raise HTTPException(
            status_code=404,
            detail="No ingested data found. Please upload logs first via /sdcc/ingest.",
        )

    model_type  = sdcc_doc.get("model_type",  "general_llm")
    logs_count  = sdcc_doc.get("logs_ingested", 0)
    dq_score    = sdcc_doc.get("data_quality_score", 0)
    struct_risk = sdcc_doc.get("structural_risk", "Unknown")
    diagnostics = sdcc_doc.get("diagnostics", {})
    det_conf    = sdcc_doc.get("detection_confidence", 0.0)
    sample_recs = sdcc_doc.get("sample_records", [])

    # ── Reconstruct DataFrame ──────────────────────────────────────────────────
    df = pd.DataFrame(sample_recs) if sample_recs else pd.DataFrame()

    # ── Compute metrics from raw text ──────────────────────────────────────────
    computed_values: dict = {}
    computation_notes: dict = {}

    if not df.empty:
        try:
            computed_values = calculate_metrics(model_type, df)
            # Build computation notes — which library/method powered each metric
            for metric_key, value in computed_values.items():
                library = _METRIC_LIBRARY_MAP.get(metric_key, "computed")
                status  = "computed" if value is not None else "unavailable (missing columns)"
                computation_notes[metric_key] = {
                    "library": library,
                    "status":  status,
                    "value":   round(value, 4) if value is not None else None,
                }
        except Exception as exc:
            # Never crash the evaluation — just flag it
            computation_notes["_error"] = str(exc)

    # ── Instantiate evaluator and compute TAF scores ──────────────────────────
    EvaluatorClass = get_evaluator(model_type)
    evaluator = EvaluatorClass()

    # model_metrics() now uses computed_values as primary source
    model_metrics = evaluator.model_metrics(df, computed=computed_values)

    # TAF principle scores
    principles = evaluator.taf_principles(diagnostics, logs_count, model_metrics, df=df)

    # Attach descriptions
    for name in principles:
        principles[name]["description"] = _PRINCIPLE_DESCRIPTIONS.get(name, "")

    overall = evaluator.clamp(
        sum(p["score"] for p in principles.values()) / max(len(principles), 1)
    )

    # Risk analysis
    risk_analysis = evaluator.compute_risk_analysis(
        principles, diagnostics, logs_count, model_metrics
    )
    risk_level = risk_analysis["overall_risk_level"]

    # Findings
    findings = evaluator.generate_findings(principles, model_metrics)

    # Framework compliance
    thr = _COMPLIANCE_THRESHOLDS.get(model_type, _COMPLIANCE_THRESHOLDS["general_llm"])
    framework_compliance = {
        "EU_AI_Act":   "Compliant"       if overall >= thr["EU_AI_Act"]   else "Conditional",
        "ISO_42001":   "Certified Ready" if overall >= thr["ISO_42001"]   else "Conditional",
        "NIST_AI_RMF": "Aligned"         if overall >= thr["NIST_AI_RMF"] else "Conditional",
        "KPMG_TAF":    "Assessed",
    }

    report_id  = str(uuid.uuid4())
    report_doc = {
        "report_id":            report_id,
        "ai_name":              ai_name,
        "model_type":           model_type,
        "model_label":          evaluator.LABEL,
        "detection_confidence": det_conf,
        "evaluated_at":         datetime.utcnow().isoformat(),
        "overall_score":        overall,
        "risk_level":           risk_level,
        "structural_risk":      struct_risk,
        "logs_evaluated":       logs_count,
        "data_quality_score":   dq_score,
        "trusted_ai_principles": principles,
        "diagnostics":          diagnostics,
        "model_metrics":        model_metrics,
        "computation_notes":    computation_notes,     # ← NEW: shows what was computed & how
        "findings":             findings,
        "risk_analysis":        risk_analysis,
        "recommendation":       sdcc_doc.get("recommendation", ""),
        "framework_compliance": framework_compliance,
        "column_warnings":      sdcc_doc.get("column_warnings", []),  # ← NEW: column hints
        "owner_id":             str(current_user["_id"]),
        "created_at":           datetime.utcnow(),
    }

    result = reports_collection.insert_one(report_doc)
    report_doc["_id"] = str(result.inserted_id)

    ai_collection.update_one(
        {"name": ai_name, "owner_id": str(current_user["_id"])},
        {"$inc": {"audit_runs": 1}},
    )

    return report_doc