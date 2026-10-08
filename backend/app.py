"""
AI-Based Tomato Leaf Disease Detection and Smart Agricultural
Decision Support System — Flask Backend

Endpoints:
  POST /api/auth/register
  POST /api/auth/login
  GET  /api/auth/me

  POST /api/predict
  POST /api/gradcam

  GET  /api/history
  GET  /api/history/<id>
  DELETE /api/history/<id>

  GET  /api/diseases
  GET  /api/diseases/<class_name>

  GET  /api/weather-risk
  POST /api/expert-request

  GET  /api/dashboard
  GET  /api/admin/stats
  GET  /api/admin/users
"""

import os
import uuid
import datetime
from functools import wraps

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    jwt_required,
    get_jwt_identity,
)
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename

from config import Config
from database.database import (
    create_user,
    get_user_by_email,
    get_user_by_id,
    update_user,
    save_prediction,
    get_predictions_by_user,
    get_prediction_by_id,
    delete_prediction,
    get_user_stats,
    create_expert_request,
    get_expert_requests,
    update_expert_request,
    get_global_stats,
    get_all_users,
    is_db_available,
)
from database.disease_data import get_disease_info, get_all_diseases
from services.preprocessing import (
    check_image_quality,
    preprocess_image,
    preprocess_for_gradcam,
    estimate_severity,
)
from services.prediction import ModelUnavailableError, model_status, predict, load_model
from services.gradcam import generate_gradcam
from services.weather import get_weather, assess_disease_risk
from services.risk_engine import assess_disease_weather_risk

# ─────────────────────────────────────────
# App setup
# ─────────────────────────────────────────

app = Flask(__name__)
app.config.from_object(Config)
app.config["JWT_SECRET_KEY"] = Config.JWT_SECRET_KEY
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = datetime.timedelta(
    hours=Config.JWT_ACCESS_TOKEN_EXPIRES_HOURS
)
app.config["MAX_CONTENT_LENGTH"] = Config.MAX_CONTENT_LENGTH

CORS(
    app,
    resources={
        r"/api/*": {
            "origins": [
                "http://localhost:5173",
                "http://127.0.0.1:5173",
            ]
        }
    },
)
jwt = JWTManager(app)

# Ensure upload/results directories exist
os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
os.makedirs(Config.RESULTS_FOLDER, exist_ok=True)

# Load the trained model at startup. Inference stays unavailable unless loading succeeds.
load_model()

# ─────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────

def allowed_file(filename: str) -> bool:
    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower() in Config.ALLOWED_EXTENSIONS
    )


def success(data: dict = None, message: str = "Success", status: int = 200):
    payload = {"success": True, "message": message}
    if data is not None:
        payload.update(data)
    return jsonify(payload), status


def error(message: str, status: int = 400, code: str = None):
    payload = {"success": False, "message": message}
    if code:
        payload["code"] = code
    return jsonify(payload), status


# In-memory fallback store when MongoDB is unavailable
_mem_users = {}
_mem_preds = {}
_mem_experts = []


def _mem_save_user(user_data):
    uid = str(uuid.uuid4())
    _mem_users[uid] = {**user_data, "_id": uid}
    return uid


def _mem_get_user_by_email(email):
    for u in _mem_users.values():
        if u.get("email") == email.lower():
            return u
    return None


def _mem_get_user_by_id(uid):
    return _mem_users.get(uid)


# ─────────────────────────────────────────
# Health check
# ─────────────────────────────────────────

@app.route("/", methods=["GET"])
def index():
    status = model_status()
    return jsonify(
        {
            "success": status["model_loaded"],
            "server": "running",
            "message": "AI model service is ready." if status["model_loaded"] else status["error"],
            "model_loaded": status["model_loaded"],
        }
    ), 200 if status["model_loaded"] else 503


@app.route("/api/health", methods=["GET"])
def health():
    status = model_status()
    payload = {
        "success": status["model_loaded"],
        "server": "running",
        "tensorflow": status["tensorflow"],
        "keras": status["keras"],
        "model_loaded": status["model_loaded"],
        "classes": status["classes"],
        "db": "connected" if is_db_available() else "unavailable (using in-memory)",
    }
    if not status["model_loaded"]:
        payload["error"] = status["error"]
        return jsonify(payload), 503
    return jsonify(payload), 200


