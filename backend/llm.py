# llm.py
import os
import requests
from dotenv import load_dotenv
from tools import TOOLS
import re

load_dotenv()

# Load system prompt from file
def load_system_prompt():
    try:
        with open("systemprompt.txt", "r") as f:
            return f.read().strip()
    except:
        return "You are a helpful assistant."

def detect_tool_usage(message: str):
    """Detect if user wants to use weather or history tool"""
    message_lower = message.lower()
    
    # History detection patterns
    history_patterns = ["history of", "tell me about", "ancient", "medieval", "independence", "empire", "dynasty", "historical"]
    
    # Weather detection patterns
    weather_patterns = ["weather in", "temperature in", "weather for", "what's the weather", "how's the weather", "weather"]
    
    # Check for history first (more specific)
    for pattern in history_patterns:
        if pattern in message_lower:
            return "history"
    
    # Then check for weather
    for pattern in weather_patterns:
        if pattern in message_lower:
            return "weather"
    
    return None

def extract_parameters(message: str, tool: str):
    """Extract parameters for weather and history tools"""
    message_lower = message.lower()
    
    if tool == "weather":
        # Extract city name
        patterns = [r"weather in ([^?]+)", r"temperature in ([^?]+)", r"weather for ([^?]+)"]
        for pattern in patterns:
            match = re.search(pattern, message_lower)
            if match:
                return match.group(1).strip()
        return "New York"  # Default city
    
    elif tool == "history":
        # Extract location/topic for history and format properly
        patterns = [r"history of ([^?]+)", r"tell me about ([^?]+)", r"about ([^?]+)"]
        for pattern in patterns:
            match = re.search(pattern, message_lower)
            if match:
                topic = match.group(1).strip().title()
                return f"History of {topic}"
        
        # If no pattern matches, assume they want history of the mentioned topic
        if any(word in message_lower for word in ["telangana", "karnataka", "tamil nadu", "kerala", "maharashtra", "gujarat", "rajasthan", "west bengal", "uttar pradesh", "andhra pradesh", "bihar", "odisha", "punjab", "haryana", "assam"]):
            # Extract state name and format properly
            for state in ["telangana", "karnataka", "tamil nadu", "kerala", "maharashtra", "gujarat", "rajasthan", "west bengal", "uttar pradesh", "andhra pradesh", "bihar", "odisha", "punjab", "haryana", "assam"]:
                if state in message_lower:
                    return f"History of {state.title()}"
        
        return "History of India"  # Default to India history
    
    return None

def ask_llm(message: str, chat_history: list = None) -> str:
    # Check if user wants to use a tool
    tool_needed = detect_tool_usage(message)
    print(f"DEBUG: Tool needed: {tool_needed}")  # Debug line
    
    if tool_needed in ["weather", "history"]:
        try:
            # Extract parameters and call the appropriate tool
            params = extract_parameters(message, tool_needed)
            print(f"DEBUG: Extracted params: {params}")  # Debug line
            
            tool_result = TOOLS[tool_needed](params)
            print(f"DEBUG: Tool result: {tool_result[:100]}...")  # Debug line
            
            # Return the tool result directly
            return tool_result
            
        except Exception as e:
            print(f"DEBUG: Tool error: {str(e)}")  # Debug line
            return f"⚠️ Error getting {tool_needed} data: {str(e)}"
    
    # If no tool needed, use regular LLM response
    return get_llm_response(message, chat_history)

def get_llm_response(message: str, chat_history: list = None) -> str:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return "Groq API key not found in environment variables."
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    # Load system prompt
    system_prompt = load_system_prompt()
    
    # Build messages with chat history
    messages = [{"role": "system", "content": system_prompt}]
    
    # Add chat history (keep last 10 messages to avoid token limits)
    if chat_history:
        recent_history = chat_history[-10:]
        messages.extend(recent_history)
    else:
        messages.append({"role": "user", "content": message})
    
    # Try different models
    models = ["llama-3.1-8b-instant", "llama3-8b-8192", "mixtral-8x7b-32768"]
    
    for model in models:
        payload = {
            "model": model,
            "messages": messages,
            "max_tokens": 1000,
            "temperature": 0.7
        }
        
        try:
            response = requests.post("https://api.groq.com/openai/v1/chat/completions", 
                                   headers=headers, json=payload, timeout=10)
            if response.status_code == 200:
                return response.json()["choices"][0]["message"]["content"]
        except:
            continue
    
    return "All LLM models failed. Try asking about weather instead!"