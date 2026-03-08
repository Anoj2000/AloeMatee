import logging

from fastapi import APIRouter, File, HTTPException, UploadFile, status

from app.core.config import settings
from app.pipeline.orchestrator import run_pipeline
from app.schemas.detection import DetectionResponse, ErrorResponse
from app.utils.image_utils import validate_image_bytes

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post(
    "/detect",
    response_model=DetectionResponse,
    status_code=status.HTTP_200_OK,
    summary="Run the 3-stage disease detection pipeline",
    description=(
        "Upload three images of an Aloe Vera plant — a lesion close-up, "
        "a whole-plant shot, and a base/soil image — to receive a disease "
        "detection result including health status, disease classification, "
        "and severity level."
    ),
    responses={
        400: {"model": ErrorResponse, "description": "Invalid image(s)"},
        422: {"description": "Missing or wrong number of files"},
        500: {"model": ErrorResponse, "description": "Internal inference error"},
    },
)
async def detect_disease(
    lesion_image: UploadFile = File(
        ..., description="Close-up of the lesion / affected leaf area"
    ),
    whole_plant_image: UploadFile = File(
        ..., description="Full view of the entire plant"
    ),
    base_soil_image: UploadFile = File(
        ..., description="Base of the plant and surrounding soil"
    ),
) -> DetectionResponse:
    # ── Read raw bytes ────────────────────────────────────────────────────────
    uploads = {
        "lesion_image": lesion_image,
        "whole_plant_image": whole_plant_image,
        "base_soil_image": base_soil_image,
    }

    raw_images: dict[str, bytes] = {}
    for field, upload in uploads.items():
        raw = await upload.read()
        try:
            validate_image_bytes(raw, max_mb=settings.MAX_IMAGE_SIZE_MB)
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file for '{field}': {exc}",
            )
        raw_images[field] = raw

    # ── Run pipeline ──────────────────────────────────────────────────────────
    try:
        result = run_pipeline(
            lesion_bytes=raw_images["lesion_image"],
            whole_plant_bytes=raw_images["whole_plant_image"],
            base_soil_bytes=raw_images["base_soil_image"],
        )
    except FileNotFoundError as exc:
        logger.error("Model file missing: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Model not found: {exc}",
        )
    except Exception as exc:
        logger.exception("Inference pipeline failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference error: {exc}",
        )

    return result