@app.route("/api/model-info", methods=["GET"])
def model_info():
    status = model_status()
    payload = {
        "success": status["model_loaded"],
        "model": "ResNet50",
        "input_size": "224x224",
        "classes": status["classes"],
        "class_names": load_model()[1] or [],
        "explainability": "Grad-CAM",
        "framework": "TensorFlow/Keras",
        "tensorflow": status["tensorflow"],
        "keras": status["keras"],
        "model_loaded": status["model_loaded"],
    }
    if not status["model_loaded"]:
        payload["error"] = status["error"]
        return jsonify(payload), 503
    return jsonify(payload), 200


# ─────────────────────────────────────────
# Auth
# ─────────────────────────────────────────

@app.route("/api/auth/register", methods=["POST"])
def register():
    data = request.get_json()
    if not data:
        return error("Request body required.")

    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    language = data.get("language", "en")
    role = "user"

    if not name or not email or not password:
        return error("Name, email, and password are required.")
    if len(password) < 6:
        return error("Password must be at least 6 characters.")

    # Check duplicate
    existing = get_user_by_email(email) if is_db_available() else _mem_get_user_by_email(email)
    if existing:
        return error("An account with this email already exists.", 409)

    hashed = generate_password_hash(password)
    user_data = {
        "name": name,
        "email": email,
        "password": hashed,
        "language": language,
        "role": role,
    }

    if is_db_available():
        user_id = create_user(user_data)
    else:
        user_id = _mem_save_user(user_data)

    token = create_access_token(identity=user_id)
    return success(
        {
            "token": token,
            "user": {"id": user_id, "name": name, "email": email, "role": role, "language": language},
        },
        "Registration successful",
        201,
    )


@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json()
    if not data:
        return error("Request body required.")

    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return error("Email and password are required.")

    user = get_user_by_email(email) if is_db_available() else _mem_get_user_by_email(email)
    if not user or not check_password_hash(user["password"], password):
        return error("Invalid email or password.", 401)

    token = create_access_token(identity=user["_id"])
    return success(
        {
            "token": token,
            "user": {
                "id": user["_id"],
                "name": user["name"],
                "email": user["email"],
                "role": user.get("role", "user"),
                "language": user.get("language", "en"),
            },
        },
        "Login successful",
    )


@app.route("/api/auth/me", methods=["GET"])
@jwt_required()
def me():
    uid = get_jwt_identity()
    user = get_user_by_id(uid) if is_db_available() else _mem_get_user_by_id(uid)
    if not user:
        return error("User not found.", 404)
    user.pop("password", None)
    return success({"user": user})


@app.route("/api/auth/update", methods=["PUT"])
@jwt_required()
def update_profile():
    uid = get_jwt_identity()
    data = request.get_json() or {}
    allowed = {k: v for k, v in data.items() if k in ["name", "language", "location"]}
    if is_db_available():
        update_user(uid, allowed)
    elif uid in _mem_users:
        _mem_users[uid].update(allowed)
    return success({}, "Profile updated")


# ─────────────────────────────────────────
# Prediction
# ─────────────────────────────────────────

