from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.dependencies import get_current_user
from app.database import db
from app.services.blackbox.orchestrator import run_blackbox_pipeline
from app.services.blackbox.ui_auditor import run_ui_blackbox_pipeline
from app.services.blackbox.enterprise_router import detect_platform, _patch_selectors
from app.services.blackbox import ui_auditor as ui_auditor_module

router = APIRouter(prefix="/blackbox", tags=["Black Box Audit"])

blackbox_collection = db["blackbox_audits"]


# ── Schema ────────────────────────────────────────────────────────────────
class BlackBoxRequest(BaseModel):
    ai_name:  str
    mode:     str                   # "api" | "ui"
    endpoint: Optional[str] = ""
    api_key:  Optional[str] = ""
    ui_url:   Optional[str] = ""
    cookies:  Optional[str] = ""   # JSON array from Cookie-Editor (UI mode only)


# ── Run Audit ─────────────────────────────────────────────────────────────
@router.post("/audit")
async def run_blackbox_audit(
    payload: BlackBoxRequest,
    current_user=Depends(get_current_user),
):
    # ── Validate ──────────────────────────────────────────────────────────
    if payload.mode == "api":
        if not payload.endpoint or not payload.api_key:
            raise HTTPException(status_code=422, detail="API mode requires endpoint + api_key.")

    elif payload.mode == "ui":
        if not payload.ui_url:
            raise HTTPException(status_code=422, detail="UI mode requires ui_url.")

    else:
        raise HTTPException(status_code=422, detail="mode must be 'api' or 'ui'.")

    # ── Route to correct pipeline ─────────────────────────────────────────
    if payload.mode == "api":
        # API mode — calls orchestrator directly, no browser, no ui_url
        result = await run_blackbox_pipeline(
            ai_name=payload.ai_name,
            mode=payload.mode,
            endpoint=payload.endpoint or "",
            api_key=payload.api_key or "",
            current_user=current_user,
        )

    elif payload.mode == "ui":
        # UI mode — detect platform, patch selectors, run Playwright pipeline
        profile = detect_platform(
            ui_url=payload.ui_url or "",
            ai_name=payload.ai_name,
        )
        _patch_selectors(ui_auditor_module, profile)

        result = await run_ui_blackbox_pipeline(
            ai_name=payload.ai_name,
            ui_url=payload.ui_url or "",
            cookies=payload.cookies or None,
            stealth=profile["stealth"],
        )

        result["platform_detected"] = profile["label"]
        result["platform_notes"]    = profile["notes"]

        if profile["needs_cookies"] and not payload.cookies:
            result["warning"] = (
                f"{profile['label']} requires login. No cookies were provided. "
                f"Export cookies from the target site using Cookie-Editor and pass "
                f"them in the 'cookies' field."
            )

    # ── Save to DB ────────────────────────────────────────────────────────
    stored = {**result, "owner_id": str(current_user["_id"]), "created_at": datetime.utcnow()}
    stored.pop("api_key", None)
    blackbox_collection.insert_one(stored)

    from app.database import users_collection
    users_collection.update_one(
        {"_id": current_user["_id"]},
        {"$inc": {"audit_count": 1}}
    )

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


# ── All audits for current user ───────────────────────────────────────────
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


# ── Single audit full detail ──────────────────────────────────────────────
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
