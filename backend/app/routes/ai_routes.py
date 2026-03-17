"""
routes/ai_routes.py
====================
Routes:
  POST /register-ai              — register an AI system
  GET  /ai-systems               — list user's AI systems
  POST /sdcc/ingest/{ai_name}    — upload logs, detect model, run data quality check
  GET  /sdcc/status/{ai_name}    — current ingestion status
  POST /evaluate/{ai_name}       — compute TAF scores and produce a full report
"""

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

router = APIRouter()


# ── Schemas ───────────────────────────────────────────────────────────────────

class ConnectorSchema(BaseModel):
    type: str
    endpoint: str
    headers: Dict[str, Any] = {}


class AISystemSchema(BaseModel):
    name: str
    description: str
    domain: str
    connector: ConnectorSchema


# ── Register AI system ────────────────────────────────────────────────────────

@router.post("/register-ai")
def register_ai_system(ai_data: AISystemSchema, current_user=Depends(get_current_user)):
    existing = ai_collection.find_one({
        "name": ai_data.name,
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


# ── List AI systems ───────────────────────────────────────────────────────────

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


# ── Ingest logs ───────────────────────────────────────────────────────────────

@router.post("/sdcc/ingest/{ai_name}")
def ingest_logs(
    ai_name: str,
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
):
    result = run_sdcc_pipeline(ai_name, file, current_user)

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

    # Don't return the raw sample_records to the client — they can be large
    return {k: v for k, v in result.items() if k != "sample_records"}


# ── SDCC status ───────────────────────────────────────────────────────────────

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


# ── Evaluate ──────────────────────────────────────────────────────────────────

# KPMG TAF principle descriptions — universal across all model types
_PRINCIPLE_DESCRIPTIONS: dict[str, str] = {
    "Transparency": (
        "The AI system should be open about its capabilities, limitations, and how it makes decisions. "
        "Users and stakeholders must be able to understand what the system does and why."
    ),
    "Explainability": (
        "Decisions and outputs produced by the AI system must be interpretable and explainable to "
        "relevant stakeholders, including non-technical users, regulators, and affected individuals."
    ),
    "Fairness": (
        "The AI system must treat all individuals and groups equitably, avoiding discriminatory outcomes "
        "across protected characteristics such as gender, race, age, and socioeconomic status."
    ),
    "Accountability": (
        "Clear lines of responsibility must exist for AI system outcomes. Governance structures, audit "
        "trails, and human oversight mechanisms must be in place to assign and enforce accountability."
    ),
    "Data Integrity": (
        "The data used to train and operate the AI must be accurate, complete, representative, and free "
        "from harmful biases. Robust data governance and lineage practices must be maintained."
    ),
    "Reliability": (
        "The AI system must perform consistently and predictably under both normal and adversarial "
        "conditions. Performance degradation, failures, and edge cases must be actively monitored."
    ),
    "Security": (
        "The AI system must be resilient against adversarial attacks, data poisoning, model extraction, "
        "and other cyber threats. Security must be embedded throughout the AI lifecycle."
    ),
    "Privacy": (
        "Personal data used by the AI system must be collected, processed, and stored in compliance with "
        "privacy regulations (e.g., GDPR). Data minimisation and purpose limitation must be enforced."
    ),
    "Sustainability": (
        "The AI system should be designed to minimise environmental impact including compute resource "
        "consumption, carbon footprint, and energy usage across training and inference workloads."
    ),
    "Safety": (
        "AI solutions should be designed and implemented to safeguard against harm to people, "
        "businesses, and property. Safety must be embedded across the full AI lifecycle through "
        "proactive risk assessment, harm prevention controls, and human override mechanisms."
    ),
}

# Regulatory compliance thresholds differ by model type because higher-risk
# applications (automation taking real actions) face a higher bar.
_COMPLIANCE_THRESHOLDS: dict[str, dict[str, int]] = {
    "classification":       {"EU_AI_Act": 75, "ISO_42001": 80, "NIST_AI_RMF": 70},
    "rag":                  {"EU_AI_Act": 70, "ISO_42001": 75, "NIST_AI_RMF": 65},
    "summarization":        {"EU_AI_Act": 70, "ISO_42001": 75, "NIST_AI_RMF": 65},
    "general_llm":          {"EU_AI_Act": 70, "ISO_42001": 75, "NIST_AI_RMF": 65},
    "automation":           {"EU_AI_Act": 80, "ISO_42001": 85, "NIST_AI_RMF": 75},
    "image_classification": {"EU_AI_Act": 75, "ISO_42001": 80, "NIST_AI_RMF": 70},
}


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

    model_type   = sdcc_doc.get("model_type", "general_llm")
    logs_count   = sdcc_doc.get("logs_ingested", 0)
    dq_score     = sdcc_doc.get("data_quality_score", 0)
    struct_risk  = sdcc_doc.get("structural_risk", "Unknown")
    diagnostics  = sdcc_doc.get("diagnostics", {})
    det_conf     = sdcc_doc.get("detection_confidence", 0.0)
    sample_recs  = sdcc_doc.get("sample_records", [])

    # Reconstruct DataFrame for model-specific metric computation
    df = pd.DataFrame(sample_recs) if sample_recs else pd.DataFrame()

    # Instantiate the right evaluator for this model type
    EvaluatorClass = get_evaluator(model_type)
    evaluator = EvaluatorClass()

    # Compute model-specific metrics
    model_metrics = evaluator.model_metrics(df)

    # Compute TAF principle scores (structural base + metric boosts)
    principles = evaluator.taf_principles(diagnostics, logs_count, model_metrics)

    # Add descriptions
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

    # Findings (structural + model-metric)
    findings = evaluator.generate_findings(principles, model_metrics)

    # Framework compliance with model-type-specific thresholds
    thr = _COMPLIANCE_THRESHOLDS.get(model_type, _COMPLIANCE_THRESHOLDS["general_llm"])
    framework_compliance = {
        "EU_AI_Act":   "Compliant"       if overall >= thr["EU_AI_Act"]   else "Conditional",
        "ISO_42001":   "Certified Ready" if overall >= thr["ISO_42001"]   else "Conditional",
        "NIST_AI_RMF": "Aligned"         if overall >= thr["NIST_AI_RMF"] else "Conditional",
        "KPMG_TAF":    "Assessed",
    }

    report_id  = str(uuid.uuid4())
    report_doc = {
        "report_id":              report_id,
        "ai_name":                ai_name,
        "model_type":             model_type,
        "model_label":            evaluator.LABEL,
        "detection_confidence":   det_conf,
        "evaluated_at":           datetime.utcnow().isoformat(),
        "overall_score":          overall,
        "risk_level":             risk_level,
        "structural_risk":        struct_risk,
        "logs_evaluated":         logs_count,
        "data_quality_score":     dq_score,
        "trusted_ai_principles":  principles,
        "diagnostics":            diagnostics,
        "model_metrics":          model_metrics,
        "findings":               findings,
        "risk_analysis":          risk_analysis,
        "recommendation":         sdcc_doc.get("recommendation", ""),
        "framework_compliance":   framework_compliance,
        "owner_id":               str(current_user["_id"]),
        "created_at":             datetime.utcnow(),
    }

    result = reports_collection.insert_one(report_doc)
    report_doc["_id"] = str(result.inserted_id)

    ai_collection.update_one(
        {"name": ai_name, "owner_id": str(current_user["_id"])},
        {"$inc": {"audit_runs": 1}},
    )

    return report_doc