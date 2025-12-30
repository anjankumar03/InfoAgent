from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from schemas import ChatRequest
from llm import ask_llm
from tools import get_weather, parse_suggestions_from_response, clean_response_content
from typing import Dict, List

app = FastAPI()

# In-memory chat history storage (use database in production)
chat_sessions: Dict[str, List[Dict[str, str]]] = {}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/chat")
def chat(req: ChatRequest):
    try:
        session_id = getattr(req, 'session_id', 'default')
        
        # Initialize session if not exists
        if session_id not in chat_sessions:
            chat_sessions[session_id] = []
        
        # Add user message to history
        chat_sessions[session_id].append({"role": "user", "content": req.message})
        
        # Get response with chat history context
        response = ask_llm(req.message, chat_sessions[session_id])
        
        # Parse suggestions and clean response
        suggestions = parse_suggestions_from_response(response)
        cleaned_response = clean_response_content(response)
        
        # Add assistant response to history
        chat_sessions[session_id].append({"role": "assistant", "content": cleaned_response})
        
        return {"response": cleaned_response, "suggestions": suggestions}
    except Exception as e:
        return {
            "response": f"Something went wrong: {str(e)}"
        }
