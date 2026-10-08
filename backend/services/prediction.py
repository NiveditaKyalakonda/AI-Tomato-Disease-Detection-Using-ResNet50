"""
Model loading and inference service.
Loads the ResNet50 model once and caches it in memory.
"""

import json
from importlib.metadata import PackageNotFoundError, version
import numpy as np

try:
    import tensorflow as tf
    TENSORFLOW_ERROR = None
except (ImportError, OSError) as exc:
    tf = None
    TENSORFLOW_ERROR = f"{type(exc).__name__}: {exc}"
    print(f"[Model] TensorFlow initialization failed: {TENSORFLOW_ERROR}")

try:
    TENSORFLOW_VERSION = version("tensorflow")
except PackageNotFoundError:
    TENSORFLOW_VERSION = None

try:
    KERAS_VERSION = version("keras")
except PackageNotFoundError:
    KERAS_VERSION = None

from config import Config

# ─────────────────────────────────────────
# Singleton model loader
# ─────────────────────────────────────────

_model = None
_class_names = None
_model_error = TENSORFLOW_ERROR
_model_attempted = False


class ModelUnavailableError(RuntimeError):
    """Raised when real model inference cannot be performed."""


def load_model():
    """Load and validate the trained model once; never substitute predictions."""
    global _model, _class_names, _model_error, _model_attempted

    if _model is not None or _model_attempted:
        return _model, _class_names

    _model_attempted = True
    try:
        with open(Config.CLASS_NAMES_PATH, "r", encoding="utf-8") as f:
            _class_names = json.load(f)
        if not isinstance(_class_names, list) or not _class_names or not all(
            isinstance(name, str) and name for name in _class_names
        ):
            raise ValueError("class_names.json must contain a non-empty ordered list of class names.")

        if tf is None:
            raise ModelUnavailableError(TENSORFLOW_ERROR or "TensorFlow is unavailable.")

        _model = tf.keras.models.load_model(Config.MODEL_PATH)
        input_shape = _model.input_shape
        output_shape = _model.output_shape
        if isinstance(input_shape, list) or tuple(input_shape[-3:]) != (224, 224, 3):
            raise ValueError(f"Expected model input shape (None, 224, 224, 3), got {input_shape}.")
        if isinstance(output_shape, list) or output_shape[-1] != len(_class_names):
            raise ValueError(
                f"Model has {output_shape[-1] if not isinstance(output_shape, list) else 'multiple'} "
                f"outputs, but class_names.json has {len(_class_names)} classes."
            )
        _model_error = None
        print(f"[Model] Trained model loaded from {Config.MODEL_PATH}")
    except Exception as exc:
        _model_error = f"{type(exc).__name__}: {exc}"
        print(f"[Model] Trained model could not be loaded: {_model_error}")
        _model = None

    return _model, _class_names


def model_status() -> dict:
    model, class_names = load_model()
    return {
        "tensorflow": getattr(tf, "__version__", TENSORFLOW_VERSION),
        "keras": getattr(getattr(tf, "keras", None), "__version__", KERAS_VERSION) if tf else KERAS_VERSION,
        "model_loaded": model is not None,
        "input_shape": list(model.input_shape) if model is not None else None,
        "output_shape": list(model.output_shape) if model is not None else None,
        "classes": len(class_names) if class_names else 0,
        "error": _model_error,
    }


def predict(preprocessed_image: np.ndarray) -> dict:
    """
    Run inference on a preprocessed image (1, 224, 224, 3).

    Returns a dict:
        predicted_class: str
        confidence: float (0-100)
        all_predictions: list[{class, probability}]
        is_healthy: bool
        confidence_level: 'high' | 'medium' | 'low'
        warning: str | None
    """
    model, class_names = load_model()

    if model is None:
        raise ModelUnavailableError(_model_error or "The trained model is not available.")

    raw = model.predict(preprocessed_image, verbose=0)
    if raw.ndim != 2 or raw.shape[0] != 1 or raw.shape[1] != len(class_names):
        raise ModelUnavailableError(
            f"Model returned prediction shape {raw.shape}; expected (1, {len(class_names)})."
        )
    probs = raw[0]
    idx = int(np.argmax(probs))
    confidence = float(probs[idx]) * 100
    predicted_class = class_names[idx]

    is_healthy = "healthy" in predicted_class.lower()

    # ── Confidence level
    if confidence >= Config.HIGH_CONFIDENCE_THRESHOLD:
        confidence_level = "high"
        warning = None
    elif confidence >= Config.LOW_CONFIDENCE_THRESHOLD:
        confidence_level = "medium"
        warning = (
            "Moderate confidence prediction. Consider uploading a clearer, "
            "well-lit image for a more reliable result."
        )
    else:
        confidence_level = "low"
        warning = (
            "Low confidence prediction. The image may be unclear, or the "
            "leaf condition may not match the training data. Please upload "
            "a clearer image or consult a local agricultural expert."
        )

    # ── All predictions sorted by probability
    all_predictions = sorted(
        [
            {"class": class_names[i], "probability": round(float(probs[i]) * 100, 2)}
            for i in range(len(class_names))
        ],
        key=lambda x: x["probability"],
        reverse=True,
    )

    return {
        "predicted_class": predicted_class,
        "class_index": idx,
        "confidence": round(confidence, 2),
        "is_healthy": is_healthy,
        "confidence_level": confidence_level,
        "warning": warning,
        "all_predictions": all_predictions,
    }
