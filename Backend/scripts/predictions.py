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

PROJECT_ROOT = Path(os.getenv("PROJECT_ROOT"))

MODEL_DIR = (
    PROJECT_ROOT / os.getenv("MODEL_DIR")
)

SEGMENTATION_MODEL_PATH = (
    MODEL_DIR / os.getenv("MODEL_NAME")
)

CHURN_MODEL_PATH = (
    MODEL_DIR / "churn_model.joblib"
)

LOG_PATH = (
    PROJECT_ROOT
    / os.getenv("LOG_DIR")
    / os.getenv("LOG_NAME")
)


# =========================
# Logging
# =========================

LOG_PATH.parent.mkdir(
    parents=True,
    exist_ok=True
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(LOG_PATH)
    ]
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


# =========================
# Prediction
# =========================

def predict(input_data: dict):

    df = pd.DataFrame([input_data])

    # -------------------------
    # Customer Segmentation
    # -------------------------

    cluster_id = int(
        segmentation_model.predict(df)[0]
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
            churn_model.predict_proba(df)[0][1]
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