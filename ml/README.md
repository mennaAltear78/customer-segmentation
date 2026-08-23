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
## Tech Stack & Libraries
* **Language:** Python
* **Data Manipulation & Analysis:** Pandas, NumPy
* **Machine Learning & Preprocessing:** Scikit-Learn (`StandardScaler`, `MinMaxScaler`, `QuantileTransformer`, `KMeans`, `PCA`)
* **Data Visualization:** Matplotlib, Seaborn

---

## Methodology & Pipeline

1. **Exploratory Data Analysis (EDA):**
   * Handled missing values, examined feature distributions (skewness), and inspected statistical summaries.
   * Utilized correlation heatmaps and distribution plots (histograms, box plots) to understand feature interactions.
     
3. **Transaction-to-Customer Level Transformation (RFM Engineering):**
   * Aggregated raw transaction-level rows into individual customer profiles.
   * Engineered **RFM** metrics:
     * **Recency:** Days since the customer's last purchase.
     * **Frequency:** Total unique purchases/invoices per customer.
     * **Monetary:** Total spend accumulated by each customer.
     * 
4. **Feature Preprocessing & Scaling:**
   * Tested multiple scaling and transformation strategies to mitigate the impact of skewness and outliers (e.g., comparing standard scalers against non-linear distribution transformations like `QuantileTransformer`).

5. **Dimensionality Reduction:**
   * Explored Principal Component Analysis (PCA) to reduce feature dimensionality, visualize cluster separation in 2D space, and understand variance retention.

6. **K-Means Clustering & Choosing K:**
   * **Mathematical Evaluation:** Metrics such as the **Silhouette Score**, **Davies-Bouldin Index**, and **Calinski-Harabasz Score** indicated that **K=2** achieved the strongest mathematical clustering performance and separation.
   * **Business Selection ($K=3$):** Despite $K=2$ scoring higher mathematically, **K=3** was intentionally selected from a business and product perspective to create more actionable, nuanced, and distinct tiers (e.g., low, medium, and high-value segments) rather than an overly broad binary split.

---

## Evaluation & Metrics Summary
* **Elbow Method:** Inspected the Within-Cluster Sum of Squares (WCSS) drop-off curve.
* **Silhouette Score:** Evaluated cohesion and separation distance.
* **Davies-Bouldin & Calinski-Harabasz Indexes:** Used to cross-validate cluster compactness and dispersion ratios.

---

---
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
### 2.Compare Different Clustering Algorithms

As a future improvement, I plan to experiment with other unsupervised clustering algorithms, such as:

- Agglomerative Clustering
- DBSCAN
- Other suitable clustering approaches

The different models will be compared based on:

- Silhouette Score
- Cluster stability
- Cluster sizes
- Interpretability of customer segments
- Business usefulness

The goal is to determine whether K-Means provides the most suitable solution for this customer segmentation problem or whether another clustering approach can produce better and more meaningful segments.
### 3. Churn Classification
Extend the project from customer segmentation to **customer churn prediction**.

After identifying customer segments using clustering, a supervised learning model could be used to predict whether a customer is likely to churn based on features such as:

- Recency
- Frequency
- Monetary
- Purchase history
- Customer segment
- Other behavioral features

This would allow the project to move from simply identifying **which type of customer a customer is** to predicting **which customers are likely to stop purchasing**.
