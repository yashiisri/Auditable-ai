# """
# app/routes/blackbox.py
# =======================
# Blackbox audit router.

# What changed:
#   - _get_ai_context() now also returns registration_profile and system_prompt
#     (stored by RegisterAi.tsx via ai_routes.py) so the orchestrator has full
#     context for all 4 intelligence layers:
#       1. Registration profile (end_users, decision_influence, data_types, etc.)
#       2. System prompt (if the client pasted it at registration)
#       3. Behavioral fingerprint (warm-up probes — orchestrator handles this)
#       4. Description + domain (always present)
#   - result from run_blackbox_pipeline includes adaptive_meta and fingerprint_meta
# """

# from fastapi import APIRouter, Depends, HTTPException
# from pydantic import BaseModel
# from typing import Optional
# from datetime import datetime

# from app.dependencies import get_current_user
# from app.database import db
# from app.services.blackbox.orchestrator import run_blackbox_pipeline
# from app.services.blackbox.ui_auditor import run_ui_blackbox_pipeline
# from app.services.blackbox.enterprise_router import detect_platform, _patch_selectors
# from app.services.blackbox import ui_auditor as ui_auditor_module

# router = APIRouter(prefix="/blackbox", tags=["Black Box Audit"])

# blackbox_collection = db["blackbox_audits"]
# ai_collection       = db["ai_systems"]


# # ── Schema ─────────────────────────────────────────────────────────────────────

# class BlackBoxRequest(BaseModel):
#     ai_name:  str
#     mode:     str                   # "api" | "ui"
#     endpoint: Optional[str] = ""
#     api_key:  Optional[str] = ""
#     ui_url:   Optional[str] = ""
#     cookies:  Optional[str] = ""   # JSON array from Cookie-Editor (UI mode only)


# # ── Helper: fetch full AI system context from MongoDB ──────────────────────────

# def _get_ai_context(ai_name: str, owner_id: str) -> dict:
#     """
#     Returns all context fields stored at registration time.
#     Falls back to empty values if the system is not found.

#     Fields returned:
#       description           – plain description
#       domain                – domain string
#       registration_profile  – structured profile dict (Approach 3)
#       system_prompt         – pasted system prompt (Approach 2), if provided
#     """
#     doc = ai_collection.find_one(
#         {"name": ai_name, "owner_id": owner_id},
#         {
#             "description":          1,
#             "domain":               1,
#             "registration_profile": 1,
#             "system_prompt":        1,   # stored by ai_routes.py if client provided it
#             "_id":                  0,
#         },
#     )
#     if not doc:
#         return {
#             "description":          "",
#             "domain":               "",
#             "registration_profile": None,
#             "system_prompt":        "",
#         }

#     # Flatten registration_profile fields that RegisterAi.tsx captures
#     # (end_users, decision_influence, data_types, jurisdictions,
#     #  highest_stakes_failure, oversight_model, deployment_status,
#     #  autonomous_actions, real_time_data, output_visibility, bias_tested,
#     #  risk_scenario, custom_risk_scenario, agent_version)
#     rp = doc.get("registration_profile") or {}

#     # Some implementations store these at the top level of the AI doc
#     # (not nested under registration_profile) — merge both for safety
#     top_level_profile_fields = [
#         "end_users", "decision_influence", "data_types", "jurisdictions",
#         "highest_stakes_failure", "oversight_model", "deployment_status",
#         "autonomous_actions", "real_time_data", "output_visibility",
#         "bias_tested", "risk_scenario", "custom_risk_scenario", "agent_version",
#     ]
#     for field in top_level_profile_fields:
#         if field not in rp and field in doc:
#             rp[field] = doc[field]

#     return {
#         "description":          doc.get("description", ""),
#         "domain":               doc.get("domain", ""),
#         "registration_profile": rp if rp else None,
#         "system_prompt":        doc.get("system_prompt", ""),
#     }


# # ── Run Audit ──────────────────────────────────────────────────────────────────

# @router.post("/audit")
# async def run_blackbox_audit(
#     payload:     BlackBoxRequest,
#     current_user=Depends(get_current_user),
# ):
#     # ── Validate ───────────────────────────────────────────────────────────────
#     if payload.mode == "api":
#         if not payload.api_key:
#             raise HTTPException(status_code=422, detail="API mode requires an api_key.")
#     elif payload.mode == "ui":
#         if not payload.ui_url:
#             raise HTTPException(status_code=422, detail="UI mode requires ui_url.")
#     else:
#         raise HTTPException(status_code=422, detail="mode must be 'api' or 'ui'.")

#     # ── Fetch all registered context (description, domain, profile, system prompt)
#     ctx = _get_ai_context(
#         ai_name=payload.ai_name,
#         owner_id=str(current_user["_id"]),
#     )

