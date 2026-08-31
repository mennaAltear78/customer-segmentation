import { apiClient } from './client';

export interface TransactionRecord {
  id: number;
  customer_id: number;
  invoice_no: string;
  invoice_date: string;
  quantity: number;
  unit_price: number;
  stock_code: string;
  total_price: number;
}

export interface TransactionsListResponse {
  count: number;
  transactions: TransactionRecord[];
}

export interface CustomerTransactionsResponse {
  customer_id: number;
  count: number;
  transactions: TransactionRecord[];
}

export interface AddTransactionRequest {
  customer_id: number;
  invoice_no: string;
  invoice_date: string;
  quantity: number;
  unit_price: number;
  stock_code: string;
}

export interface AddTransactionResponse {
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
}

export interface CSVUploadResponse {
  transactions_added: number;
  customers_processed: number;
  segmentation_updated: number;
  churn_updated: number;
}

export const getAllTransactions = async (): Promise<TransactionsListResponse> => {
  const response = await apiClient.get<TransactionsListResponse>('/api/transactions/');
  return response.data;
};

export const getCustomerTransactions = async (customerId: number | string): Promise<CustomerTransactionsResponse> => {
  const response = await apiClient.get<CustomerTransactionsResponse>(`/api/transactions/${customerId}`);
  return response.data;
};

export const addTransaction = async (data: AddTransactionRequest): Promise<AddTransactionResponse> => {
  const response = await apiClient.post<AddTransactionResponse>('/api/transactions/', data);
  return response.data;
};

export const uploadTransactionsCSV = async (file: File): Promise<CSVUploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post<CSVUploadResponse>('/api/transactions/upload', formData);
  return response.data;
};
