import sys
import json
import numpy as np
import tensorflow as tf
from PIL import Image

MODEL_PATH = "../models/tomato_resnet50.keras"
CLASS_NAMES_PATH = "../models/class_names.json"
IMG_SIZE = (224, 224)

if len(sys.argv) < 2:
    print("Please provide an image path.")
    print('Example: python predict.py "../test_leaf.jpg"')
    sys.exit()

IMAGE_PATH = sys.argv[1]

print("\nLoading model...")
model = tf.keras.models.load_model(MODEL_PATH)
print("Model loaded!")

with open(CLASS_NAMES_PATH, "r") as f:
    class_names = json.load(f)

print("\nLoading image:", IMAGE_PATH)

image = Image.open(IMAGE_PATH).convert("RGB")
image = image.resize(IMG_SIZE)

image_array = np.array(image)
image_array = np.expand_dims(image_array, axis=0)

predictions = model.predict(image_array, verbose=0)

predicted_index = np.argmax(predictions[0])
confidence = predictions[0][predicted_index] * 100
predicted_class = class_names[predicted_index]

print("\n=================================")
print("TOMATO DISEASE PREDICTION")
print("=================================")

print("\nPrediction:")
print(predicted_class)

print(f"\nConfidence: {confidence:.2f}%")
