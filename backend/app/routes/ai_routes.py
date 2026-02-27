# from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
# from datetime import datetime
# from app.database import ai_collection, sdcc_collection
# from app.dependencies import get_current_user
# from pydantic import BaseModel
# from typing import Dict, Any
# from app.services.sdcc.orchestrator import run_sdcc_pipeline
# from app.services.sdcc.parser import parse_file
# from app.services.sdcc.metrics import extract_metrics
# from app.services.sdcc.detector import detect_model_type
# import uuid

# router = APIRouter()


# # ── Schemas ───────────────────────────────────────────────────────────────

# class ConnectorSchema(BaseModel):
#     type: str
#     endpoint: str
#     headers: Dict[str, Any]


# class AISystemSchema(BaseModel):
#     name: str
#     description: str
#     domain: str
#     connector: ConnectorSchema


# # ── Register AI ───────────────────────────────────────────────────────────

# @router.post("/register-ai")
# def register_ai_system(
#     ai_data: AISystemSchema,
#     current_user=Depends(get_current_user)
# ):
#     existing = ai_collection.find_one({
#         "name": ai_data.name,
#         "owner_id": str(current_user["_id"])
#     })

#     if existing:
#         raise HTTPException(status_code=400, detail="AI system already exists")

#     new_ai = {
#         "name": ai_data.name,
#         "description": ai_data.description,
#         "domain": ai_data.domain,
#         "connector": ai_data.connector.dict(),
#         "owner_id": str(current_user["_id"]),
#         "created_at": datetime.utcnow(),
#         "status": "active",
#         "audit_runs": 0
#     }

#     ai_collection.insert_one(new_ai)
#     return {"message": "AI system registered successfully"}


# # ── SDCC Ingest ───────────────────────────────────────────────────────────

# @router.post("/sdcc/ingest/{ai_name}")
# def ingest_logs(
#     ai_name: str,
#     file: UploadFile = File(...),
#     current_user=Depends(get_current_user)
# ):
#     result = run_sdcc_pipeline(ai_name, file, current_user)

#     # Persist so /evaluate can retrieve it later
#     sdcc_collection.update_one(
#         {"ai_name": ai_name, "owner_id": str(current_user["_id"])},
#         {"$set": {**result, "ai_name": ai_name, "owner_id": str(current_user["_id"])}},
#         upsert=True
#     )

#     return result


# # ── Legacy CSV Upload ─────────────────────────────────────────────────────

# @router.post("/upload-csv/{ai_name}")
# def upload_csv(
#     ai_name: str,
#     file: UploadFile = File(...),
#     current_user=Depends(get_current_user)
# ):
#     df = parse_file(file)
#     model_type = detect_model_type(df)
#     logs_count = len(df)

#     record = {
#         "ai_name": ai_name,
#         "owner_id": str(current_user["_id"]),
#         "model_type": model_type,
#         "logs_ingested": logs_count,
#         "data_quality_score": 70,
#         "structural_risk": "Moderate",
#         "diagnostics": {
#             "missing_ratio": float(df.isnull().mean().mean()),
#             "duplicates": int(df.duplicated().sum()),
#             "schema_confidence": 0.7,
#             "total_columns": len(df.columns),
#             "text_columns": sum(1 for c in df.columns if not hasattr(df[c], 'dtype') or str(df[c].dtype) == 'object'),
#             "numeric_columns": sum(1 for c in df.columns if str(df[c].dtype) != 'object'),
#             "column_names": list(df.columns)
#         },
#         "recommendation": "Basic CSV uploaded. Use SDCC pipeline for deeper analysis.",
#         "uploaded_at": datetime.utcnow().isoformat()
#     }

#     sdcc_collection.update_one(
#         {"ai_name": ai_name, "owner_id": str(current_user["_id"])},
#         {"$set": record},
#         upsert=True
#     )

#     return {"logs_ingested": logs_count, "model_type": model_type}


# # ── Evaluate ──────────────────────────────────────────────────────────────

