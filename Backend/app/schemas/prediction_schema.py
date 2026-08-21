from pydantic import BaseModel
from datetime import date
from typing import List


class Transaction(BaseModel):
    # id:int
    customer_id:int
    invoice_no: str
    invoice_date: date
    quantity: int
    unit_price: float


class CustomerPrediction(BaseModel):
    customer_id: int
    transactions: list[Transaction]