import os
import json
import tensorflow as tf

from tensorflow.keras import layers, models
from tensorflow.keras.applications import ResNet50
from tensorflow.keras.applications.resnet50 import preprocess_input
from tensorflow.keras.callbacks import (
    EarlyStopping,
    ModelCheckpoint,
    ReduceLROnPlateau
)

# ============================================================
# SETTINGS
# ============================================================

IMG_SIZE = (224, 224)
BATCH_SIZE = 32

INITIAL_EPOCHS = 15
FINE_TUNE_EPOCHS = 10

TRAIN_DIR = "../dataset/train/augmented_dataset"
VAL_DIR = "../dataset/validation/augmented_dataset"

MODEL_DIR = "../models"

os.makedirs(MODEL_DIR, exist_ok=True)


# ============================================================
# LOAD DATASET
# ============================================================

print("Loading training dataset...")

train_dataset = tf.keras.utils.image_dataset_from_directory(
    TRAIN_DIR,
    image_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    shuffle=True,
    seed=42
)

print("Loading validation dataset...")

validation_dataset = tf.keras.utils.image_dataset_from_directory(
    VAL_DIR,
    image_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    shuffle=False
)


# ============================================================
# CLASS NAMES
# ============================================================

class_names = train_dataset.class_names

print("\nClasses found:")
for i, name in enumerate(class_names):
    print(f"{i}: {name}")

# Save class names
with open(
    os.path.join(MODEL_DIR, "class_names.json"),
    "w"
) as f:
    json.dump(class_names, f, indent=4)


# ============================================================
# PERFORMANCE
# ============================================================

AUTOTUNE = tf.data.AUTOTUNE

train_dataset = train_dataset.prefetch(
    AUTOTUNE
)

validation_dataset = validation_dataset.prefetch(
    AUTOTUNE
)


# ============================================================
# DATA AUGMENTATION
# ============================================================

data_augmentation = tf.keras.Sequential([
    layers.RandomFlip("horizontal"),
    layers.RandomRotation(0.1),
    layers.RandomZoom(0.1),
    layers.RandomContrast(0.1)
])


# ============================================================
# RESNET50
# ============================================================

print("\nLoading ResNet50...")

base_model = ResNet50(
    weights="imagenet",
    include_top=False,
    input_shape=(224, 224, 3)
)

# Freeze pretrained layers
base_model.trainable = False


# ============================================================
# BUILD MODEL
# ============================================================

inputs = layers.Input(
    shape=(224, 224, 3)
)

x = data_augmentation(inputs)

x = preprocess_input(x)

x = base_model(
    x,
    training=False
)

x = layers.GlobalAveragePooling2D()(x)

x = layers.Dropout(0.3)(x)

outputs = layers.Dense(
    len(class_names),
    activation="softmax"
)(x)

model = models.Model(
    inputs,
    outputs
)


# ============================================================
# COMPILE
# ============================================================

model.compile(
    optimizer=tf.keras.optimizers.Adam(
        learning_rate=0.001
    ),
    loss="sparse_categorical_crossentropy",
    metrics=["accuracy"]
)


# ============================================================
# CALLBACKS
# ============================================================

checkpoint = ModelCheckpoint(
    os.path.join(
        MODEL_DIR,
        "tomato_resnet50_best.keras"
    ),
    monitor="val_accuracy",
    save_best_only=True,
    mode="max"
)

early_stopping = EarlyStopping(
    monitor="val_loss",
    patience=4,
    restore_best_weights=True
)

reduce_lr = ReduceLROnPlateau(
    monitor="val_loss",
    factor=0.2,
    patience=2,
    min_lr=1e-7
)


# ============================================================
# STAGE 1 — TRAIN CLASSIFIER
# ============================================================

print("\n===================================")
print("STAGE 1: TRAINING")
print("===================================\n")

history = model.fit(
    train_dataset,
    validation_data=validation_dataset,
    epochs=INITIAL_EPOCHS,
    callbacks=[
        checkpoint,
        early_stopping,
        reduce_lr
    ]
)


# ============================================================
# STAGE 2 — FINE TUNING
# ============================================================

print("\n===================================")
print("STAGE 2: FINE-TUNING RESNET50")
print("===================================\n")

base_model.trainable = True

# Freeze early layers
for layer in base_model.layers[:140]:
    layer.trainable = False


# Recompile with smaller learning rate
model.compile(
    optimizer=tf.keras.optimizers.Adam(
        learning_rate=1e-5
    ),
    loss="sparse_categorical_crossentropy",
    metrics=["accuracy"]
)


history_fine = model.fit(
    train_dataset,
    validation_data=validation_dataset,
    epochs=FINE_TUNE_EPOCHS,
    callbacks=[
        checkpoint,
        early_stopping,
        reduce_lr
    ]
)


# ============================================================
# SAVE FINAL MODEL
# ============================================================

final_model_path = os.path.join(
    MODEL_DIR,
    "tomato_resnet50_final.keras"
)

model.save(final_model_path)

print("\n===================================")
print("TRAINING COMPLETED")
print("===================================")

print("\nModel saved:")
print(final_model_path)

print("\nClasses saved:")
print(
    os.path.join(
        MODEL_DIR,
        "class_names.json"
    )
)