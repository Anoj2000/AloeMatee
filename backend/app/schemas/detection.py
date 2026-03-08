from pydantic import BaseModel, Field


# ── Per-stage results ─────────────────────────────────────────────────────────

class StageAResult(BaseModel):
    label: str = Field(..., examples=["healthy", "unhealthy"])
    confidence: float = Field(..., ge=0.0, le=1.0)


class StageBResult(BaseModel):
    disease: str = Field(..., examples=["leaf_rot", "rust", "leaf_blight"])
    confidence: float = Field(..., ge=0.0, le=1.0)


class StageCResult(BaseModel):
    severity: str = Field(..., examples=["mild", "moderate", "severe"])
    confidence: float = Field(..., ge=0.0, le=1.0)


# ── Unified response ──────────────────────────────────────────────────────────

class DetectionResponse(BaseModel):
    # ── Top-level summary fields (primary mobile app fields) ─────────────────
    status: str = Field(
        ...,
        description="'healthy' | 'unhealthy' | 'uncertain'",
        examples=["unhealthy"],
    )
    disease_name: str | None = Field(
        None,
        description="Human-readable disease name. None when plant is healthy.",
        examples=["Leaf Rot"],
    )
    disease_id: int | None = Field(
        None,
        description="0-based class index of the predicted disease from Stage B.",
        examples=[0],
    )
    probability: float | None = Field(
        None,
        description="Stage B top-class confidence (disease probability).",
        examples=[0.87],
    )
    severity: str | None = Field(
        None,
        description="Severity level from Stage C. None when plant is healthy.",
        examples=["moderate"],
    )
    confidence: float | None = Field(
        None,
        description="Stage C top-class confidence (severity confidence).",
        examples=[0.81],
    )

    # ── Full per-stage breakdowns ─────────────────────────────────────────────
    stage_a: StageAResult
    stage_b: StageBResult | None = Field(
        None,
        description="Only present when status is 'unhealthy'.",
    )
    stage_c: StageCResult | None = Field(
        None,
        description="Only present when status is 'unhealthy'.",
    )
    images_received: list[str] = Field(
        ...,
        description="Names of the 3 uploaded images.",
        examples=[["lesion", "whole_plant", "base_soil"]],
    )


# ── Error response ────────────────────────────────────────────────────────────

class ErrorResponse(BaseModel):
    detail: str


# ── /api/v1/predict schemas ───────────────────────────────────────────────────

class PredictionItem(BaseModel):
    disease_id: int = Field(..., description="0-based class index of the disease.", examples=[0])
    disease_name: str = Field(..., description="Human-readable disease name.", examples=["Leaf Rot"])
    prob: float = Field(..., ge=0.0, le=1.0, description="Model confidence for this disease.", examples=[0.87])


class PredictResponse(BaseModel):
    request_id: str = Field(..., description="UUID identifying this inference request.")
    predictions: list[PredictionItem] = Field(
        ...,
        description="Ranked list of predicted diseases (highest prob first).",
    )
    confidence_status: str = Field(
        ...,
        description="'HIGH' (≥0.80) | 'MEDIUM' (0.60–0.79) | 'LOW' (<0.60).",
        examples=["HIGH"],
    )
    recommended_next_step: str = Field(
        ...,
        description="'SHOW_TREATMENT' when HIGH or MEDIUM; 'RETAKE' when LOW.",
        examples=["SHOW_TREATMENT"],
    )
    symptoms_summary: str = Field(
        ...,
        description="Short human-readable summary of detected condition and severity.",
        examples=["Leaf Rot (moderate severity) detected with high confidence."],
    )
    retake_message: str | None = Field(
        None,
        description="Photo improvement tips. Only present when confidence_status is 'LOW'.",
        examples=["Please retake the photos in bright, natural light with the affected area in focus."],
    )
