from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.database.db import get_db
from app.schemas.prediction_schema import Transaction
from scripts.predictions import predict
from scripts.churn_prediction import predict_churn
from app.services.rfm_service import calculate_rfm
import pandas as pd
from io import StringIO


router = APIRouter(
    prefix="/api/transactions",
    tags=["Transactions"]
)


# =========================================================
# PROCESS CUSTOMER
# =========================================================

def process_customer(customer_id: int, db: Session):

    # -----------------------------------------------------
    # 1. Calculate RFM + Features
    # -----------------------------------------------------

    rfm = calculate_rfm(
        db,
        customer_id
    )

    # -----------------------------------------------------
    # 2. Segmentation
    # -----------------------------------------------------

    segmentation_result = predict(rfm)

    # -----------------------------------------------------
    # 3. Save RFM + Segmentation
    # -----------------------------------------------------

    save_rfm_query = text("""
        INSERT INTO public.customer_rfm (
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
        )
        VALUES (
            :customer_id,
            :recency,
            :frequency,
            :monetary,
            :cluster_id,
            :segment,
            :avg_order_value,
            :active_months,
            :avg_gap,
            :gap_std,
            :unique_products,
            :lifetime,
            :spend_trend
        )

        ON CONFLICT (customer_id)
        DO UPDATE SET
            recency = EXCLUDED.recency,
            frequency = EXCLUDED.frequency,
            monetary = EXCLUDED.monetary,
            cluster_id = EXCLUDED.cluster_id,
            segment = EXCLUDED.segment,
            avg_order_value = EXCLUDED.avg_order_value,
            active_months = EXCLUDED.active_months,
            avg_gap = EXCLUDED.avg_gap,
            gap_std = EXCLUDED.gap_std,
            unique_products = EXCLUDED.unique_products,
            lifetime = EXCLUDED.lifetime,
            spend_trend = EXCLUDED.spend_trend,
            updated_at = CURRENT_TIMESTAMP
    """)

    db.execute(
        save_rfm_query,
        {
            "customer_id": customer_id,
            "recency": float(rfm["Recency"]),
            "frequency": float(rfm["Frequency"]),
            "monetary": float(rfm["Monetary"]),
            "cluster_id": int(segmentation_result["cluster_id"]),
            "segment": str(segmentation_result["segment"]),
            "avg_order_value": float(rfm["AvgOrderValue"]),
            "active_months": int(rfm["ActiveMonths"]),
            "avg_gap": float(rfm["AvgGap"]),
            "gap_std": float(rfm["GapStd"]),
            "unique_products": int(rfm["UniqueProducts"]),
            "lifetime": float(rfm["Lifetime"]),
            "spend_trend": float(rfm["SpendTrend"])
        }
    )

    # -----------------------------------------------------
    # 4. Churn
    # -----------------------------------------------------

    churn_result = predict_churn(rfm)

    # -----------------------------------------------------
    # 5. Save Churn
    # -----------------------------------------------------

    save_churn_query = text("""
        INSERT INTO public.customer_churn (
            customer_id,
            churn_probability,
            prediction,
            threshold
        )
        VALUES (
            :customer_id,
            :churn_probability,
            :prediction,
            :threshold
        )

        ON CONFLICT (customer_id)
        DO UPDATE SET
            churn_probability = EXCLUDED.churn_probability,
            prediction = EXCLUDED.prediction,
            threshold = EXCLUDED.threshold,
            predicted_at = CURRENT_TIMESTAMP
    """)

    db.execute(
        save_churn_query,
        {
            "customer_id": customer_id,
            "churn_probability": float(
                churn_result["churn_probability"]
            ),
            "prediction": str(
                churn_result["prediction"]
            ),
            "threshold": float(
                churn_result["threshold"]
            )
        }
    )

    return {
        "customer_id": customer_id,

        "segmentation": {
            "cluster_id": int(
                segmentation_result["cluster_id"]
            ),
            "segment": str(
                segmentation_result["segment"]
            )
        },

        "churn": {
            "churn_probability": float(
                churn_result["churn_probability"]
            ),
            "prediction": str(
                churn_result["prediction"]
            ),
            "threshold": float(
                churn_result["threshold"]
            )
        },

        "features": {
            "recency": float(rfm["Recency"]),
            "frequency": float(rfm["Frequency"]),
            "monetary": float(rfm["Monetary"]),
            "avg_order_value": float(rfm["AvgOrderValue"]),
            "active_months": int(rfm["ActiveMonths"]),
            "avg_gap": float(rfm["AvgGap"]),
            "gap_std": float(rfm["GapStd"]),
            "unique_products": int(rfm["UniqueProducts"]),
            "lifetime": float(rfm["Lifetime"]),
            "spend_trend": float(rfm["SpendTrend"])
        }
    }


# =========================================================
# ADD ONE TRANSACTION
# =========================================================

