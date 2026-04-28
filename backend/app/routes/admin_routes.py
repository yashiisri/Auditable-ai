from fastapi import APIRouter, HTTPException, Depends
from app.dependencies import get_current_user
from app.database import users_collection, reports_collection, sdcc_collection
from bson import ObjectId

router = APIRouter()


def require_admin(current_user=Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


def _serialize(doc: dict) -> dict:
    doc["id"] = str(doc.pop("_id", ""))
    return doc


@router.get("/users")
def list_users(admin=Depends(require_admin)):
    users = list(users_collection.find({}, {"password": 0}))
    return [_serialize(u) for u in users]


@router.get("/audits")
def list_audits(admin=Depends(require_admin)):
    # Return full audit data including principles, findings, computation notes
    docs = list(reports_collection.find({}))
    if not docs:
        docs = list(sdcc_collection.find({}))
    return [_serialize(d) for d in docs]


@router.get("/audits/{audit_id}")
def get_audit(audit_id: str, admin=Depends(require_admin)):
    from bson import ObjectId as ObjId
    try:
        doc = reports_collection.find_one({"_id": ObjId(audit_id)})
        if not doc:
            doc = sdcc_collection.find_one({"_id": ObjId(audit_id)})
    except Exception:
        doc = reports_collection.find_one({"report_id": audit_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Audit not found")
    return _serialize(doc)
