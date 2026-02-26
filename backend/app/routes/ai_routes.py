from fastapi import APIRouter, Depends, UploadFile, File
from datetime import datetime
from app.database import ai_collection
from app.dependencies import get_current_user
from pydantic import BaseModel
from typing import Dict, Any
from app.services.sdcc.orchestrator import run_sdcc_pipeline

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
def register_ai_system(
    ai_data: AISystemSchema,
    current_user=Depends(get_current_user)
):
    # Check duplicate
    existing = ai_collection.find_one({
        "name": ai_data.name,
        "owner_id": str(current_user["_id"])
    })

    if existing:
        raise HTTPException(status_code=400, detail="AI system already exists")

    new_ai = {
        "name": ai_data.name,
        "description": ai_data.description,
        "domain": ai_data.domain,
        "connector": ai_data.connector.dict(),
        "owner_id": str(current_user["_id"]),
        "created_at": datetime.utcnow(),
        "status": "active",
        "audit_runs": 0
    }

    ai_collection.insert_one(new_ai)

    return {"message": "AI system registered successfully"}

@router.post("/sdcc/ingest/{ai_name}")
def ingest_logs(
    ai_name: str,
    file: UploadFile = File(...),
    current_user=Depends(get_current_user)
):
    return run_sdcc_pipeline(ai_name, file, current_user)