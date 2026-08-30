from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.customers import router as customers_router
from app.routes.dashboard import router as dashboard_router
from app.routes.segmentation import router as segementaion_router
from app.routes.transactions import router as transaction_router
from app.routes.churn import router as chrun_router


app = FastAPI(
    title="Customer Segmentation API",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "https://fcustomer-segmentation12menna.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(chrun_router)
app.include_router(customers_router)
app.include_router(segementaion_router)
app.include_router(transaction_router)
app.include_router(dashboard_router)
