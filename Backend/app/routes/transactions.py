from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database.db import get_db

router = APIRouter(
    prefix="/api/transactions",
    tags=["Transactions"]
)


# =========================
# Get all transactions
# =========================

@router.get("/")
def get_all_transactions(
    db: Session = Depends(get_db)
):

    query = text("""
        SELECT
            id,
            customer_id,
            invoice_no,
            invoice_date,
            quantity,
            unit_price,
            stock_code,
            total_price
        FROM public.customer_transactions
        ORDER BY invoice_date DESC
    """)

    result = db.execute(query)

    rows = result.mappings().all()

    return {
        "count": len(rows),
        "transactions": rows
    }


# =========================
# Get customer transactions
# =========================

@router.get("/{customer_id}")
def get_customer_transactions(
    customer_id: int,
    db: Session = Depends(get_db)
):

    query = text("""
        SELECT
            id,
            customer_id,
            invoice_no,
            invoice_date,
            quantity,
            unit_price,
            stock_code,
            total_price
        FROM public.customer_transactions
        WHERE customer_id = :customer_id
        ORDER BY invoice_date DESC
    """)

    result = db.execute(
        query,
        {"customer_id": customer_id}
    )

    rows = result.mappings().all()

    return {
        "customer_id": customer_id,
        "count": len(rows),
        "transactions": rows
    }