@app.route("/api/predict", methods=["POST"])
@jwt_required()
def predict_disease():
    user_id = get_jwt_identity()

    if "image" not in request.files:
        return error("Please upload a tomato leaf image.", code="NO_IMAGE")

    file = request.files["image"]
    if file.filename == "" or not allowed_file(file.filename):
        return error("Invalid file. Allowed: png, jpg, jpeg, webp.")

    location = request.form.get("location", "")
    language = request.form.get("language", "en")
    skip_quality = request.form.get("skip_quality", "false").lower() == "true"

    image_bytes = file.read()

    # ── Quality check
    quality = check_image_quality(image_bytes)
    if not skip_quality and not quality["ok"]:
        return error(
            f"Image quality check failed: {'; '.join(quality['issues'])}. "
            "Upload a clearer image or set skip_quality=true to proceed anyway.",
            422,
            "IMAGE_QUALITY_FAILED",
        )

    # ── Preprocess
    try:
        preprocessed = preprocess_image(image_bytes)
        preprocessed_gc, original_np = preprocess_for_gradcam(image_bytes)
    except Exception as exc:
        app.logger.exception("Uploaded image preprocessing failed")
        return error(f"Unable to process this image: {exc}", 422, "IMAGE_PROCESSING_FAILED")

    # ── Predict
    try:
        result = predict(preprocessed)
    except ModelUnavailableError as exc:
        return error(f"TensorFlow model service failed to initialize: {exc}", 503, "AI_MODEL_UNAVAILABLE")
    except Exception as exc:
        app.logger.exception("Trained model inference failed")
        return error(f"AI model inference failed: {exc}", 500, "AI_INFERENCE_FAILED")
    predicted_class = result["predicted_class"]
    class_index = result["class_index"]
    confidence = result["confidence"]

    # ── Disease info
    disease_info = get_disease_info(predicted_class)
    localized_name = disease_info.get(language) or disease_info.get("name", predicted_class)
    weather = get_weather(city=location or "Bengaluru")
    disease_risk = assess_disease_weather_risk(predicted_class, weather, weather.get("forecast"))

    # ── Grad-CAM is optional: a visualization error must not discard a real prediction.
    gc = None
    gradcam_error = None
    model, class_names = load_model()
    try:
        gc = generate_gradcam(model, preprocessed_gc, class_index, original_np)
    except Exception as exc:
        gradcam_error = str(exc)
        app.logger.exception("Grad-CAM generation failed")

    severity = estimate_severity(gc["activation_map"]) if gc else None

    # ── Save image
    filename = f"{uuid.uuid4().hex}.jpg"
    filepath = os.path.join(Config.UPLOAD_FOLDER, filename)
    with open(filepath, "wb") as f:
        f.write(image_bytes)

    # ── Save to DB
    pred_doc = {
        "user_id": user_id,
        "image_filename": filename,
        "disease": predicted_class,
        "disease_name": disease_info.get("name", predicted_class),
        "language": language,
        "localized_disease_name": localized_name,
        "confidence": confidence,
        "confidence_level": result["confidence_level"],
        "is_healthy": result["is_healthy"],
        "severity": severity["level"] if severity else None,
        "severity_pct": severity["percentage"] if severity else None,
        "location": location,
        "all_predictions": result["all_predictions"],
        "weather": weather,
        "risk": disease_risk,
    }

    if is_db_available():
        pred_id = save_prediction(pred_doc)
    else:
        pred_id = str(uuid.uuid4())
        _mem_preds[pred_id] = {**pred_doc, "_id": pred_id}

    return success(
        {
            "prediction_id": pred_id,
            "prediction": predicted_class,
            "predicted_class": predicted_class,
            "class_index": class_index,
            "disease_name": disease_info.get("name", predicted_class),
            "localized_disease_name": localized_name,
            "language": language,
            "confidence": confidence,
            "confidence_level": result["confidence_level"],
            "warning": result["warning"],
            "is_healthy": result["is_healthy"],
            "severity": severity,
            "disease_info": disease_info,
            "gradcam": {
                "overlay_b64": gc["overlay_b64"],
                "heatmap_b64": gc["heatmap_b64"],
            } if gc else None,
            "gradcam_error": gradcam_error,
            "quality": quality,
            "weather": weather,
            "future_risk": disease_risk,
            "all_predictions": result["all_predictions"][:5],
        },
        "Prediction complete",
    )


@app.route("/api/gradcam/<prediction_id>", methods=["GET"])
@jwt_required()
def get_gradcam(prediction_id):
    """Re-generate Grad-CAM for a saved prediction."""
    user_id = get_jwt_identity()

    if is_db_available():
        pred = get_prediction_by_id(prediction_id)
    else:
        pred = _mem_preds.get(prediction_id)

    if not pred or pred.get("user_id") != user_id:
        return error("Prediction not found.", 404)

    filepath = os.path.join(Config.UPLOAD_FOLDER, pred["image_filename"])
    if not os.path.exists(filepath):
        return error("Original image not available.", 404)

    with open(filepath, "rb") as f:
        image_bytes = f.read()

    preprocessed_gc, original_np = preprocess_for_gradcam(image_bytes)
    model, class_names = load_model()
    class_index = next(
        (i for i, c in enumerate(class_names) if c == pred["disease"]), 0
    )
    gc = generate_gradcam(model, preprocessed_gc, class_index, original_np)

    return success(
        {"overlay": gc["overlay_b64"], "heatmap": gc["heatmap_b64"]},
        "Grad-CAM generated",
    )


