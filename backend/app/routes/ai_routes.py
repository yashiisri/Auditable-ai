# from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
# from datetime import datetime
# from app.database import ai_collection, sdcc_collection, reports_collection
# from app.dependencies import get_current_user
# from pydantic import BaseModel
# from typing import Dict, Any
# from app.services.sdcc.orchestrator import run_sdcc_pipeline
# import pandas as pd
# import uuid

# router = APIRouter()

# class ConnectorSchema(BaseModel):
#     type: str
#     endpoint: str
#     headers: Dict[str, Any]


# class AISystemSchema(BaseModel):
#     name: str
#     description: str
#     domain: str
#     connector: ConnectorSchema


# @router.post("/register-ai")
# def register_ai_system(ai_data: AISystemSchema, current_user=Depends(get_current_user)):

#     existing = ai_collection.find_one({
#         "name": ai_data.name,
#         "owner_id": str(current_user["_id"])
#     })

#     if existing:
#         raise HTTPException(status_code=400, detail="AI system already exists")

#     ai_collection.insert_one({
#         "name": ai_data.name,
#         "description": ai_data.description,
#         "domain": ai_data.domain,
#         "connector": ai_data.connector.dict(),
#         "owner_id": str(current_user["_id"]),
#         "created_at": datetime.utcnow(),
#         "status": "active",
#         "audit_runs": 0
#     })

#     return {"message": "AI system registered successfully"}


# @router.post("/sdcc/ingest/{ai_name}")
# def ingest_logs(ai_name: str, file: UploadFile = File(...), current_user=Depends(get_current_user)):

#     result = run_sdcc_pipeline(ai_name, file, current_user)

#     sdcc_collection.update_one(
#         {"ai_name": ai_name, "owner_id": str(current_user["_id"])},
#         {"$set": {**result, "ai_name": ai_name, "owner_id": str(current_user["_id"])}},
#         upsert=True
#     )

#     return result

# @router.post("/upload-csv/{ai_name}")
# def upload_csv(ai_name: str, file: UploadFile = File(...), current_user=Depends(get_current_user)):

#     df = pd.read_csv(file.file)

#     logs_count = len(df)
#     missing_ratio = float(df.isnull().mean().mean())
#     duplicates = int(df.duplicated().sum())

#     record = {
#         "ai_name": ai_name,
#         "owner_id": str(current_user["_id"]),
#         "model_type": "general_llm",
#         "logs_ingested": logs_count,
#         "data_quality_score": 70,
#         "structural_risk": "Moderate",
#         "diagnostics": {
#             "missing_ratio": round(missing_ratio, 4),
#             "duplicates": duplicates,
#             "schema_confidence": round(1 - missing_ratio * 0.5, 3),
#             "total_columns": len(df.columns),
#             "text_columns": sum(1 for c in df.columns if str(df[c].dtype) == "object"),
#             "numeric_columns": sum(1 for c in df.columns if str(df[c].dtype) != "object"),
#             "column_names": list(df.columns)
#         },
#         "recommendation": "CSV uploaded. Use SDCC pipeline for deeper analysis.",
#         "uploaded_at": datetime.utcnow().isoformat()
#     }

#     sdcc_collection.update_one(
#         {"ai_name": ai_name, "owner_id": str(current_user["_id"])},
#         {"$set": record},
#         upsert=True
#     )

#     return {"logs_ingested": logs_count, "model_type": "general_llm"}



# def compute_trusted_ai_scores(diagnostics, model_type, logs_count):

#     missing_ratio = diagnostics.get("missing_ratio", 0)
#     duplicates = diagnostics.get("duplicates", 0)
#     schema_conf = diagnostics.get("schema_confidence", 0.8)

#     def clamp(v):
#         return max(0, min(100, int(v)))