# @router.post("/evaluate/{ai_name}")
# def evaluate_ai(
#     ai_name: str,
#     current_user=Depends(get_current_user)
# ):
#     sdcc_doc = sdcc_collection.find_one({
#         "ai_name": ai_name,
#         "owner_id": str(current_user["_id"])
#     })

#     if not sdcc_doc:
#         raise HTTPException(
#             status_code=404,
#             detail="No ingested data found. Please upload logs first."
#         )

#     model_type = sdcc_doc.get("model_type", "general_llm")
#     logs_count = sdcc_doc.get("logs_ingested", 0)
#     data_quality_score = sdcc_doc.get("data_quality_score", 0)
#     structural_risk = sdcc_doc.get("structural_risk", "Unknown")
#     diagnostics = sdcc_doc.get("diagnostics", {})

#     # ── Governance scoring ────────────────────────────────────────────────
#     missing_ratio = diagnostics.get("missing_ratio", 0)

#     transparency_score  = min(100, data_quality_score + 5)
#     fairness_score      = max(0, 100 - int(missing_ratio * 200))
#     accountability_score = 80 if logs_count >= 50 else 50
#     robustness_score    = max(0, 100 - int(missing_ratio * 150))
#     explainability_score = 75 if model_type == "classification" else 60

#     overall_score = int(
#         (transparency_score  * 0.25) +
#         (fairness_score      * 0.20) +
#         (accountability_score * 0.20) +
#         (robustness_score    * 0.20) +
#         (explainability_score * 0.15)
#     )

#     risk_level = (
#         "Low"      if overall_score >= 75 else
#         "Moderate" if overall_score >= 55 else
#         "High"
#     )

#     # ── Findings ──────────────────────────────────────────────────────────
#     findings = []

#     if missing_ratio > 0.1:
#         findings.append({
#             "category": "Data Quality",
#             "severity": "High",
#             "issue": f"Missing data ratio is {round(missing_ratio * 100, 1)}% — exceeds 10% threshold.",
#             "recommendation": "Impute or remove incomplete records before audit."
#         })

#     if diagnostics.get("duplicates", 0) > 0:
#         findings.append({
#             "category": "Data Integrity",
#             "severity": "Medium",
#             "issue": f"{diagnostics['duplicates']} duplicate rows detected.",
#             "recommendation": "De-duplicate the dataset to ensure evaluation accuracy."
#         })

#     if logs_count < 50:
#         findings.append({
#             "category": "Dataset Size",
#             "severity": "Medium",
#             "issue": f"Only {logs_count} records ingested — statistical confidence is limited.",
#             "recommendation": "Provide at least 50+ records for robust evaluation."
#         })

#     if diagnostics.get("text_columns", 0) == 0:
#         findings.append({
#             "category": "Schema",
#             "severity": "Low",
#             "issue": "No text columns detected. Input/output columns may be missing.",
#             "recommendation": "Ensure dataset contains input prompts and model responses."
#         })

#     # ── Update audit count ────────────────────────────────────────────────
#     ai_collection.update_one(
#         {"name": ai_name, "owner_id": str(current_user["_id"])},
#         {"$inc": {"audit_runs": 1}}
#     )

#     return {
#         "report_id": str(uuid.uuid4()),
#         "ai_name": ai_name,
#         "model_type": model_type,
#         "evaluated_at": datetime.utcnow().isoformat(),
#         "overall_score": overall_score,
#         "risk_level": risk_level,
#         "structural_risk": structural_risk,
#         "logs_evaluated": logs_count,
#         "data_quality_score": data_quality_score,
#         "governance_scores": {
#             "transparency":   transparency_score,
#             "fairness":       fairness_score,
#             "accountability": accountability_score,
#             "robustness":     robustness_score,
#             "explainability": explainability_score
#         },
#         "diagnostics": diagnostics,
#         "findings": findings,
#         "recommendation": sdcc_doc.get("recommendation", "")
#     }


