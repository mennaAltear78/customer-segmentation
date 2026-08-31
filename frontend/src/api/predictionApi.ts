import { apiClient } from './client';

export interface ChurnPredictionResponse {
  customer_id: number;
  churn_probability: number;
  prediction: string;
}

export const predictChurn = async (customerId: number): Promise<ChurnPredictionResponse> => {
  // customer_id is a query parameter as expected by the FastAPI backend
  const response = await apiClient.post<ChurnPredictionResponse>(`/api/predict-churn/?customer_id=${customerId}`);
  return response.data;
};
