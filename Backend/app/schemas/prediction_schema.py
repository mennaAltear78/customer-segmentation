from pydantic import BaseModel
from datetime import date



class Transaction(BaseModel):
    customer_id: int
    invoice_no: str
    invoice_date: date
    quantity: int
    unit_price: float
    stock_code: str
    total_price: float | None = None

class CustomerPrediction(BaseModel):
    customer_id: int
    transactions: list[Transaction]
    