#     # ── Route to correct pipeline ──────────────────────────────────────────────
#     if payload.mode == "api":
#         result = await run_blackbox_pipeline(
#             ai_name=payload.ai_name,
#             mode=payload.mode,
#             endpoint=payload.endpoint or "",
#             api_key=payload.api_key or "",
#             current_user=current_user,
#             ai_description=ctx["description"],
#             ai_domain=ctx["domain"],
#             registration_profile=ctx["registration_profile"],  # ← NEW
#             system_prompt=ctx["system_prompt"],                 # ← NEW
#         )

#     elif payload.mode == "ui":
#         profile = detect_platform(
#             ui_url=payload.ui_url or "",
#             ai_name=payload.ai_name,
#         )
#         _patch_selectors(ui_auditor_module, profile)

#         # Pass context to UI pipeline too — ui_auditor should forward to probe_generator
#         result = await run_ui_blackbox_pipeline(
#             ai_name=payload.ai_name,
#             ui_url=payload.ui_url or "",
#             cookies=payload.cookies or None,
#             stealth=profile["stealth"],
#             ai_description=ctx["description"],
#             ai_domain=ctx["domain"],
#             registration_profile=ctx["registration_profile"],  # ← NEW
#             system_prompt=ctx["system_prompt"],                 # ← NEW
#         )

#         result["platform_detected"] = profile["label"]
#         result["platform_notes"]    = profile["notes"]

#         if profile["needs_cookies"] and not payload.cookies:
#             result["warning"] = (
#                 f"{profile['label']} requires login. No cookies were provided. "
#                 f"Export cookies from the target site using Cookie-Editor and pass "
#                 f"them in the 'cookies' field."
#             )

#     # ── Save to DB ─────────────────────────────────────────────────────────────
#     stored = {**result, "owner_id": str(current_user["_id"]), "created_at": datetime.utcnow()}
#     stored.pop("api_key", None)
#     blackbox_collection.insert_one(stored)

#     from app.database import users_collection
#     users_collection.update_one(
#         {"_id": current_user["_id"]},
#         {"$inc": {"audit_count": 1}}
#     )

#     return result


# # ── History by AI name ─────────────────────────────────────────────────────────

# @router.get("/history/{ai_name}")
# def get_blackbox_history(ai_name: str, current_user=Depends(get_current_user)):
#     records = list(
#         blackbox_collection.find(
#             {"ai_name": ai_name, "owner_id": str(current_user["_id"])},
#             {"_id": 0, "probe_results": 0},
#         ).sort("created_at", -1).limit(10)
#     )
#     return {"history": records}


# # ── All audits for current user ────────────────────────────────────────────────

# @router.get("/history-all")
# def get_all_blackbox_history(current_user=Depends(get_current_user)):
#     records = list(
#         blackbox_collection.find(
#             {"owner_id": str(current_user["_id"])},
#             {"_id": 0, "probe_results": 0, "api_key": 0},
#         ).sort("created_at", -1).limit(50)
#     )
#     for r in records:
#         for field in ("created_at", "started_at", "completed_at"):
#             if isinstance(r.get(field), datetime):
#                 r[field] = r[field].isoformat()
#     return {"history": records}


# # ── Single audit full detail ───────────────────────────────────────────────────

# @router.get("/audit/{audit_id}")
# def get_blackbox_audit(audit_id: str, current_user=Depends(get_current_user)):
#     record = blackbox_collection.find_one(
#         {"audit_id": audit_id, "owner_id": str(current_user["_id"])},
#         {"_id": 0, "api_key": 0},
#     )
#     if not record:
#         raise HTTPException(status_code=404, detail="Audit not found.")
#     for field in ("created_at", "started_at", "completed_at"):
#         if isinstance(record.get(field), datetime):
#             record[field] = record[field].isoformat()
#     return record



"""
app/routes/blackbox.py
=======================
Blackbox audit router.

What changed:
  - _get_ai_context() now also returns registration_profile and system_prompt
    (stored by RegisterAi.tsx via ai_routes.py) so the orchestrator has full
    context for all 4 intelligence layers:
      1. Registration profile (end_users, decision_influence, data_types, etc.)
      2. System prompt (if the client pasted it at registration)
      3. Behavioral fingerprint (warm-up probes — orchestrator handles this)
      4. Description + domain (always present)
  - result from run_blackbox_pipeline includes adaptive_meta and fingerprint_meta
"""

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
ai_collection       = db["ai_systems"]


# ── Schema ─────────────────────────────────────────────────────────────────────

class BlackBoxRequest(BaseModel):
    ai_name:  str
    mode:     str                   # "api" | "ui"
    endpoint: Optional[str] = ""
    api_key:  Optional[str] = ""
    ui_url:   Optional[str] = ""
    cookies:  Optional[str] = ""   # JSON array from Cookie-Editor (UI mode only)


# ── Helper: fetch full AI system context from MongoDB ──────────────────────────

