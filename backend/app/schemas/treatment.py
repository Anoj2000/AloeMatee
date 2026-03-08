from pydantic import BaseModel, Field


class TreatmentResponse(BaseModel):
    disease_id: int = Field(..., description="0-based class index of the disease.")
    disease_name: str = Field(..., description="Human-readable disease name.", examples=["Leaf Rot"])
    scientific_treatment: str = Field(
        ...,
        description="Evidence-based treatment using approved agricultural chemicals or procedures.",
    )
    ayurvedic_treatment: str = Field(
        ...,
        description="Traditional / ayurvedic / natural treatment approach.",
    )
    dosage: str = Field(
        ...,
        description="Application rates and frequency for all treatments listed.",
    )
    warnings: str = Field(
        ...,
        description="Safety notices, toxicity information, and usage precautions.",
    )
    sources: list[str] = Field(
        ...,
        description="References supporting the treatment recommendations.",
    )
