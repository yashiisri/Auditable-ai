from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
from bson import ObjectId

from app.schemas import RegisterSchema, LoginSchema, TokenResponse
from app.database import users_collection
from app.utils.security import hash_password, verify_password, create_access_token
from app.dependencies import get_current_user

router = APIRouter()


# ---------------------------------------
# REGISTER
# ---------------------------------------
@router.post("/register")
def register(user: RegisterSchema):
    existing_user = users_collection.find_one({"email": user.email})

    if existing_user:
        raise HTTPException(status_code=400, detail="Email already exists")

    hashed_password = hash_password(user.password)

    new_user = {
        "name": user.name,
        "email": user.email,
        "password": hashed_password,
        "role": "auditor",
        "is_active": True,
        "created_at": datetime.utcnow(),
        "last_login": None,
        "audit_count": 0
    }

    users_collection.insert_one(new_user)

    return {"message": "User registered successfully"}


# ---------------------------------------
# LOGIN
# ---------------------------------------
@router.post("/login", response_model=TokenResponse)
def login(user: LoginSchema):
    db_user = users_collection.find_one({"email": user.email})

    if not db_user:
        raise HTTPException(status_code=400, detail="Invalid credentials")

    if not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    # Update last login timestamp
    users_collection.update_one(
        {"_id": db_user["_id"]},
        {"$set": {"last_login": datetime.utcnow()}}
    )

    access_token = create_access_token({
        "sub": db_user["email"],
        "user_id": str(db_user["_id"]),
        "role": db_user["role"]
    })

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


# ---------------------------------------
# GET CURRENT USER (Protected)
# ---------------------------------------
@router.get("/me")
def get_profile(current_user=Depends(get_current_user)):
    return {
        "id": str(current_user["_id"]),
        "name": current_user["name"],
        "email": current_user["email"],
        "role": current_user["role"],
        "audit_count": current_user.get("audit_count", 0)
    }