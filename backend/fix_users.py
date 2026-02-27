"""
Run this ONCE to delete users with corrupted/plain-text passwords from MongoDB.
Usage:  python fix_users.py
"""
import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

client = MongoClient(os.getenv("MONGO_URI"))
db = client["trusted_ai_db"]
users = db["users"]

# Delete ALL users so you can re-register fresh with proper bcrypt hashes
result = users.delete_many({})
print(f"Deleted {result.deleted_count} user(s) from the database.")
print("Now go to http://localhost:5173/register and create a fresh account.")