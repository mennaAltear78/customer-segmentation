from fastapi import APIRouter, Depends ,HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.schemas.prediction_schema import Transaction
from scripts.predictions import predict
from app.services.rfm_service import calculate_rfm


router = APIRouter()


@router.post("/predection")
def add_transaction(
    data: Transaction,
    db: Session = Depends(get_db)
):

    try:

        # =========================================================
        # 1. CREATE CUSTOMER IF IT DOES NOT EXIST
        # =========================================================

        # Case 1:
        # customer_id was NOT sent
        if data.customer_id is None:

            # Get next customer_id from customers table
            result = db.execute(
                text("""
                    SELECT COALESCE(MAX(customer_id), 0) + 1
                    FROM customers
                """)
            )

            new_customer_id = result.scalar()

            data.customer_id = new_customer_id

            # Create customer
            db.execute(
                text("""
                    INSERT INTO customers (customer_id)
                    VALUES (:customer_id)
                """),
                {
                    "customer_id": data.customer_id
                }
            )

        else:

            # Case 2:
            # customer_id was sent
            # Check if it already exists

            customer_exists = db.execute(
                text("""
                    SELECT customer_id
                    FROM customers
                    WHERE customer_id = :customer_id
                """),
                {
                    "customer_id": data.customer_id
                }
            ).scalar()

            # If customer doesn't exist -> create it
            if customer_exists is None:

                db.execute(
                    text("""
                        INSERT INTO customers (customer_id)
                        VALUES (:customer_id)
                    """),
                    {
                        "customer_id": data.customer_id
                    }
                )

        # =========================================================
        # 2. SAVE TRANSACTION
        # =========================================================

        transaction_query = text("""
            INSERT INTO customer_transactions (
                customer_id,
                invoice_no,
                invoice_date,
                quantity,
                unit_price
            )
            VALUES (
                :customer_id,
                :invoice_no,
                :invoice_date,
                :quantity,
                :unit_price
            )
        """)

        db.execute(
            transaction_query,
            {
                "customer_id": data.customer_id,
                "invoice_no": data.invoice_no,
                "invoice_date": data.invoice_date,
                "quantity": data.quantity,
                "unit_price": data.unit_price
            }
        )

        # =========================================================
        # 3. COMMIT CUSTOMER + TRANSACTION
        # =========================================================

        db.commit()

        # =========================================================
        # 4. CALCULATE RFM
        # =========================================================

        rfm = calculate_rfm(
            db,
            data.customer_id
        )

        # =========================================================
        # 5. PREDICTION
        # =========================================================

        prediction_result = predict(rfm)

        # =========================================================
        # 6. SAVE RFM + PREDICTION
        # =========================================================

        save_rfm_query = text("""
            INSERT INTO customer_rfm (
                customer_id,
                recency,
                frequency,
                monetary,
                cluster_id,
                segment
            )
            VALUES (
                :customer_id,
                :recency,
                :frequency,
                :monetary,
                :cluster_id,
                :segment
            )
            ON CONFLICT (customer_id)
            DO UPDATE SET
                recency = EXCLUDED.recency,
                frequency = EXCLUDED.frequency,
                monetary = EXCLUDED.monetary,
                cluster_id = EXCLUDED.cluster_id,
                segment = EXCLUDED.segment,
                updated_at = CURRENT_TIMESTAMP
        """)

        db.execute(
            save_rfm_query,
            {
                "customer_id": int(data.customer_id),
                "recency": int(rfm["Recency"]),
                "frequency": int(rfm["Frequency"]),
                "monetary": float(rfm["Monetary"]),
                "cluster_id": int(prediction_result["cluster_id"]),
                "segment": str(prediction_result["segment"])
            }
        )

        db.commit()

        # =========================================================
        # 7. RETURN RESULT
        # =========================================================

        return {
            "customer_id": int(data.customer_id),
            "recency": int(rfm["Recency"]),
            "frequency": int(rfm["Frequency"]),
            "monetary": float(rfm["Monetary"]),
            "cluster_id": int(prediction_result["cluster_id"]),
            "segment": str(prediction_result["segment"])
        }

    except Exception as e:

        # Rollback if anything goes wrong
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
# =========================
# Get all transactions
# =========================

@router.get("/transactions")
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
            unit_price
        FROM customer_transactions
        ORDER BY invoice_date DESC
    """)

    result = db.execute(query)

    rows = result.mappings().all()

    return {
        "count": len(rows),
        "transactions": rows
    }

@router.get("/transactions/{customer_id}")
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
            unit_price
        FROM customer_transactions
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

# =========================
# Get all RFM records
# =========================

@router.get("/rfm")
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
            updated_at
        FROM customer_rfm
        ORDER BY updated_at DESC
    """)

    result = db.execute(query)

    rows = result.mappings().all()

    return {
        "count": len(rows),
        "rfm": rows
    }
@router.get("/rfm/{customer_id}")
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
            updated_at
        FROM customer_rfm
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
            detail=f"RFM for customer {customer_id} not found"
        )

    return row


@router.get("/dashboard")
def get_dashboard(
    db: Session = Depends(get_db)
):

    query = text("""
        SELECT
            COUNT(*) AS total_customers,

            COUNT(*) FILTER (
                WHERE segment = 'Champions / VIP'
            ) AS champions,

            COUNT(*) FILTER (
                WHERE segment = 'Loyal Customer'
            ) AS loyal_customers,

            COUNT(*) FILTER (
                WHERE segment = 'At-Risk / Hibernating'
            ) AS at_risk_customers,

            COUNT(*) FILTER (
                WHERE segment = 'Potential Customer'
            ) AS potential_customers

        FROM customer_rfm
    """)

    result = db.execute(query)

    return dict(result.mappings().first())