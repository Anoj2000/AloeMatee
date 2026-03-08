"""
Pipeline Orchestrator.

Thin adapter that calls pipeline.predict() and converts the result dict
into a typed DetectionResponse Pydantic model for the FastAPI route.

All business logic lives in pipeline.py.
"""

import logging

from app.pipeline.pipeline import predict
from app.schemas.detection import (
    DetectionResponse,
    StageAResult,
    StageBResult,
    StageCResult,
)

logger = logging.getLogger(__name__)


def run_pipeline(
    lesion_bytes: bytes,
    whole_plant_bytes: bytes,
    base_soil_bytes: bytes,
) -> DetectionResponse:
    """
    Run the full prediction pipeline and return a typed DetectionResponse.

    Delegates all logic to pipeline.predict() and maps the result dict
    onto the Pydantic schema.
    """
    raw = predict(
        lesion_bytes=lesion_bytes,
        whole_plant_bytes=whole_plant_bytes,
        base_soil_bytes=base_soil_bytes,
    )

    a = raw["stage_a"]
    b = raw["stage_b"]
    c = raw["stage_c"]

    return DetectionResponse(
        status=raw["status"],
        disease_name=raw["disease_name"],
        disease_id=raw["disease_id"],
        probability=raw["probability"],
        severity=raw["severity"],
        confidence=raw["confidence"],
        stage_a=StageAResult(
            label=a["label"],
            confidence=a["confidence"],
        ),
        stage_b=StageBResult(
            disease=b["disease"],
            confidence=b["confidence"],
        ) if b else None,
        stage_c=StageCResult(
            severity=c["severity"],
            confidence=c["confidence"],
        ) if c else None,
        images_received=["lesion", "whole_plant", "base_soil"],
    )
