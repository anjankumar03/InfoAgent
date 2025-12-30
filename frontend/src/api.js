const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://infoagent-1.onrender.com' 
  : 'http://localhost:8000';

export async function sendMessage(message) {
  try {
    const res = await fetch(`${API_BASE_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    return res.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}