#     principles = {
#         "Transparency": {
#             "score": clamp(schema_conf * 100),
#             "parameters": {"Schema Confidence": clamp(schema_conf * 100)}
#         },
#         "Fairness": {
#             "score": clamp((1 - missing_ratio) * 100),
#             "parameters": {"Missing Data": clamp((1 - missing_ratio) * 100)}
#         },
#         "Accountability": {
#             "score": clamp((logs_count / 50) * 100),
#             "parameters": {"Logs Volume": clamp((logs_count / 50) * 100)}
#         },
#         "Reliability": {
#             "score": clamp((1 - missing_ratio) * 90),
#             "parameters": {"Consistency": clamp((1 - missing_ratio) * 90)}
#         },
#         "Explainability": {
#             "score": 80 if model_type == "classification" else 60,
#             "parameters": {"Model Type": 80 if model_type == "classification" else 60}
#         }
#     }

#     overall = int(sum(v["score"] for v in principles.values()) / len(principles))

#     return {"principles": principles, "overall": overall}




# @router.post("/evaluate/{ai_name}")
# def evaluate_ai(ai_name: str, current_user=Depends(get_current_user)):

#     sdcc_doc = sdcc_collection.find_one({
#         "ai_name": ai_name,
#         "owner_id": str(current_user["_id"])
#     })

#     if not sdcc_doc:
#         raise HTTPException(status_code=404, detail="No ingested data found. Please upload logs first.")

#     model_type = sdcc_doc.get("model_type", "general_llm")
#     logs_count = sdcc_doc.get("logs_ingested", 0)
#     dq_score = sdcc_doc.get("data_quality_score", 0)
#     struct_risk = sdcc_doc.get("structural_risk", "Unknown")
#     diagnostics = sdcc_doc.get("diagnostics", {})

#     trusted_ai = compute_trusted_ai_scores(diagnostics, model_type, logs_count)

#     principles = trusted_ai["principles"]
#     overall = trusted_ai["overall"]

#     risk_level = "Low" if overall >= 75 else ("Moderate" if overall >= 55 else "High")

#     findings = []

#     for name, data in principles.items():
#         if data["score"] < 50:
#             findings.append({
#                 "category": name,
#                 "severity": "High",
#                 "issue": f"{name} score is {data['score']}/100 — governance gap.",
#                 "recommendation": f"Strengthen {name.lower()} controls."
#             })

#     report_id = str(uuid.uuid4())

#     report_doc = {
#         "report_id": report_id,
#         "ai_name": ai_name,
#         "model_type": model_type,
#         "evaluated_at": datetime.utcnow().isoformat(),
#         "overall_score": overall,
#         "risk_level": risk_level,
#         "structural_risk": struct_risk,
#         "logs_evaluated": logs_count,
#         "data_quality_score": dq_score,
#         "trusted_ai_principles": principles,
#         "diagnostics": diagnostics,
#         "findings": findings,
#         "recommendation": sdcc_doc.get("recommendation", ""),
#         "framework_compliance": {
#             "EU_AI_Act": "Compliant" if overall >= 75 else "Conditional",
#             "ISO_42001": "Certified Ready" if overall >= 80 else "Conditional",
#             "NIST_AI_RMF": "Aligned" if overall >= 70 else "Conditional",
#             "KPMG_TAF": "Assessed"
#         },
#         "owner_id": str(current_user["_id"]),
#         "created_at": datetime.utcnow()
#     }

#     # Insert report into MongoDB
#     result = reports_collection.insert_one(report_doc)

#     # Convert Mongo ObjectId to string for FastAPI JSON response
#     report_doc["_id"] = str(result.inserted_id)

#     # Update audit count
#     ai_collection.update_one(
#         {"name": ai_name, "owner_id": str(current_user["_id"])},
#         {"$inc": {"audit_runs": 1}}
#     )

#     return report_doc


from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from datetime import datetime
from app.database import ai_collection, sdcc_collection, reports_collection
from app.dependencies import get_current_user
from pydantic import BaseModel
from typing import Dict, Any
from app.services.sdcc.orchestrator import run_sdcc_pipeline
import pandas as pd
import uuid

