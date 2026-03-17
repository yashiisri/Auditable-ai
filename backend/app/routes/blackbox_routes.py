
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.dependencies import get_current_user
from app.database import db
from app.services.blackbox.orchestrator import run_blackbox_pipeline

router = APIRouter(prefix="/blackbox", tags=["Black Box Audit"])

blackbox_collection = db["blackbox_audits"]


# ── Schema ────────────────────────────────────────────────────────────────
class BlackBoxRequest(BaseModel):
    ai_name:  str
    mode:     str
    endpoint: Optional[str] = ""
    api_key:  Optional[str] = ""
    ui_url:   Optional[str] = ""


# ── Run Audit ─────────────────────────────────────────────────────────────
@router.post("/audit")
async def run_blackbox_audit(
    payload: BlackBoxRequest,
    current_user=Depends(get_current_user),
):
    if payload.mode == "api":
        if not payload.endpoint or not payload.api_key:
            raise HTTPException(status_code=422, detail="API mode needs endpoint + api_key.")
    elif payload.mode == "ui":
        if not payload.ui_url:
            raise HTTPException(status_code=422, detail="UI mode needs ui_url.")
    else:
        raise HTTPException(status_code=422, detail="mode must be 'api' or 'ui'.")

    result = await run_blackbox_pipeline(
        ai_name=payload.ai_name,
        mode=payload.mode,
        endpoint=payload.endpoint or "",
        api_key=payload.api_key or "",
        ui_url=payload.ui_url or "",
        current_user=current_user,
    )

    stored = {**result, "owner_id": str(current_user["_id"]), "created_at": datetime.utcnow()}
    stored.pop("api_key", None)
    blackbox_collection.insert_one(stored)

    # Increment user audit counter
    from app.database import users_collection
    users_collection.update_one({"_id": current_user["_id"]}, {"$inc": {"audit_count": 1}})

    return result


# ── History by AI name ────────────────────────────────────────────────────
@router.get("/history/{ai_name}")
def get_blackbox_history(ai_name: str, current_user=Depends(get_current_user)):
    records = list(
        blackbox_collection.find(
            {"ai_name": ai_name, "owner_id": str(current_user["_id"])},
            {"_id": 0, "probe_results": 0},
        ).sort("created_at", -1).limit(10)
    )
    return {"history": records}


# ── History — ALL audits for current user (used by Profile page) ──────────
@router.get("/history-all")
def get_all_blackbox_history(current_user=Depends(get_current_user)):
    records = list(
        blackbox_collection.find(
            {"owner_id": str(current_user["_id"])},
            {"_id": 0, "probe_results": 0, "api_key": 0},
        ).sort("created_at", -1).limit(50)
    )
    for r in records:
        for field in ("created_at", "started_at", "completed_at"):
            if isinstance(r.get(field), datetime):
                r[field] = r[field].isoformat()
    return {"history": records}


# ── Single audit — full detail (used when clicking a past audit) ──────────
@router.get("/audit/{audit_id}")
def get_blackbox_audit(audit_id: str, current_user=Depends(get_current_user)):
    record = blackbox_collection.find_one(
        {"audit_id": audit_id, "owner_id": str(current_user["_id"])},
        {"_id": 0, "api_key": 0},
    )
    if not record:
        raise HTTPException(status_code=404, detail="Audit not found.")
    for field in ("created_at", "started_at", "completed_at"):
        if isinstance(record.get(field), datetime):
            record[field] = record[field].isoformat()
    return record