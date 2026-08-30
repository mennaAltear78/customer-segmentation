import os
import logging
from pathlib import Path

import pandas as pd
from dotenv import load_dotenv
from joblib import load


# =========================
# Configuration
# =========================

load_dotenv()
PROJECT_ROOT = Path(
    os.getenv(
        "PROJECT_ROOT",
        Path(__file__).resolve().parent.parent
    )
)

MODEL_DIR = (
    PROJECT_ROOT / os.getenv("MODEL_DIR", "ml")
)

SEGMENTATION_MODEL_PATH = (
    MODEL_DIR / os.getenv("MODEL_NAME", "CUSTOMER_SEGMENTAION_MODEL.pkl")
)

CHURN_MODEL_PATH = (
    MODEL_DIR / "churn_model.joblib"
)

LOG_PATH = (
    PROJECT_ROOT
    / os.getenv("LOG_DIR", "logs")
    / os.getenv("LOG_NAME", "app.log")
)

IS_VERCEL = os.getenv("VERCEL") == "1"


# =========================
# Logging
# =========================

logging_handlers = [logging.StreamHandler()]

if not IS_VERCEL:
    LOG_PATH.parent.mkdir(
        parents=True,
        exist_ok=True
    )
    logging_handlers.append(logging.FileHandler(LOG_PATH))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
    handlers=logging_handlers
)


# =========================
# Load Models
# =========================

logging.info("Loading segmentation model...")

segmentation_model = load(
    SEGMENTATION_MODEL_PATH
)

logging.info(
    "Segmentation model loaded successfully."
)


# Churn model will be loaded after we train it
churn_model = None

if CHURN_MODEL_PATH.exists():

    logging.info("Loading churn model...")

    churn_model = load(
        CHURN_MODEL_PATH
    )

    logging.info(
        "Churn model loaded successfully."
    )


# =========================
# Cluster Names
# =========================

CLUSTER_NAMES = {
    0: "At-Risk / Hibernating",
    1: "Potential Loyalists",
    2: "Champions / VIP"
}

SEGMENTATION_FEATURES = list(
    getattr(segmentation_model, "feature_names_in_", [
        "Recency",
        "Frequency",
        "Monetary",
    ])
)


# =========================
# Prediction
# =========================

def predict(input_data: dict):

    df = pd.DataFrame([input_data])
    aligned_df = df.reindex(
        columns=SEGMENTATION_FEATURES,
        fill_value=0
    )

    # -------------------------
    # Customer Segmentation
    # -------------------------

    cluster_id = int(
        segmentation_model.predict(aligned_df)[0]
    )

    segment_name = CLUSTER_NAMES.get(
        cluster_id,
        "Unknown Segment"
    )

    result = {
        "cluster_id": cluster_id,
        "segment": segment_name
    }

    # -------------------------
    # Churn Prediction
    # -------------------------

    if churn_model is not None:

        churn_probability = float(
            churn_model.predict_proba(aligned_df)[0][1]
        )

        churn_prediction = (
            churn_probability >= 0.5
        )

        result.update({
            "churn_probability": round(
                churn_probability,
                4
            ),
            "churn_prediction": bool(
                churn_prediction
            )
        })

    logging.info(
        f"Prediction: {result}"
    )

    return result