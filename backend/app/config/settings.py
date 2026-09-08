import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    SECRET_KEY = os.getenv("SECRET_KEY", "supersecret")

    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")

    # ── LLM Judge Panel models ────────────────────────────────────────────────
    # Change these (or override via .env) to swap the judge models globally.
    # Judge 1 — Groq
    JUDGE_GROQ_MODEL: str       = os.getenv("JUDGE_GROQ_MODEL",       "openai/gpt-oss-120b")
    # Judge 2 — OpenRouter
    JUDGE_OPENROUTER_MODEL: str = os.getenv("JUDGE_OPENROUTER_MODEL", "mistralai/mistral-large")
    # Judge 3 — Together AI
    JUDGE_TOGETHER_MODEL: str   = os.getenv("JUDGE_TOGETHER_MODEL",   "Qwen/Qwen2.5-72B-Instruct")

    # ── Detector tiebreaker model (Groq Phase-4) ──────────────────────────────
    DETECTOR_GROQ_MODEL: str    = os.getenv("DETECTOR_GROQ_MODEL",    "openai/gpt-oss-20b")

settings = Settings()
