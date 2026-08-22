import { apiClient } from './client';

export interface TransactionRecord {
  id: number;
  customer_id: number;
  invoice_no: string;
  invoice_date: string;
  quantity: number;
  unit_price: number;
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

export const getAllTransactions = async (): Promise<TransactionsListResponse> => {
  const response = await apiClient.get<TransactionsListResponse>('/transactions');
  return response.data;
};

export const getCustomerTransactions = async (customerId: number | string): Promise<CustomerTransactionsResponse> => {
  const response = await apiClient.get<CustomerTransactionsResponse>(`/transactions/${customerId}`);
  return response.data;
};
