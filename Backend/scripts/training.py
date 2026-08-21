import os
import json
import logging
from pathlib import Path

import pandas as pd
import joblib

from dotenv import load_dotenv
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import QuantileTransformer
from sklearn.cluster import KMeans
from sklearn.metrics import (
    silhouette_score,
    davies_bouldin_score,
    calinski_harabasz_score
)


def train_model():

    # =========================
    # Load configuration
    # =========================

    load_dotenv()

    PROJECT_ROOT = Path(os.getenv("PROJECT_ROOT"))

    DATASET_PATH = (
        PROJECT_ROOT / os.getenv("DATASET_NAME")
    )

    MODEL_PATH = (
        PROJECT_ROOT
        / os.getenv("MODEL_DIR")
        / os.getenv("MODEL_NAME")
    )

    LOG_PATH = (
        PROJECT_ROOT
        / os.getenv("LOG_DIR")
        / os.getenv("LOG_NAME")
    )

    RANDOM_STATE = int(
        os.getenv("RANDOM_STATE", 42)
    )

    # =========================
    # Create directories
    # =========================

    MODEL_PATH.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    LOG_PATH.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    # =========================
    # Logging
    # =========================

    logging.basicConfig(
        filename=LOG_PATH,
        level=logging.INFO,
        format="%(asctime)s - %(levelname)s - %(message)s"
    )

    try:

        logging.info("Final training started.")

        # =========================
        # Load data
        # =========================

        df = pd.read_excel(DATASET_PATH)

        logging.info(
            f"Dataset loaded: {df.shape}"
        )

        # =========================
        # Final preprocessing
        # =========================

        df = df.drop_duplicates()

        rfm_df = df.dropna(
            subset=["CustomerID"]
        ).copy()

        rfm_df = rfm_df[
            ~rfm_df["InvoiceNo"]
            .astype(str)
            .str.startswith("C")
        ].copy()

        rfm_df["InvoiceDate"] = pd.to_datetime(
            rfm_df["InvoiceDate"]
        )

        rfm_df["TotalPrice"] = (
            rfm_df["Quantity"]
            * rfm_df["UnitPrice"]
        )

        reference_date = (
            rfm_df["InvoiceDate"].max()
            + pd.Timedelta(days=1)
        )

        recency = (
            reference_date
            - rfm_df.groupby("CustomerID")["InvoiceDate"].max()
        ).dt.days

        frequency = (
            rfm_df.groupby("CustomerID")["InvoiceNo"]
            .nunique()
        )

        monetary = (
            rfm_df.groupby("CustomerID")["TotalPrice"]
            .sum()
        )

        rfm = pd.DataFrame({
            "Recency": recency,
            "Frequency": frequency,
            "Monetary": monetary
        })

        # =========================
        # Final model
        # =========================

        pipeline = Pipeline([
            (
                "preprocessor",
                QuantileTransformer(
                    output_distribution="normal",
                    random_state=RANDOM_STATE
                )
            ),
            (
                "kmeans",
                KMeans(
                    n_clusters=3,
                    n_init=10,
                    random_state=RANDOM_STATE
                )
            )
        ])

        # =========================
        # Final training
        # =========================

        pipeline.fit(rfm)

        logging.info(
            "Final model trained successfully."
        )

        # =========================
        # Evaluation
        # =========================

        X_transformed = (
            pipeline
            .named_steps["preprocessor"]
            .transform(rfm)
        )

        labels = pipeline.predict(rfm)

        silhouette = silhouette_score(
            X_transformed,
            labels
        )

        davies_bouldin = davies_bouldin_score(
            X_transformed,
            labels
        )

        calinski_harabasz = calinski_harabasz_score(
            X_transformed,
            labels
        )

        metrics = {
            "model": "KMeans",
            "n_clusters": 3,
            "preprocessing": "QuantileTransformer",
            "silhouette_score": float(silhouette),
            "davies_bouldin_score": float(davies_bouldin),
            "calinski_harabasz_score": float(
                calinski_harabasz
            ),
            "n_customers": len(rfm)
        }

        logging.info(
            f"Metrics: {metrics}"
        )

        # =========================
        # Save model
        # =========================

        joblib.dump(
            pipeline,
            MODEL_PATH
        )

        logging.info(
            f"Model saved to: {MODEL_PATH}"
        )

        # =========================
        # Save metrics
        # =========================

        metrics_path = (
            MODEL_PATH.parent / "metrics.json"
        )

        with open(metrics_path, "w") as file:
            json.dump(
                metrics,
                file,
                indent=4
            )

        logging.info(
            f"Metrics saved to: {metrics_path}"
        )

        logging.info(
            "Final training completed successfully."
        )

    except Exception as e:

        logging.exception(
            f"Training failed: {e}"
        )

        raise


if __name__ == "__main__":
    train_model()