import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCustomerDetails, type CustomerDetailsResponse } from '../api/customersApi';
import { SegmentBadge } from '../components/SegmentBadge';
import { RFMCard } from '../components/RFMCard';
import { LoadingState, ErrorState, EmptyState } from '../components/States';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { Header } from '../components/Header';

interface CustomerDetailsProps {
  onMenuToggle: () => void;
}

export const CustomerDetails: React.FC<CustomerDetailsProps> = ({ onMenuToggle }) => {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();

  const [details, setDetails] = useState<CustomerDetailsResponse | null>(null);
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
      const data = await getCustomerDetails(customerId);
      setDetails(data);
    } catch (err: any) {
      console.error(err);
      if (err?.response?.status === 404) {
        setError(`Customer #${customerId} was not found.`);
      } else {
        setError('Unable to load customer details. Please verify backend API accessibility.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [customerId]);

  const transactions = details?.transactions || [];
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

  if (error || !details) {
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
        <ErrorState title="Error Loading Profile" message={error || 'Profile could not be loaded.'} onRetry={() => fetchData()} />
      </div>
    );
  }

  const { rfm, segmentation, churn, behavior } = details;

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title={`Customer Details`}
        subtitle={`Detailed behavioral profile and machine learning classifications for account #${customerId}`}
        onMenuToggle={onMenuToggle}
      />
      
      <div className="p-6 lg:p-8 space-y-8 flex-1 overflow-y-auto animate-fadeIn text-left">
        {/* Back Link */}
        <div>
          <button
            onClick={() => navigate('/customers')}
            className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
          >
            <ArrowLeft size={14} />
            Back to Customers
          </button>
        </div>

        {/* Profile General Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Classification Details */}
          <div className="p-6 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-xs flex flex-col justify-between">
            <div className="space-y-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Machine Learning Segmentation</span>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                  Customer #{customerId}
                </h2>
                <SegmentBadge segment={segmentation.segment} />
              </div>
              <div className="text-sm text-[var(--text-secondary)]">
                Classification Cluster Assignment: <strong className="font-mono text-[var(--text-primary)]">Cluster {segmentation.cluster_id}</strong>
              </div>
            </div>
            <div className="mt-4 text-xs text-[var(--text-tertiary)] italic border-t border-[var(--border-color)] pt-3">
              Models are recalculated on transaction updates to maintain real-time accuracy.
            </div>
          </div>

          {/* Churn Assessment Details */}
          <div className={`p-6 rounded-xl border shadow-xs flex flex-col justify-between ${
            churn.prediction === 'Churn' 
              ? 'border-red-200 bg-red-50/15 dark:border-red-950/20 dark:bg-red-950/5' 
              : 'border-emerald-200 bg-emerald-50/15 dark:border-emerald-950/20 dark:bg-emerald-950/5'
          }`}>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Predictive Churn Risk Analysis</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                  churn.prediction === 'Churn'
                    ? 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-400'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400'
                }`}>
                  {churn.prediction}
                </span>
              </div>
              
              <div>
                <div className="flex justify-between items-end mb-1">
                  <span className="text-sm font-semibold text-[var(--text-secondary)]">Churn Probability</span>
                  <span className="text-lg font-bold font-mono text-[var(--text-primary)]">
                    {(churn.churn_probability * 100).toFixed(1)}%
                  </span>
                </div>
                {/* Meter Bar */}
                <div className="w-full bg-[var(--bg-primary)] rounded-full h-2 overflow-hidden border border-[var(--border-color)]">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      churn.prediction === 'Churn' ? 'bg-red-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${churn.churn_probability * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="mt-4 text-xs text-[var(--text-tertiary)] border-t border-[var(--border-color)]/50 pt-3">
              Customers above 50% probability threshold are marked as Churn Risk.
            </div>
          </div>
        </div>

        {/* RFM Score Cards */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-[var(--text-primary)]">Recalculated RFM Parameters</h3>
          <RFMCard
            recency={rfm.recency}
            frequency={rfm.frequency}
            monetary={rfm.monetary}
          />
        </div>

        {/* Behavior Metrics Grid */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-[var(--text-primary)]">Customer Behavior Analysis</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Average Order Value</span>
              <p className="text-lg font-bold text-[var(--text-primary)] mt-1.5">
                ${behavior.avg_order_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            
            <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Active Months</span>
              <p className="text-lg font-bold text-[var(--text-primary)] mt-1.5">{behavior.active_months} Months</p>
            </div>

            <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Average Gap Between Orders</span>
              <p className="text-lg font-bold text-[var(--text-primary)] mt-1.5">{behavior.avg_gap.toFixed(1)} Days</p>
            </div>

            <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Order Gap Standard Dev</span>
              <p className="text-lg font-bold text-[var(--text-primary)] mt-1.5">{behavior.gap_std.toFixed(1)} d</p>
            </div>

            <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Unique Products Ordered</span>
              <p className="text-lg font-bold text-[var(--text-primary)] mt-1.5">{behavior.unique_products}</p>
            </div>

            <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Account Lifetime Span</span>
              <p className="text-lg font-bold text-[var(--text-primary)] mt-1.5">{behavior.lifetime} Days</p>
            </div>

            <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-xs col-span-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Spend Trend (Second half - First half)</span>
              <p className={`text-lg font-bold mt-1.5 ${behavior.spend_trend >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {behavior.spend_trend >= 0 ? '+' : ''}${behavior.spend_trend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        {/* Transactions Ledger */}
        <div className="p-6 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-xs">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
            <div>
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
                      <th className="py-3.5 px-6">Stock Code</th>
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
                          <td className="py-3 px-6 text-xs font-mono text-[var(--text-secondary)]">
                            {tx.stock_code}
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
