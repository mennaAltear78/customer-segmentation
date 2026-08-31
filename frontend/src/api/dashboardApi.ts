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

export const getDashboardData = async (): Promise<DashboardData> => {
  const response = await apiClient.get<DashboardData>('/api/dashboard');
  return response.data;
};
