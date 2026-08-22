import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCustomerRFMDetails, type RFMRecord } from '../api/customersApi';
import { getCustomerTransactions, type TransactionRecord } from '../api/transactionsApi';
import { SegmentBadge } from '../components/SegmentBadge';
import { RFMCard } from '../components/RFMCard';
import { LoadingState, ErrorState, EmptyState } from '../components/States';
import { ArrowLeft, ChevronLeft, ChevronRight, Calendar, Info } from 'lucide-react';

import { Header } from '../components/Header';

interface CustomerDetailsProps {
  onMenuToggle: () => void;
}

export const CustomerDetails: React.FC<CustomerDetailsProps> = ({ onMenuToggle }) => {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();

  const [rfmDetails, setRfmDetails] = useState<RFMRecord | null>(null);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination for transaction ledger
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchData = async () => {
    if (!customerId) return;
    setLoading(true);
    setError(null);

    try {
      const [rfmData, transData] = await Promise.all([
        getCustomerRFMDetails(customerId),
        getCustomerTransactions(customerId),
      ]);

      setRfmDetails(rfmData);
      setTransactions(transData.transactions || []);
    } catch (err: any) {
      console.error(err);
      if (err?.response?.status === 404) {
        setError(`Customer #${customerId} was not found.`);
      } else {
        setError('Unable to load customer details. Please check the network connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [customerId]);

  // Paginated transactions
  const totalTransactions = transactions.length;
  const totalPages = Math.ceil(totalTransactions / itemsPerPage) || 1;
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return transactions.slice(startIndex, startIndex + itemsPerPage);
  }, [transactions, currentPage]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalTransactions);

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <LoadingState rows={6} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 lg:p-8">
        <div className="mb-4">
          <button
            onClick={() => navigate('/customers')}
            className="flex items-center gap-1.5 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
          >
            <ArrowLeft size={16} />
            Back to Customers
          </button>
        </div>
        <ErrorState title="Error Loading Profile" message={error} onRetry={() => fetchData()} />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title={`Customer Details`}
        subtitle={`Detailed behavioral profile for account #${customerId}`}
        onMenuToggle={onMenuToggle}
      />
      <div className="p-6 lg:p-8 space-y-8 flex-1 overflow-y-auto animate-fadeIn text-left">
      {/* Back button and profile header */}
      <div className="space-y-4">
        <div>
          <button
            onClick={() => navigate('/customers')}
            className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
          >
            <ArrowLeft size={14} />
            Back to Customers
          </button>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[var(--border-color)] pb-5">
          <div className="flex flex-wrap items-center gap-3 text-left">
            <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Customer #{customerId}
            </h2>
            {rfmDetails && <SegmentBadge segment={rfmDetails.segment} />}
          </div>
          {rfmDetails && (
            <div className="text-xs text-[var(--text-secondary)] text-right">
              <span>Updated: {new Date(rfmDetails.updated_at || rfmDetails.created_at).toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* RFM Cards Overview */}
      {rfmDetails ? (
        <div className="space-y-4 text-left">
          <h3 className="text-base font-semibold text-[var(--text-primary)]">Behavior Metrics</h3>
          <RFMCard 
            recency={rfmDetails.recency} 
            frequency={rfmDetails.frequency} 
            monetary={rfmDetails.monetary} 
          />
        </div>
      ) : (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30 rounded-xl text-sm flex gap-2 text-left">
          <Info size={16} className="shrink-0 mt-0.5" />
          <span>No RFM scores computed for this customer profile yet. Submit a transaction to perform segmentation.</span>
        </div>
      )}

      {/* Transactions Table Section */}
      <div className="p-6 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
          <div className="text-left">
            <h3 className="text-base font-semibold text-[var(--text-primary)]">Transaction Ledger</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">Purchases recorded for this customer ID</p>
          </div>
          <span className="text-xs font-semibold text-[var(--text-secondary)] px-2.5 py-1 rounded-md bg-[var(--bg-primary)] border border-[var(--border-color)]">
            Total Transactions: {totalTransactions}
          </span>
        </div>

        {totalTransactions === 0 ? (
          <EmptyState message="No transactions found for this customer." />
        ) : (
          <>
            <div className="overflow-x-auto -mx-6 sm:mx-0">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border-color)] bg-[var(--bg-primary)]/40 text-[var(--text-secondary)] text-xs uppercase tracking-wider font-semibold">
                    <th className="py-3.5 px-6">Invoice No</th>
                    <th className="py-3.5 px-6">Invoice Date</th>
                    <th className="py-3.5 px-4 text-right">Quantity</th>
                    <th className="py-3.5 px-4 text-right">Unit Price</th>
                    <th className="py-3.5 px-6 text-right">Total Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)] text-sm text-[var(--text-primary)]">
                  {paginatedTransactions.map((tx) => {
                    const rowTotal = tx.quantity * tx.unit_price;
                    return (
                      <tr key={tx.id} className="hover:bg-[var(--bg-primary)]/30 transition-all">
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
                        <td className="py-3 px-6 text-right font-medium text-[var(--text-primary)]">
                          ${rowTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination controls for transactions */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border-color)] bg-[var(--bg-primary)]/20 mt-4">
                <div className="text-xs text-[var(--text-secondary)]">
                  Showing {startIndex + 1}-{endIndex} of {totalTransactions}
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
