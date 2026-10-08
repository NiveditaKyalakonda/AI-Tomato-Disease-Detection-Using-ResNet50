"""
Grad-CAM (Gradient-weighted Class Activation Mapping) implementation.
Produces heatmap overlays that highlight which regions of the leaf
influenced the model's prediction — making the AI explainable (XAI).
"""

import io
import base64
import numpy as np
import cv2
from PIL import Image

try:
    import tensorflow as tf
except (ImportError, OSError):
    tf = None


def generate_gradcam(
    model,
    preprocessed_image: np.ndarray,
    class_index: int,
    original_image: np.ndarray,
    alpha: float = 0.5,
) -> dict:
    """
    Generate a Grad-CAM heatmap and overlay it on the original image.

    Args:
        model: Loaded Keras model.
        preprocessed_image: (1, 224, 224, 3) preprocessed array.
        class_index: Predicted class index.
        original_image: (224, 224, 3) float32 array (0-255 range).
        alpha: Blending factor for overlay (0=original, 1=heatmap only).

    Returns:
        dict with:
            heatmap_b64: base64-encoded heatmap PNG
            overlay_b64: base64-encoded overlay PNG
            activation_map: 2-D numpy array (0-1) for severity estimation
    """
    if model is None:
        raise RuntimeError("Grad-CAM is unavailable because the trained model did not load.")

    if tf is None:
        raise RuntimeError("Grad-CAM is unavailable because TensorFlow could not be imported.")

    base_index = next(
        (index for index, layer in enumerate(model.layers) if isinstance(layer, tf.keras.Model) and layer.layers),
        None,
    )
    if base_index is None:
        raise RuntimeError("No nested convolutional feature model was found for Grad-CAM.")

    base_model = model.layers[base_index]
    last_conv_layer = next(
        (layer for layer in reversed(base_model.layers) if isinstance(layer, tf.keras.layers.Conv2D)),
        None,
    )
    if last_conv_layer is None:
        raise RuntimeError("No convolutional layer was found for Grad-CAM.")

    try:
        feature_model = tf.keras.Model(
            inputs=base_model.inputs,
            outputs=[last_conv_layer.output, base_model.output],
        )

        with tf.GradientTape() as tape:
            inputs = tf.cast(preprocessed_image, tf.float32)
            conv_outputs, features = feature_model(inputs, training=False)
            predictions = features
            for layer in model.layers[base_index + 1 :]:
                predictions = layer(predictions, training=False)
            loss = predictions[:, class_index]

        grads = tape.gradient(loss, conv_outputs)
        pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))

        conv_outputs = conv_outputs[0]
        heatmap = conv_outputs @ pooled_grads[..., tf.newaxis]
        heatmap = tf.squeeze(heatmap).numpy()

        # Normalize heatmap
        heatmap = np.maximum(heatmap, 0)
        max_val = heatmap.max()
        if max_val > 0:
            heatmap /= max_val

    except Exception as e:
        raise RuntimeError(f"Grad-CAM computation failed: {e}") from e

    # ── Resize heatmap to image size
    heatmap_resized = cv2.resize(heatmap, (224, 224))
    activation_map = heatmap_resized.copy()

    # ── Colorize heatmap with JET colormap
    heatmap_colored = np.uint8(255 * heatmap_resized)
    heatmap_colored = cv2.applyColorMap(heatmap_colored, cv2.COLORMAP_JET)
    heatmap_colored = cv2.cvtColor(heatmap_colored, cv2.COLOR_BGR2RGB)

    # ── Overlay on original image
    original_uint8 = np.clip(original_image, 0, 255).astype(np.uint8)
    overlay = cv2.addWeighted(original_uint8, 1 - alpha, heatmap_colored, alpha, 0)

    # ── Encode both to base64
    heatmap_b64 = _encode_to_b64(heatmap_colored)
    overlay_b64 = _encode_to_b64(overlay)

    return {
        "heatmap_b64": heatmap_b64,
        "overlay_b64": overlay_b64,
        "activation_map": activation_map,
    }


def _encode_to_b64(img_array: np.ndarray) -> str:
    """Encode an RGB uint8 numpy array as a base64 PNG string."""
    img = Image.fromarray(img_array.astype(np.uint8))
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    return base64.b64encode(buffer.getvalue()).decode("utf-8")
