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
def get_all_customers(
    db: Session = Depends(get_db)
):

    query = text("""
        SELECT
            r.customer_id,
            r.recency,
            r.frequency,
            r.monetary,
            r.cluster_id,
            r.segment,
            r.created_at,
            r.updated_at,
            COALESCE(c.churn_probability, 0.0) AS churn_probability,
            COALESCE(c.prediction, 'Not Churn') AS prediction
        FROM public.customer_rfm r
        LEFT JOIN public.customer_churn c ON r.customer_id = c.customer_id
        ORDER BY r.updated_at DESC
    """)

    result = db.execute(query)

    rows = result.mappings().all()

    customers_list = []
    for row in rows:
        customers_list.append({
            "customer_id": row["customer_id"],
            "recency": int(row["recency"]) if row["recency"] is not None else 0,
            "frequency": int(row["frequency"]) if row["frequency"] is not None else 0,
            "monetary": float(row["monetary"]) if row["monetary"] is not None else 0.0,
            "cluster_id": int(row["cluster_id"]) if row["cluster_id"] is not None else 0,
            "segment": row["segment"] or "Unknown",
            "created_at": row["created_at"].isoformat() if row["created_at"] is not None else "",
            "updated_at": row["updated_at"].isoformat() if row["updated_at"] is not None else "",
            "churn_probability": float(row["churn_probability"]),
            "prediction": row["prediction"],
        })

    return {
        "count": len(customers_list),
        "customers": customers_list
    }


# =========================
# Get customer RFM
# =========================

@router.get("/{customer_id}")
def get_customer_details(
    customer_id: int,
    db: Session = Depends(get_db)
):

    # Fetch RFM and behavior
    rfm_query = text("""
        SELECT
            customer_id,
            recency,
            frequency,
            monetary,
            cluster_id,
            segment,
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
    
    rfm_row = db.execute(rfm_query, {"customer_id": customer_id}).mappings().first()

    # If customer is not found in RFM, check if they exist in transactions.
    # If they exist, calculate and save RFM/Churn dynamically!
    if rfm_row is None:
        tx_check = db.execute(
            text("SELECT 1 FROM public.customer_transactions WHERE customer_id = :customer_id LIMIT 1"),
            {"customer_id": customer_id}
        ).scalar()
        
        if tx_check is not None:
            from app.routes.segmentation import process_customer
            try:
                process_customer(customer_id, db)
                db.commit()
                rfm_row = db.execute(rfm_query, {"customer_id": customer_id}).mappings().first()
            except Exception as e:
                db.rollback()
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to calculate parameters for customer: {str(e)}"
                )

    if rfm_row is None:
        raise HTTPException(
            status_code=404,
            detail=f"Customer {customer_id} not found"
        )

    # Fetch churn risk
    churn_query = text("""
        SELECT churn_probability, prediction
        FROM public.customer_churn
        WHERE customer_id = :customer_id
    """)
    churn_row = db.execute(churn_query, {"customer_id": customer_id}).mappings().first()
    
    churn_prob = float(churn_row["churn_probability"]) if churn_row else 0.0
    churn_pred = churn_row["prediction"] if churn_row else "Not Churn"

    # Fetch transactions ledger
    tx_query = text("""
        SELECT
            id,
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
    tx_rows = db.execute(tx_query, {"customer_id": customer_id}).mappings().all()
    
    transactions_list = [
        {
            "id": r["id"],
            "invoice_no": r["invoice_no"],
            "invoice_date": r["invoice_date"].isoformat() if r["invoice_date"] is not None else "",
            "quantity": r["quantity"],
            "unit_price": float(r["unit_price"]),
            "stock_code": r["stock_code"],
            "total_price": float(r["total_price"])
        }
        for r in tx_rows
    ]

    return {
        "customer_id": customer_id,
        "rfm": {
            "recency": int(rfm_row["recency"]) if rfm_row["recency"] is not None else 0,
            "frequency": int(rfm_row["frequency"]) if rfm_row["frequency"] is not None else 0,
            "monetary": float(rfm_row["monetary"]) if rfm_row["monetary"] is not None else 0.0
        },
        "segmentation": {
            "cluster_id": int(rfm_row["cluster_id"]) if rfm_row["cluster_id"] is not None else 0,
            "segment": rfm_row["segment"] or "Unknown"
        },
        "churn": {
            "churn_probability": churn_prob,
            "prediction": churn_pred
        },
        "behavior": {
            "avg_order_value": float(rfm_row["avg_order_value"]) if rfm_row["avg_order_value"] is not None else 0.0,
            "active_months": int(rfm_row["active_months"]) if rfm_row["active_months"] is not None else 0,
            "avg_gap": float(rfm_row["avg_gap"]) if rfm_row["avg_gap"] is not None else 0.0,
            "gap_std": float(rfm_row["gap_std"]) if rfm_row["gap_std"] is not None else 0.0,
            "unique_products": int(rfm_row["unique_products"]) if rfm_row["unique_products"] is not None else 0,
            "lifetime": float(rfm_row["lifetime"]) if rfm_row["lifetime"] is not None else 0.0,
            "spend_trend": float(rfm_row["spend_trend"]) if rfm_row["spend_trend"] is not None else 0.0
        },
        "transactions": transactions_list
    }