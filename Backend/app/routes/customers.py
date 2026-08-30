from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database.db import get_db


router = APIRouter(
    prefix="/api/customers",
    tags=["Customers"]
)


# =========================
# Get all customers RFM
# =========================

@router.get("/")
def get_all_rfm(
    db: Session = Depends(get_db)
):

    query = text("""
        SELECT
            id,
            customer_id,
            recency,
            frequency,
            monetary,
            cluster_id,
            segment,
            created_at,
            updated_at,
            avg_order_value,
            active_months,
            avg_gap,
            gap_std,
            unique_products,
            lifetime,
            spend_trend
        FROM public.customer_rfm
        ORDER BY updated_at DESC
    """)

    result = db.execute(query)

    rows = result.mappings().all()

    return {
        "count": len(rows),
        "customers": rows
    }


# =========================
# Get customer RFM
# =========================

@router.get("/{customer_id}")
def get_customer_rfm(
    customer_id: int,
    db: Session = Depends(get_db)
):

    query = text("""
        SELECT
            id,
            customer_id,
            recency,
            frequency,
            monetary,
            cluster_id,
            segment,
            created_at,
            updated_at,
            avg_order_value,
            active_months,
            avg_gap,
            gap_std,
            unique_products,
            lifetime,
            spend_trend
        FROM public.customer_rfm
        WHERE customer_id = :customer_id
    """)

    result = db.execute(
        query,
        {"customer_id": customer_id}
    )

    row = result.mappings().first()

    if row is None:
        raise HTTPException(
            status_code=404,
            detail=f"Customer {customer_id} not found"
        )

    return row