"""
OFishx local inference server.

Runs the supplied TensorFlow Lite fish classifier for the OFishx Expo app.

The model contract was inspected directly from model_unquant.tflite:
  input:  1 x 224 x 224 x 3, float32
  output: 1 x 10, float32 (softmax)
  labels: model/labels.txt, one class per line ("0 Bangus", ...)
  preprocessing: RGB, stretch-resize to 224 x 224, pixel / 127.5 - 1.0

Run from this directory:
  .venv\\Scripts\\python.exe app.py
"""

from __future__ import annotations

import hashlib
import io
import os
import threading
import time
import warnings
from pathlib import Path

os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")

from flask import Flask, jsonify, request
from flask_cors import CORS
from PIL import Image, ImageOps, UnidentifiedImageError
import numpy as np
import tensorflow as tf

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "model" / "model_unquant.tflite"
LABELS_PATH = BASE_DIR / "model" / "labels.txt"

EXPECTED_MODEL_SHA256 = (
    "9427784E667F491364C81CF7648872981181240A17E9CCF11727010FD1A91F56"
)
INPUT_SIZE = 224
SUPPORTED_FORMATS = {"JPEG", "PNG", "WEBP"}
MAX_CONTENT_BYTES = 12 * 1024 * 1024
MAX_PIXELS = 40_000_000

warnings.simplefilter("error", Image.DecompressionBombWarning)
Image.MAX_IMAGE_PIXELS = MAX_PIXELS

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = MAX_CONTENT_BYTES
CORS(app, resources={r"/*": {"origins": "*"}})

_inference_lock = threading.Lock()
_interpreter = None
_input_index = None
_output_index = None
_labels = []


