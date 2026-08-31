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
    # 1. KPIs
    # =========================================================

    total_customers = db.execute(text("SELECT COUNT(*) FROM public.customers")).scalar() or 0

    tx_stats = db.execute(text("""
        SELECT 
            COUNT(*) AS total_transactions,
            COALESCE(SUM(total_price), 0) AS total_revenue
        FROM public.customer_transactions
    """)).mappings().first()
    
    total_transactions = tx_stats["total_transactions"] or 0
    total_revenue = float(tx_stats["total_revenue"]) or 0.0

    churn_stats = db.execute(text("""
        SELECT
            COUNT(*) FILTER (WHERE prediction = 'Churn') AS churned_count,
            COUNT(*) FILTER (WHERE prediction = 'Not Churn') AS stable_count
        FROM public.customer_churn
    """)).mappings().first()

    churned_customers = churn_stats["churned_count"] or 0
    stable_customers = churn_stats["stable_count"] or 0
    
    churn_rate = 0.0
    if (churned_customers + stable_customers) > 0:
        churn_rate = float(churned_customers) / (churned_customers + stable_customers)

    # =========================================================
    # 2. SEGMENTATION DISTRIBUTION
    # =========================================================

    segments_result = db.execute(text("""
        SELECT segment, COUNT(*) AS count
        FROM public.customer_rfm
        GROUP BY segment
    """)).all()
    
    segments_dict = {row[0]: row[1] for row in segments_result if row[0] is not None}

    # =========================================================
    # 3. CHURN DISTRIBUTION
    # =========================================================

    churn_dict = {
        "churn": churned_customers,
        "not_churn": stable_customers
    }

    # =========================================================
    # 4. TIMESERIES (REVENUE & TRANSACTIONS OVER TIME)
    # =========================================================

    timeseries_result = db.execute(text("""
        SELECT
            TO_CHAR(invoice_date, 'YYYY-MM') AS month,
            SUM(total_price) AS revenue,
            COUNT(DISTINCT invoice_no) AS transactions
        FROM public.customer_transactions
        GROUP BY TO_CHAR(invoice_date, 'YYYY-MM')
        ORDER BY month ASC
    """)).mappings().all()

    revenue_over_time = [
        {
            "month": row["month"],
            "revenue": float(row["revenue"]) if row["revenue"] is not None else 0.0,
            "transactions": int(row["transactions"]) if row["transactions"] is not None else 0
        }
        for row in timeseries_result
    ]

    # =========================================================
    # 5. TOP CUSTOMERS
    # =========================================================

    top_customers_result = db.execute(text("""
        SELECT
            r.customer_id,
            r.segment,
            r.monetary,
            COALESCE(c.churn_probability, 0.0) AS churn_probability
        FROM public.customer_rfm r
        LEFT JOIN public.customer_churn c ON r.customer_id = c.customer_id
        ORDER BY r.monetary DESC
        LIMIT 5
    """)).mappings().all()

    top_customers = [
        {
            "customer_id": row["customer_id"],
            "segment": row["segment"],
            "monetary": float(row["monetary"]) if row["monetary"] is not None else 0.0,
            "churn_probability": float(row["churn_probability"])
        }
        for row in top_customers_result
    ]

    # =========================================================
    # 6. CUSTOMERS AT RISK
    # =========================================================

    risk_customers_result = db.execute(text("""
        SELECT
            r.customer_id,
            r.segment,
            r.monetary,
            COALESCE(c.churn_probability, 0.0) AS churn_probability
        FROM public.customer_rfm r
        JOIN public.customer_churn c ON r.customer_id = c.customer_id
        WHERE c.prediction = 'Churn'
        ORDER BY c.churn_probability DESC, r.monetary DESC
        LIMIT 5
    """)).mappings().all()

    customers_at_risk = [
        {
            "customer_id": row["customer_id"],
            "segment": row["segment"],
            "monetary": float(row["monetary"]) if row["monetary"] is not None else 0.0,
            "churn_probability": float(row["churn_probability"])
        }
        for row in risk_customers_result
    ]

    # =========================================================
    # 7. RECENT TRANSACTIONS
    # =========================================================

    recent_tx_result = db.execute(text("""
        SELECT
            id,
            customer_id,
            invoice_no,
            invoice_date,
            quantity,
            unit_price,
            total_price
        FROM public.customer_transactions
        ORDER BY invoice_date DESC
        LIMIT 5
    """)).mappings().all()

    recent_transactions = [
        {
            "id": row["id"],
            "customer_id": row["customer_id"],
            "invoice_no": row["invoice_no"],
            "invoice_date": row["invoice_date"].isoformat() if row["invoice_date"] is not None else "",
            "quantity": row["quantity"],
            "unit_price": float(row["unit_price"]),
            "total_price": float(row["total_price"])
        }
        for row in recent_tx_result
    ]

    return {
        "total_customers": total_customers,
        "total_transactions": total_transactions,
        "total_revenue": total_revenue,
        "churn_rate": churn_rate,
        "segments": segments_dict,
        "churn": churn_dict,
        "revenue_over_time": revenue_over_time,
        "top_customers": top_customers,
        "customers_at_risk": customers_at_risk,
        "recent_transactions": recent_transactions
    }