"""
Weather-based disease risk analysis.
Uses OpenWeatherMap API to get current conditions and
assesses risk for each tomato disease based on weather parameters.
"""

import requests
from config import Config
from database.disease_data import DISEASE_INFO


def get_weather(city: str = "Bengaluru", lat: float = None, lon: float = None) -> dict:
    """
    Fetch current weather from OpenWeatherMap API.
    Falls back to mock data if API key is not configured.
    """
    api_key = Config.WEATHER_API_KEY

    if not api_key or api_key == "your_openweathermap_api_key_here":
        return _mock_weather(city)

    try:
        if lat and lon:
            url = (
                f"https://api.openweathermap.org/data/2.5/weather"
                f"?lat={lat}&lon={lon}&appid={api_key}&units=metric"
            )
        else:
            url = (
                f"https://api.openweathermap.org/data/2.5/weather"
                f"?q={city}&appid={api_key}&units=metric"
            )

        resp = requests.get(url, timeout=5)
        resp.raise_for_status()
        data = resp.json()

        forecast = get_forecast(city=city, lat=lat, lon=lon, api_key=api_key)
        return {
            "city": data.get("name", city),
            "temperature": round(data["main"]["temp"], 1),
            "humidity": data["main"]["humidity"],
            "description": data["weather"][0]["description"].capitalize(),
            "wind_speed": data.get("wind", {}).get("speed", 0),
            "rainfall_1h": data.get("rain", {}).get("1h", 0),
            "precipitation_probability": 0,
            "forecast": forecast,
            "consecutive_rainy_days": sum(1 for item in forecast if item.get("rainfall", 0) > 0 or item.get("precipitation_probability", 0) >= 40),
            "source": "live",
        }
    except Exception as e:
        print(f"[Weather] API error: {e} — using mock data")
        return _mock_weather(city)


def _mock_weather(city: str) -> dict:
    """
    Return city-aware mock weather data.
    Different cities get different representative conditions so the
    risk analysis produces varied results during demos.
    """
    city_lower = city.lower()

    # Tropical / humid baseline
    if any(k in city_lower for k in ["bengaluru", "bangalore", "mysuru", "mysore", "mangaluru"]):
        temp, hum, rain, desc = 27.0, 74, 1.2, "Light rain"
    elif any(k in city_lower for k in ["mumbai", "pune", "kolhapur"]):
        temp, hum, rain, desc = 29.5, 82, 3.0, "Overcast with showers"
    elif any(k in city_lower for k in ["chennai", "coimbatore", "madurai"]):
        temp, hum, rain, desc = 33.0, 68, 0.0, "Sunny and hot"
    elif any(k in city_lower for k in ["delhi", "noida", "gurugram", "agra"]):
        temp, hum, rain, desc = 24.0, 55, 0.0, "Clear sky"
    elif any(k in city_lower for k in ["kolkata", "howrah", "bhubaneswar"]):
        temp, hum, rain, desc = 31.0, 85, 2.5, "Humid and cloudy"
    elif any(k in city_lower for k in ["hyderabad", "secunderabad", "warangal"]):
        temp, hum, rain, desc = 28.5, 65, 0.3, "Partly cloudy"
    elif any(k in city_lower for k in ["shimla", "manali", "dehradun", "srinagar"]):
        temp, hum, rain, desc = 14.0, 60, 0.8, "Cool and misty"
    else:
        # Generic representative Indian agriculture zone
        temp, hum, rain, desc = 26.5, 72, 0.5, "Partly cloudy"

    forecast = [
        {"period": "Today", "temperature": temp, "humidity": hum, "rainfall": rain, "precipitation_probability": 65 if rain else 10},
        {"period": "Tomorrow", "temperature": temp + 1, "humidity": min(99, hum + 3), "rainfall": rain, "precipitation_probability": 60 if rain else 15},
        {"period": "Day 3", "temperature": temp - 1, "humidity": max(30, hum - 2), "rainfall": rain / 2, "precipitation_probability": 45 if rain else 20},
        {"period": "Day 4", "temperature": temp, "humidity": hum, "rainfall": 0, "precipitation_probability": 20},
        {"period": "Day 5", "temperature": temp + 1, "humidity": hum, "rainfall": 0, "precipitation_probability": 15},
    ]
    return {
        "city": city,
        "temperature": temp,
        "humidity": hum,
        "description": desc,
        "wind_speed": 3.2,
        "rainfall_1h": rain,
        "precipitation_probability": forecast[0]["precipitation_probability"],
        "forecast": forecast,
        "consecutive_rainy_days": sum(1 for item in forecast if item["rainfall"] > 0 or item["precipitation_probability"] >= 40),
        "source": "mock",
        "note": "Sample data — add your OpenWeatherMap API key in .env for live weather.",
    }


