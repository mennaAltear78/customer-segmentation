import { apiClient } from './client';

export interface DashboardSegmentation {
  total_customers: number;
  champions: number;
  potential_loyalists: number;
  at_risk_customers: number;
}

export interface DashboardChurn {
  total_predictions: number;
  churned_customers: number;
  not_churned_customers: number;
  average_churn_probability: number;
}

export interface DashboardTransactions {
  total_transactions: number;
  total_revenue: number;
  total_quantity: number;
  average_transaction_value: number;
}

export interface DashboardData {
  segmentation: DashboardSegmentation;
  churn: DashboardChurn;
  transactions: DashboardTransactions;
}

export const getDashboardData = async (): Promise<DashboardData> => {
  // Use trailing slash as expected by FastAPI
  const response = await apiClient.get<DashboardData>('/api/dashboard/');
  return response.data;
};
