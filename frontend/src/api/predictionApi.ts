import { apiClient } from './client';

export interface PredictionRequest {
  customer_id?: number | null;
  invoice_no: string;
  invoice_date: string;
  quantity: number;
  unit_price: number;
}

export interface PredictionResponse {
  customer_id: number;
  recency: number;
  frequency: number;
  monetary: number;
  cluster_id: number;
  segment: string;
  churn_probability?: number;
  churn_prediction?: boolean;
}

export const predictSegment = async (data: PredictionRequest): Promise<PredictionResponse> => {
  const response = await apiClient.post<PredictionResponse>('/predection', data);
  return response.data;
};
