import requests
import json
from datetime import datetime
import re

def get_weather(city: str):
    try:
        url = f"https://geocoding-api.open-meteo.com/v1/search?name={city}"
        geo = requests.get(url).json()

        if "results" not in geo or len(geo["results"]) == 0:
            return f"🌤️ **Weather Info:**\n\nSorry, I couldn't find weather data for '{city}'. Please try a specific city name."

        lat = geo["results"][0]["latitude"]
        lon = geo["results"][0]["longitude"]
        location_name = geo["results"][0].get("name", city)
        country = geo["results"][0].get("country", "")

        weather_url = (
            f"https://api.open-meteo.com/v1/forecast?"
            f"latitude={lat}&longitude={lon}&current_weather=true&timezone=auto"
        )

        weather = requests.get(weather_url).json()
        current = weather["current_weather"]
        temp = current["temperature"]
        windspeed = current["windspeed"]
        
        # Get weather code description
        weather_codes = {
            0: "Clear sky ☀️", 1: "Mainly clear 🌤️", 2: "Partly cloudy ⛅", 3: "Overcast ☁️",
            45: "Foggy 🌫️", 51: "Light drizzle 🌦️", 61: "Slight rain 🌧️", 
            63: "Moderate rain 🌧️", 65: "Heavy rain ⛈️", 80: "Rain showers 🌦️", 95: "Thunderstorm ⛈️"
        }
        
        weather_desc = weather_codes.get(current.get("weathercode", 0), "Unknown ❓")
        
        return f"🌤️ **Current Weather in {location_name}:**\n\n🌡️ **Temperature:** {temp}°C\n🌬️ **Wind Speed:** {windspeed} km/h\n☁️ **Condition:** {weather_desc}\n📍 **Location:** {location_name}, {country}"
        
    except Exception as e:
        return f"🌤️ **Weather Error:**\n\nSorry, I couldn't get weather data for '{city}'. Error: {str(e)}"

def get_india_history(query: str):
    """Get historical information using Wikipedia API"""
    try:
        # Add User-Agent header to avoid 403 errors
        headers = {
            'User-Agent': 'InfoAgent/1.0 (https://github.com/user/infoagent)'
        }
        
        # Use the query directly to search Wikipedia
        search_url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{query.replace(' ', '_')}"
        response = requests.get(search_url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            title = data.get('title', query)
            extract = data.get('extract', 'No summary available')
            page_url = data.get('content_urls', {}).get('desktop', {}).get('page', '')
            
            formatted_response = f"📚 **{title}**\n\n{extract}"
            
            if page_url:
                formatted_response += f"\n\n🔗 **Read more:** [Wikipedia Article]({page_url})"
            
            return formatted_response
        else:
            # Try alternative search if direct lookup fails
            search_api_url = f"https://en.wikipedia.org/w/api.php?action=opensearch&search={query}&limit=1&format=json"
            search_response = requests.get(search_api_url, headers=headers, timeout=10)
            
            if search_response.status_code == 200:
                search_data = search_response.json()
                if len(search_data) > 1 and len(search_data[1]) > 0:
                    article_title = search_data[1][0]
                    # Try again with the found title
                    new_url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{article_title.replace(' ', '_')}"
                    new_response = requests.get(new_url, headers=headers, timeout=10)
                    
                    if new_response.status_code == 200:
                        data = new_response.json()
                        title = data.get('title', article_title)
                        extract = data.get('extract', 'No summary available')
                        page_url = data.get('content_urls', {}).get('desktop', {}).get('page', '')
                        
                        formatted_response = f"📚 **{title}**\n\n{extract}"
                        
                        if page_url:
                            formatted_response += f"\n\n🔗 **Read more:** [Wikipedia Article]({page_url})"
                        
                        return formatted_response
            
            return f"📚 **History Info:**\n\nSorry, I couldn't find information about '{query}'. Please try a different search term."
            
    except Exception as e:
        return f"📚 **History Error:**\n\nSorry, I couldn't retrieve information. Error: {str(e)}"
def parse_suggestions_from_response(response: str) -> list:
    """Parse suggestions from LLM response in the format 'Answer:\n...\n\nSuggestions:\n- item1\n- item2'"""
    suggestions = []
    lines = response.split('\n')
    
    # Find the "Suggestions:" line
    suggestions_start = -1
    for i, line in enumerate(lines):
        if line.strip().lower() == 'suggestions:':
            suggestions_start = i + 1
            break
    
    if suggestions_start == -1:
        return suggestions
    
    # Extract suggestions that start with "-"
    for i in range(suggestions_start, len(lines)):
        line = lines[i].strip()
        if line.startswith('- '):
            suggestion = line[2:].strip()
            if suggestion:
                suggestions.append(suggestion)
        elif line and not line.startswith('-') and not line.startswith(' '):
            # Stop if we hit non-suggestion content
            break
    
    return suggestions[:4]  # Max 4 suggestions

def clean_response_content(response: str) -> str:
    """Remove suggestions section from response to show only the answer"""
    lines = response.split('\n')
    answer_lines = []
    
    # Find where "Suggestions:" starts
    for line in lines:
        if line.strip().lower() == 'suggestions:':
            break
        answer_lines.append(line)
    
    # Remove "Answer:" prefix if present
    cleaned = '\n'.join(answer_lines).strip()
    if cleaned.lower().startswith('answer:'):
        cleaned = cleaned[7:].strip()
    
    return cleaned

# Tool registry for easy access
TOOLS = {
    "weather": get_weather,
    "history": get_india_history
}