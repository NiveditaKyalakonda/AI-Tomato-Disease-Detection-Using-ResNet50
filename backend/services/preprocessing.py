"""
Image preprocessing and quality checking before model inference.
"""

import io
import cv2
import numpy as np
from PIL import Image

IMG_SIZE = (224, 224)

# ─────────────────────────────────────────
# Quality checks
# ─────────────────────────────────────────

def check_image_quality(image_bytes: bytes) -> dict:
    """
    Perform quality checks on the uploaded image.

    Returns a dict with:
        ok: bool — whether the image passes all checks
        issues: list[str] — human-readable issues found
        score: int — 0-100 quality estimate
    """
    issues = []
    score = 100

    try:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img_array = np.array(img)
    except Exception:
        return {"ok": False, "issues": ["Unable to read image file."], "score": 0}

    h, w = img_array.shape[:2]

    # ── Resolution check
    if w < 100 or h < 100:
        issues.append("Image resolution is too low (minimum 100×100 pixels).")
        score -= 40

    # ── Blur check (Laplacian variance)
    gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
    blur_score = cv2.Laplacian(gray, cv2.CV_64F).var()
    if blur_score < 50:
        issues.append("Image appears blurry. Please upload a sharper image.")
        score -= 30
    elif blur_score < 100:
        issues.append("Image is slightly blurry. A sharper image may improve accuracy.")
        score -= 10

    # ── Brightness check
    brightness = img_array.mean()
    if brightness < 30:
        issues.append("Image is too dark. Please ensure adequate lighting.")
        score -= 20
    elif brightness > 230:
        issues.append("Image is overexposed. Avoid direct harsh lighting.")
        score -= 15

    # ── Green channel check (basic leaf presence)
    r_mean = img_array[:, :, 0].mean()
    g_mean = img_array[:, :, 1].mean()
    b_mean = img_array[:, :, 2].mean()

    if g_mean < max(r_mean, b_mean):
        issues.append(
            "No clear green leaf detected. Please ensure the tomato leaf is "
            "visible and centered in the frame."
        )
        score -= 20

    # ── Size check
    if w / h > 5 or h / w > 5:
        issues.append("Image has an unusual aspect ratio. A roughly square crop works best.")
        score -= 10

    score = max(0, min(100, score))
    return {
        "ok": len([i for i in issues if "too" in i.lower() or "unable" in i.lower() or "no clear" in i.lower()]) == 0,
        "issues": issues,
        "score": score,
        "resolution": f"{w}×{h}",
        "blur_score": round(blur_score, 1),
        "brightness": round(float(brightness), 1),
    }


# ─────────────────────────────────────────
# Preprocessing for ResNet50
# ─────────────────────────────────────────

def preprocess_image(image_bytes: bytes) -> np.ndarray:
    """
    Load and resize RGB image pixels for the trained model.
    The training model contains ResNet50 preprocess_input in its own graph.
    Returns raw float32 RGB pixels with shape (1, 224, 224, 3).
    """
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = img.resize(IMG_SIZE, Image.LANCZOS)
    img_array = np.asarray(img, dtype=np.float32)
    return np.expand_dims(img_array, axis=0)


def preprocess_for_gradcam(image_bytes: bytes) -> tuple:
    """Return BGR/mean-subtracted pixels for the nested ResNet50 and RGB for overlay."""
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = img.resize(IMG_SIZE, Image.LANCZOS)
    original = np.array(img, dtype=np.float32)

    preprocessed = np.expand_dims(original[..., ::-1].copy(), axis=0)
    preprocessed -= np.array([103.939, 116.779, 123.68], dtype=np.float32)

    return preprocessed, original


# ─────────────────────────────────────────
# Severity estimation from Grad-CAM mask
# ─────────────────────────────────────────

def estimate_severity(activation_map: np.ndarray, threshold: float = 0.5) -> dict:
    """
    Estimate disease severity based on the proportion of high-activation pixels
    in the Grad-CAM heatmap.

    Args:
        activation_map: 2-D float array (values 0-1), same size as input image.
        threshold: pixel value above which a pixel is considered 'activated'.

    Returns:
        dict with level, percentage, label.
    """
    activated = (activation_map > threshold).sum()
    total = activation_map.size
    pct = (activated / total) * 100 if total > 0 else 0

    if pct < 15:
        level = "Mild"
        color = "#22C55E"
        advice = "Early stage — monitor closely and apply preventive measures."
    elif pct < 40:
        level = "Moderate"
        color = "#F59E0B"
        advice = "Moderate infection — begin treatment promptly to prevent spread."
    else:
        level = "Severe"
        color = "#EF4444"
        advice = "Severe infection — immediate intervention required."

    return {
        "level": level,
        "percentage": round(pct, 1),
        "color": color,
        "advice": advice,
    }
