import { apiClient } from './client';

export interface DashboardData {
  total_customers: number;
  champions: number;
  loyal_customers: number;
  at_risk_customers: number;
  potential_customers: number;
}

export const getDashboardData = async (): Promise<DashboardData> => {
  const response = await apiClient.get<DashboardData>('/dashboard');
  return response.data;
};
