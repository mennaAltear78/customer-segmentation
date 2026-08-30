from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database.db import get_db


router = APIRouter(
    prefix="/api/dashboard",
    tags=["Dashboard"]
)


@router.get("/")
def get_dashboard(
    db: Session = Depends(get_db)
):

    # =========================================================
    # 1. SEGMENTATION
    # =========================================================

    segmentation_query = text("""
        SELECT
            COUNT(*) AS total_customers,

            COUNT(*) FILTER (
                WHERE cluster_id = 2
            ) AS champions,

            COUNT(*) FILTER (
                WHERE cluster_id = 1
            ) AS potential_loyalists,

            COUNT(*) FILTER (
                WHERE cluster_id = 0
            ) AS at_risk_customers

        FROM public.customer_rfm
    """)

    segmentation_result = db.execute(
        segmentation_query
    ).mappings().first()


    # =========================================================
    # 2. CHURN
    # =========================================================

    churn_query = text("""
        SELECT
            COUNT(*) AS total_predictions,

            COUNT(*) FILTER (
                WHERE prediction = 'Churn'
            ) AS churned_customers,

            COUNT(*) FILTER (
                WHERE prediction != 'Churn'
            ) AS not_churned_customers,

            ROUND(
                AVG(churn_probability)::numeric,
                4
            ) AS average_churn_probability

        FROM public.customer_churn
    """)

    churn_result = db.execute(
        churn_query
    ).mappings().first()


    # =========================================================
    # 3. TRANSACTIONS
    # =========================================================

    transactions_query = text("""
        SELECT
            COUNT(*) AS total_transactions,

            COALESCE(
                SUM(total_price),
                0
            ) AS total_revenue,

            COALESCE(
                SUM(quantity),
                0
            ) AS total_quantity,

            COALESCE(
                AVG(total_price),
                0
            ) AS average_transaction_value

        FROM public.customer_transactions
    """)

    transactions_result = db.execute(
        transactions_query
    ).mappings().first()


    # =========================================================
    # 4. RETURN DASHBOARD
    # =========================================================

    return {
        "segmentation": dict(segmentation_result),
        "churn": dict(churn_result),
        "transactions": dict(transactions_result)
    }