router = APIRouter()


class ConnectorSchema(BaseModel):
    type: str
    endpoint: str
    headers: Dict[str, Any]


class AISystemSchema(BaseModel):
    name: str
    description: str
    domain: str
    connector: ConnectorSchema


@router.post("/register-ai")
def register_ai_system(ai_data: AISystemSchema, current_user=Depends(get_current_user)):
    existing = ai_collection.find_one({
        "name": ai_data.name,
        "owner_id": str(current_user["_id"])
    })
    if existing:
        raise HTTPException(status_code=400, detail="AI system already exists")

    ai_collection.insert_one({
        "name": ai_data.name,
        "description": ai_data.description,
        "domain": ai_data.domain,
        "connector": ai_data.connector.dict(),
        "owner_id": str(current_user["_id"]),
        "created_at": datetime.utcnow(),
        "status": "active",
        "audit_runs": 0
    })
    return {"message": "AI system registered successfully"}


@router.post("/sdcc/ingest/{ai_name}")
def ingest_logs(ai_name: str, file: UploadFile = File(...), current_user=Depends(get_current_user)):
    result = run_sdcc_pipeline(ai_name, file, current_user)

    sdcc_collection.update_one(
        {"ai_name": ai_name, "owner_id": str(current_user["_id"])},
        {"$set": {**result, "ai_name": ai_name, "owner_id": str(current_user["_id"])}},
        upsert=True
    )
    return result


@router.post("/upload-csv/{ai_name}")
def upload_csv(ai_name: str, file: UploadFile = File(...), current_user=Depends(get_current_user)):
    """Legacy CSV-only upload — now also handles JSON via extension check."""
    filename = file.filename.lower() if file.filename else ""

    if filename.endswith(".json"):
        import json
        content = json.load(file.file)
        if isinstance(content, list):
            df = pd.DataFrame(content)
        else:
            df = pd.json_normalize(content)
    else:
        df = pd.read_csv(file.file)

    logs_count = len(df)
    missing_ratio = float(df.isnull().mean().mean())
    duplicates = int(df.duplicated().sum())

    record = {
        "ai_name": ai_name,
        "owner_id": str(current_user["_id"]),
        "model_type": "general_llm",
        "logs_ingested": logs_count,
        "data_quality_score": 70,
        "structural_risk": "Moderate",
        "diagnostics": {
            "missing_ratio": round(missing_ratio, 4),
            "duplicates": duplicates,
            "schema_confidence": round(1 - missing_ratio * 0.5, 3),
            "total_columns": len(df.columns),
            "text_columns": sum(1 for c in df.columns if str(df[c].dtype) == "object"),
            "numeric_columns": sum(1 for c in df.columns if str(df[c].dtype) != "object"),
            "column_names": list(df.columns)
        },
        "recommendation": "File uploaded. Use SDCC pipeline for deeper analysis.",
        "uploaded_at": datetime.utcnow().isoformat()
    }

    sdcc_collection.update_one(
        {"ai_name": ai_name, "owner_id": str(current_user["_id"])},
        {"$set": record},
        upsert=True
    )
    return {"logs_ingested": logs_count, "model_type": "general_llm"}


# ─────────────────────────────────────────────────────────────────────────────
#  10 KPMG Trusted AI Principles — rich sub-parameter computation
# ─────────────────────────────────────────────────────────────────────────────

PRINCIPLE_DESCRIPTIONS = {
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
    "Human-Centricity": (
        "AI systems must augment rather than replace human judgment in high-stakes decisions. "
        "Meaningful human oversight, intervention capability, and contestability must be preserved."
    ),
}


