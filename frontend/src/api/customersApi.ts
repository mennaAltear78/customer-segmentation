import { apiClient } from './client';

export interface CustomerRFMRecord {
  customer_id: number;
  recency: number;
  frequency: number;
  monetary: number;
  cluster_id: number;
  segment: string;
  created_at: string;
  updated_at: string;
  churn_probability: number;
  prediction: string;
}

export interface CustomersListResponse {
  count: number;
  customers: CustomerRFMRecord[];
}

export interface CustomerDetailBehavior {
  avg_order_value: number;
  active_months: number;
  avg_gap: number;
  gap_std: number;
  unique_products: number;
  lifetime: number;
  spend_trend: number;
}

export interface CustomerDetailsResponse {
  customer_id: number;
  rfm: {
    recency: number;
    frequency: number;
    monetary: number;
  };
  segmentation: {
    cluster_id: number;
    segment: string;
  };
  churn: {
    churn_probability: number;
    prediction: string;
  };
  behavior: CustomerDetailBehavior;
  transactions: {
    id: number;
    invoice_no: string;
    invoice_date: string;
    quantity: number;
    unit_price: number;
    stock_code: string;
    total_price: number;
  }[];
}

export const getCustomers = async (): Promise<CustomersListResponse> => {
  const response = await apiClient.get<CustomersListResponse>('/api/customers');
  return response.data;
};

export const getCustomerDetails = async (customerId: number | string): Promise<CustomerDetailsResponse> => {
  const response = await apiClient.get<CustomerDetailsResponse>(`/api/customers/${customerId}`);
  return response.data;
};
