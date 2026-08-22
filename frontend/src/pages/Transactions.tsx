import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllTransactions, type TransactionRecord } from '../api/transactionsApi';
import { SearchInput, FilterDropdown } from '../components/SearchAndFilter';
import { LoadingState, ErrorState, EmptyState } from '../components/States';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Header } from '../components/Header';

interface TransactionsProps {
  onMenuToggle: () => void;
}

export const Transactions: React.FC<TransactionsProps> = ({ onMenuToggle }) => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters and sorting
  const [searchCustomerId, setSearchCustomerId] = useState('');
  const [searchInvoiceNo, setSearchInvoiceNo] = useState('');
  const [dateSort, setDateSort] = useState('desc'); // 'desc' | 'asc'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await getAllTransactions();
      setTransactions(data.transactions || []);
    } catch (err: any) {
      console.error(err);
      setError('Unable to load transaction records. Please verify backend API accessibility.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchCustomerId, searchInvoiceNo, dateSort]);

  // Processed Transactions
  const processedTransactions = useMemo(() => {
    let result = [...transactions];

    // 1. Search by Customer ID
    if (searchCustomerId.trim()) {
      const q = searchCustomerId.trim().toLowerCase();
      result = result.filter(tx => tx.customer_id.toString().includes(q));
    }

    // 2. Search by Invoice No
    if (searchInvoiceNo.trim()) {
      const q = searchInvoiceNo.trim().toLowerCase();
      result = result.filter(tx => tx.invoice_no.toLowerCase().includes(q));
    }

    // 3. Sort by Invoice Date
    result.sort((a, b) => {
      const timeA = new Date(a.invoice_date).getTime();
      const timeB = new Date(b.invoice_date).getTime();
      return dateSort === 'desc' ? timeB - timeA : timeA - timeB;
    });

    return result;
  }, [transactions, searchCustomerId, searchInvoiceNo, dateSort]);

  // Pagination calculations
  const totalItems = processedTransactions.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return processedTransactions.slice(startIndex, startIndex + itemsPerPage);
  }, [processedTransactions, currentPage]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <LoadingState rows={8} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 lg:p-8">
        <ErrorState title="API Connection Error" message={error} onRetry={() => fetchData()} />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title="Transactions Ledger"
        subtitle="Browse and query invoice transaction records returned by the backend."
        onRefresh={() => fetchData(true)}
        refreshing={refreshing}
        onMenuToggle={onMenuToggle}
      />
      <div className="p-6 lg:p-8 space-y-6 flex-1 overflow-y-auto animate-fadeIn text-left">

      {/* Toolbar / Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 bg-[var(--bg-secondary)] p-4 rounded-xl border border-[var(--border-color)] shadow-3xs">
        <div className="flex-1 flex flex-col sm:flex-row gap-4">
          <SearchInput
            value={searchCustomerId}
            onChangeValue={setSearchCustomerId}
            placeholder="Search Customer ID..."
          />
          <SearchInput
            value={searchInvoiceNo}
            onChangeValue={setSearchInvoiceNo}
            placeholder="Search Invoice No..."
          />
        </div>
        <div>
          <FilterDropdown
            label="Date Sort"
            options={[
              { value: 'desc', label: 'Newest First' },
              { value: 'asc', label: 'Oldest First' },
            ]}
            value={dateSort}
            onChangeValue={setDateSort}
          />
        </div>
      </div>

      {/* Counter */}
      <div className="text-left text-xs font-semibold text-[var(--text-secondary)] px-1">
        {totalItems > 0 ? (
          <span>Showing {startIndex + 1}-{endIndex} of {totalItems} transactions</span>
        ) : (
          <span>Showing 0 of 0 transactions</span>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-sm overflow-hidden">
        {paginatedTransactions.length === 0 ? (
          <div className="py-12">
            <EmptyState message="No transactions match your query criteria." />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border-color)] bg-[var(--bg-primary)]/40 text-[var(--text-secondary)] text-xs uppercase tracking-wider font-semibold">
                    <th className="py-3.5 px-6">Customer ID</th>
                    <th className="py-3.5 px-6">Invoice No</th>
                    <th className="py-3.5 px-6">Invoice Date</th>
                    <th className="py-3.5 px-4 text-right">Quantity</th>
                    <th className="py-3.5 px-4 text-right">Unit Price</th>
                    <th className="py-3.5 px-6 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)] text-sm text-[var(--text-primary)]">
                  {paginatedTransactions.map((tx) => {
                    const rowTotal = tx.quantity * tx.unit_price;
                    return (
                      <tr key={tx.id} className="hover:bg-[var(--bg-primary)]/30 transition-all">
                        <td className="py-3 px-6">
                          <button
                            onClick={() => navigate(`/customer/${tx.customer_id}`)}
                            className="font-semibold font-mono text-[var(--accent)] hover:text-[var(--accent-hover)] transition-all cursor-pointer underline decoration-dotted"
                          >
                            #{tx.customer_id}
                          </button>
                        </td>
                        <td className="py-3 px-6 font-semibold font-mono text-[var(--text-primary)]">
                          {tx.invoice_no}
                        </td>
                        <td className="py-3 px-6 text-xs text-[var(--text-secondary)]">
                          {new Date(tx.invoice_date).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right text-[var(--text-secondary)]">
                          {tx.quantity}
                        </td>
                        <td className="py-3 px-4 text-right text-[var(--text-secondary)]">
                          ${tx.unit_price.toFixed(2)}
                        </td>
                        <td className="py-3 px-6 text-right font-semibold text-[var(--text-primary)]">
                          ${rowTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border-color)] bg-[var(--bg-primary)]/20">
                <div className="text-xs text-[var(--text-secondary)]">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-md border border-[var(--border-color)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] text-[var(--text-secondary)] disabled:opacity-50 transition-all cursor-pointer"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-md border border-[var(--border-color)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] text-[var(--text-secondary)] disabled:opacity-50 transition-all cursor-pointer"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  </div>
);
};
