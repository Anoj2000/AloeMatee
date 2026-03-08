"""
Integration tests for POST /api/v1/detect.
Run: pytest tests/test_api.py -v
"""

import io
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.main import app
from app.schemas.detection import (
    DetectionResponse,
    StageAResult,
    StageBResult,
    StageCResult,
)

client = TestClient(app)


# ── Helpers ────────────────────────────────────────────────────────────────────

def _png_file(name: str = "test.png") -> tuple[str, bytes, str]:
    img = Image.new("RGB", (100, 100), color=(60, 120, 60))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return (name, buf.getvalue(), "image/png")


def _healthy_response() -> DetectionResponse:
    return DetectionResponse(
        status="healthy",
        stage_a=StageAResult(label="healthy", confidence=0.96),
        stage_b=None,
        stage_c=None,
        images_received=["lesion", "whole_plant", "base_soil"],
    )


def _unhealthy_response() -> DetectionResponse:
    return DetectionResponse(
        status="unhealthy",
        stage_a=StageAResult(label="unhealthy", confidence=0.91),
        stage_b=StageBResult(disease="leaf_rot", confidence=0.87),
        stage_c=StageCResult(severity="moderate", confidence=0.79),
        images_received=["lesion", "whole_plant", "base_soil"],
    )


# ── Tests ──────────────────────────────────────────────────────────────────────

class TestDetectEndpoint:
    def test_healthy_plant_returns_200(self):
        with patch(
            "app.api.routes.detection.run_pipeline",
            return_value=_healthy_response(),
        ):
            response = client.post(
                "/api/v1/detect",
                files={
                    "lesion_image": _png_file("lesion.png"),
                    "whole_plant_image": _png_file("whole.png"),
                    "base_soil_image": _png_file("base.png"),
                },
            )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["stage_b"] is None
        assert data["stage_c"] is None

    def test_unhealthy_plant_returns_full_result(self):
        with patch(
            "app.api.routes.detection.run_pipeline",
            return_value=_unhealthy_response(),
        ):
            response = client.post(
                "/api/v1/detect",
                files={
                    "lesion_image": _png_file("lesion.png"),
                    "whole_plant_image": _png_file("whole.png"),
                    "base_soil_image": _png_file("base.png"),
                },
            )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "unhealthy"
        assert data["stage_b"]["disease"] == "leaf_rot"
        assert data["stage_c"]["severity"] == "moderate"

    def test_missing_image_returns_422(self):
        response = client.post(
            "/api/v1/detect",
            files={
                "lesion_image": _png_file("lesion.png"),
                # whole_plant_image and base_soil_image omitted
            },
        )
        assert response.status_code == 422

    def test_invalid_file_returns_400(self):
        """Sending a text file instead of an image should return 400."""
        response = client.post(
            "/api/v1/detect",
            files={
                "lesion_image": ("lesion.txt", b"not an image", "text/plain"),
                "whole_plant_image": _png_file("whole.png"),
                "base_soil_image": _png_file("base.png"),
            },
        )
        assert response.status_code == 400

    def test_health_check(self):
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"
