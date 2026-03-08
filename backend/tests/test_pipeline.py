"""
Unit tests for the AI pipeline stages.
Run: pytest tests/test_pipeline.py -v
Requires: pytest, Pillow, numpy
"""

import io
import struct
import zlib
from unittest.mock import MagicMock, patch

import numpy as np
import pytest
from PIL import Image


# ── Helpers ────────────────────────────────────────────────────────────────────

def _make_png_bytes(width: int = 64, height: int = 64) -> bytes:
    """Return a minimal valid RGB PNG as bytes."""
    img = Image.new("RGB", (width, height), color=(80, 140, 80))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def _fake_runner(output_shape: tuple, fixed_logits: list[float]):
    """Return a mock TFLiteRunner whose predict() returns given logits."""
    mock = MagicMock()
    mock.predict.return_value = np.array([fixed_logits], dtype=np.float32)
    return mock


# ── Stage A ────────────────────────────────────────────────────────────────────

class TestStageA:
    def test_healthy_prediction(self):
        from app.pipeline import stage_a

        images = [_make_png_bytes() for _ in range(3)]
        # Index 0 = healthy with high confidence
        fake = _fake_runner((1, 2), [5.0, 0.1])

        with patch("app.pipeline.stage_a._get_runner", return_value=fake):
            result = stage_a.run(images)

        assert result["label"] == "healthy"
        assert result["confidence"] > 0.9

    def test_unhealthy_prediction(self):
        from app.pipeline import stage_a

        images = [_make_png_bytes() for _ in range(3)]
        # Index 1 = unhealthy with high confidence
        fake = _fake_runner((1, 2), [0.1, 5.0])

        with patch("app.pipeline.stage_a._get_runner", return_value=fake):
            result = stage_a.run(images)

        assert result["label"] == "unhealthy"
        assert result["confidence"] > 0.9

    def test_probabilities_sum_to_one(self):
        from app.pipeline import stage_a

        images = [_make_png_bytes() for _ in range(3)]
        fake = _fake_runner((1, 2), [1.0, 2.0])

        with patch("app.pipeline.stage_a._get_runner", return_value=fake):
            result = stage_a.run(images)

        total = sum(result["probabilities"].values())
        assert abs(total - 1.0) < 1e-5


# ── Stage B ────────────────────────────────────────────────────────────────────

class TestStageB:
    def test_returns_top_disease(self):
        from app.pipeline import stage_b

        images = [_make_png_bytes() for _ in range(3)]
        # 7 disease classes — boost index 2 (leaf_blight)
        logits = [0.1, 0.1, 5.0, 0.1, 0.1, 0.1, 0.1]
        fake = _fake_runner((1, 7), logits)

        with patch("app.pipeline.stage_b._get_runner", return_value=fake):
            result = stage_b.run(images)

        assert result["disease"] == "leaf_blight"
        assert result["confidence"] > 0.9

    def test_uncertain_when_low_confidence(self):
        from app.pipeline import stage_b

        images = [_make_png_bytes() for _ in range(3)]
        # Uniform logits → all ~0.14 → below MIN_CONFIDENCE (0.40)
        logits = [1.0] * 7
        fake = _fake_runner((1, 7), logits)

        with patch("app.pipeline.stage_b._get_runner", return_value=fake):
            result = stage_b.run(images)

        assert result["disease"] == "uncertain"


# ── Stage C ────────────────────────────────────────────────────────────────────

class TestStageC:
    def test_returns_severity(self):
        from app.pipeline import stage_c

        images = [_make_png_bytes() for _ in range(3)]
        # 4 severity classes — boost index 2 (severe)
        logits = [0.1, 0.1, 5.0, 0.1]
        fake = _fake_runner((1, 4), logits)

        with patch("app.pipeline.stage_c._get_runner", return_value=fake):
            result = stage_c.run(images)

        assert result["severity"] == "severe"
        assert result["confidence"] > 0.9


# ── Orchestrator ───────────────────────────────────────────────────────────────

class TestOrchestrator:
    def test_early_exit_on_healthy(self):
        from app.pipeline.orchestrator import run_pipeline

        images = [_make_png_bytes() for _ in range(3)]

        with (
            patch(
                "app.pipeline.orchestrator.stage_a.run",
                return_value={
                    "label": "healthy",
                    "confidence": 0.97,
                    "probabilities": {"healthy": 0.97, "unhealthy": 0.03},
                },
            ),
            patch("app.pipeline.orchestrator.stage_b.run") as mock_b,
            patch("app.pipeline.orchestrator.stage_c.run") as mock_c,
        ):
            result = run_pipeline(*images)

        assert result.status == "healthy"
        mock_b.assert_not_called()
        mock_c.assert_not_called()

    def test_full_pipeline_on_unhealthy(self):
        from app.pipeline.orchestrator import run_pipeline

        images = [_make_png_bytes() for _ in range(3)]

        with (
            patch(
                "app.pipeline.orchestrator.stage_a.run",
                return_value={
                    "label": "unhealthy",
                    "confidence": 0.92,
                    "probabilities": {"healthy": 0.08, "unhealthy": 0.92},
                },
            ),
            patch(
                "app.pipeline.orchestrator.stage_b.run",
                return_value={"disease": "leaf_rot", "confidence": 0.85, "all_scores": {}},
            ),
            patch(
                "app.pipeline.orchestrator.stage_c.run",
                return_value={"severity": "moderate", "confidence": 0.78, "all_scores": {}},
            ),
        ):
            result = run_pipeline(*images)

        assert result.status == "unhealthy"
        assert result.stage_b.disease == "leaf_rot"
        assert result.stage_c.severity == "moderate"