@router.post("/")
def add_transaction(
    data: Transaction,
    db: Session = Depends(get_db)
):

    try:

        # -------------------------------------------------
        # 1. Check / Create Customer
        # -------------------------------------------------

        customer_exists = db.execute(
            text("""
                SELECT customer_id
                FROM public.customers
                WHERE customer_id = :customer_id
            """),
            {
                "customer_id": data.customer_id
            }
        ).scalar()

        if customer_exists is None:

            db.execute(
                text("""
                    INSERT INTO public.customers (customer_id)
                    VALUES (:customer_id)
                """),
                {
                    "customer_id": data.customer_id
                }
            )

        # -------------------------------------------------
        # 2. Save Transaction
        # -------------------------------------------------

        db.execute(
            text("""
                INSERT INTO public.customer_transactions (
                    customer_id,
                    invoice_no,
                    invoice_date,
                    quantity,
                    unit_price,
                    stock_code,
                    total_price
                )
                VALUES (
                    :customer_id,
                    :invoice_no,
                    :invoice_date,
                    :quantity,
                    :unit_price,
                    :stock_code,
                    :total_price
                )
            """),
            {
                "customer_id": data.customer_id,
                "invoice_no": data.invoice_no,
                "invoice_date": data.invoice_date,
                "quantity": data.quantity,
                "unit_price": data.unit_price,
                "stock_code": data.stock_code,
                "total_price": data.quantity * data.unit_price
            }
        )

        # Commit transaction first
        db.commit()

        # -------------------------------------------------
        # 3. Calculate Segmentation + Churn
        # -------------------------------------------------

        result = process_customer(
            data.customer_id,
            db
        )

        db.commit()

        return {
            "message": "Transaction added successfully",
            **result
        }

    except Exception as e:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# =========================================================
# UPLOAD CSV
# =========================================================

@router.post("/upload")
async def upload_transactions_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):

    try:

        # -------------------------------------------------
        # 1. Check file
        # -------------------------------------------------

        if not file.filename.endswith(".csv"):
            raise HTTPException(
                status_code=400,
                detail="Please upload a CSV file"
            )

        # -------------------------------------------------
        # 2. Read CSV
        # -------------------------------------------------

        content = await file.read()

        df = pd.read_csv(
            StringIO(content.decode("utf-8"))
        )

        # -------------------------------------------------
        # 3. Required columns
        # -------------------------------------------------

        required_columns = {
            "customer_id",
            "invoice_no",
            "invoice_date",
            "quantity",
            "unit_price",
            "stock_code"
        }

        missing_columns = (
            required_columns - set(df.columns)
        )

        if missing_columns:

            raise HTTPException(
                status_code=400,
                detail={
                    "message": "Missing columns",
                    "columns": list(missing_columns)
                }
            )

        # -------------------------------------------------
        # 4. Convert date
        # -------------------------------------------------

        df["invoice_date"] = pd.to_datetime(
            df["invoice_date"]
        )

        # -------------------------------------------------
        # 5. Insert Customers
        # -------------------------------------------------

        customer_ids = (
            df["customer_id"]
            .dropna()
            .unique()
            .tolist()
        )

        for customer_id in customer_ids:

            exists = db.execute(
                text("""
                    SELECT customer_id
                    FROM public.customers
                    WHERE customer_id = :customer_id
                """),
                {
                    "customer_id": int(customer_id)
                }
            ).scalar()

            if exists is None:

                db.execute(
                    text("""
                        INSERT INTO public.customers (
                            customer_id
                        )
                        VALUES (:customer_id)
                    """),
                    {
                        "customer_id": int(customer_id)
                    }
                )

        # -------------------------------------------------
        # 6. Insert Transactions
        # -------------------------------------------------

        for _, row in df.iterrows():

            db.execute(
                text("""
                    INSERT INTO public.customer_transactions (
                        customer_id,
                        invoice_no,
                        invoice_date,
                        quantity,
                        unit_price,
                        stock_code,
                        total_price
                    )
                    VALUES (
                        :customer_id,
                        :invoice_no,
                        :invoice_date,
                        :quantity,
                        :unit_price,
                        :stock_code,
                        :total_price
                    )
                """),
                {
                    "customer_id": int(row["customer_id"]),
                    "invoice_no": str(row["invoice_no"]),
                    "invoice_date": row["invoice_date"],
                    "quantity": int(row["quantity"]),
                    "unit_price": float(row["unit_price"]),
                    "stock_code": str(row["stock_code"]),
                    "total_price": (
                        float(row["quantity"])
                        * float(row["unit_price"])
                    )
                }
            )

        db.commit()

        # -------------------------------------------------
        # 7. Process Customers
        # -------------------------------------------------

        results = []

        for customer_id in customer_ids:

            result = process_customer(
                int(customer_id),
                db
            )

            results.append(result)

        db.commit()

        # -------------------------------------------------
        # 8. Return Summary
        # -------------------------------------------------

        return {
            "message": "CSV uploaded successfully",
            "customers_processed": len(customer_ids),
            "transactions_added": len(df),
            "customers": results
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception as e:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )