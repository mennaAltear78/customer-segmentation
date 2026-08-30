import pytest

from scripts.predictions import predict


def test_predict_accepts_extended_rfm_fields():
    payload = {
        "Recency": 10,
        "Frequency": 5,
        "Monetary": 1500,
        "AvgOrderValue": 300,
        "ActiveMonths": 3,
        "AvgGap": 7,
        "GapStd": 2,
        "UniqueProducts": 12,
        "Lifetime": 90,
        "SpendTrend": 500,
    }

    result = predict(payload)

    assert set(result).issuperset({"cluster_id", "segment"})
    assert isinstance(result["cluster_id"], int)
    assert isinstance(result["segment"], str)
