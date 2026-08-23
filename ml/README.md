# Business Problem

The goal of this project is to segment customers based on their purchasing behavior.

The original Online Retail dataset is transaction-level data, meaning that each row represents a transaction, and the same customer can appear in multiple rows because a customer can make multiple purchases.

However, the business problem is not to group transactions. We want to group **customers** with similar purchasing behavior and identify meaningful customer segments, such as high-value customers, loyal customers, or customers who may be at risk of becoming inactive.

Therefore, the first challenge is that the level of the raw data does not match the level of the business problem:

**Raw Data → Transaction Level**  
**Business Problem → Customer Level**

For example:

```text
Customer A
    ├── Transaction 1
    ├── Transaction 2
    └── Transaction 3

Customer B
    ├── Transaction 4
    └── Transaction 5

```
## Future Improvements

### 1. Cancellation Behavior Analysis

Currently, cancellation transactions are excluded from the RFM calculation
to prevent them from distorting Recency, Frequency, and Monetary values.

As a future improvement, cancellation behavior could be retained as
separate customer-level features, such as:

- Cancellation Count
- Cancellation Rate

These features could be used to analyze whether cancellation behavior
differs across customer segments without affecting the core RFM calculation.
