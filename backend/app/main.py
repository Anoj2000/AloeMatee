import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import detection, predict, treatment
from app.core.config import settings
from app.models.model_loader import get_models

logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(
    detection.router,
    prefix="/api/v1",
    tags=["Detection"],
)
app.include_router(
    predict.router,
    prefix="/api/v1",
    tags=["Predict"],
)
app.include_router(
    treatment.router,
    prefix="/api/v1",
    tags=["Treatment"],
)


# ── Startup: pre-load all models ─────────────────────────────────────────────
@app.on_event("startup")
async def preload_models() -> None:
    """Load all three TFLite models into memory before the first request."""
    get_models()


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health", tags=["System"])
async def health_check() -> dict:
    return {"status": "ok", "version": settings.APP_VERSION}


# ── Models debug endpoint ─────────────────────────────────────────────────────
@app.get("/models", tags=["System"])
async def model_info() -> dict:
    """Returns input/output shapes and paths for all three loaded TFLite models."""
    return get_models().summary()
