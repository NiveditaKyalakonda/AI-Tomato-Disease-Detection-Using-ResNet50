"""Disease-specific weather risk assessment."""

from database.disease_data import get_disease_info


def assess_disease_weather_risk(disease_class: str, weather: dict, forecast: list | None = None) -> dict:
    info = get_disease_info(disease_class)
    conditions = info.get("risk_conditions", {})
    temperature = float(weather.get("temperature", 25))
    humidity = float(weather.get("humidity", 60))
    rainfall = float(weather.get("rainfall_1h", 0))
    precipitation = float(weather.get("precipitation_probability", 0))
    forecast = forecast or []

    t_min, t_max = conditions.get("temperature_range", [0, 50])
    score = 0
    factors = []

    if t_min <= temperature <= t_max:
        score += 35
        factors.append("Temperature is favorable for this disease")
    elif abs(temperature - t_min) <= 4 or abs(temperature - t_max) <= 4:
        score += 15

    humidity_threshold = conditions.get("humidity_threshold", 70)
    if humidity >= humidity_threshold:
        score += 30
        factors.append("High humidity can keep leaves wet")
    elif humidity >= humidity_threshold - 10:
        score += 15

    if conditions.get("rainfall_risk") and (rainfall > 0 or precipitation >= 40):
        score += 20
        factors.append("Rain or expected precipitation may spread infection")

    rainy_days = sum(
        1 for day in forecast
        if day.get("rainfall", 0) > 0 or day.get("precipitation_probability", 0) >= 40
    )
    if rainy_days >= 2:
        score += 15
        factors.append("Several forecast periods may remain wet")

    score = min(100, score)
    if score >= 80:
        level, color = "Very High", "#B91C1C"
    elif score >= 60:
        level, color = "High", "#EF4444"
    elif score >= 35:
        level, color = "Moderate", "#F59E0B"
    else:
        level, color = "Low", "#22C55E"

    return {
        "disease_class": disease_class,
        "disease_name": info.get("name", disease_class),
        "risk_level": level,
        "risk_score": score,
        "color": color,
        "risk_factors": factors or ["Current conditions are not strongly favorable"],
        "rainy_days": rainy_days,
        "explanation": (
            "This is a weather-based risk assessment, not a certainty. "
            "Monitor nearby plants and confirm changes in the field."
        ),
    }
