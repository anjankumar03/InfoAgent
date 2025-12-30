# InfoAgent

A modern chat application with AI assistant capabilities, featuring weather information and historical data retrieval with intelligent suggestion system.

## Features

- 🤖 AI-powered chat assistant with personalized responses
- 🌤️ Real-time weather data for any city worldwide
- 📚 Historical information from Wikipedia
- 💡 Intelligent follow-up suggestions
- 🎨 Modern ChatGPT-style UI with code highlighting
- 📱 Responsive design with smooth animations

## Tech Stack

**Backend:**
- FastAPI (Python)
- Groq API for LLM integration
- Open-Meteo API for weather data
- Wikipedia API for historical information

**Frontend:**
- React.js
- Prism.js for code syntax highlighting
- Modern CSS with animations

## Installation & Setup

### Prerequisites
- Python 3.8+
- Node.js 14+
- Git

### Step 1: Clone the Repository
```bash
git clone https://github.com/ShivaNagula00/InfoAgent.git
cd InfoAgent
```

### Step 2: Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create and activate virtual environment:
```bash
python -m venv .venv
.venv\Scripts\activate  # On Windows
# source .venv/bin/activate  # On macOS/Linux
```

3. Install Python dependencies:
```bash
pip install -r requirements.txt
```

4. Create `.env` file in backend directory:
```bash
echo GROQ_API_KEY=your_groq_api_key_here > .env
```

5. Start the backend server:
```bash
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Step 3: Frontend Setup

1. Open a new terminal and navigate to frontend directory:
```bash
cd frontend
```

2. Install Node.js dependencies:
```bash
npm install
```

3. Start the frontend development server:
```bash
npm start
```

## Running the Application

### Method 1: Manual (Recommended for Development)

**Terminal 1 - Backend:**
```bash
cd InfoAgent/backend
.venv\Scripts\activate
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd InfoAgent/frontend
npm start
```

### Method 2: Using Windows Command Prompt

**Start Backend:**
```cmd
start cmd /k "cd backend && .venv\Scripts\activate && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"
```

**Start Frontend:**
```cmd
start cmd /k "cd frontend && npm start"
```

## Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Documentation:** http://localhost:8000/docs

## Environment Variables

Create a `.env` file in the `backend` directory:

```env
GROQ_API_KEY=your_groq_api_key_here
```

## API Endpoints

- `POST /chat` - Send message to AI assistant
- `GET /docs` - API documentation

## Usage

1. Open http://localhost:3000 in your browser
2. Start chatting with InfoAgent
3. Ask about weather: "What's the weather in New York?"
4. Ask about history: "Tell me about the history of India"
5. Click on suggestion chips for follow-up questions

## Project Structure

```
InfoAgent/
├── backend/
│   ├── .venv/              # Virtual environment
│   ├── main.py             # FastAPI application
│   ├── llm.py              # LLM integration
│   ├── tools.py            # Weather & history tools
│   ├── schemas.py          # Pydantic models
│   ├── systemprompt.txt    # AI system prompt
│   ├── requirements.txt    # Python dependencies
│   └── .env                # Environment variables
├── frontend/
│   ├── src/
│   │   ├── Chat.js         # Main chat component
│   │   ├── api.js          # API integration
│   │   ├── index.css       # Styles
│   │   └── utils/          # Utility functions
│   ├── package.json        # Node.js dependencies
│   └── public/             # Static files
└── README.md               # This file
```

## Troubleshooting

**Backend Issues:**
- Ensure virtual environment is activated
- Check if GROQ_API_KEY is set in .env file
- Verify Python version (3.8+)

**Frontend Issues:**
- Clear npm cache: `npm cache clean --force`
- Delete node_modules and reinstall: `rm -rf node_modules && npm install`
- Check if backend is running on port 8000

**Port Conflicts:**
- Kill processes using ports 3000/8000:
  ```bash
  netstat -ano | findstr :3000
  netstat -ano | findstr :8000
  taskkill /PID <process_id> /F
  ```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Commit changes: `git commit -m 'Add feature'`
5. Push to branch: `git push origin feature-name`
6. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.