from pathlib import Path

import joblib
import pandas as pd


model_path = (
    Path(__file__).resolve().parent.parent
    / "app"
    / "routes"
    / "churn_model.pkl"
)

best_model = None
threshold = 0.5
FEATURES = []

if model_path.exists():
    model_package = joblib.load(model_path)

    if isinstance(model_package, dict) and {"model", "threshold", "features"}.issubset(model_package):
        best_model = model_package["model"]
        threshold = model_package["threshold"]
        FEATURES = model_package["features"]
    elif hasattr(model_package, "predict_proba"):
        best_model = model_package
        FEATURES = list(model_package.feature_names_in_)


def predict_churn(rfm: dict):
    if best_model is None:
        raise ValueError("Churn model not loaded")

    data = pd.DataFrame([
        {
            "Recency": float(rfm.get("Recency", 0)),
            "Frequency": float(rfm.get("Frequency", 0)),
            "Monetary": float(rfm.get("Monetary", 0)),
            "UniqueProducts": float(rfm.get("UniqueProducts", 0)),
            "Lifetime": float(rfm.get("Lifetime", 0)),
            "AvgOrderValue": float(rfm.get("AvgOrderValue", 0)),
            "ActiveMonths": float(rfm.get("ActiveMonths", 0)),
            "AvgGap": float(rfm.get("AvgGap", 0)),
            "GapStd": float(rfm.get("GapStd", 0)),
            "SpendTrend": float(rfm.get("SpendTrend", 0)),
        }
    ])

    ordered_features = list(best_model.feature_names_in_)
    aligned = data.reindex(columns=ordered_features, fill_value=0)

    probability = float(best_model.predict_proba(aligned)[0, 1])
    prediction = "Churn" if probability >= threshold else "Not Churn"

    return {
        "churn_probability": round(probability, 4),
        "prediction": prediction,
        "threshold": float(threshold),
    }
