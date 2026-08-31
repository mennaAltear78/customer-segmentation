import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getCustomers,
  type CustomerRFMRecord
} from '../api/customersApi';
import { SegmentBadge } from '../components/SegmentBadge';
import { SearchInput, FilterDropdown } from '../components/SearchAndFilter';
import { LoadingState, ErrorState, EmptyState } from '../components/States';
import { ChevronLeft, ChevronRight} from 'lucide-react';

import { Header } from '../components/Header';

interface CustomersProps {
  onMenuToggle: () => void;
}

export const Customers: React.FC<CustomersProps> = ({ onMenuToggle }) => {
  const navigate = useNavigate();
  const [records, setRecords] = useState<CustomerRFMRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter and sort states
  const [searchId, setSearchId] = useState('');
  const [selectedSegment, setSelectedSegment] = useState('ALL');
  const [sortBy, setSortBy] = useState('updated_at_desc');
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
      const data = await getCustomers();
      setRecords(data.customers || []);
    } catch (err: any) {
      console.error(err);
      setError('Unable to load customer segmentation data. Please check that the API is online.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Reset pagination when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchId, selectedSegment, sortBy]);

  // List of unique segments for the dropdown list
  const segmentOptions = useMemo(() => {
    const segments = new Set<string>();
    records.forEach(r => {
      if (r.segment) segments.add(r.segment);
    });
    return [
      { value: 'ALL', label: 'All Segments' },
      ...Array.from(segments).map(seg => ({ value: seg, label: seg }))
    ];
  }, [records]);

  // Sorting Options
  const sortOptions = [
    { value: 'updated_at_desc', label: 'Recently Updated' },
    { value: 'recency_asc', label: 'Recency: Low to High' },
    { value: 'recency_desc', label: 'Recency: High to Low' },
    { value: 'frequency_desc', label: 'Frequency: High to Low' },
    { value: 'frequency_asc', label: 'Frequency: Low to High' },
    { value: 'monetary_desc', label: 'Monetary: High to Low' },
    { value: 'monetary_asc', label: 'Monetary: Low to High' },
  ];

  // Processed Records (Filtered, Sorted, Paginated)
  const processedRecords = useMemo(() => {
    let result = [...records];

    // 1. Search by Customer ID
    if (searchId.trim()) {
      const q = searchId.trim().toLowerCase();
      result = result.filter(r => r.customer_id.toString().includes(q));
    }

    // 2. Filter by Segment
    if (selectedSegment !== 'ALL') {
      result = result.filter(r => r.segment === selectedSegment);
    }

    // 3. Sort
    result.sort((a, b) => {
      if (sortBy === 'updated_at_desc') {
        const dateA = new Date(a.updated_at || a.created_at).getTime();
        const dateB = new Date(b.updated_at || b.created_at).getTime();
        return dateB - dateA;
      }
      if (sortBy === 'recency_asc') return a.recency - b.recency;
      if (sortBy === 'recency_desc') return b.recency - a.recency;
      if (sortBy === 'frequency_desc') return b.frequency - a.frequency;
      if (sortBy === 'frequency_asc') return a.frequency - b.frequency;
      if (sortBy === 'monetary_desc') return b.monetary - a.monetary;
      if (sortBy === 'monetary_asc') return a.monetary - b.monetary;
      return 0;
    });

    return result;
  }, [records, searchId, selectedSegment, sortBy]);

  // Pagination calculation
  const totalItems = processedRecords.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return processedRecords.slice(startIndex, startIndex + itemsPerPage);
  }, [processedRecords, currentPage]);

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
        title="Customers & RFM"
        subtitle="Browse calculated Recency, Frequency, and Monetary scores mapped to machine learning clusters."
        onRefresh={() => fetchData(true)}
        refreshing={refreshing}
        onMenuToggle={onMenuToggle}
      />
      <div className="p-6 lg:p-8 space-y-6 flex-1 overflow-y-auto animate-fadeIn text-left">

      {/* Toolbar / Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 bg-[var(--bg-secondary)] p-4 rounded-xl border border-[var(--border-color)] shadow-3xs">
        <SearchInput
          value={searchId}
          onChangeValue={setSearchId}
          placeholder="Search by Customer ID..."
        />
        <div className="flex flex-wrap items-center gap-4">
          <FilterDropdown
            label="Segment"
            options={segmentOptions}
            value={selectedSegment}
            onChangeValue={setSelectedSegment}
          />
          <FilterDropdown
            label="Sort"
            options={sortOptions}
            value={sortBy}
            onChangeValue={setSortBy}
          />
        </div>
      </div>

      {/* Counter */}
      <div className="text-left text-xs font-semibold text-[var(--text-secondary)] px-1">
        {totalItems > 0 ? (
          <span>Showing {startIndex + 1}-{endIndex} of {totalItems} customers</span>
        ) : (
          <span>Showing 0 of 0 customers</span>
        )}
      </div>

      {/* Data Table */}
      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-sm overflow-hidden">
        {paginatedRecords.length === 0 ? (
          <div className="py-12">
            <EmptyState message="No customer segmentation data matches your query." />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border-color)] bg-[var(--bg-primary)]/40 text-[var(--text-secondary)] text-xs uppercase tracking-wider font-semibold">
                    <th className="py-3.5 px-6">Customer ID</th>
                    <th className="py-3.5 px-6">Segment</th>
                    <th className="py-3.5 px-4 text-center">Churn Risk</th>
                    <th className="py-3.5 px-4 text-right">Probability</th>
                    <th className="py-3.5 px-4 text-right">Recency</th>
                    <th className="py-3.5 px-4 text-right">Frequency</th>
                    <th className="py-3.5 px-4 text-right">Monetary</th>
                    <th className="py-3.5 px-6 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)] text-sm text-[var(--text-primary)]">
                  {paginatedRecords.map((row) => (
                    <tr key={row.customer_id} className="hover:bg-[var(--bg-primary)]/30 transition-all">
                      <td className="py-3 px-6 font-semibold font-mono text-[var(--text-primary)]">
                        #{row.customer_id}
                      </td>
                      <td className="py-3 px-6">
                        <SegmentBadge segment={row.segment} />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          row.prediction === 'Churn' 
                            ? 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400' 
                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                        }`}>
                          {row.prediction}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-medium text-[var(--text-secondary)]">
                        {(row.churn_probability * 100).toFixed(0)}%
                      </td>
                      <td className="py-3 px-4 text-right text-[var(--text-secondary)]">
                        {row.recency} d
                      </td>
                      <td className="py-3 px-4 text-right text-[var(--text-secondary)]">
                        {row.frequency}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-[var(--text-secondary)]">
                        ${row.monetary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-6 text-center">
                        <button
                          onClick={() => navigate(`/customer/${row.customer_id}`)}
                          className="px-3.5 py-1.5 rounded-md border border-[var(--border-color)] hover:border-[var(--accent)] hover:text-[var(--accent)] text-xs font-semibold text-[var(--text-secondary)] bg-[var(--bg-secondary)] transition-all cursor-pointer"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
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
