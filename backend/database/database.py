"""
MongoDB database connection and collection helpers.
Falls back gracefully if MongoDB is not available.
"""

import os
from datetime import datetime
from bson import ObjectId
from pymongo import MongoClient, DESCENDING
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError

from config import Config

# ─────────────────────────────────────────
# Connection
# ─────────────────────────────────────────

_client = None
_db = None


def get_db():
    """Return the database handle, creating the connection once."""
    global _client, _db
    if _db is None:
        try:
            _client = MongoClient(Config.MONGO_URI, serverSelectionTimeoutMS=3000)
            _client.admin.command("ping")
            _db = _client[Config.DB_NAME]
            print("[DB] Connected to MongoDB:", Config.DB_NAME)
        except (ConnectionFailure, ServerSelectionTimeoutError) as e:
            print(f"[DB] MongoDB not available: {e}")
            _db = None
    return _db


def is_db_available():
    return get_db() is not None


# ─────────────────────────────────────────
# Helper: serialize ObjectId
# ─────────────────────────────────────────

def serialize(doc):
    """Convert ObjectId fields to strings for JSON serialisation."""
    if doc is None:
        return None
    if isinstance(doc, list):
        return [serialize(d) for d in doc]
    if isinstance(doc, dict):
        return {k: (str(v) if isinstance(v, ObjectId) else v) for k, v in doc.items()}
    return doc


# ─────────────────────────────────────────
# Users
# ─────────────────────────────────────────

def create_user(user_data: dict):
    db = get_db()
    if db is None:
        return None
    user_data["created_at"] = datetime.utcnow()
    result = db.users.insert_one(user_data)
    return str(result.inserted_id)


def get_user_by_email(email: str):
    db = get_db()
    if db is None:
        return None
    return serialize(db.users.find_one({"email": email.lower()}))


def get_user_by_id(user_id: str):
    db = get_db()
    if db is None:
        return None
    try:
        return serialize(db.users.find_one({"_id": ObjectId(user_id)}))
    except Exception:
        return None


def update_user(user_id: str, update_data: dict):
    db = get_db()
    if db is None:
        return False
    try:
        db.users.update_one({"_id": ObjectId(user_id)}, {"$set": update_data})
        return True
    except Exception:
        return False


# ─────────────────────────────────────────
# Predictions
# ─────────────────────────────────────────

def save_prediction(prediction_data: dict):
    db = get_db()
    if db is None:
        return None
    prediction_data["created_at"] = datetime.utcnow()
    result = db.predictions.insert_one(prediction_data)
    return str(result.inserted_id)


def get_predictions_by_user(user_id: str, limit: int = 50, skip: int = 0):
    db = get_db()
    if db is None:
        return []
    cursor = (
        db.predictions.find({"user_id": user_id})
        .sort("created_at", DESCENDING)
        .skip(skip)
        .limit(limit)
    )
    return serialize(list(cursor))


def get_prediction_by_id(prediction_id: str):
    db = get_db()
    if db is None:
        return None
    try:
        return serialize(db.predictions.find_one({"_id": ObjectId(prediction_id)}))
    except Exception:
        return None


def delete_prediction(prediction_id: str, user_id: str):
    db = get_db()
    if db is None:
        return False
    try:
        result = db.predictions.delete_one(
            {"_id": ObjectId(prediction_id), "user_id": user_id}
        )
        return result.deleted_count > 0
    except Exception:
        return False


def get_user_stats(user_id: str):
    db = get_db()
    if db is None:
        return {}
    pipeline = [
        {"$match": {"user_id": user_id}},
        {
            "$group": {
                "_id": "$disease",
                "count": {"$sum": 1},
                "avg_confidence": {"$avg": "$confidence"},
            }
        },
        {"$sort": {"count": -1}},
    ]
    disease_counts = list(db.predictions.aggregate(pipeline))
    total = db.predictions.count_documents({"user_id": user_id})
    healthy = db.predictions.count_documents({"user_id": user_id, "is_healthy": True})
    diseased = total - healthy
    return {
        "total_scans": total,
        "healthy_count": healthy,
        "diseased_count": diseased,
        "disease_breakdown": serialize(disease_counts),
    }


# ─────────────────────────────────────────
# Expert requests
# ─────────────────────────────────────────

def create_expert_request(data: dict):
    db = get_db()
    if db is None:
        return None
    data["created_at"] = datetime.utcnow()
    data["status"] = "pending"
    result = db.expert_requests.insert_one(data)
    return str(result.inserted_id)


def get_expert_requests(status: str = None, limit: int = 50):
    db = get_db()
    if db is None:
        return []
    query = {"status": status} if status else {}
    cursor = (
        db.expert_requests.find(query).sort("created_at", DESCENDING).limit(limit)
    )
    return serialize(list(cursor))


def update_expert_request(request_id: str, update_data: dict):
    db = get_db()
    if db is None:
        return False
    try:
        db.expert_requests.update_one(
            {"_id": ObjectId(request_id)}, {"$set": update_data}
        )
        return True
    except Exception:
        return False


# ─────────────────────────────────────────
# Admin / Global stats
# ─────────────────────────────────────────

def get_global_stats():
    db = get_db()
    if db is None:
        return {}
    total_users = db.users.count_documents({})
    total_preds = db.predictions.count_documents({})
    pipeline = [
        {"$group": {"_id": "$disease", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10},
    ]
    top_diseases = serialize(list(db.predictions.aggregate(pipeline)))
    return {
        "total_users": total_users,
        "total_predictions": total_preds,
        "top_diseases": top_diseases,
    }


def get_all_users(limit: int = 100, skip: int = 0):
    db = get_db()
    if db is None:
        return []
    cursor = db.users.find({}, {"password": 0}).sort("created_at", DESCENDING).skip(skip).limit(limit)
    return serialize(list(cursor))
