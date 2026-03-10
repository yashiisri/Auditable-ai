# from fastapi import APIRouter, HTTPException, Depends
# from datetime import datetime
# from bson import ObjectId

# from app.schemas import RegisterSchema, LoginSchema, TokenResponse
# from app.database import users_collection
# from app.utils.security import hash_password, verify_password, create_access_token
# from app.dependencies import get_current_user

# router = APIRouter()


# # ── Register ──────────────────────────────────────────────────────────────
# @router.post("/register")
# def register(user: RegisterSchema):
#     existing_user = users_collection.find_one({"email": user.email})

#     if existing_user:
#         raise HTTPException(status_code=400, detail="Email already exists")

#     hashed_password = hash_password(user.password)

#     new_user = {
#         "name": user.name,
#         "email": user.email,
#         "password": hashed_password,          # always bcrypt hash
#         "role": "auditor",
#         "is_active": True,
#         "created_at": datetime.utcnow(),
#         "last_login": None,
#         "audit_count": 0
#     }

#     users_collection.insert_one(new_user)
#     return {"message": "User registered successfully"}


# # ── Login ─────────────────────────────────────────────────────────────────
# @router.post("/login", response_model=TokenResponse)
# def login(user: LoginSchema):
#     db_user = users_collection.find_one({"email": user.email})

#     if not db_user:
#         raise HTTPException(status_code=400, detail="Invalid credentials")

#     stored_password = db_user.get("password", "")

#     # Guard: if the stored value is not a bcrypt hash, reject it cleanly
#     if not stored_password.startswith("$2b$") and not stored_password.startswith("$2a$"):
#         raise HTTPException(
#             status_code=400,
#             detail="Account has a corrupted password. Please re-register your account."
#         )

#     if not verify_password(user.password, stored_password):
#         raise HTTPException(status_code=400, detail="Invalid credentials")

#     users_collection.update_one(
#         {"_id": db_user["_id"]},
#         {"$set": {"last_login": datetime.utcnow()}}
#     )

#     access_token = create_access_token({
#         "sub": db_user["email"],
#         "user_id": str(db_user["_id"]),
#         "role": db_user["role"]
#     })

#     return {"access_token": access_token, "token_type": "bearer"}


# # ── Get Profile ───────────────────────────────────────────────────────────
# @router.get("/me")
# def get_profile(current_user=Depends(get_current_user)):
#     return {
#         "id": str(current_user["_id"]),
#         "name": current_user["name"],
#         "email": current_user["email"],
#         "role": current_user["role"],
#         "audit_count": current_user.get("audit_count", 0)
#     }

from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
from pydantic import BaseModel
from typing import Optional

from app.schemas import RegisterSchema, LoginSchema, TokenResponse
from app.database import users_collection
from app.utils.security import hash_password, verify_password, create_access_token
from app.dependencies import get_current_user

router = APIRouter()


# ── Register ──────────────────────────────────────────────────────────────
@router.post("/register")
def register(user: RegisterSchema):
    existing_user = users_collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already exists")

    new_user = {
        "name":        user.name,
        "email":       user.email,
        "password":    hash_password(user.password),
        "role":        "auditor",
        "is_active":   True,
        "created_at":  datetime.utcnow(),
        "last_login":  None,
        "audit_count": 0,
    }
    users_collection.insert_one(new_user)
    return {"message": "User registered successfully"}


# ── Login ─────────────────────────────────────────────────────────────────
@router.post("/login", response_model=TokenResponse)
def login(user: LoginSchema):
    db_user = users_collection.find_one({"email": user.email})
    if not db_user:
        raise HTTPException(status_code=400, detail="Invalid credentials")

    stored = db_user.get("password", "")
    if not stored.startswith("$2b$") and not stored.startswith("$2a$"):
        raise HTTPException(status_code=400, detail="Corrupted password. Please re-register.")

    if not verify_password(user.password, stored):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    users_collection.update_one(
        {"_id": db_user["_id"]},
        {"$set": {"last_login": datetime.utcnow()}},
    )

    token = create_access_token({
        "sub":     db_user["email"],
        "user_id": str(db_user["_id"]),
        "role":    db_user["role"],
    })
    return {"access_token": token, "token_type": "bearer"}


# ── Get Profile ───────────────────────────────────────────────────────────
@router.get("/me")
def get_profile(current_user=Depends(get_current_user)):
    created = current_user.get("created_at")
    last    = current_user.get("last_login")
    return {
        "id":          str(current_user["_id"]),
        "name":        current_user["name"],
        "email":       current_user["email"],
        "role":        current_user["role"],
        "audit_count": current_user.get("audit_count", 0),
        "created_at":  created.isoformat() if isinstance(created, datetime) else None,
        "last_login":  last.isoformat()    if isinstance(last,    datetime) else None,
    }


# ── Update Profile (name) ─────────────────────────────────────────────────
class UpdateProfileSchema(BaseModel):
    name: Optional[str] = None


@router.patch("/me")
def update_profile(payload: UpdateProfileSchema, current_user=Depends(get_current_user)):
    updates: dict = {}
    if payload.name is not None:
        name = payload.name.strip()
        if not name:
            raise HTTPException(status_code=400, detail="Name cannot be empty.")
        updates["name"] = name
    if not updates:
        raise HTTPException(status_code=400, detail="Nothing to update.")
    users_collection.update_one({"_id": current_user["_id"]}, {"$set": updates})
    return {"message": "Profile updated successfully", **updates}