"""
Stage B — Disease classification (EfficientNetV2).

Only reached when Stage A predicts UNHEALTHY.
Ensemble of 3 images → averaged softmax → top disease class.

Label file: ml_models/labels/stage_b_labels.txt  (one label per line)
"""

import numpy as np

from app.core.config import settings
from app.models.model_loader import get_models
from app.utils.preprocess import PreprocessConfig, preprocess_image_bytes

_labels: list[str] = []


def _load_labels() -> list[str]:
    global _labels
    if not _labels:
        path = settings.STAGE_B_LABELS_PATH
        if path.exists():
            _labels = [ln.strip() for ln in path.read_text().splitlines() if ln.strip()]
        else:
            # Fallback built-in labels
            _labels = [
                "leaf_rot",
                "rust",
                "leaf_blight",
                "root_rot",
                "tip_burn",
                "crown_rot",
                "basal_stem_rot",
            ]
    return _labels


def _get_runner():
    return get_models().stage_b


def run(image_bytes_list: list[bytes]) -> dict:
    """
    Parameters
    ----------
    image_bytes_list : list of raw bytes for [lesion, whole_plant, base_soil]

    Returns
    -------
    {
        "disease":    str,
        "confidence": float,
        "all_scores": {label: float, ...}
    }
    """
    runner = _get_runner()
    labels = _load_labels()
    size = settings.STAGE_B_INPUT_SIZE
    probs_sum = np.zeros(len(labels), dtype=np.float32)

    cfg = PreprocessConfig(size=size)
    for raw in image_bytes_list:
        arr = preprocess_image_bytes(raw, config=cfg)
        output = runner.predict(arr)           # shape (1, num_classes)
        probs = _softmax(output[0])
        probs_sum += probs

    avg_probs = probs_sum / len(image_bytes_list)
    top_idx = int(np.argmax(avg_probs))
    confidence = float(avg_probs[top_idx])

    # If confidence is below the threshold, mark as uncertain
    disease = (
        labels[top_idx]
        if confidence >= settings.MIN_CONFIDENCE
        else "uncertain"
    )

    return {
        "disease": disease,
        "confidence": round(confidence, 4),
        "all_scores": {
            labels[i]: round(float(avg_probs[i]), 4)
            for i in range(len(labels))
        },
    }


def _softmax(logits: np.ndarray) -> np.ndarray:
    e = np.exp(logits - np.max(logits))
    return e / e.sum()
