"""
treatment_service.py
────────────────────
Loads disease treatment data from data/treatments.json and exposes a
single public function:

    get_treatment(disease_id: int) -> dict | None

The JSON file is read once at import time and cached in-process.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

# ── Locate treatments.json relative to the backend/ root ─────────────────────
_DATA_FILE = Path(__file__).resolve().parent.parent.parent / "data" / "treatments.json"


def _load() -> dict[str, dict]:
    """Read and parse treatments.json.  Raises RuntimeError on failure."""
    try:
        raw = _DATA_FILE.read_text(encoding="utf-8")
    except FileNotFoundError:
        raise RuntimeError(
            f"Treatment data file not found: {_DATA_FILE}. "
            "Ensure data/treatments.json is present in the backend directory."
        )
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"treatments.json is malformed: {exc}") from exc

    treatments: dict = payload.get("treatments", {})
    if not treatments:
        raise RuntimeError("treatments.json contains no 'treatments' key or it is empty.")

    logger.info(
        "[TreatmentService] Loaded %d disease treatment records from %s",
        len(treatments),
        _DATA_FILE,
    )
    return treatments


# ── Module-level cache (loaded once at first import) ─────────────────────────
_TREATMENTS: dict[str, dict] = _load()


# ── Public API ────────────────────────────────────────────────────────────────

def get_treatment(disease_id: int) -> dict | None:
    """
    Return the treatment record for *disease_id*, or *None* if not found.

    Parameters
    ----------
    disease_id : int
        0-based disease class index matching the Stage B label order.

    Returns
    -------
    dict with keys: disease_id, disease_name, scientific_treatment,
    ayurvedic_treatment, dosage, warnings, sources.
    None when the id is not in the dataset.
    """
    return _TREATMENTS.get(str(disease_id))


def list_diseases() -> list[dict]:
    """Return all disease treatment records sorted by disease_id."""
    return sorted(_TREATMENTS.values(), key=lambda d: d["disease_id"])
