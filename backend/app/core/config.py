from pathlib import Path
from pydantic_settings import BaseSettings


BASE_DIR = Path(__file__).resolve().parent.parent.parent  # backend/


class Settings(BaseSettings):
    # ── App ──────────────────────────────────────────────────────────────────
    APP_NAME: str = "AloeMate Disease Detection API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # ── CORS ─────────────────────────────────────────────────────────────────
    ALLOWED_ORIGINS: list[str] = ["*"]

    # ── Model paths ──────────────────────────────────────────────────────────
    MODEL_DIR: Path = BASE_DIR / "ml_models"

    @property
    def STAGE_A_MODEL_PATH(self) -> Path:
        return self.MODEL_DIR / "stageA_model.tflite"

    @property
    def STAGE_B_MODEL_PATH(self) -> Path:
        return self.MODEL_DIR / "stageB_model.tflite"

    @property
    def STAGE_C_MODEL_PATH(self) -> Path:
        return self.MODEL_DIR / "aloe_vera_model.tflite"

    @property
    def STAGE_B_LABELS_PATH(self) -> Path:
        return self.MODEL_DIR / "labels" / "stage_b_labels.txt"

    @property
    def STAGE_C_LABELS_PATH(self) -> Path:
        return self.MODEL_DIR / "labels" / "stage_c_labels.txt"

    # ── Image preprocessing ───────────────────────────────────────────────────
    STAGE_A_INPUT_SIZE: tuple[int, int] = (224, 224)   # MobileNetV2
    STAGE_B_INPUT_SIZE: tuple[int, int] = (260, 260)   # EfficientNetV2-S
    STAGE_C_INPUT_SIZE: tuple[int, int] = (260, 260)   # EfficientNetV2-S

    # ── Thresholds ────────────────────────────────────────────────────────────
    # Stage A: probability of UNHEALTHY class must exceed this to proceed
    UNHEALTHY_THRESHOLD: float = 0.55
    # Stage B / C: minimum confidence to report; below this → "uncertain"
    MIN_CONFIDENCE: float = 0.40

    # ── Upload limits ─────────────────────────────────────────────────────────
    MAX_IMAGE_SIZE_MB: int = 10

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
