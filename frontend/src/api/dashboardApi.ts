import { apiClient } from './client';

export interface DashboardSegmentData {
  [segment: string]: number;
}

export interface DashboardChurnData {
  churn: number;
  not_churn: number;
}

export interface DashboardTimeseriesData {
  month: string;
  revenue: number;
  transactions: number;
}

export interface DashboardCustomerRow {
  customer_id: number;
  segment: string;
  monetary: number;
  churn_probability: number;
}

export interface DashboardTransactionRow {
  id: number;
  customer_id: number;
  invoice_no: string;
  invoice_date: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface DashboardData {
  total_customers: number;
  total_transactions: number;
  total_revenue: number;
  churn_rate: number;
  segments: DashboardSegmentData;
  churn: DashboardChurnData;
  revenue_over_time: DashboardTimeseriesData[];
  top_customers: DashboardCustomerRow[];
  customers_at_risk: DashboardCustomerRow[];
  recent_transactions: DashboardTransactionRow[];
}

/**
 * Normalize the response to handle both the updated local backend format
 * and the older Vercel-deployed backend format:
 *
 * Local format (flat):
 *   { total_customers, total_transactions, total_revenue, churn_rate,
 *     segments, churn, revenue_over_time, top_customers, customers_at_risk, recent_transactions }
 *
 * Old Vercel format (nested):
 *   { segmentation: { total_customers, champions, potential_loyalists, at_risk_customers },
 *     churn: { churned_customers, not_churned_customers, average_churn_probability, total_predictions },
 *     transactions: { total_transactions, total_revenue, ... } }
 */
function normalizeDashboard(raw: any): DashboardData {
  // ── Already the flat/local shape ──────────────────────────────
  if (typeof raw.total_customers === 'number') {
    return raw as DashboardData;
  }

  // ── Old nested Vercel shape ───────────────────────────────────
  const seg = raw.segmentation || {};
  const churnRaw = raw.churn || {};
  const tx = raw.transactions || {};

  const totalCustomers: number = seg.total_customers || 0;
  const churned: number = churnRaw.churned_customers || 0;
  const stable: number = churnRaw.not_churned_customers || 0;
  const totalPredicted = churned + stable;
  const churnRate = totalPredicted > 0 ? churned / totalPredicted : (churnRaw.average_churn_probability || 0);

  // Build segments object from named fields
  const segments: DashboardSegmentData = {};
  if (seg.champions != null && seg.champions > 0) segments['Champions / VIP'] = seg.champions;
  if (seg.potential_loyalists != null && seg.potential_loyalists > 0) segments['Potential Loyalists'] = seg.potential_loyalists;
  if (seg.at_risk_customers != null && seg.at_risk_customers > 0) segments['At-Risk / Hibernating'] = seg.at_risk_customers;

  return {
    total_customers: totalCustomers,
    total_transactions: tx.total_transactions || 0,
    total_revenue: tx.total_revenue || 0,
    churn_rate: churnRate,
    segments,
    churn: {
      churn: churned,
      not_churn: stable,
    },
    revenue_over_time: [],   // not available in old API
    top_customers: [],       // not available in old API
    customers_at_risk: [],   // not available in old API
    recent_transactions: [], // not available in old API
  };
}

export const getDashboardData = async (): Promise<DashboardData> => {
  const response = await apiClient.get<any>('/api/dashboard');
  return normalizeDashboard(response.data);
};
