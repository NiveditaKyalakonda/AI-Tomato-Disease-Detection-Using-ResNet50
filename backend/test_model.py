"""Run real inference on a supplied tomato leaf image using the production model."""

import json
import sys
from pathlib import Path

import numpy as np

from config import Config
from services.prediction import load_model, model_status
from services.gradcam import generate_gradcam
from services.preprocessing import preprocess_for_gradcam, preprocess_image


def main():
    if len(sys.argv) != 2:
        raise SystemExit(
            "Usage: python test_model.py <path-to-leaf-image>\n"
            "Example: python test_model.py "
            "../dataset/test/augmented_dataset/Tomato_Early_blight/img_1.jpg"
        )

    image_path = Path(sys.argv[1]).expanduser().resolve()
    if not image_path.is_file():
        raise SystemExit(f"Test image not found: {image_path}")

    with Path(Config.CLASS_NAMES_PATH).open(encoding="utf-8") as class_file:
        class_names = json.load(class_file)
    model, loaded_names = load_model()
    if model is None:
        raise SystemExit(f"Trained model failed to load: {model_status()['error']}")
    if loaded_names != class_names:
        raise SystemExit("Loaded class order differs from class_names.json.")

    input_image = preprocess_image(image_path.read_bytes())
    if input_image.shape != (1, 224, 224, 3):
        raise SystemExit(f"Unexpected preprocessed image shape: {input_image.shape}")

    probabilities = np.asarray(model.predict(input_image, verbose=0))[0]
    if probabilities.shape != (len(class_names),):
        raise SystemExit(
            f"Model output contains {probabilities.size} values for {len(class_names)} class names."
        )

    class_index = int(np.argmax(probabilities))
    print(f"Image: {image_path}")
    print(f"Predicted class: {class_names[class_index]}")
    print(f"Confidence: {probabilities[class_index] * 100:.2f}%")
    print("Class probabilities:")
    for index, probability in enumerate(probabilities):
        print(f"  {index}: {class_names[index]}: {probability * 100:.2f}%")

    gradcam_input, original_image = preprocess_for_gradcam(image_path.read_bytes())
    gradcam = generate_gradcam(model, gradcam_input, class_index, original_image)
    activation_map = gradcam["activation_map"]
    if activation_map.shape != (224, 224) or not np.isfinite(activation_map).all():
        raise SystemExit(f"Invalid Grad-CAM activation map: {activation_map.shape}")
    if not gradcam["overlay_b64"] or not gradcam["heatmap_b64"]:
        raise SystemExit("Grad-CAM did not return real heatmap and overlay images.")
    print(f"Grad-CAM: {activation_map.shape}, range {activation_map.min():.3f}–{activation_map.max():.3f}")


if __name__ == "__main__":
    main()
