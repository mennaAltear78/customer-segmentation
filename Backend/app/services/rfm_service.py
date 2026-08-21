from sqlalchemy.orm import Session
from sqlalchemy import text
import pandas as pd


def calculate_rfm(db: Session, customer_id: int):

    query = text("""
        SELECT
            customer_id,
            invoice_no,
            invoice_date,
            quantity,
            unit_price
        FROM customer_transactions
        WHERE customer_id = :customer_id
    """)

    result = db.execute(
        query,
        {"customer_id": customer_id}
    )

    rows = result.mappings().all()

    if not rows:
        return None

    df = pd.DataFrame(rows)

    df["invoice_date"] = pd.to_datetime(
        df["invoice_date"]
    )

    # Total price for every transaction
    df["total_price"] = (
        df["quantity"] * df["unit_price"]
    )

    # Reference date
    reference_date = (
        df["invoice_date"].max()
        + pd.Timedelta(days=1)
    )

    # Recency
    recency = (
        reference_date
        - df["invoice_date"].max()
    ).days

    # Frequency
    frequency = df["invoice_no"].nunique()

    # Monetary
    monetary = df["total_price"].sum()

    return {
        "Recency": recency,
        "Frequency": frequency,
        "Monetary": monetary
    }