def compute_trusted_ai_scores(diagnostics: dict, model_type: str, logs_count: int) -> dict:
    """
    Compute all 10 KPMG Trusted AI Principles with detailed sub-parameters.
    Each principle returns: { score, parameters: {param: value}, description, risk_flag }
    """
    missing_ratio   = diagnostics.get("missing_ratio", 0)
    duplicates      = diagnostics.get("duplicates", 0)
    schema_conf     = diagnostics.get("schema_confidence", 0.8)
    total_cols      = diagnostics.get("total_columns", 1)
    text_cols       = diagnostics.get("text_columns", 0)
    numeric_cols    = diagnostics.get("numeric_columns", 0)
    column_names    = [c.lower() for c in diagnostics.get("column_names", [])]

    def clamp(v: float) -> int:
        return max(0, min(100, int(v)))

    # ── Derived signals ──────────────────────────────────────────────────────
    completeness       = clamp((1 - missing_ratio) * 100)
    schema_score       = clamp(schema_conf * 100)
    duplicate_penalty  = clamp(max(0, 100 - (duplicates / max(logs_count, 1)) * 500))
    volume_score       = clamp(min(logs_count / 100 * 100, 100))
    column_diversity   = clamp(min(total_cols / 10 * 100, 100))

    # Field-presence bonuses
    has_input    = any(k in column_names for k in ["input", "prompt", "query", "text", "question"])
    has_output   = any(k in column_names for k in ["output", "response", "answer", "prediction", "result"])
    has_label    = any(k in column_names for k in ["label", "class", "target", "ground_truth"])
    has_timestamp= any(k in column_names for k in ["timestamp", "date", "time", "created_at"])
    has_user_id  = any(k in column_names for k in ["user_id", "user", "session_id", "session"])
    has_score    = any(k in column_names for k in ["score", "confidence", "probability", "prob"])
    has_feedback = any(k in column_names for k in ["feedback", "rating", "review", "human_eval"])
    has_safety   = any(k in column_names for k in ["is_safe", "safety", "flagged", "moderated"])
    has_pii      = any(k in column_names for k in ["contains_pii", "pii", "personal"])
    has_version  = any(k in column_names for k in ["model_version", "version", "model_id"])
    has_latency  = any(k in column_names for k in ["latency", "response_time", "duration"])
    has_error    = any(k in column_names for k in ["error", "exception", "failed"])
    has_halluc   = any(k in column_names for k in ["hallucination", "faithfulness", "groundedness"])
    has_rouge    = any(k in column_names for k in ["rouge", "bleu", "meteor", "bertscore"])

    io_bonus     = 20 if (has_input and has_output) else (10 if (has_input or has_output) else 0)
    model_bonus  = 80 if model_type == "classification" else 60

    # ── 1. Transparency ──────────────────────────────────────────────────────
    transparency_params = {
        "Schema Confidence":      schema_score,
        "Field Documentation":    clamp(io_bonus * 4 + schema_score * 0.2),
        "Model Version Tracking": 100 if has_version else 30,
        "Input/Output Coverage":  clamp(io_bonus * 4.5),
        "Column Completeness":    clamp(column_diversity * 0.8 + schema_score * 0.2),
    }
    transparency_score = clamp(sum(transparency_params.values()) / len(transparency_params))

    # ── 2. Explainability ────────────────────────────────────────────────────
    explainability_params = {
        "Model Interpretability":  model_bonus,
        "Prediction Confidence":   100 if has_score else 40,
        "Reasoning Documentation": 100 if has_halluc else (60 if has_rouge else 35),
        "Feedback Integration":    100 if has_feedback else 30,
        "Output Traceability":     clamp(io_bonus * 4 + (20 if has_score else 0)),
    }
    explainability_score = clamp(sum(explainability_params.values()) / len(explainability_params))

    # ── 3. Fairness ──────────────────────────────────────────────────────────
    fairness_params = {
        "Data Completeness":        completeness,
        "Label Balance":            clamp(80 if has_label else 50),
        "Demographic Coverage":     clamp(60 + (text_cols / max(total_cols, 1)) * 40),
        "Bias Indicator Fields":    100 if has_feedback else (60 if has_label else 30),
        "Missing Data Equity":      clamp((1 - missing_ratio * 2) * 100),
    }
    fairness_score = clamp(sum(fairness_params.values()) / len(fairness_params))

    # ── 4. Accountability ────────────────────────────────────────────────────
    accountability_params = {
        "Audit Log Volume":        volume_score,
        "Timestamp Coverage":      100 if has_timestamp else 20,
        "User Attribution":        100 if has_user_id else 25,
        "Model Version Control":   100 if has_version else 30,
        "Error/Exception Logging": 100 if has_error else 35,
    }
    accountability_score = clamp(sum(accountability_params.values()) / len(accountability_params))

    # ── 5. Data Integrity ────────────────────────────────────────────────────
    data_integrity_params = {
        "Completeness Score":      completeness,
        "Duplicate-Free Rate":     duplicate_penalty,
        "Schema Consistency":      schema_score,
        "Data Type Diversity":     clamp((numeric_cols / max(total_cols, 1)) * 100 * 0.5 +
                                        (text_cols / max(total_cols, 1)) * 100 * 0.5),
        "Ground Truth Availability": 100 if (has_label or has_rouge) else 40,
    }
    data_integrity_score = clamp(sum(data_integrity_params.values()) / len(data_integrity_params))

    # ── 6. Reliability ───────────────────────────────────────────────────────
    reliability_params = {
        "Consistency Score":       clamp((1 - missing_ratio) * 90),
        "Performance Metrics":     100 if (has_rouge or has_score) else 40,
        "Latency Monitoring":      100 if has_latency else 30,
        "Error Rate Tracking":     100 if has_error else 35,
        "Volume Sufficiency":      volume_score,
    }
    reliability_score = clamp(sum(reliability_params.values()) / len(reliability_params))

    # ── 7. Security ──────────────────────────────────────────────────────────
    security_params = {
        "Safety Flagging":         100 if has_safety else 25,
        "Input Validation":        clamp(schema_score * 0.8 + 20 if has_input else schema_score * 0.6),
        "Adversarial Robustness":  40 if model_type == "general_llm" else 55,
        "Content Moderation":      100 if has_safety else 30,
        "PII Detection":           100 if has_pii else 20,
    }
    security_score = clamp(sum(security_params.values()) / len(security_params))

    # ── 8. Privacy ───────────────────────────────────────────────────────────
    privacy_params = {
        "PII Field Tracking":      100 if has_pii else 20,
        "Data Minimisation":       clamp(100 - (total_cols / 20) * 40),
        "User Anonymisation":      50 if has_user_id else 70,
        "Consent Management":      40,   # structural estimate — needs runtime signals
        "Data Retention Signals":  100 if has_timestamp else 30,
    }
    privacy_score = clamp(sum(privacy_params.values()) / len(privacy_params))

    # ── 9. Sustainability ────────────────────────────────────────────────────
    sustainability_params = {
        "Dataset Efficiency":      clamp(100 - (logs_count / 10000) * 30),
        "Feature Engineering":     clamp(column_diversity * 0.7 + 30),
        "Compute Proxy Score":     80 if model_type == "classification" else 55,
        "Redundancy Elimination":  duplicate_penalty,
        "Resource Optimisation":   clamp(schema_score * 0.6 + 40),
    }
    sustainability_score = clamp(sum(sustainability_params.values()) / len(sustainability_params))

    # ── 10. Human-Centricity ─────────────────────────────────────────────────
    human_centricity_params = {
        "Human Feedback Integration": 100 if has_feedback else 25,
        "Override/Escalation Fields": 60 if has_feedback else 20,
        "Decision Explainability":    model_bonus,
        "User Attribution":           100 if has_user_id else 30,
        "Safety Override Signals":    100 if has_safety else 35,
    }
    human_centricity_score = clamp(sum(human_centricity_params.values()) / len(human_centricity_params))

    # ── Assemble principles ───────────────────────────────────────────────────
    principles = {
        "Transparency":     {"score": transparency_score,     "parameters": transparency_params},
        "Explainability":   {"score": explainability_score,   "parameters": explainability_params},
        "Fairness":         {"score": fairness_score,         "parameters": fairness_params},
        "Accountability":   {"score": accountability_score,   "parameters": accountability_params},
        "Data Integrity":   {"score": data_integrity_score,   "parameters": data_integrity_params},
        "Reliability":      {"score": reliability_score,      "parameters": reliability_params},
        "Security":         {"score": security_score,         "parameters": security_params},
        "Privacy":          {"score": privacy_score,          "parameters": privacy_params},
        "Sustainability":   {"score": sustainability_score,   "parameters": sustainability_params},
        "Human-Centricity": {"score": human_centricity_score, "parameters": human_centricity_params},
    }

    overall = clamp(sum(p["score"] for p in principles.values()) / len(principles))
    return {"principles": principles, "overall": overall}


