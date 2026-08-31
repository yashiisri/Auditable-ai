from fastapi import APIRouter
import os
from groq import Groq

router = APIRouter()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

@router.post("/chat")
async def chat(data: dict):
    messages = data.get("messages")

    if not messages:
        return {"response": "No messages provided"}

    try:
        completion = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=messages
        )

        reply = completion.choices[0].message.content

        return {"response": reply}

    except Exception as e:
        return {"response": f"Error: {str(e)}"}