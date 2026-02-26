import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")

client = MongoClient(MONGO_URI)
db = client["trusted_ai_db"]

users_collection = db["users"]
ai_collection = db["ai_systems"]
sdcc_collection = db["sdcc_results"]