from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from datetime import datetime
from app.database import ai_collection, sdcc_collection
from app.dependencies import get_current_user
from pydantic import BaseModel
from typing import Dict, Any
from app.services.sdcc.orchestrator import run_sdcc_pipeline
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
    existing = ai_collection.find_one({"name": ai_data.name, "owner_id": str(current_user["_id"])})
    if existing:
        raise HTTPException(status_code=400, detail="AI system already exists")
    ai_collection.insert_one({
        "name": ai_data.name, "description": ai_data.description,
        "domain": ai_data.domain, "connector": ai_data.connector.dict(),
        "owner_id": str(current_user["_id"]), "created_at": datetime.utcnow(),
        "status": "active", "audit_runs": 0
    })
    return {"message": "AI system registered successfully"}

@router.post("/sdcc/ingest/{ai_name}")
def ingest_logs(ai_name: str, file: UploadFile = File(...), current_user=Depends(get_current_user)):
    result = run_sdcc_pipeline(ai_name, file, current_user)
    sdcc_collection.update_one(
        {"ai_name": ai_name, "owner_id": str(current_user["_id"])},
        {"$set": {**result, "ai_name": ai_name, "owner_id": str(current_user["_id"])}}, upsert=True
    )
    return result

@router.post("/upload-csv/{ai_name}")
def upload_csv(ai_name: str, file: UploadFile = File(...), current_user=Depends(get_current_user)):
    import pandas as pd
    df = pd.read_csv(file.file)
    logs_count = len(df)
    missing_ratio = float(df.isnull().mean().mean())
    duplicates = int(df.duplicated().sum())
    record = {
        "ai_name": ai_name, "owner_id": str(current_user["_id"]),
        "model_type": "general_llm", "logs_ingested": logs_count,
        "data_quality_score": 70, "structural_risk": "Moderate",
        "diagnostics": {
            "missing_ratio": round(missing_ratio, 4), "duplicates": duplicates,
            "schema_confidence": round(1 - missing_ratio * 0.5, 3),
            "total_columns": len(df.columns),
            "text_columns": sum(1 for c in df.columns if str(df[c].dtype) == 'object'),
            "numeric_columns": sum(1 for c in df.columns if str(df[c].dtype) != 'object'),
            "column_names": list(df.columns)
        },
        "recommendation": "CSV uploaded. Use SDCC pipeline for deeper analysis.",
        "uploaded_at": datetime.utcnow().isoformat()
    }
    sdcc_collection.update_one(
        {"ai_name": ai_name, "owner_id": str(current_user["_id"])},
        {"$set": record}, upsert=True
    )
    return {"logs_ingested": logs_count, "model_type": "general_llm"}