# ─────────────────────────────────────────────────────────────────────────────
#  Risk Analysis
# ─────────────────────────────────────────────────────────────────────────────

def compute_risk_analysis(principles: dict, diagnostics: dict, logs_count: int) -> dict:
    """Generate a structured risk analysis across all 10 principles."""
    risk_items = []

    for name, data in principles.items():
        score = data["score"]
        params = data.get("parameters", {})

        # Identify worst sub-parameter
        if params:
            worst_param  = min(params, key=lambda k: params[k])
            worst_val    = params[worst_param]
        else:
            worst_param, worst_val = "N/A", score

        if score < 40:
            severity = "Critical"
            color    = "#ff4d4d"
        elif score < 60:
            severity = "High"
            color    = "#ff7043"
        elif score < 75:
            severity = "Moderate"
            color    = "#ffb020"
        else:
            severity = "Low"
            color    = "#00C896"

        risk_items.append({
            "principle":    name,
            "score":        score,
            "severity":     severity,
            "color":        color,
            "worst_param":  worst_param,
            "worst_val":    worst_val,
            "gap":          100 - score,
        })

    # Sort by score ascending (most critical first)
    risk_items.sort(key=lambda x: x["score"])

    critical_count = sum(1 for r in risk_items if r["severity"] == "Critical")
    high_count     = sum(1 for r in risk_items if r["severity"] == "High")
    moderate_count = sum(1 for r in risk_items if r["severity"] == "Moderate")
    low_count      = sum(1 for r in risk_items if r["severity"] == "Low")

    avg_score = sum(r["score"] for r in risk_items) / len(risk_items)

    if critical_count > 0:
        overall_risk = "Critical"
    elif high_count >= 3:
        overall_risk = "High"
    elif avg_score >= 75:
        overall_risk = "Low"
    elif avg_score >= 55:
        overall_risk = "Moderate"
    else:
        overall_risk = "High"

    # Data volume risk
    if logs_count < 30:
        data_risk = "High — insufficient log volume for reliable evaluation"
    elif logs_count < 100:
        data_risk = "Moderate — limited dataset; results may not generalise"
    else:
        data_risk = "Low — adequate data volume for statistical confidence"

    return {
        "overall_risk_level":  overall_risk,
        "risk_items":          risk_items,
        "critical_count":      critical_count,
        "high_count":          high_count,
        "moderate_count":      moderate_count,
        "low_count":           low_count,
        "average_score":       round(avg_score, 1),
        "data_volume_risk":    data_risk,
        "missing_data_risk":   "High" if diagnostics.get("missing_ratio", 0) > 0.2 else
                               ("Moderate" if diagnostics.get("missing_ratio", 0) > 0.05 else "Low"),
    }


