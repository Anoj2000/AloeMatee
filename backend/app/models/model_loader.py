"""
model_loader.py
───────────────
Loads all three TFLite models for the AloeMate AI pipeline and exposes them
as a single, lazily-initialised singleton (Models).

Models
------
- stage_a  stageA_model.tflite      MobileNetV2   Healthy vs Unhealthy
- stage_b  stageB_model.tflite      EfficientNetV2  Disease classifier
- stage_c  aloe_vera_model.tflite   EfficientNetV2  Severity classifier

Usage
-----
from app.models.model_loader import get_models

models = get_models()          # thread-safe singleton
output = models.stage_a.predict(array)
output = models.stage_b.predict(array)
output = models.stage_c.predict(array)

# Inspect a loaded model
print(models.stage_a.input_shape)   # e.g. (1, 224, 224, 3)
print(models.stage_b.output_shape)  # e.g. (1, 7)

# Reload all models from disk (useful if .tflite files are swapped)
models.reload()
"""

import logging
import threading
from dataclasses import dataclass
from pathlib import Path

from app.core.config import settings
from app.models.tflite_runner import TFLiteRunner

logger = logging.getLogger(__name__)


# ── Model registry ────────────────────────────────────────────────────────────

@dataclass(frozen=True)
class _ModelSpec:
    """Metadata for a single TFLite model."""
    name: str
    path: Path
    description: str


_SPECS = [
    _ModelSpec(
        name="stage_a",
        path=settings.STAGE_A_MODEL_PATH,
        description="Stage A — MobileNetV2 — Healthy vs Unhealthy",
    ),
    _ModelSpec(
        name="stage_b",
        path=settings.STAGE_B_MODEL_PATH,
        description="Stage B — EfficientNetV2 — Disease classifier",
    ),
    _ModelSpec(
        name="stage_c",
        path=settings.STAGE_C_MODEL_PATH,
        description="Stage C — EfficientNetV2 (aloe_vera_model) — Severity classifier",
    ),
]


# ── Models container ─────────────────────────────────────────────────────────

class Models:
    """
    Container that holds the three loaded TFLiteRunner instances.

    Attributes
    ----------
    stage_a : TFLiteRunner   Healthy / Unhealthy model (MobileNetV2)
    stage_b : TFLiteRunner   Disease classifier      (EfficientNetV2)
    stage_c : TFLiteRunner   Severity classifier     (EfficientNetV2 / aloe_vera_model)
    """

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self.stage_a: TFLiteRunner
        self.stage_b: TFLiteRunner
        self.stage_c: TFLiteRunner
        self._load_all()

    # ── Private ───────────────────────────────────────────────────────────────

    def _load_all(self) -> None:
        """Load (or reload) every model from disk and allocate tensors."""
        with self._lock:
            for spec in _SPECS:
                logger.info("Loading %-10s  (%s)  →  %s", spec.name, spec.description, spec.path)
                runner = TFLiteRunner(spec.path)
                setattr(self, spec.name, runner)
                logger.info(
                    "  %-10s  input=%s  output=%s",
                    spec.name,
                    runner.input_shape,
                    runner.output_shape,
                )
            logger.info("All 3 TFLite models loaded and tensors allocated.")

    # ── Public ────────────────────────────────────────────────────────────────

    def reload(self) -> None:
        """
        Re-load all three models from disk.
        Useful when .tflite files are replaced without restarting the server.
        """
        logger.info("Reloading all TFLite models from disk...")
        self._load_all()
        logger.info("Model reload complete.")

    def summary(self) -> dict:
        """
        Return a dict describing each loaded model — path, input shape, and
        output shape.  Useful for the /health or /models debug endpoint.
        """
        result = {}
        for spec in _SPECS:
            runner: TFLiteRunner = getattr(self, spec.name)
            result[spec.name] = {
                "path": str(spec.path),
                "description": spec.description,
                "input_shape": list(runner.input_shape),
                "output_shape": list(runner.output_shape),
            }
        return result


# ── Singleton ─────────────────────────────────────────────────────────────────

_instance: Models | None = None
_init_lock = threading.Lock()


def get_models() -> Models:
    """
    Return the shared Models singleton, loading all three models on first call.

    Thread-safe: safe to call from multiple FastAPI worker threads simultaneously.
    """
    global _instance
    if _instance is None:
        with _init_lock:
            if _instance is None:          # double-checked locking
                _instance = Models()
    return _instance