def compute_trusted_ai_scores(diagnostics, model_type, logs_count):
    missing_ratio = diagnostics.get("missing_ratio", 0)
    duplicates    = diagnostics.get("duplicates", 0)
    schema_conf   = diagnostics.get("schema_confidence", 0.8)
    text_cols     = diagnostics.get("text_columns", 0)
    numeric_cols  = diagnostics.get("numeric_columns", 0)
    total_cols    = max(diagnostics.get("total_columns", 1), 1)
    col_names     = diagnostics.get("column_names", [])

    has_label     = any("label" in c.lower() or "class" in c.lower() for c in col_names)
    has_output    = any("output" in c.lower() or "response" in c.lower() or "prediction" in c.lower() for c in col_names)
    has_input     = any("input" in c.lower() or "prompt" in c.lower() or "query" in c.lower() for c in col_names)
    has_timestamp = any("time" in c.lower() or "date" in c.lower() for c in col_names)
    has_user_id   = any("user" in c.lower() or "_id" in c.lower() for c in col_names)
    col_coverage  = min(total_cols / 5, 1.0)

    def clamp(v): return max(0, min(100, int(v)))

    p = {}
    p["Transparency"] = {
        "score": clamp((schema_conf*30)+(25 if has_input else 0)+(20 if has_output else 0)+(15 if has_timestamp else 0)+(10 if logs_count>=50 else 5)),
        "parameters": {"Schema Documentation": clamp(schema_conf*100), "Input Logging": 100 if has_input else 20, "Output Logging": 100 if has_output else 20, "Timestamp Tracing": 100 if has_timestamp else 10, "Log Volume Adequacy": clamp((logs_count/100)*100)}
    }
    p["Explainability"] = {
        "score": clamp((75 if model_type=="classification" else 55)+(15 if has_output else 0)+(10 if text_cols>0 else 0)-(10 if missing_ratio>0.1 else 0)),
        "parameters": {"Model Interpretability": 80 if model_type=="classification" else 55, "Output Rationale Fields": 100 if has_output else 20, "Text Column Presence": 100 if text_cols>0 else 0, "Decision Traceability": clamp(schema_conf*90), "Feature Completeness": clamp((1-missing_ratio)*100)}
    }
    p["Fairness"] = {
        "score": clamp(((1-missing_ratio)*50)+(30 if duplicates==0 else max(0,30-duplicates))+(20 if has_label else 10)),
        "parameters": {"Missing Data Parity": clamp((1-missing_ratio)*100), "Duplicate Elimination": clamp(max(0,100-duplicates*5)), "Label Balance": 80 if has_label else 40, "Input Representation": 100 if has_input else 30, "Schema Completeness": clamp(schema_conf*100)}
    }
    p["Accountability"] = {
        "score": clamp((80 if logs_count>=50 else 40)+(10 if has_user_id else 0)+(10 if has_timestamp else 0)),
        "parameters": {"Log Volume Compliance": clamp((logs_count/50)*80), "User Identity Tracking": 100 if has_user_id else 20, "Temporal Audit Trail": 100 if has_timestamp else 10, "Schema Governance": clamp(schema_conf*100), "Duplicate Control": clamp(max(0,100-duplicates*10))}
    }
    p["Data Integrity"] = {
        "score": clamp(((1-missing_ratio)*50)+(max(0,30-duplicates*3))+(col_coverage*20)),
        "parameters": {"Completeness Rate": clamp((1-missing_ratio)*100), "Uniqueness (No Dups)": clamp(max(0,100-duplicates*5)), "Column Coverage": clamp(col_coverage*100), "Schema Confidence": clamp(schema_conf*100), "Numeric Field Validity": clamp((numeric_cols/total_cols)*100)}
    }
    p["Reliability"] = {
        "score": clamp((schema_conf*40)+((1-missing_ratio)*35)+(25 if has_output else 10)),
        "parameters": {"Schema Stability": clamp(schema_conf*100), "Data Consistency": clamp((1-missing_ratio)*100), "Output Field Present": 100 if has_output else 10, "Log Sufficiency": clamp((logs_count/100)*100), "Duplicate-Free Rate": clamp(max(0,100-duplicates*3))}
    }
    p["Security"] = {
        "score": clamp((schema_conf*35)+(30 if has_user_id else 10)+(20 if has_timestamp else 0)+(15 if logs_count>0 else 0)),
        "parameters": {"Access Identity Fields": 100 if has_user_id else 20, "Temporal Access Logging": 100 if has_timestamp else 10, "Schema Integrity": clamp(schema_conf*100), "Data Residency Signals": clamp((1-missing_ratio)*80), "Log Completeness": clamp((logs_count/50)*100)}
    }
    p["Privacy"] = {
        "score": clamp((schema_conf*30)+((1-missing_ratio)*30)+(20 if not has_user_id else 10)+20),
        "parameters": {"Data Minimisation": clamp((1-col_coverage)*100), "PII Exposure Risk": 80 if not has_user_id else 40, "Completeness Safety": clamp((1-missing_ratio)*90), "Schema Anonymisation": clamp(schema_conf*80), "Field Sensitivity": clamp((1-missing_ratio)*70)}
    }
    p["Sustainability"] = {
        "score": clamp((schema_conf*35)+(min(logs_count,100)/100*30)+((1-missing_ratio)*25)+10),
        "parameters": {"Data Efficiency": clamp((1-missing_ratio)*100), "Schema Optimisation": clamp(schema_conf*100), "Log Proportionality": clamp(min(logs_count,200)/200*100), "Redundancy Reduction": clamp(max(0,100-duplicates*5)), "Resource Footprint": clamp(col_coverage*100)}
    }
    p["Human-Centricity"] = {
        "score": clamp((30 if has_input else 10)+(30 if has_output else 10)+(schema_conf*25)+(15 if has_timestamp else 5)),
        "parameters": {"Human Input Channels": 100 if has_input else 20, "Output Interpretability": 100 if has_output else 20, "Oversight Schema": clamp(schema_conf*100), "Temporal Control": 100 if has_timestamp else 20, "User Feedback Fields": 100 if has_user_id else 30}
    }

    overall = int(sum(v["score"] for v in p.values()) / len(p))
    return {"principles": p, "overall": overall}

