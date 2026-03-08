import io
import numpy as np
from PIL import Image


def decode_and_preprocess(
    image_bytes: bytes,
    target_size: tuple[int, int],
    normalize: bool = True,
) -> np.ndarray:
    """
    Decode raw image bytes, resize to target_size (W, H), optionally normalize
    to [0, 1], and return a float32 array shaped (1, H, W, 3) ready for
    TFLite inference.
    """
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    image = image.resize(target_size, Image.BILINEAR)
    arr = np.array(image, dtype=np.float32)
    if normalize:
        arr /= 255.0
    # Add batch dimension
    return np.expand_dims(arr, axis=0)


def validate_image_bytes(image_bytes: bytes, max_mb: int = 10) -> None:
    """Raise ValueError if the payload is too large or not a valid image."""
    max_bytes = max_mb * 1024 * 1024
    if len(image_bytes) > max_bytes:
        raise ValueError(f"Image exceeds maximum allowed size of {max_mb} MB.")
    try:
        Image.open(io.BytesIO(image_bytes)).verify()
    except Exception:
        raise ValueError("Uploaded file is not a valid image.")
