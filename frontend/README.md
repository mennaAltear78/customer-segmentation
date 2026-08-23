# Customer Segmentation Dashboard - README

A comprehensive, machine learning-powered Customer Segmentation Dashboard designed to bridge high-level business insights with granular customer and transaction-level data exploration.

---

## Architecture & Data Flow

```text
Raw Data
   │
   ▼
Transaction Level (Invoices, Quantities, Unit Prices)
   │
   ▼
RFM Feature Engineering (Recency, Frequency, Monetary)
   │
   ▼
Machine Learning / Clustering (K-Means, Scaler, Encoder)
   │
   ▼
Customer Segmentation & Predictions
   │
   ▼
Frontend Dashboard
 ┌───────────────────────┐
 │ 1. Dashboard          │
 │ 2. Customers          │
 │ 3. Transactions       │
 │ 4. Prediction / Input │
 └───────────────────────┘
```

---

## Features & Application Sections

### 1. Dashboard
Provides a high-level overview of the entire customer segmentation strategy and business metrics:
- **Total Customers & Segment Counts:** Summary metrics for key groups (e.g., Champions/VIPs, Potential Loyalists, At-Risk/Hibernating).
- **Segment Distribution:** Visual bar charts and graphs showing the breakdown of customers across different clusters.
- **Average RFM Values:** Aggregate metrics displaying average Recency, Frequency, and Monetary values.
- **Recent Insights:** Real-time visibility into the latest customer segmentation trends.

### 2. Customers
Brings visibility down to the individual customer level, linking aggregate business views with specific profiles:
- **Customer Directory:** Complete list of all available customers along with their attributes and assigned clusters.
- **Detailed Profiles:** Select a specific customer (e.g., Customer X) to inspect their unique segment, RFM scores, and transaction records.

### 3. Transactions
Explores data at the granular transaction level, giving a comprehensive view of historical purchasing activity:
- **Transaction Records:** Detailed view featuring invoices, customer mappings, dates, quantities, unit prices, and overall transaction values.

### 4. Prediction & Model Pipeline
Allows users to input new customer data points, process them through the trained machine learning pipeline (scaler, encoder, and clustering model), and instantly assign them to the correct customer segment.

---

## Live Demo
Access the live application here: [Customer Segmentation App](https://fcustomer-segmentation12menna.vercel.app)
