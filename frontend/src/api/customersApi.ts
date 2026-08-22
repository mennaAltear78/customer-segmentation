import { apiClient } from './client';

export interface RFMRecord {
  id: number;
  customer_id: number;
  recency: number;
  frequency: number;
  monetary: number;
  cluster_id: number;
  segment: string;
  created_at: string;
  updated_at: string;
}

export interface RFMListResponse {
  count: number;
  rfm: RFMRecord[];
}

export const getCustomersRFM = async (): Promise<RFMListResponse> => {
  const response = await apiClient.get<RFMListResponse>('/rfm');
  return response.data;
};

export const getCustomerRFMDetails = async (customerId: number | string): Promise<RFMRecord> => {
  const response = await apiClient.get<RFMRecord>(`/rfm/${customerId}`);
  return response.data;
};
