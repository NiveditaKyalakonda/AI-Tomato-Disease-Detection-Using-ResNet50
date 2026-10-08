"""
Evaluate the trained ResNet50 model on the test dataset.
Produces accuracy, loss, and a full classification report.
"""

import os
import json
import numpy as np
import tensorflow as tf
from sklearn.metrics import classification_report, confusion_matrix

# ─────────────────────────────────────────
# SETTINGS
# ─────────────────────────────────────────

IMG_SIZE   = (224, 224)
BATCH_SIZE = 32

TEST_DIR        = "../dataset/test"
MODEL_PATH      = "../models/tomato_resnet50_final.keras"
CLASS_NAMES_PATH = "../models/class_names.json"

# ─────────────────────────────────────────
# LOAD
# ─────────────────────────────────────────

print("Loading model…")
model = tf.keras.models.load_model(MODEL_PATH)
print("Model loaded.")

with open(CLASS_NAMES_PATH) as f:
    class_names = json.load(f)

print("\nLoading test dataset…")
test_dataset = tf.keras.utils.image_dataset_from_directory(
    TEST_DIR,
    image_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    shuffle=False,
)

# ─────────────────────────────────────────
# EVALUATE
# ─────────────────────────────────────────

print("\nEvaluating…")
loss, accuracy = model.evaluate(test_dataset, verbose=1)

print(f"\n{'='*40}")
print(f"Test Loss:     {loss:.4f}")
print(f"Test Accuracy: {accuracy * 100:.2f}%")
print(f"{'='*40}")

# ─────────────────────────────────────────
# CLASSIFICATION REPORT
# ─────────────────────────────────────────

print("\nGenerating classification report…")

y_true, y_pred = [], []
for images, labels in test_dataset:
    preds = model.predict(images, verbose=0)
    y_true.extend(labels.numpy())
    y_pred.extend(np.argmax(preds, axis=1))

report = classification_report(y_true, y_pred, target_names=class_names)
print("\nClassification Report:")
print(report)

# Save report
report_path = "../models/evaluation_report.txt"
with open(report_path, "w") as f:
    f.write(f"Test Loss:     {loss:.4f}\n")
    f.write(f"Test Accuracy: {accuracy * 100:.2f}%\n\n")
    f.write(report)

print(f"\nReport saved to: {report_path}")