def _load_labels() -> list[str]:
    if not LABELS_PATH.exists():
        raise RuntimeError(f"Missing labels file: {LABELS_PATH}")

    rows = []
    with LABELS_PATH.open("r", encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if not line:
                continue
            parts = line.split(" ", 1)
            if len(parts) != 2 or not parts[0].isdigit():
                raise RuntimeError(
                    "labels.txt must use the format '<index> <label>' on every line."
                )
            rows.append((int(parts[0]), parts[1]))

    rows.sort(key=lambda row: row[0])
    if [index for index, _ in rows] != list(range(len(rows))):
        raise RuntimeError("labels.txt has missing or duplicate class indexes.")
    if not rows:
        raise RuntimeError("labels.txt contains no labels.")
    return [label for _, label in rows]


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest().upper()


def load_model() -> None:
    global _interpreter, _input_index, _output_index, _labels

    if not MODEL_PATH.exists():
        raise RuntimeError(f"Missing model file: {MODEL_PATH}")

    actual_hash = _sha256(MODEL_PATH)
    if actual_hash != EXPECTED_MODEL_SHA256:
        raise RuntimeError(
            "The model file does not match the verified fish classifier. "
            f"Expected SHA256 {EXPECTED_MODEL_SHA256}, got {actual_hash}. "
            "Replace model/model_unquant.tflite with the trained fish model."
        )

    labels = _load_labels()
    interpreter = tf.lite.Interpreter(
        model_path=str(MODEL_PATH),
        num_threads=max(1, min(4, os.cpu_count() or 1)),
    )
    interpreter.allocate_tensors()

    inputs = interpreter.get_input_details()
    outputs = interpreter.get_output_details()
    if len(inputs) != 1 or len(outputs) != 1:
        raise RuntimeError("The TFLite model must have exactly one input and one output.")

    input_detail = inputs[0]
    output_detail = outputs[0]
    expected_input = [1, INPUT_SIZE, INPUT_SIZE, 3]
    if list(input_detail["shape"]) != expected_input:
        raise RuntimeError(
            f"Unexpected model input shape {list(input_detail['shape'])}; "
            f"expected {expected_input}."
        )
    if input_detail["dtype"] != np.float32:
        raise RuntimeError("Unexpected model input dtype; expected float32.")
    if int(np.prod(output_detail["shape"])) != len(labels):
        raise RuntimeError(
            f"Model output size {int(np.prod(output_detail['shape']))} "
            f"does not match {len(labels)} labels."
        )

    _interpreter = interpreter
    _input_index = input_detail["index"]
    _output_index = output_detail["index"]
    _labels = labels


def _read_image(file_storage) -> tuple[Image.Image, str]:
    raw = file_storage.read()
    if not raw:
        raise ValueError("The uploaded image is empty.")

    try:
        image = Image.open(io.BytesIO(raw))
        image.load()
    except (
        UnidentifiedImageError,
        OSError,
        Image.DecompressionBombError,
        Image.DecompressionBombWarning,
    ) as exc:
        raise ValueError(
            "The file could not be read as an image. Use a JPEG, PNG, or WebP photo."
        ) from exc

    image_format = (image.format or "").upper()
    if image_format not in SUPPORTED_FORMATS:
        raise ValueError(
            f"Unsupported image format: {image_format or 'unknown'}. "
            "Use JPEG, PNG, or WebP."
        )

    if image.width * image.height > MAX_PIXELS:
        raise ValueError("The image is too large. Use a photo under 40 megapixels.")

    image = ImageOps.exif_transpose(image)
    if image.mode in ("RGBA", "LA") or "transparency" in image.info:
        rgba = image.convert("RGBA")
        background = Image.new("RGBA", rgba.size, (255, 255, 255, 255))
        image = Image.alpha_composite(background, rgba)
    image = image.convert("RGB")
    return image, image_format


def _preprocess(image: Image.Image) -> np.ndarray:
    # Verified preprocessing: stretch (not crop) to 224 x 224 and scale to [-1, 1].
    resized = image.resize((INPUT_SIZE, INPUT_SIZE), Image.Resampling.BILINEAR)
    array = np.asarray(resized, dtype=np.float32)
    array = array / 127.5 - 1.0
    return np.expand_dims(array, axis=0)


def _predict(image: Image.Image) -> tuple[list[dict], float]:
    batch = _preprocess(image)
    started = time.perf_counter()
    with _inference_lock:
        _interpreter.set_tensor(_input_index, batch)
        _interpreter.invoke()
        scores = np.array(_interpreter.get_tensor(_output_index)[0], dtype=np.float64)
    elapsed_ms = (time.perf_counter() - started) * 1000.0

    if scores.shape[0] != len(_labels):
        raise RuntimeError("Model output does not match the label file.")
    if not np.all(np.isfinite(scores)):
        raise RuntimeError("Model returned non-finite scores.")
    total = float(scores.sum())
    if not 0.98 <= total <= 1.02:
        raise RuntimeError(
            "Model output was not a probability distribution. "
            "Do not use a different or incorrectly exported model."
        )

    order = np.argsort(scores)[::-1]
    predictions = [
        {
            "label": _labels[int(index)],
            "confidence": round(float(scores[index]), 6),
        }
        for index in order
    ]
    return predictions, round(elapsed_ms, 2)


@app.get("/health")
def health():
    return jsonify(
        {
            "success": True,
            "status": "ok",
            "model": "OFishx Philippine fish classifier",
            "input": {
                "width": INPUT_SIZE,
                "height": INPUT_SIZE,
                "channels": 3,
                "normalization": "pixel/127.5 - 1.0",
            },
            "classes": _labels,
            "predictEndpoint": "/predict",
        }
    )


@app.post("/predict")
def predict():
    if "image" not in request.files:
        return (
            jsonify(
                {
                    "success": False,
                    "code": "IMAGE_REQUIRED",
                    "error": "Attach the fish photo as a multipart field named 'image'.",
                }
            ),
            400,
        )

    uploaded = request.files["image"]
    if not uploaded.filename:
        return (
            jsonify(
                {
                    "success": False,
                    "code": "IMAGE_REQUIRED",
                    "error": "No image filename was provided.",
                }
            ),
            400,
        )

    try:
        image, image_format = _read_image(uploaded)
    except ValueError as exc:
        return (
            jsonify(
                {
                    "success": False,
                    "code": "UNSUPPORTED_IMAGE",
                    "error": str(exc),
                }
            ),
            415,
        )

    try:
        predictions, inference_ms = _predict(image)
    except Exception as exc:  # Keep internal details out of the response.
        app.logger.exception("Inference failed")
        return (
            jsonify(
                {
                    "success": False,
                    "code": "INFERENCE_FAILED",
                    "error": "The model could not process this image. Try another photo.",
                }
            ),
            500,
        )

    top = predictions[0]
    return jsonify(
        {
            "success": True,
            "topPrediction": top,
            "predictions": predictions,
            "lowConfidence": top["confidence"] < 0.60,
            "inferenceMs": inference_ms,
            "model": {
                "name": "OFishx Philippine fish classifier",
                "inputSize": INPUT_SIZE,
                "classCount": len(_labels),
                "preprocessing": "RGB stretch 224x224, pixel/127.5 - 1.0",
            },
            "receivedFormat": image_format,
        }
    )


@app.errorhandler(413)
def image_too_large(_error):
    return (
        jsonify(
            {
                "success": False,
                "code": "IMAGE_TOO_LARGE",
                "error": "The photo is larger than 12 MB. Choose a smaller image.",
            }
        ),
        413,
    )


@app.errorhandler(404)
def not_found(_error):
    return (
        jsonify(
            {
                "success": False,
                "code": "NOT_FOUND",
                "error": "Unknown endpoint. Use GET /health or POST /predict.",
            }
        ),
        404,
    )


if __name__ == "__main__":
    load_model()
    host = os.environ.get("OFISHX_HOST", "0.0.0.0")
    port = int(os.environ.get("OFISHX_PORT", "8000"))
    print("\nOFishx inference server")
    print(f"  Model:  {MODEL_PATH}")
    print(f"  Classes: {', '.join(_labels)}")
    print(f"  Health: http://127.0.0.1:{port}/health")
    print(f"  Bind:   http://{host}:{port}")
    print("  Keep this window open while using the phone app.\n", flush=True)
    app.run(host=host, port=port, debug=False, threaded=True)
