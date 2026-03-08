"""
predict.py
──────────
POST /api/v1/predict

Accepts three Aloe Vera images (image1, image2, image3), runs the 3-stage
AI pipeline, and returns a rich structured response including a ranked
disease prediction list, confidence status, recommended next step, and a
plain-English symptoms summary.
"""

from __future__ import annotations

import logging
import shutil
import tempfile
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, File, HTTPException, UploadFile, status

from app.core.config import settings
from app.pipeline import pipeline
from app.schemas.detection import ErrorResponse, PredictResponse, PredictionItem
from app.utils.image_utils import validate_image_bytes

logger = logging.getLogger(__name__)
router = APIRouter()


# ── Helpers ───────────────────────────────────────────────────────────────────

def _confidence_status(prob: float) -> str:
    """Map a top-class probability to a three-tier confidence label.

    HIGH   >= 0.80
    MEDIUM  0.60 – 0.79
    LOW    < 0.60
    """
    if prob >= 0.80:
        return "HIGH"
    if prob >= 0.60:
        return "MEDIUM"
    return "LOW"


def _retake_message(prob: float) -> str | None:
    """Return photo improvement guidance when confidence is LOW, else None."""
    if prob >= 0.60:
        return None
    return (
        "The model confidence is too low to give a reliable result. "
        "Please retake all three photos following these tips: "
        "(1) use bright, natural or diffuse lighting with no harsh shadows; "
        "(2) hold the camera steady and close enough so the affected area fills most of the frame; "
        "(3) ensure the lens is clean and the image is in sharp focus; "
        "(4) avoid backlighting or flash glare directly on the leaf surface."
    )


def _symptoms_summary(
    status: str,
    disease_name: str | None,
    severity: str | None,
    confidence_status: str,
) -> str:
    """Generate a short, human-readable description of the detection result."""
    if status == "healthy":
        return "The plant appears healthy. No disease or stress indicators were detected."

    if status == "uncertain" or disease_name is None:
        return (
            "The model could not confidently identify a specific disease. "
            "Consider retaking the photos in better lighting or from different angles."
        )

    severity_text = f"{severity} severity" if severity else "unknown severity"
    confidence_text = {
        "HIGH": "high confidence",
        "MEDIUM": "moderate confidence",
        "LOW": "low confidence — consider retaking photos",
    }.get(confidence_status, "uncertain confidence")

    return (
        f"{disease_name} ({severity_text}) detected with {confidence_text}. "
        "Review the recommended treatment and monitor the plant closely."
    )


# ── Route ─────────────────────────────────────────────────────────────────────

@router.post(
    "/predict",
    response_model=PredictResponse,
    status_code=status.HTTP_200_OK,
    summary="Predict Aloe Vera disease from three images",
    description=(
        "Upload three images of an Aloe Vera plant (image1, image2, image3) "
        "to receive a disease prediction with ranked probabilities, a "
        "confidence status, a recommended next step, and a plain-English "
        "symptoms summary."
    ),
    responses={
        400: {"model": ErrorResponse, "description": "Invalid image(s)"},
        422: {"description": "Missing or wrong number of files"},
        500: {"model": ErrorResponse, "description": "Internal inference error"},
    },
)
async def predict_disease(
    image1: UploadFile = File(..., description="First photo of the plant (e.g. lesion close-up)"),
    image2: UploadFile = File(..., description="Second photo of the plant (e.g. whole-plant view)"),
    image3: UploadFile = File(..., description="Third photo of the plant (e.g. base and soil)"),
) -> PredictResponse:
    request_id = str(uuid4())
    logger.info("[/predict] request_id=%s — reading uploads", request_id)

    # ── Read & validate raw bytes ─────────────────────────────────────────────
    upload_map = {"image1": image1, "image2": image2, "image3": image3}
    raw_images: dict[str, bytes] = {}

    for field, upload in upload_map.items():
        raw = await upload.read()
        try:
            validate_image_bytes(raw, max_mb=settings.MAX_IMAGE_SIZE_MB)
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file for '{field}': {exc}",
            )
        raw_images[field] = raw

    # ── Persist uploads to a temp directory (for audit / future disk use) ──
    tmp_dir = Path(tempfile.mkdtemp(prefix=f"aloemate_{request_id}_"))
    try:
        for field, raw in raw_images.items():
            dest = tmp_dir / f"{field}.jpg"
            dest.write_bytes(raw)
            logger.debug("[/predict] saved %s → %s", field, dest)

        # ── Run the AI pipeline ───────────────────────────────────────────────
        logger.info("[/predict] request_id=%s — running pipeline", request_id)
        try:
            result = pipeline.predict(
                lesion_bytes=raw_images["image1"],
                whole_plant_bytes=raw_images["image2"],
                base_soil_bytes=raw_images["image3"],
            )
        except FileNotFoundError as exc:
            logger.error("[/predict] Model file missing: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Model not found: {exc}",
            )
        except Exception as exc:
            logger.exception("[/predict] Pipeline failed for request_id=%s", request_id)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Inference error: {exc}",
            )

    finally:
        # Always clean up temp files regardless of success or failure
        shutil.rmtree(tmp_dir, ignore_errors=True)
        logger.debug("[/predict] cleaned up temp dir %s", tmp_dir)

    # ── Build ranked predictions list ─────────────────────────────────────────
    stage_b = result.get("stage_b")

    if stage_b and result["status"] != "healthy":
        all_scores: dict[str, float] = stage_b.get("all_scores", {})
        labels = list(all_scores.keys())

        predictions: list[PredictionItem] = sorted(
            [
                PredictionItem(
                    disease_id=labels.index(label),
                    disease_name=label.replace("_", " ").title(),
                    prob=round(score, 6),
                )
                for label, score in all_scores.items()
            ],
            key=lambda p: p.prob,
            reverse=True,
        )
    else:
        # Plant is healthy or uncertain — return an empty prediction list
        predictions = []

    # ── Derive confidence status & next-step recommendation ──────────────────
    top_prob: float = result.get("probability") or 0.0
    conf_status = _confidence_status(top_prob)
    next_step = "RETAKE" if conf_status == "LOW" else "SHOW_TREATMENT"
    retake_msg = _retake_message(top_prob)

    # ── Build symptoms summary ────────────────────────────────────────────────
    summary = _symptoms_summary(
        status=result["status"],
        disease_name=result.get("disease_name"),
        severity=result.get("severity"),
        confidence_status=conf_status,
    )

    logger.info(
        "[/predict] request_id=%s — done  status=%s  disease=%s  confidence_status=%s",
        request_id,
        result["status"],
        result.get("disease_name"),
        conf_status,
    )

    return PredictResponse(
        request_id=request_id,
        predictions=predictions,
        confidence_status=conf_status,
        recommended_next_step=next_step,
        symptoms_summary=summary,
        retake_message=retake_msg,
    )
