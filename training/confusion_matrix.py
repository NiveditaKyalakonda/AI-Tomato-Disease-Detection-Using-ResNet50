"""
Generate and save a confusion matrix for the trained model.
"""

import os
import json
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import tensorflow as tf
from sklearn.metrics import confusion_matrix

# ─────────────────────────────────────────
# SETTINGS
# ─────────────────────────────────────────

IMG_SIZE   = (224, 224)
BATCH_SIZE = 32

TEST_DIR         = "../dataset/test"
MODEL_PATH       = "../models/tomato_resnet50_final.keras"
CLASS_NAMES_PATH = "../models/class_names.json"
OUTPUT_PATH      = "../models/confusion_matrix.png"

# ─────────────────────────────────────────
# LOAD
# ─────────────────────────────────────────

print("Loading model…")
model = tf.keras.models.load_model(MODEL_PATH)

with open(CLASS_NAMES_PATH) as f:
    class_names = json.load(f)

# Shorten class names for display
short_names = [c.replace("Tomato_", "").replace("_", " ") for c in class_names]

test_dataset = tf.keras.utils.image_dataset_from_directory(
    TEST_DIR, image_size=IMG_SIZE, batch_size=BATCH_SIZE, shuffle=False
)

# ─────────────────────────────────────────
# PREDICT
# ─────────────────────────────────────────

y_true, y_pred = [], []
for images, labels in test_dataset:
    preds = model.predict(images, verbose=0)
    y_true.extend(labels.numpy())
    y_pred.extend(np.argmax(preds, axis=1))

cm = confusion_matrix(y_true, y_pred)
cm_norm = cm.astype(float) / cm.sum(axis=1, keepdims=True)

# ─────────────────────────────────────────
# PLOT
# ─────────────────────────────────────────

fig, axes = plt.subplots(1, 2, figsize=(22, 9))

# Raw counts
sns.heatmap(cm, annot=True, fmt="d", cmap="Reds",
            xticklabels=short_names, yticklabels=short_names, ax=axes[0])
axes[0].set_title("Confusion Matrix (Counts)", fontsize=14, fontweight="bold")
axes[0].set_ylabel("True Label")
axes[0].set_xlabel("Predicted Label")
axes[0].tick_params(axis="x", rotation=45)
axes[0].tick_params(axis="y", rotation=0)

# Normalised
sns.heatmap(cm_norm, annot=True, fmt=".2f", cmap="Greens",
            xticklabels=short_names, yticklabels=short_names, ax=axes[1])
axes[1].set_title("Confusion Matrix (Normalised)", fontsize=14, fontweight="bold")
axes[1].set_ylabel("True Label")
axes[1].set_xlabel("Predicted Label")
axes[1].tick_params(axis="x", rotation=45)
axes[1].tick_params(axis="y", rotation=0)

plt.suptitle("Tomato Disease Detection — ResNet50 Confusion Matrix",
             fontsize=16, fontweight="bold", y=1.01)
plt.tight_layout()

plt.savefig(OUTPUT_PATH, dpi=150, bbox_inches="tight")
print(f"\nConfusion matrix saved to: {OUTPUT_PATH}")
plt.show()
