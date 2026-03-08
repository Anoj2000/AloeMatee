"""
preprocess.py
─────────────
OpenCV-based image preprocessing for AloeMate TFLite inference.

All functions return a float32 numpy tensor shaped (1, H, W, 3) that can be
passed directly to TFLiteRunner.predict().

Primary entry-point
───────────────────
    from app.utils.preprocess import preprocess_image

    tensor = preprocess_image("ml_models/test_leaf.jpg")
    # tensor.shape → (1, 224, 224, 3)  dtype=float32  values ∈ [0, 1]

Advanced usage — different sizes per stage
───────────────────────────────────────────
    from app.utils.preprocess import preprocess_image, PreprocessConfig, preprocess_image_bytes

    # Stage A — MobileNetV2
    tensor_a = preprocess_image(path, config=PreprocessConfig(size=(224, 224)))

    # Stage B / C — EfficientNetV2
    tensor_b = preprocess_image(path, config=PreprocessConfig(size=(260, 260)))

    # From raw bytes (e.g. FastAPI UploadFile)
    tensor = preprocess_image_bytes(raw_bytes)
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from pathlib import Path

import cv2
import numpy as np

logger = logging.getLogger(__name__)


# ── Configuration ─────────────────────────────────────────────────────────────

@dataclass
class PreprocessConfig:
    """
    All tunable preprocessing parameters in one place.

    Attributes
    ----------
    size        : (width, height) to resize to. Default 224x224 (MobileNetV2).
    normalize   : Divide pixel values by 255.0 to get [0, 1]. Default True.
    mean        : Per-channel mean for mean-std normalisation (ImageNet default).
                  Set to None to skip mean-std normalisation (only /255 is applied).
    std         : Per-channel std for mean-std normalisation (ImageNet default).
                  Set to None to skip mean-std normalisation.
    interpolation : cv2 interpolation flag used when resizing.
    """
    size: tuple[int, int] = (224, 224)
    normalize: bool = True
    # ImageNet mean/std — set both to None to disable mean-std normalisation
    mean: tuple[float, float, float] | None = (0.485, 0.456, 0.406)
    std: tuple[float, float, float] | None  = (0.229, 0.224, 0.225)
    interpolation: int = cv2.INTER_LINEAR


# Convenience singletons for each model stage
STAGE_A_CONFIG = PreprocessConfig(size=(224, 224))          # MobileNetV2
STAGE_B_CONFIG = PreprocessConfig(size=(260, 260))          # EfficientNetV2-S
STAGE_C_CONFIG = PreprocessConfig(size=(260, 260))          # EfficientNetV2-S (aloe_vera_model)


# ── Core helpers ──────────────────────────────────────────────────────────────

def _bgr_to_rgb(image: np.ndarray) -> np.ndarray:
    """Convert a BGR image (OpenCV default) to RGB."""
    return cv2.cvtColor(image, cv2.COLOR_BGR2RGB)


def _resize(image: np.ndarray, size: tuple[int, int], interpolation: int) -> np.ndarray:
    """Resize to (width, height); returns (height, width, 3)."""
    return cv2.resize(image, size, interpolation=interpolation)


def _to_float32_normalised(
    image: np.ndarray,
    normalize: bool,
    mean: tuple[float, float, float] | None,
    std: tuple[float, float, float] | None,
) -> np.ndarray:
    """
    Cast to float32 and optionally apply:
      1. /255 normalisation  → values ∈ [0, 1]
      2. mean-std normalisation → values ≈ N(0, 1)  (ImageNet standard)
    """
    arr = image.astype(np.float32)

    if normalize:
        arr /= 255.0

    if mean is not None and std is not None:
        arr = (arr - np.array(mean, dtype=np.float32)) / np.array(std, dtype=np.float32)

    return arr


def _add_batch_dim(arr: np.ndarray) -> np.ndarray:
    """Expand (H, W, 3) → (1, H, W, 3)."""
    return np.expand_dims(arr, axis=0)


# ── Public API ────────────────────────────────────────────────────────────────

def preprocess_image(
    image_path: str | Path,
    config: PreprocessConfig = STAGE_A_CONFIG,
) -> np.ndarray:
    """
    Load an image from disk and return a TFLite-ready tensor.

    Parameters
    ----------
    image_path : path to JPEG, PNG, BMP, or TIFF file.
    config     : PreprocessConfig — controls size, normalisation, etc.
                 Defaults to STAGE_A_CONFIG (224×224, MobileNetV2).

    Returns
    -------
    np.ndarray  shape (1, H, W, 3), dtype float32

    Raises
    ------
    FileNotFoundError  : if image_path does not exist.
    ValueError         : if the file cannot be decoded as an image.
    """
    path = Path(image_path)
    if not path.exists():
        raise FileNotFoundError(f"Image file not found: {path}")

    image = cv2.imread(str(path))
    if image is None:
        raise ValueError(f"OpenCV could not decode image: {path}")

    logger.debug("Loaded image %s  original size=%s", path.name, image.shape[:2][::-1])
    return _pipeline(image, config)


def preprocess_image_bytes(
    raw_bytes: bytes,
    config: PreprocessConfig = STAGE_A_CONFIG,
) -> np.ndarray:
    """
    Decode image from raw bytes (e.g. FastAPI UploadFile content) and return
    a TFLite-ready tensor.

    Parameters
    ----------
    raw_bytes : raw image bytes (JPEG, PNG, …).
    config    : PreprocessConfig.

    Returns
    -------
    np.ndarray  shape (1, H, W, 3), dtype float32

    Raises
    ------
    ValueError : if the bytes cannot be decoded as an image.
    """
    arr = np.frombuffer(raw_bytes, dtype=np.uint8)
    image = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError("OpenCV could not decode image from bytes.")

    return _pipeline(image, config)


def preprocess_batch(
    image_paths: list[str | Path],
    config: PreprocessConfig = STAGE_A_CONFIG,
) -> np.ndarray:
    """
    Load and preprocess multiple images, returning a batched tensor.

    Parameters
    ----------
    image_paths : list of file paths, e.g. [lesion, whole_plant, base_soil].
    config      : PreprocessConfig.

    Returns
    -------
    np.ndarray  shape (N, H, W, 3), dtype float32
    """
    tensors = [preprocess_image(p, config)[0] for p in image_paths]   # strip batch dim
    return np.stack(tensors, axis=0)                                   # (N, H, W, 3)


# ── Internal pipeline ─────────────────────────────────────────────────────────

def _pipeline(bgr_image: np.ndarray, config: PreprocessConfig) -> np.ndarray:
    """
    Shared processing chain applied to every image regardless of source.

    Steps
    -----
    1. BGR → RGB   (OpenCV loads as BGR by default)
    2. Resize      (cv2.resize with configurable interpolation)
    3. float32 cast + /255 normalisation
    4. Mean-std normalisation   (ImageNet values, disable by setting mean/std=None)
    5. Expand batch dimension   (H, W, 3) → (1, H, W, 3)
    """
    rgb   = _bgr_to_rgb(bgr_image)
    resized = _resize(rgb, config.size, config.interpolation)
    normed  = _to_float32_normalised(resized, config.normalize, config.mean, config.std)
    return _add_batch_dim(normed)
