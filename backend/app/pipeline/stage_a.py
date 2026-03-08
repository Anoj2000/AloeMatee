"""
Stage A — Healthy vs Unhealthy validation (MobileNetV2).

Expects a list of 3 preprocessed image arrays (one per uploaded image).
Averages their softmax outputs to produce a single ensemble prediction.

Output classes (index):
  0 → healthy
  1 → unhealthy
"""

import numpy as np

from app.core.config import settings
from app.models.model_loader import get_models
from app.utils.preprocess import PreprocessConfig, preprocess_image_bytes

_LABELS = ["healthy", "unhealthy"]


def _get_runner():
    return get_models().stage_a


def run(image_bytes_list: list[bytes]) -> dict:
    """
    Parameters
    ----------
    image_bytes_list : list of raw bytes for [lesion, whole_plant, base_soil]

    Returns
    -------
    {
        "label":       "healthy" | "unhealthy",
        "confidence":  float,
        "probabilities": {"healthy": float, "unhealthy": float}
    }
    """
    runner = _get_runner()
    size = settings.STAGE_A_INPUT_SIZE
    probs_sum = np.zeros(len(_LABELS), dtype=np.float32)

    cfg = PreprocessConfig(size=size)
    for raw in image_bytes_list:
        arr = preprocess_image_bytes(raw, config=cfg)
        output = runner.predict(arr)           # shape (1, 2)
        probs = _softmax(output[0])
        probs_sum += probs

    avg_probs = probs_sum / len(image_bytes_list)
    predicted_idx = int(np.argmax(avg_probs))
    label = _LABELS[predicted_idx]
    confidence = float(avg_probs[predicted_idx])

    return {
        "label": label,
        "confidence": round(confidence, 4),
        "probabilities": {
            _LABELS[i]: round(float(avg_probs[i]), 4)
            for i in range(len(_LABELS))
        },
    }


def _softmax(logits: np.ndarray) -> np.ndarray:
    e = np.exp(logits - np.max(logits))
    return e / e.sum()
