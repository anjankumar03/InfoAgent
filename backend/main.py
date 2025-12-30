from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import json
from schemas import ChatRequest
from llm import ask_llm
from tools import get_weather

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/chat")
def chat(req: ChatRequest):
    msg = req.message.lower()

    if "weather" in msg:
        city = msg.split()[-1]
        return {"response": get_weather(city)}

    try:
        return {"response": ask_llm(req.message)}
    except Exception as e:
        return {"response": f"Hello! I'm a weather agent. Ask me about the weather in any city, or there might be an issue with the LLM service: {str(e)}"}