def get_forecast(city: str = "Bengaluru", lat: float = None, lon: float = None, api_key: str = "") -> list:
    params = {"appid": api_key, "units": "metric", "cnt": 40}
    if lat is not None and lon is not None:
        params.update({"lat": lat, "lon": lon})
    else:
        params["q"] = city
    response = requests.get("https://api.openweathermap.org/data/2.5/forecast", params=params, timeout=5)
    response.raise_for_status()
    items = response.json().get("list", [])
    return [
        {
            "period": item.get("dt_txt", ""),
            "temperature": round(item.get("main", {}).get("temp", 25), 1),
            "humidity": item.get("main", {}).get("humidity", 60),
            "rainfall": item.get("rain", {}).get("3h", 0),
            "precipitation_probability": round(item.get("pop", 0) * 100),
        }
        for item in items
    ]


def assess_disease_risk(weather: dict) -> dict:
    """
    Assess disease risk for each class based on current weather conditions.

    Returns an overall risk level and per-disease risk details.
    """
    temp = weather.get("temperature", 25)
    humidity = weather.get("humidity", 60)
    rainfall = weather.get("rainfall_1h", 0)

    risk_results = []
    high_risk_count = 0

    for class_name, info in DISEASE_INFO.items():
        if class_name == "Tomato_healthy":
            continue

        conditions = info.get("risk_conditions", {})
        t_range = conditions.get("temperature_range", [0, 50])
        h_thresh = conditions.get("humidity_threshold", 50)
        rain_risk = conditions.get("rainfall_risk", False)

        # Calculate risk score (0-100)
        risk_score = 0

        # Temperature factor (0-40 points)
        t_min, t_max = t_range
        if t_min <= temp <= t_max:
            risk_score += 40
        elif abs(temp - t_min) <= 3 or abs(temp - t_max) <= 3:
            risk_score += 20

        # Humidity factor (0-40 points)
        if humidity >= h_thresh:
            excess = humidity - h_thresh
            risk_score += min(40, 25 + excess // 2)
        elif humidity >= h_thresh - 10:
            risk_score += 15

        # Rainfall factor (0-20 points)
        if rain_risk and rainfall > 0:
            risk_score += min(20, int(rainfall * 10))

        if risk_score >= 70:
            risk_level = "High"
            color = "#EF4444"
            high_risk_count += 1
        elif risk_score >= 40:
            risk_level = "Medium"
            color = "#F59E0B"
        else:
            risk_level = "Low"
            color = "#22C55E"

        risk_results.append({
            "class_name": class_name,
            "disease_name": info["name"],
            "risk_level": risk_level,
            "risk_score": risk_score,
            "color": color,
            "type": info["type"],
        })

    risk_results.sort(key=lambda x: x["risk_score"], reverse=True)

    # Overall risk
    if high_risk_count >= 3:
        overall = "High"
        overall_color = "#EF4444"
        alert = (
            "⚠️ High disease risk detected based on current weather conditions. "
            "Inspect tomato leaves regularly and consider preventive measures."
        )
    elif high_risk_count >= 1:
        overall = "Medium"
        overall_color = "#F59E0B"
        alert = (
            "🟡 Moderate disease risk. Monitor plants closely over the next few days."
        )
    else:
        overall = "Low"
        overall_color = "#22C55E"
        alert = "🟢 Current weather conditions pose a low risk for most tomato diseases."

    return {
        "overall_risk": overall,
        "overall_color": overall_color,
        "alert_message": alert,
        "high_risk_count": high_risk_count,
        "disease_risks": risk_results,
        "weather": weather,
    }
