"""Backward-compatible import alias for the corrected schema module."""

from app.schemas.prediction_schema import CustomerPrediction, Transaction

__all__ = ["CustomerPrediction", "Transaction"]