# ─────────────────────────────────────────────────────────────────────────────
#  Evaluation endpoint
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/evaluate/{ai_name}")
def evaluate_ai(ai_name: str, current_user=Depends(get_current_user)):
    sdcc_doc = sdcc_collection.find_one({
        "ai_name": ai_name,
        "owner_id": str(current_user["_id"])
    })

    if not sdcc_doc:
        raise HTTPException(
            status_code=404,
            detail="No ingested data found. Please upload logs first."
        )

    model_type  = sdcc_doc.get("model_type", "general_llm")
    logs_count  = sdcc_doc.get("logs_ingested", 0)
    dq_score    = sdcc_doc.get("data_quality_score", 0)
    struct_risk = sdcc_doc.get("structural_risk", "Unknown")
    diagnostics = sdcc_doc.get("diagnostics", {})

    trusted_ai = compute_trusted_ai_scores(diagnostics, model_type, logs_count)
    principles = trusted_ai["principles"]
    overall    = trusted_ai["overall"]

    risk_analysis = compute_risk_analysis(principles, diagnostics, logs_count)
    risk_level    = risk_analysis["overall_risk_level"]

    # Enrich principles with descriptions
    for name in principles:
        principles[name]["description"] = PRINCIPLE_DESCRIPTIONS.get(name, "")

    # Generate per-principle findings
    findings = []
    for name, data in principles.items():
        if data["score"] < 60:
            findings.append({
                "category":       name,
                "severity":       "High" if data["score"] < 40 else "Medium",
                "issue":          f"{name} score is {data['score']}/100 — governance gap detected.",
                "recommendation": _recommendation_for_principle(name, data["parameters"]),
            })

    report_id = str(uuid.uuid4())

    report_doc = {
        "report_id":             report_id,
        "ai_name":               ai_name,
        "model_type":            model_type,
        "evaluated_at":          datetime.utcnow().isoformat(),
        "overall_score":         overall,
        "risk_level":            risk_level,
        "structural_risk":       struct_risk,
        "logs_evaluated":        logs_count,
        "data_quality_score":    dq_score,
        "trusted_ai_principles": principles,
        "diagnostics":           diagnostics,
        "findings":              findings,
        "risk_analysis":         risk_analysis,
        "recommendation":        sdcc_doc.get("recommendation", ""),
        "framework_compliance": {
            "EU_AI_Act":   "Compliant"        if overall >= 75 else "Conditional",
            "ISO_42001":   "Certified Ready"  if overall >= 80 else "Conditional",
            "NIST_AI_RMF": "Aligned"          if overall >= 70 else "Conditional",
            "KPMG_TAF":    "Assessed",
        },
        "owner_id":   str(current_user["_id"]),
        "created_at": datetime.utcnow(),
    }

    result = reports_collection.insert_one(report_doc)
    report_doc["_id"] = str(result.inserted_id)

    ai_collection.update_one(
        {"name": ai_name, "owner_id": str(current_user["_id"])},
        {"$inc": {"audit_runs": 1}}
    )

    return report_doc