@router.post("/evaluate/{ai_name}")
def evaluate_ai(ai_name: str, current_user=Depends(get_current_user)):
    sdcc_doc = sdcc_collection.find_one({"ai_name": ai_name, "owner_id": str(current_user["_id"])})
    if not sdcc_doc:
        raise HTTPException(status_code=404, detail="No ingested data found. Please upload logs first.")

    model_type  = sdcc_doc.get("model_type", "general_llm")
    logs_count  = sdcc_doc.get("logs_ingested", 0)
    dq_score    = sdcc_doc.get("data_quality_score", 0)
    struct_risk = sdcc_doc.get("structural_risk", "Unknown")
    diagnostics = sdcc_doc.get("diagnostics", {})

    trusted_ai = compute_trusted_ai_scores(diagnostics, model_type, logs_count)
    principles = trusted_ai["principles"]
    overall    = trusted_ai["overall"]
    risk_level = "Low" if overall >= 75 else ("Moderate" if overall >= 55 else "High")

    findings = []
    for name, data in principles.items():
        score = data["score"]
        if score < 50:
            findings.append({"category": name, "severity": "High",
                "issue": f"{name} score is {score}/100 — significant governance gap.",
                "recommendation": f"Strengthen {name.lower()} controls and documentation."})
        elif score < 70:
            findings.append({"category": name, "severity": "Medium",
                "issue": f"{name} score is {score}/100 — improvement recommended.",
                "recommendation": f"Enhance {name.lower()} practices to meet Trusted AI standards."})

    missing_ratio = diagnostics.get("missing_ratio", 0)
    if missing_ratio > 0.1:
        findings.append({"category": "Data Integrity", "severity": "High",
            "issue": f"Missing data ratio {round(missing_ratio*100,1)}% exceeds 10% threshold.",
            "recommendation": "Impute or remove incomplete records."})
    if diagnostics.get("duplicates", 0) > 0:
        findings.append({"category": "Reliability", "severity": "Medium",
            "issue": f"{diagnostics['duplicates']} duplicate rows detected.",
            "recommendation": "De-duplicate dataset for accurate evaluation."})

    eu_status   = "Compliant" if overall >= 75 else ("Conditional" if overall >= 60 else "Partial")
    iso_status  = "Certified Ready" if overall >= 80 else ("Conditional" if overall >= 65 else "Partial")
    nist_status = "Aligned" if overall >= 70 else ("Conditional" if overall >= 55 else "Partial")

    ai_collection.update_one(
        {"name": ai_name, "owner_id": str(current_user["_id"])}, {"$inc": {"audit_runs": 1}})

    return {
        "report_id": str(uuid.uuid4()), "ai_name": ai_name,
        "model_type": model_type, "evaluated_at": datetime.utcnow().isoformat(),
        "overall_score": overall, "risk_level": risk_level,
        "structural_risk": struct_risk, "logs_evaluated": logs_count,
        "data_quality_score": dq_score, "trusted_ai_principles": principles,
        "governance_scores": {
            "transparency": principles["Transparency"]["score"],
            "fairness": principles["Fairness"]["score"],
            "accountability": principles["Accountability"]["score"],
            "robustness": principles["Reliability"]["score"],
            "explainability": principles["Explainability"]["score"],
        },
        "diagnostics": diagnostics, "findings": findings,
        "recommendation": sdcc_doc.get("recommendation", ""),
        "framework_compliance": {
            "EU_AI_Act": eu_status, "ISO_42001": iso_status,
            "NIST_AI_RMF": nist_status, "KPMG_TAF": "Assessed"
        }
    }