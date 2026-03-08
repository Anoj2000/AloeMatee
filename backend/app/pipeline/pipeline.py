"""
pipeline.py
───────────
High-level AloeMate AI prediction pipeline.

Implements the full 3-stage disease detection flow and returns a single
structured result dict ready for the API response.

Pipeline flow
─────────────
  Input: 3 image byte-strings
  │
  ├─ Stage A  stageA_model.tflite  (MobileNetV2)
  │     Predicts HEALTHY or UNHEALTHY
  │     │
  │     ├─ HEALTHY  ──► return early result  (stage_b / stage_c = None)
  │     │
  │     └─ UNHEALTHY
  │           │
  │           ├─ Stage B  stageB_model.tflite  (EfficientNetV2)
  │           │     Classifies specific disease
  │           │
  │           └─ Stage C  aloe_vera_model.tflite  (EfficientNetV2)
  │                 Classifies disease severity
  │
  └─► Structured result dict

Result schema
─────────────
{
    "status":       "healthy" | "unhealthy" | "uncertain",
    "disease_name": str | None,          # human-readable name, None if healthy
    "disease_id":   int | None,          # 0-indexed class index from Stage B
    "probability":  float | None,        # Stage B top-class confidence
    "severity":     str | None,          # mild / moderate / severe / critical
    "confidence":   float | None,        # Stage C top-class confidence
    "stage_a": {
        "label":        "healthy" | "unhealthy",
        "confidence":   float,
        "probabilities": {"healthy": float, "unhealthy": float}
    },
    "stage_b": {                         # None when status == "healthy"
        "disease":    str,
        "confidence": float,
        "all_scores": {label: float}
    } | None,
    "stage_c": {                         # None when status == "healthy"
        "severity":   str,
        "confidence": float,
        "all_scores": {label: float}
    } | None
}

Usage
─────
from app.pipeline.pipeline import predict

result = predict(
    lesion_bytes=...,
    whole_plant_bytes=...,
    base_soil_bytes=...,
)

print(result["disease_name"])  # e.g. "Leaf Rot"
print(result["severity"])      # e.g. "moderate"
print(result["probability"])   # e.g. 0.87
"""

from __future__ import annotations

import logging

from app.core.config import settings
from app.pipeline import stage_a, stage_b, stage_c

logger = logging.getLogger(__name__)


# ── Disease display names ─────────────────────────────────────────────────────
# Maps the raw label (from stage_b_labels.txt) to a human-readable name.
# Extend this dict when new disease classes are added to the model.

_DISEASE_DISPLAY_NAMES: dict[str, str] = {
    "leaf_rot":        "Leaf Rot",
    "rust":            "Rust",
    "leaf_blight":     "Leaf Blight",
    "root_rot":        "Root Rot",
    "tip_burn":        "Tip Burn",
    "crown_rot":       "Crown Rot",
    "basal_stem_rot":  "Basal Stem Rot",
    "uncertain":       "Unknown / Uncertain",
}


def _display_name(raw_label: str) -> str:
    """Return a human-readable disease name, falling back to title-cased label."""
    return _DISEASE_DISPLAY_NAMES.get(raw_label, raw_label.replace("_", " ").title())


# ── Main pipeline entry-point ────────────────────────────────────────────────

def predict(
    lesion_bytes: bytes,
    whole_plant_bytes: bytes,
    base_soil_bytes: bytes,
) -> dict:
    """
    Run the full A → B → C pipeline on three Aloe Vera images.

    Parameters
    ----------
    lesion_bytes      : raw bytes of the lesion close-up image
    whole_plant_bytes : raw bytes of the whole-plant image
    base_soil_bytes   : raw bytes of the base-and-soil image

    Returns
    -------
    Structured result dict — see module docstring for schema.
    """
    images = [lesion_bytes, whole_plant_bytes, base_soil_bytes]

    # ── Stage A: Healthy vs Unhealthy ─────────────────────────────────────────
    logger.info("[Pipeline] Stage A — healthy/unhealthy validation")
    a_result = stage_a.run(images)
    logger.info(
        "[Pipeline] Stage A → label=%s  confidence=%.4f",
        a_result["label"],
        a_result["confidence"],
    )

    unhealthy_prob = a_result["probabilities"].get("unhealthy", 0.0)
    is_unhealthy = (
        a_result["label"] == "unhealthy"
        and unhealthy_prob >= settings.UNHEALTHY_THRESHOLD
    )

    # ── Early exit: plant is HEALTHY ─────────────────────────────────────────
    if not is_unhealthy:
        logger.info("[Pipeline] Result: HEALTHY — stages B and C skipped")
        return _build_result(
            status="healthy",
            a_result=a_result,
            b_result=None,
            c_result=None,
            disease_id=None,
        )

    # ── Stage B: Disease classification ──────────────────────────────────────
    logger.info("[Pipeline] Stage B — disease classification")
    b_result = stage_b.run(images)
    logger.info(
        "[Pipeline] Stage B → disease=%s  confidence=%.4f",
        b_result["disease"],
        b_result["confidence"],
    )

    # ── Stage C: Severity classification ─────────────────────────────────────
    logger.info("[Pipeline] Stage C — severity classification")
    c_result = stage_c.run(images)
    logger.info(
        "[Pipeline] Stage C → severity=%s  confidence=%.4f",
        c_result["severity"],
        c_result["confidence"],
    )

    # Resolve disease_id: index of the predicted class in the label list
    disease_id = _resolve_disease_id(b_result)

    status = "unhealthy" if b_result["disease"] != "uncertain" else "uncertain"

    logger.info(
        "[Pipeline] Complete → status=%s  disease=%s  severity=%s",
        status,
        b_result["disease"],
        c_result["severity"],
    )

    return _build_result(
        status=status,
        a_result=a_result,
        b_result=b_result,
        c_result=c_result,
        disease_id=disease_id,
    )


# ── Result builder ────────────────────────────────────────────────────────────

def _build_result(
    status: str,
    a_result: dict,
    b_result: dict | None,
    c_result: dict | None,
    disease_id: int | None,
) -> dict:
    """
    Assemble the final structured result dict.

    Top-level convenience fields (disease_name, disease_id, probability,
    severity, confidence) sit alongside the full per-stage breakdowns so
    callers can choose the level of detail they need.
    """
    disease_label = b_result["disease"] if b_result else None
    severity      = c_result["severity"] if c_result else None

    return {
        # ── Top-level summary (what the mobile app primarily uses) ────────────
        "status":       status,
        "disease_name": _display_name(disease_label) if disease_label else None,
        "disease_id":   disease_id,
        "probability":  b_result["confidence"] if b_result else None,
        "severity":     severity,
        "confidence":   c_result["confidence"] if c_result else None,

        # ── Full per-stage breakdowns ─────────────────────────────────────────
        "stage_a": a_result,
        "stage_b": b_result,
        "stage_c": c_result,
    }


def _resolve_disease_id(b_result: dict) -> int | None:
    """
    Determine the 0-based class index of the predicted disease by looking it
    up in the all_scores dict (keys are ordered as they appear in the label
    file).  Returns None for 'uncertain'.
    """
    disease = b_result.get("disease")
    if not disease or disease == "uncertain":
        return None
    all_scores: dict = b_result.get("all_scores", {})
    labels = list(all_scores.keys())
    try:
        return labels.index(disease)
    except ValueError:
        return None
