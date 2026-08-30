from fastapi import APIRouter, Depends, HTTPException
import pandas as pd
from sqlalchemy import text
from sqlalchemy.orm import Session
from pathlib import Path
import joblib

from app.database.db import get_db


router = APIRouter(
    prefix="/api/predict-churn",
    tags=["Predict Churn"]
)


# =========================
# Load Churn Model
# =========================

model_path = Path(__file__).resolve().parent / "churn_model.pkl"

best_model = None
threshold = 0.5
FEATURES = []

if model_path.exists():

    model_package = joblib.load(model_path)

    if isinstance(model_package, dict) and {
        "model",
        "threshold",
        "features"
    }.issubset(model_package):

        best_model = model_package["model"]
        threshold = model_package["threshold"]
        FEATURES = model_package["features"]

    elif hasattr(model_package, "predict_proba"):

        best_model = model_package
        FEATURES = list(model_package.feature_names_in_)


# =========================
# Predict Customer Churn
# =========================

@router.post("/")
def predict_churn(
    customer_id: int,
    db: Session = Depends(get_db)
):

    # =========================================================
    # 1. GET CUSTOMER TRANSACTIONS
    # =========================================================

    result = db.execute(
        text("""
            SELECT
                invoice_no,
                invoice_date,
                quantity,
                unit_price,
                stock_code,
                total_price
            FROM public.customer_transactions
            WHERE customer_id = :customer_id
            ORDER BY invoice_date
        """),
        {
            "customer_id": customer_id
        }
    )

    rows = result.mappings().all()

    if not rows:
        raise HTTPException(
            status_code=404,
            detail=f"Customer {customer_id} not found"
        )


    # =========================================================
    # 2. CREATE DATAFRAME
    # =========================================================

    transactions = pd.DataFrame(rows)

    transactions["invoice_date"] = pd.to_datetime(
        transactions["invoice_date"]
    )


    # =========================================================
    # 3. BASIC FEATURES
    # =========================================================

    observation_date = transactions["invoice_date"].max()

    recency = (
        observation_date - transactions["invoice_date"].max()
    ).days

    frequency = transactions["invoice_no"].nunique()

    monetary = transactions["total_price"].sum()

    unique_products = transactions["stock_code"].nunique()

    lifetime = (
        transactions["invoice_date"].max()
        - transactions["invoice_date"].min()
    ).days


    # =========================================================
    # 4. AVERAGE ORDER VALUE
    # =========================================================

    order_values = (
        transactions
        .groupby("invoice_no")["total_price"]
        .sum()
    )

    avg_order_value = order_values.mean()


    # =========================================================
    # 5. ACTIVE MONTHS
    # =========================================================

    active_months = (
        transactions["invoice_date"]
        .dt.to_period("M")
        .nunique()
    )


    # =========================================================
    # 6. PURCHASE GAPS
    # =========================================================

    purchase_dates = (
        transactions[["invoice_date"]]
        .drop_duplicates()
        .sort_values("invoice_date")
    )

    gaps = (
        purchase_dates["invoice_date"]
        .diff()
        .dt.days
        .dropna()
    )

    avg_gap = (
        gaps.mean()
        if len(gaps) > 0
        else 0
    )

    gap_std = (
        gaps.std()
        if len(gaps) > 1
        else 0
    )


    # =========================================================
    # 7. SPEND TREND
    # =========================================================

    midpoint = (
        transactions["invoice_date"].min()
        +
        (
            transactions["invoice_date"].max()
            -
            transactions["invoice_date"].min()
        ) / 2
    )

    first_half = transactions[
        transactions["invoice_date"] <= midpoint
    ]

    second_half = transactions[
        transactions["invoice_date"] > midpoint
    ]

    first_half_spend = first_half["total_price"].sum()

    second_half_spend = second_half["total_price"].sum()

    spend_trend = (
        second_half_spend
        - first_half_spend
    )


    # =========================================================
    # 8. CREATE MODEL INPUT
    # =========================================================

    data = pd.DataFrame([{

        "Recency": recency,

        "Frequency": frequency,

        "Monetary": monetary,

        "UniqueProducts": unique_products,

        "Lifetime": lifetime,

        "AvgOrderValue": avg_order_value,

        "ActiveMonths": active_months,

        "AvgGap": avg_gap,

        "GapStd": gap_std,

        "SpendTrend": spend_trend

    }])


    # =========================================================
    # 9. CHECK MODEL
    # =========================================================

    if best_model is None:

        raise HTTPException(
            status_code=500,
            detail="Churn model not loaded"
        )

    ordered_features = list(best_model.feature_names_in_)
    data = data.reindex(columns=ordered_features, fill_value=0)


    # =========================================================
    # 10. PREDICTION
    # =========================================================

    probability = best_model.predict_proba(
        data
    )[0, 1]

    prediction = int(
        probability >= threshold
    )


    # =========================================================
    # 11. SAVE RESULT IN customer_churn
    # =========================================================

    save_query = text("""
        INSERT INTO public.customer_churn (
            customer_id,
            churn_probability,
            prediction,
            threshold,
            predicted_at
        )
        VALUES (
            :customer_id,
            :churn_probability,
            :prediction,
            :threshold,
            CURRENT_TIMESTAMP
        )
    """)

    db.execute(
        save_query,
        {
            "customer_id": customer_id,

            "churn_probability": float(
                probability
            ),

            "prediction": (
                "Churn"
                if prediction == 1
                else "Not Churn"
            ),

            "threshold": float(
                threshold
            )
        }
    )

    db.commit()


    # =========================================================
    # 12. RETURN RESULT
    # =========================================================

    return {
        "customer_id": customer_id,

        "churn_probability": round(
            float(probability),
            4
        ),

        "prediction": (
            "Churn"
            if prediction == 1
            else "Not Churn"
        ),

        "threshold": float(threshold),

        "features": data.to_dict(
            orient="records"
        )[0]
    }