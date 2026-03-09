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

# ─────────────────────────────────────────────
# Schemas
# ─────────────────────────────────────────────

class ConnectorSchema(BaseModel):
    type: str
    endpoint: str
    headers: Dict[str, Any]


class AISystemSchema(BaseModel):
    name: str
    description: str
    domain: str
    connector: ConnectorSchema


# ─────────────────────────────────────────────
# Register AI System
# ─────────────────────────────────────────────

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


# ─────────────────────────────────────────────
# SDCC Ingest
# ─────────────────────────────────────────────

@router.post("/sdcc/ingest/{ai_name}")
def ingest_logs(ai_name: str, file: UploadFile = File(...), current_user=Depends(get_current_user)):

    result = run_sdcc_pipeline(ai_name, file, current_user)

    sdcc_collection.update_one(
        {"ai_name": ai_name, "owner_id": str(current_user["_id"])},
        {"$set": {**result, "ai_name": ai_name, "owner_id": str(current_user["_id"])}},
        upsert=True
    )

    return result


# ─────────────────────────────────────────────
# CSV Upload
# ─────────────────────────────────────────────

@router.post("/upload-csv/{ai_name}")
def upload_csv(ai_name: str, file: UploadFile = File(...), current_user=Depends(get_current_user)):

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
        "recommendation": "CSV uploaded. Use SDCC pipeline for deeper analysis.",
        "uploaded_at": datetime.utcnow().isoformat()
    }

    sdcc_collection.update_one(
        {"ai_name": ai_name, "owner_id": str(current_user["_id"])},
        {"$set": record},
        upsert=True
    )

    return {"logs_ingested": logs_count, "model_type": "general_llm"}


# ─────────────────────────────────────────────
# Trusted AI Scoring Engine
# ─────────────────────────────────────────────

def compute_trusted_ai_scores(diagnostics, model_type, logs_count):

    missing_ratio = diagnostics.get("missing_ratio", 0)
    duplicates = diagnostics.get("duplicates", 0)
    schema_conf = diagnostics.get("schema_confidence", 0.8)

    def clamp(v):
        return max(0, min(100, int(v)))

    principles = {
        "Transparency": {
            "score": clamp(schema_conf * 100),
            "parameters": {"Schema Confidence": clamp(schema_conf * 100)}
        },
        "Fairness": {
            "score": clamp((1 - missing_ratio) * 100),
            "parameters": {"Missing Data": clamp((1 - missing_ratio) * 100)}
        },
        "Accountability": {
            "score": clamp((logs_count / 50) * 100),
            "parameters": {"Logs Volume": clamp((logs_count / 50) * 100)}
        },
        "Reliability": {
            "score": clamp((1 - missing_ratio) * 90),
            "parameters": {"Consistency": clamp((1 - missing_ratio) * 90)}
        },
        "Explainability": {
            "score": 80 if model_type == "classification" else 60,
            "parameters": {"Model Type": 80 if model_type == "classification" else 60}
        }
    }

    overall = int(sum(v["score"] for v in principles.values()) / len(principles))

    return {"principles": principles, "overall": overall}


# ─────────────────────────────────────────────
# Evaluate AI System
# ─────────────────────────────────────────────

@router.post("/evaluate/{ai_name}")
def evaluate_ai(ai_name: str, current_user=Depends(get_current_user)):

    sdcc_doc = sdcc_collection.find_one({
        "ai_name": ai_name,
        "owner_id": str(current_user["_id"])
    })

    if not sdcc_doc:
        raise HTTPException(status_code=404, detail="No ingested data found. Please upload logs first.")

    model_type = sdcc_doc.get("model_type", "general_llm")
    logs_count = sdcc_doc.get("logs_ingested", 0)
    dq_score = sdcc_doc.get("data_quality_score", 0)
    struct_risk = sdcc_doc.get("structural_risk", "Unknown")
    diagnostics = sdcc_doc.get("diagnostics", {})

    trusted_ai = compute_trusted_ai_scores(diagnostics, model_type, logs_count)

    principles = trusted_ai["principles"]
    overall = trusted_ai["overall"]

    risk_level = "Low" if overall >= 75 else ("Moderate" if overall >= 55 else "High")

    findings = []

    for name, data in principles.items():

        if data["score"] < 50:
            findings.append({
                "category": name,
                "severity": "High",
                "issue": f"{name} score is {data['score']}/100 — governance gap.",
                "recommendation": f"Strengthen {name.lower()} controls."
            })

    report_id = str(uuid.uuid4())

    report_doc = {
        "report_id": report_id,
        "ai_name": ai_name,
        "model_type": model_type,
        "evaluated_at": datetime.utcnow().isoformat(),
        "overall_score": overall,
        "risk_level": risk_level,
        "structural_risk": struct_risk,
        "logs_evaluated": logs_count,
        "data_quality_score": dq_score,
        "trusted_ai_principles": principles,
        "diagnostics": diagnostics,
        "findings": findings,
        "recommendation": sdcc_doc.get("recommendation", ""),
        "framework_compliance": {
            "EU_AI_Act": "Compliant" if overall >= 75 else "Conditional",
            "ISO_42001": "Certified Ready" if overall >= 80 else "Conditional",
            "NIST_AI_RMF": "Aligned" if overall >= 70 else "Conditional",
            "KPMG_TAF": "Assessed"
        },
        "owner_id": str(current_user["_id"]),
        "created_at": datetime.utcnow()
    }

    # SAVE REPORT
    reports_collection.insert_one(report_doc)

    # Update audit count
    ai_collection.update_one(
        {"name": ai_name, "owner_id": str(current_user["_id"])},
        {"$inc": {"audit_runs": 1}}
    )

    return report_doc