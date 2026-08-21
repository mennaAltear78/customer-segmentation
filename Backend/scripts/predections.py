"""Backward-compatible import alias for the corrected prediction module."""

from scripts.predictions import (
    CLUSTER_NAMES,
    predict,
)

__all__ = ["CLUSTER_NAMES", "predict"]