def _get_ai_context(ai_name: str, owner_id: str) -> dict:
    """
    Returns all context fields stored at registration time.
    Falls back to empty values if the system is not found.

    Fields returned:
      description           – plain description
      domain                – domain string
      registration_profile  – structured profile dict (Approach 3)
      system_prompt         – pasted system prompt (Approach 2), if provided
    """
    doc = ai_collection.find_one(
        {"name": ai_name, "owner_id": owner_id},
        {
            "description":          1,
            "domain":               1,
            "registration_profile": 1,
            "system_prompt":        1,   # stored by ai_routes.py if client provided it
            "_id":                  0,
        },
    )
    if not doc:
        return {
            "description":          "",
            "domain":               "",
            "registration_profile": None,
            "system_prompt":        "",
        }

    # Flatten registration_profile fields that RegisterAi.tsx captures
    # (end_users, decision_influence, data_types, jurisdictions,
    #  highest_stakes_failure, oversight_model, deployment_status,
    #  autonomous_actions, real_time_data, output_visibility, bias_tested,
    #  risk_scenario, custom_risk_scenario, agent_version)
    rp = doc.get("registration_profile") or {}

    # Some implementations store these at the top level of the AI doc
    # (not nested under registration_profile) — merge both for safety
    top_level_profile_fields = [
        "end_users", "decision_influence", "data_types", "jurisdictions",
        "highest_stakes_failure", "oversight_model", "deployment_status",
        "autonomous_actions", "real_time_data", "output_visibility",
        "bias_tested", "risk_scenario", "custom_risk_scenario", "agent_version",
    ]
    for field in top_level_profile_fields:
        if field not in rp and field in doc:
            rp[field] = doc[field]

    return {
        "description":          doc.get("description", ""),
        "domain":               doc.get("domain", ""),
        "registration_profile": rp if rp else None,
        "system_prompt":        doc.get("system_prompt", ""),
    }


# ── Run Audit ──────────────────────────────────────────────────────────────────

@router.post("/audit")
async def run_blackbox_audit(
    payload:     BlackBoxRequest,
    current_user=Depends(get_current_user),
):
    # ── Validate ───────────────────────────────────────────────────────────────
    if payload.mode == "api":
        if not payload.api_key:
            raise HTTPException(status_code=422, detail="API mode requires an api_key.")
    elif payload.mode == "ui":
        if not payload.ui_url:
            raise HTTPException(status_code=422, detail="UI mode requires ui_url.")
    else:
        raise HTTPException(status_code=422, detail="mode must be 'api' or 'ui'.")

    # ── Fetch all registered context (description, domain, profile, system prompt)
    ctx = _get_ai_context(
        ai_name=payload.ai_name,
        owner_id=str(current_user["_id"]),
    )

    # ── Route to correct pipeline ──────────────────────────────────────────────
    if payload.mode == "api":
        result = await run_blackbox_pipeline(
            ai_name=payload.ai_name,
            mode=payload.mode,
            endpoint=payload.endpoint or "",
            api_key=payload.api_key or "",
            current_user=current_user,
            ai_description=ctx["description"],
            ai_domain=ctx["domain"],
            registration_profile=ctx["registration_profile"],  # ← NEW
            system_prompt=ctx["system_prompt"],                 # ← NEW
        )

    elif payload.mode == "ui":
        profile = detect_platform(
            ui_url=payload.ui_url or "",
            ai_name=payload.ai_name,
        )
        _patch_selectors(ui_auditor_module, profile)

        # Pass context to UI pipeline too — ui_auditor should forward to probe_generator
        result = await run_ui_blackbox_pipeline(
            ai_name=payload.ai_name,
            ui_url=payload.ui_url or "",
            cookies=payload.cookies or None,
            stealth=profile["stealth"],
            ai_description=ctx["description"],
            ai_domain=ctx["domain"],
            registration_profile=ctx["registration_profile"],  # ← NEW
            system_prompt=ctx["system_prompt"],                 # ← NEW
        )

        result["platform_detected"] = profile["label"]
        result["platform_notes"]    = profile["notes"]

        if profile["needs_cookies"] and not payload.cookies:
            result["warning"] = (
                f"{profile['label']} requires login. No cookies were provided. "
                f"Export cookies from the target site using Cookie-Editor and pass "
                f"them in the 'cookies' field."
            )

    # ── Save to DB ─────────────────────────────────────────────────────────────
    stored = {**result, "owner_id": str(current_user["_id"]), "created_at": datetime.utcnow()}
    stored.pop("api_key", None)
    blackbox_collection.insert_one(stored)

    from app.database import users_collection
    users_collection.update_one(
        {"_id": current_user["_id"]},
        {"$inc": {"audit_count": 1}}
    )

    return result


# ── History by AI name ─────────────────────────────────────────────────────────

@router.get("/history/{ai_name}")
def get_blackbox_history(ai_name: str, current_user=Depends(get_current_user)):
    records = list(
        blackbox_collection.find(
            {"ai_name": ai_name, "owner_id": str(current_user["_id"])},
            {"_id": 0, "probe_results": 0},
        ).sort("created_at", -1).limit(10)
    )
    return {"history": records}


# ── All audits for current user ────────────────────────────────────────────────

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


# ── Single audit full detail ───────────────────────────────────────────────────

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