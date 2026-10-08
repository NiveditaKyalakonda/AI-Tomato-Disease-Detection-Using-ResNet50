"""
Utility script to copy the best-trained model into the backend model directory.
Run this after training is complete.
"""

import os
import json
import shutil

DEFAULT_MODEL = "../models/tomato_resnet50_final.keras"
FALLBACK_MODEL = "../models/tomato_resnet50_best.keras"
DEST_MODEL  = "../backend/model/resnet50_tomato_disease.keras"

SRC_MODEL = DEFAULT_MODEL if os.path.exists(DEFAULT_MODEL) else FALLBACK_MODEL if os.path.exists(FALLBACK_MODEL) else ""

SRC_CLASSES  = "../models/class_names.json"
DEST_CLASSES = "../backend/model/class_names.json"

def main():
    # Verify source model exists
    if not SRC_MODEL or not os.path.exists(SRC_MODEL):
        print("[ERROR] Model not found in ../models/")
        print("Train the model first with: python train.py")
        return

    # Ensure backend model directory exists
    os.makedirs(os.path.dirname(DEST_MODEL), exist_ok=True)

    # Copy model
    print(f"Copying model:\n  {SRC_MODEL}\n  → {DEST_MODEL}")
    shutil.copy2(SRC_MODEL, DEST_MODEL)
    size_mb = os.path.getsize(DEST_MODEL) / (1024 * 1024)
    print(f"Model copied ({size_mb:.1f} MB)")

    # Copy class names
    if os.path.exists(SRC_CLASSES):
        shutil.copy2(SRC_CLASSES, DEST_CLASSES)
        with open(DEST_CLASSES) as f:
            classes = json.load(f)
        print(f"Class names copied ({len(classes)} classes):")
        for i, c in enumerate(classes):
            print(f"  {i}: {c}")
    else:
        print(f"[WARNING] class_names.json not found at {SRC_CLASSES}")

    print("\nDone. You can now start the backend with: python app.py")

if __name__ == "__main__":
    main()