# ─────────────────────────────────────────
# Prediction History
# ─────────────────────────────────────────

@app.route("/api/history", methods=["GET"])
@jwt_required()
def history():
    user_id = get_jwt_identity()
    limit = int(request.args.get("limit", 20))
    skip = int(request.args.get("skip", 0))

    if is_db_available():
        preds = get_predictions_by_user(user_id, limit=limit, skip=skip)
    else:
        preds = list(_mem_preds.values())
        preds = [p for p in preds if p.get("user_id") == user_id]

    return success({"predictions": preds, "count": len(preds)})


@app.route("/api/history/<prediction_id>", methods=["GET"])
@jwt_required()
def history_detail(prediction_id):
    user_id = get_jwt_identity()

    if is_db_available():
        pred = get_prediction_by_id(prediction_id)
    else:
        pred = _mem_preds.get(prediction_id)

    if not pred or pred.get("user_id") != user_id:
        return error("Prediction not found.", 404)

    pred["disease_info"] = get_disease_info(pred.get("disease", ""))
    return success({"prediction": pred})


@app.route("/api/history/<prediction_id>", methods=["DELETE"])
@jwt_required()
def delete_history(prediction_id):
    user_id = get_jwt_identity()

    if is_db_available():
        ok = delete_prediction(prediction_id, user_id)
    else:
        if prediction_id in _mem_preds and _mem_preds[prediction_id].get("user_id") == user_id:
            del _mem_preds[prediction_id]
            ok = True
        else:
            ok = False

    if not ok:
        return error("Prediction not found or not authorized.", 404)
    return success({}, "Prediction deleted")


# ─────────────────────────────────────────
# Disease info
# ─────────────────────────────────────────

@app.route("/api/diseases", methods=["GET"])
def diseases_list():
    return success({"diseases": get_all_diseases()})


@app.route("/api/diseases/<class_name>", methods=["GET"])
def disease_detail(class_name):
    info = get_disease_info(class_name)
    return success({"disease": info})


# ─────────────────────────────────────────
# Weather risk
# ─────────────────────────────────────────

@app.route("/api/weather-risk", methods=["GET"])
def weather_risk():
    city = request.args.get("city", "Bengaluru")
    lat = request.args.get("lat")
    lon = request.args.get("lon")

    weather = get_weather(
        city=city,
        lat=float(lat) if lat else None,
        lon=float(lon) if lon else None,
    )
    risk = assess_disease_risk(weather)
    disease_class = request.args.get("disease")
    disease_risk = assess_disease_weather_risk(disease_class, weather, weather.get("forecast")) if disease_class else None
    if disease_risk:
        risk["selected_disease_risk"] = disease_risk
    return success(risk)


# ─────────────────────────────────────────
# Expert consultation
# ─────────────────────────────────────────

@app.route("/api/expert-request", methods=["POST"])
@jwt_required()
def request_expert():
    user_id = get_jwt_identity()
    data = request.get_json() or {}

    prediction_id = data.get("prediction_id")
    message = (data.get("message") or "").strip()

    if not prediction_id:
        return error("prediction_id is required.")

    req = {
        "user_id": user_id,
        "prediction_id": prediction_id,
        "message": message,
    }

    if is_db_available():
        req_id = create_expert_request(req)
    else:
        req_id = str(uuid.uuid4())
        _mem_experts.append({**req, "_id": req_id})

    return success({"request_id": req_id}, "Expert consultation request submitted", 201)


# ─────────────────────────────────────────
# Farmer Dashboard
# ─────────────────────────────────────────

