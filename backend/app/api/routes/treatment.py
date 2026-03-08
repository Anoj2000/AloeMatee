"""
treatment.py
────────────
GET /api/v1/diseases/{disease_id}/treatment

Returns the scientific and ayurvedic treatment information for a given
Aloe Vera disease identified by its 0-based class index.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, Path, status

from app.schemas.detection import ErrorResponse
from app.schemas.treatment import TreatmentResponse
from app.services.treatment_service import get_treatment, list_diseases

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get(
    "/diseases/{disease_id}/treatment",
    response_model=TreatmentResponse,
    status_code=status.HTTP_200_OK,
    summary="Get treatment for a specific disease",
    description=(
        "Returns the scientific treatment, ayurvedic treatment, dosage, "
        "warnings, and reference sources for the Aloe Vera disease "
        "identified by its 0-based class index."
    ),
    responses={
        404: {"model": ErrorResponse, "description": "Disease ID not found"},
    },
)
async def get_disease_treatment(
    disease_id: int = Path(
        ...,
        ge=0,
        description="0-based disease class index (e.g. 0 = Leaf Rot, 1 = Rust).",
        examples=[0],
    ),
) -> TreatmentResponse:
    logger.info("[/diseases/%d/treatment] Fetching treatment data", disease_id)

    record = get_treatment(disease_id)
    if record is None:
        valid_ids = [str(d["disease_id"]) for d in list_diseases()]
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                f"No treatment data found for disease_id={disease_id}. "
                f"Valid IDs are: {', '.join(valid_ids)}."
            ),
        )

    return TreatmentResponse(**record)


@router.get(
    "/diseases",
    response_model=list[TreatmentResponse],
    status_code=status.HTTP_200_OK,
    summary="List all diseases with treatment data",
    description="Returns treatment information for every disease in the dataset, sorted by disease_id.",
)
async def list_all_treatments() -> list[TreatmentResponse]:
    logger.info("[/diseases] Listing all disease treatments")
    return [TreatmentResponse(**d) for d in list_diseases()]
