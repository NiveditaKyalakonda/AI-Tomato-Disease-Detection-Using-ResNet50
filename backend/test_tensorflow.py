"""Verify that TensorFlow and its ResNet50 application initialize on this machine."""

import tensorflow as tf
import keras
from tensorflow.keras.applications import ResNet50


def main():
    print(f"TensorFlow version: {tf.__version__}")
    print(f"Keras version: {keras.__version__}")
    print(f"TensorFlow operation: {(tf.constant([2.0]) * 3.0).numpy().tolist()}")
    print("TensorFlow initialized successfully")

    model = ResNet50(weights=None, include_top=False, input_shape=(224, 224, 3))
    print(f"ResNet50 input shape: {model.input_shape}")
    print(f"ResNet50 output shape: {model.output_shape}")
    print("ResNet50 initialized successfully")


if __name__ == "__main__":
    main()