def _recommendation_for_principle(name: str, params: dict) -> str:
    """Return the most actionable recommendation based on the worst sub-parameter."""
    worst = min(params, key=lambda k: params[k]) if params else None

    recs = {
        "Transparency": {
            "Schema Confidence":      "Improve data schema consistency and reduce null fields.",
            "Model Version Tracking": "Implement model versioning (e.g., MLflow) and log version in every record.",
            "Input/Output Coverage":  "Ensure input and output columns are consistently present in logs.",
            "Field Documentation":    "Document all fields with descriptions and expected formats.",
            "Column Completeness":    "Increase the number of meaningful columns with clear purposes.",
        },
        "Explainability": {
            "Model Interpretability":  "Consider switching to interpretable models (decision trees, SHAP-explained models).",
            "Prediction Confidence":   "Add a confidence/probability score column to every model output.",
            "Reasoning Documentation": "Log hallucination scores, ROUGE metrics, or chain-of-thought reasoning.",
            "Feedback Integration":    "Collect human feedback or ratings per prediction for explainability audit.",
            "Output Traceability":     "Ensure each output can be traced to its input and model version.",
        },
        "Fairness": {
            "Data Completeness":     "Reduce missing data to below 5% to ensure equitable representation.",
            "Label Balance":         "Audit class distribution and apply resampling if imbalanced.",
            "Demographic Coverage":  "Expand training data to include diverse demographic representations.",
            "Bias Indicator Fields": "Add bias audit fields (e.g., demographic labels, fairness metrics).",
            "Missing Data Equity":   "Investigate whether missing data is disproportionate across groups.",
        },
        "Accountability": {
            "Audit Log Volume":        "Increase log coverage to at least 1000 records for meaningful audit.",
            "Timestamp Coverage":      "Add timestamp to every log record for chronological auditability.",
            "User Attribution":        "Track user/session IDs to attribute outputs to accountable parties.",
            "Model Version Control":   "Log the model version used for each prediction.",
            "Error/Exception Logging": "Implement structured error logging for all failed predictions.",
        },
        "Data Integrity": {
            "Completeness Score":        "Fill or impute missing values; document imputation strategy.",
            "Duplicate-Free Rate":       "Deduplicate logs before analysis to ensure reliable metrics.",
            "Schema Consistency":        "Enforce data schema validation at ingestion time.",
            "Data Type Diversity":       "Ensure a balanced mix of numeric and categorical features.",
            "Ground Truth Availability": "Add ground truth labels or human-evaluated outputs for comparison.",
        },
        "Reliability": {
            "Consistency Score":     "Investigate sources of missing/inconsistent data across runs.",
            "Performance Metrics":   "Track ROUGE, BLEU, accuracy, or F1 scores per prediction.",
            "Latency Monitoring":    "Log response latency to detect performance degradation over time.",
            "Error Rate Tracking":   "Monitor error rates and set alerting thresholds.",
            "Volume Sufficiency":    "Increase log volume to at least 500 records for statistical reliability.",
        },
        "Security": {
            "Safety Flagging":        "Implement content safety classifiers and log outcomes per request.",
            "Input Validation":       "Validate all inputs against a schema before processing.",
            "Adversarial Robustness": "Run red-team exercises and log adversarial probe results.",
            "Content Moderation":     "Integrate a moderation layer and log all moderated outputs.",
            "PII Detection":          "Run PII detection on inputs/outputs and flag/mask sensitive data.",
        },
        "Privacy": {
            "PII Field Tracking":    "Add a contains_pii column and implement automatic PII detection.",
            "Data Minimisation":     "Remove columns not required for model operation.",
            "User Anonymisation":    "Hash or pseudonymise user identifiers before logging.",
            "Consent Management":    "Implement consent tracking and store consent signals with data.",
            "Data Retention Signals":"Add timestamp fields to enable automated data retention policies.",
        },
        "Sustainability": {
            "Dataset Efficiency":    "Sample representative subsets instead of logging all requests.",
            "Feature Engineering":   "Reduce redundant features to lower compute and storage footprint.",
            "Compute Proxy Score":   "Use lighter model variants where interpretability is not sacrificed.",
            "Redundancy Elimination":"Deduplicate and compress logs to reduce storage overhead.",
            "Resource Optimisation": "Profile model inference cost and optimise batch sizes.",
        },
        "Human-Centricity": {
            "Human Feedback Integration":"Integrate a human rating or feedback loop into the AI pipeline.",
            "Override/Escalation Fields": "Add escalation or override flags so humans can correct outputs.",
            "Decision Explainability":    "Provide human-readable explanations for all high-stakes decisions.",
            "User Attribution":           "Track which users interact with the AI to personalise oversight.",
            "Safety Override Signals":    "Implement a manual safety override mechanism and log its usage.",
        },
    }

    if worst and name in recs and worst in recs[name]:
        return recs[name][worst]
    return f"Review and strengthen {name.lower()} controls across all sub-parameters."