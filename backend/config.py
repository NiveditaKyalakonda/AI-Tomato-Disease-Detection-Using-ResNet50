import os
from pathlib import Path
from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parent
load_dotenv(BACKEND_DIR / ".env")


def _backend_path(env_name: str, default: Path) -> str:
    configured_path = Path(os.getenv(env_name, str(default)))
    if not configured_path.is_absolute():
        configured_path = BACKEND_DIR / configured_path
    return str(configured_path.resolve())


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "fallback-secret")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "fallback-jwt-secret")
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
    DB_NAME = os.getenv("DB_NAME", "tomato_disease_db")
    WEATHER_API_KEY = os.getenv("WEATHER_API_KEY", "")
    UPLOAD_FOLDER = _backend_path("UPLOAD_FOLDER", BACKEND_DIR / "uploads")
    RESULTS_FOLDER = _backend_path("RESULTS_FOLDER", BACKEND_DIR / "results")
    MODEL_PATH = _backend_path("MODEL_PATH", BACKEND_DIR / "model" / "resnet50_tomato_disease.keras")
    CLASS_NAMES_PATH = _backend_path("CLASS_NAMES_PATH", BACKEND_DIR / "model" / "class_names.json")
    MAX_CONTENT_LENGTH = int(os.getenv("MAX_CONTENT_LENGTH", 16 * 1024 * 1024))
    DEBUG = os.getenv("DEBUG", "False") == "True"

    ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}

    # Confidence thresholds
    HIGH_CONFIDENCE_THRESHOLD = 75
    LOW_CONFIDENCE_THRESHOLD = 50

    # JWT expiry
    JWT_ACCESS_TOKEN_EXPIRES_HOURS = 24
