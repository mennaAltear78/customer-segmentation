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
            unit_price,
            stock_code,
            total_price
        FROM customer_transactions
        WHERE customer_id = :customer_id
        ORDER BY invoice_date
    """)

    result = db.execute(
        query,
        {"customer_id": customer_id}
    )

    rows = result.mappings().all()

    if not rows:
        return None

    df = pd.DataFrame(rows)

    if "total_price" not in df.columns:
        df["total_price"] = (
            df["quantity"] * df["unit_price"]
        )

    df["invoice_date"] = pd.to_datetime(
        df["invoice_date"]
    )

    # Reference date
    reference_date = (
        df["invoice_date"].max()
        + pd.Timedelta(days=1)
    )

    # Basic metrics
    recency = (
        reference_date
        - df["invoice_date"].max()
    ).days

    frequency = df["invoice_no"].nunique()
    monetary = df["total_price"].sum()

    order_values = (
        df.groupby("invoice_no")["total_price"].sum()
    )
    avg_order_value = (
        order_values.mean()
        if not order_values.empty
        else 0
    )

    active_months = (
        df["invoice_date"].dt.to_period("M").nunique()
    )

    purchase_dates = (
        df[["invoice_date"]]
        .drop_duplicates()
        .sort_values("invoice_date")
    )

    gaps = (
        purchase_dates["invoice_date"]
        .diff()
        .dt.days
        .dropna()
    )

    avg_gap = gaps.mean() if len(gaps) > 0 else 0
    gap_std = gaps.std() if len(gaps) > 1 else 0

    unique_products = (
        df["stock_code"].nunique()
        if "stock_code" in df.columns
        else 0
    )

    lifetime = (
        (df["invoice_date"].max() - df["invoice_date"].min()).days
        if len(df) > 0
        else 0
    )

    midpoint = (
        df["invoice_date"].min()
        + (
            df["invoice_date"].max()
            - df["invoice_date"].min()
        ) / 2
    )

    first_half = df[df["invoice_date"] <= midpoint]
    second_half = df[df["invoice_date"] > midpoint]

    spend_trend = (
        second_half["total_price"].sum()
        - first_half["total_price"].sum()
    )

    return {
        "Recency": float(recency),
        "Frequency": float(frequency),
        "Monetary": float(monetary),
        "AvgOrderValue": float(avg_order_value),
        "ActiveMonths": int(active_months),
        "AvgGap": float(avg_gap),
        "GapStd": float(gap_std),
        "UniqueProducts": int(unique_products),
        "Lifetime": float(lifetime),
        "SpendTrend": float(spend_trend),
    }