@app.route("/api/dashboard", methods=["GET"])
@jwt_required()
def dashboard():
    user_id = get_jwt_identity()
    user = get_user_by_id(user_id) if is_db_available() else _mem_get_user_by_id(user_id)

    if is_db_available():
        stats = get_user_stats(user_id)
        recent = get_predictions_by_user(user_id, limit=5)
    else:
        user_preds = [p for p in _mem_preds.values() if p.get("user_id") == user_id]
        total = len(user_preds)
        healthy = sum(1 for p in user_preds if p.get("is_healthy"))
        stats = {
            "total_scans": total,
            "healthy_count": healthy,
            "diseased_count": total - healthy,
            "disease_breakdown": [],
        }
        recent = sorted(user_preds, key=lambda x: x.get("created_at", ""), reverse=True)[:5]

    # Weather risk summary
    city = (user or {}).get("location", "Bengaluru")
    weather = get_weather(city=city)
    risk = assess_disease_risk(weather)

    return success(
        {
            "stats": stats,
            "recent_predictions": recent,
            "trends": [
                {
                    "date": item.get("created_at"),
                    "disease": item.get("disease_name", item.get("disease")),
                    "temperature": item.get("weather", {}).get("temperature"),
                    "humidity": item.get("weather", {}).get("humidity"),
                    "rainfall": item.get("weather", {}).get("rainfall_1h"),
                    "risk_score": item.get("risk", {}).get("risk_score"),
                    "risk_level": item.get("risk", {}).get("risk_level"),
                }
                for item in recent
            ],
            "weather_risk": {
                "overall": risk["overall_risk"],
                "alert": risk["alert_message"],
                "weather": risk["weather"],
            },
        }
    )


# ─────────────────────────────────────────
# Admin
# ─────────────────────────────────────────

def admin_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        uid = get_jwt_identity()
        user = get_user_by_id(uid) if is_db_available() else _mem_get_user_by_id(uid)
        if not user or user.get("role") != "admin":
            return error("Admin access required.", 403)
        return fn(*args, **kwargs)
    return wrapper


@app.route("/api/admin/stats", methods=["GET"])
@admin_required
def admin_stats():
    if is_db_available():
        stats = get_global_stats()
    else:
        stats = {
            "total_users": len(_mem_users),
            "total_predictions": len(_mem_preds),
            "top_diseases": [],
        }
    return success({"stats": stats})


@app.route("/api/admin/users", methods=["GET"])
@admin_required
def admin_users():
    limit = int(request.args.get("limit", 50))
    skip = int(request.args.get("skip", 0))
    if is_db_available():
        users = get_all_users(limit=limit, skip=skip)
    else:
        users = [
            {k: v for k, v in u.items() if k != "password"}
            for u in list(_mem_users.values())[skip: skip + limit]
        ]
    return success({"users": users, "count": len(users)})


@app.route("/api/admin/expert-requests", methods=["GET"])
@admin_required
def admin_expert_requests():
    status = request.args.get("status")
    if is_db_available():
        reqs = get_expert_requests(status=status)
    else:
        reqs = _mem_experts if not status else [r for r in _mem_experts if r.get("status") == status]
    return success({"requests": reqs})


@app.route("/api/admin/expert-requests/<req_id>", methods=["PUT"])
@admin_required
def admin_update_expert_request(req_id):
    data = request.get_json() or {}
    if is_db_available():
        update_expert_request(req_id, data)
    else:
        for r in _mem_experts:
            if r.get("_id") == req_id:
                r.update(data)
    return success({}, "Expert request updated")


# ─────────────────────────────────────────
# Serve uploaded images
# ─────────────────────────────────────────

@app.route("/api/uploads/<filename>")
@jwt_required()
def serve_upload(filename):
    return send_from_directory(Config.UPLOAD_FOLDER, secure_filename(filename))


# ─────────────────────────────────────────
# Error handlers
# ─────────────────────────────────────────

@app.errorhandler(404)
def not_found(e):
    return error("Endpoint not found.", 404)


@app.errorhandler(413)
def too_large(e):
    return error("File too large. Maximum size is 16 MB.", 413)


@app.errorhandler(500)
def server_error(e):
    return error(f"Internal server error: {str(e)}", 500)


# ─────────────────────────────────────────
# Run
# ─────────────────────────────────────────

if __name__ == "__main__":
    app.run(debug=Config.DEBUG, host="0.0.0.0", port=5000)
