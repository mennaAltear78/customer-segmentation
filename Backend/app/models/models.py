from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.db import Base
from datetime import datetime


class Customer(Base):
    __tablename__ = "customers"

    # لو customer_id هو الـ Primary Key الأساسي في الداتابيز عندك من الأول:
    customer_id = Column(Integer, primary_key=True, index=True)

    transactions = relationship("CustomerTransaction", back_populates="customer", cascade="all, delete-orphan")
    rfm = relationship("CustomerRFM", back_populates="customer", uselist=False, cascade="all, delete-orphan")
    churn = relationship("CustomerChurn", back_populates="customer", uselist=False, cascade="all, delete-orphan")

class CustomerTransaction(Base):
    __tablename__ = "customer_transactions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    customer_id = Column(Integer, ForeignKey("customers.customer_id"), nullable=False)
    invoice_no = Column(String, nullable=False)
    invoice_date = Column(DateTime, nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)

    # الربط مع جدول العملاء
    customer = relationship("Customer", back_populates="transactions")


class CustomerRFM(Base):
    __tablename__ = "customer_rfm"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
        autoincrement=True
    )

    customer_id = Column(
        Integer,
        ForeignKey("customers.customer_id"),
        unique=True,
        nullable=False
    )

    recency = Column(Integer, nullable=True)

    frequency = Column(Integer, nullable=True)

    monetary = Column(Float, nullable=True)

    cluster_id = Column(Integer, nullable=True)

    segment = Column(String, nullable=True)

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    # Relationship with Customer
    customer = relationship(
        "Customer",
        back_populates="rfm"
    )


class CustomerChurn(Base):
    __tablename__ = "customer_churn"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    customer_id = Column(Integer, ForeignKey("customers.customer_id"), unique=True, nullable=False)
    churn_probability = Column(Float, nullable=False)
    prediction = Column(String, nullable=False)
    threshold = Column(Float, nullable=False)
    predicted_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship with Customer
    customer = relationship("Customer", back_populates="churn")