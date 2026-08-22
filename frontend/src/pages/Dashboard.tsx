import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Crown, 
  TrendingUp, 
  AlertTriangle, 
  ArrowRight,
  Calendar,
  RefreshCw,
  DollarSign
} from 'lucide-react';
import { getDashboardData, type DashboardData } from '../api/dashboardApi';
import { getCustomersRFM, type RFMRecord } from '../api/customersApi';
import { StatCard } from '../components/StatCard';
import { SegmentChart } from '../components/SegmentChart';
import { SegmentBadge } from '../components/SegmentBadge';
import { LoadingState, ErrorState, EmptyState } from '../components/States';
import { Header } from '../components/Header';

interface DashboardProps {
  onApiStatusChange: (status: boolean) => void;
  onMenuToggle: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onApiStatusChange, onMenuToggle }) => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [rfmRecords, setRfmRecords] = useState<RFMRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const [dash, rfm] = await Promise.all([
        getDashboardData(),
        getCustomersRFM()
      ]);
      
      setDashboardData(dash);
      setRfmRecords(rfm.rfm || []);
      onApiStatusChange(true);
    } catch (err: any) {
      console.error(err);
      setError('Unable to connect to the API. Please check that the backend is running.');
      onApiStatusChange(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <LoadingState rows={6} />
      </div>
    );
  }

  if (error && !dashboardData) {
    return (
      <div className="p-6 lg:p-8">
        <ErrorState 
          title="Network Connection Error" 
          message={error} 
          onRetry={() => fetchData()} 
        />
      </div>
    );
  }

  // Calculate RFM Aggregates
  const totalRfmCount = rfmRecords.length;
  const avgRecency = totalRfmCount > 0 
    ? Math.round(rfmRecords.reduce((sum, r) => sum + (r.recency || 0), 0) / totalRfmCount)
    : 0;
  const avgFrequency = totalRfmCount > 0 
    ? Math.round((rfmRecords.reduce((sum, r) => sum + (r.frequency || 0), 0) / totalRfmCount) * 10) / 10
    : 0;
  const avgMonetary = totalRfmCount > 0 
    ? rfmRecords.reduce((sum, r) => sum + (r.monetary || 0), 0) / totalRfmCount
    : 0;

  // Segment totals
  const championsCount = dashboardData?.champions || 0;
  const potentialLoyalistsCount = (dashboardData?.loyal_customers || 0) + (dashboardData?.potential_customers || 0);
  const atRiskCount = dashboardData?.at_risk_customers || 0;
  const totalCount = dashboardData?.total_customers || 0;

  // Percentage calculations
  const calcPct = (val: number) => (totalCount > 0 ? (val / totalCount) * 100 : 0);

  const chartData = [
    { 
      name: 'Champions / VIP', 
      value: championsCount, 
      percentage: calcPct(championsCount), 
      color: '#10b981' // Emerald-500
    },
    { 
      name: 'Potential Loyalists', 
      value: potentialLoyalistsCount, 
      percentage: calcPct(potentialLoyalistsCount), 
      color: '#4f46e5' // Indigo-600
    },
    { 
      name: 'At-Risk / Hibernating', 
      value: atRiskCount, 
      percentage: calcPct(atRiskCount), 
      color: '#f59e0b' // Amber-500
    }
  ];

  // Recently updated RFM records
  const recentRecords = rfmRecords.slice(0, 5);

  const handleRefresh = () => {
    fetchData(true);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title="Customer Segmentation"
        subtitle="Monitor customer behavior, RFM segments, and segmentation predictions."
        onRefresh={handleRefresh}
        refreshing={refreshing}
        onMenuToggle={onMenuToggle}
      />
      <div className="p-6 lg:p-8 space-y-8 flex-1 overflow-y-auto animate-fadeIn text-left">

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Total Customers" 
          value={totalCount} 
          description="Aggregated count of segmented accounts" 
          icon={Users} 
          iconClassName="text-slate-600 bg-slate-100 dark:text-slate-400 dark:bg-slate-900/40"
        />
        <StatCard 
          label="Champions / VIP" 
          value={championsCount} 
          description={`${calcPct(championsCount).toFixed(1)}% of total customer base`} 
          icon={Crown} 
          iconClassName="text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/30"
        />
        <StatCard 
          label="Potential Loyalists" 
          value={potentialLoyalistsCount} 
          description={`${calcPct(potentialLoyalistsCount).toFixed(1)}% of total customer base`} 
          icon={TrendingUp} 
          iconClassName="text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-950/30"
        />
        <StatCard 
          label="At-Risk / Hibernating" 
          value={atRiskCount} 
          description={`${calcPct(atRiskCount).toFixed(1)}% of total customer base`} 
          icon={AlertTriangle} 
          iconClassName="text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/30"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Segment Distribution */}
        <div className="lg:col-span-2 p-6 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-semibold text-[var(--text-primary)]">Segment Distribution</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">Share of customer database split by clusters</p>
          </div>
          <SegmentChart data={chartData} />
        </div>

        {/* RFM Averages */}
        <div className="p-6 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-semibold text-[var(--text-primary)]">RFM Database Averages</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-medium">Aggregated behavior metrics</p>
          </div>
          <div className="space-y-4 my-6">
            <div className="flex items-center gap-3.5 p-3 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)]">
              <div className="p-2 bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-md">
                <Calendar size={18} />
              </div>
              <div className="text-left">
                <p className="text-xs text-[var(--text-secondary)] uppercase font-semibold tracking-wider">Avg Recency</p>
                <p className="text-lg font-bold text-[var(--text-primary)] mt-0.5">{avgRecency} Days</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)]">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-md">
                <RefreshCw size={18} />
              </div>
              <div className="text-left">
                <p className="text-xs text-[var(--text-secondary)] uppercase font-semibold tracking-wider">Avg Frequency</p>
                <p className="text-lg font-bold text-[var(--text-primary)] mt-0.5">{avgFrequency} Invoices</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)]">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-md">
                <DollarSign size={18} />
              </div>
              <div className="text-left">
                <p className="text-xs text-[var(--text-secondary)] uppercase font-semibold tracking-wider">Avg Monetary</p>
                <p className="text-lg font-bold text-[var(--text-primary)] mt-0.5">
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(avgMonetary)}
                </p>
              </div>
            </div>
          </div>
          <div className="text-xs text-[var(--text-tertiary)] italic">
            Calculated across {totalRfmCount} active profiles.
          </div>
        </div>
      </div>

      {/* Recent Insights Table */}
      <div className="p-6 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-xs">
        <div className="flex justify-between items-center mb-6">
          <div className="text-left">
            <h3 className="text-base font-semibold text-[var(--text-primary)]">Recent Customer Insights</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">Recently segmented or updated customer records</p>
          </div>
          <button
            onClick={() => navigate('/customers')}
            className="flex items-center gap-1.5 text-xs font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)] transition-all cursor-pointer"
          >
            All Customers
            <ArrowRight size={14} />
          </button>
        </div>

        {recentRecords.length === 0 ? (
          <EmptyState message="No customer segmentation data available yet." />
        ) : (
          <div className="overflow-x-auto -mx-6 sm:mx-0">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-color)] bg-[var(--bg-primary)]/40 text-[var(--text-secondary)] text-xs uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-6">Customer ID</th>
                  <th className="py-3.5 px-4 text-right">Recency</th>
                  <th className="py-3.5 px-4 text-right">Frequency</th>
                  <th className="py-3.5 px-4 text-right">Monetary</th>
                  <th className="py-3.5 px-6">Segment</th>
                  <th className="py-3.5 px-6 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)] text-sm text-[var(--text-primary)]">
                {recentRecords.map((row) => (
                  <tr key={row.customer_id} className="hover:bg-[var(--bg-primary)]/30 transition-all">
                    <td className="py-3 px-6 font-semibold font-mono text-[var(--text-primary)]">
                      #{row.customer_id}
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
                    <td className="py-3 px-6">
                      <SegmentBadge segment={row.segment} />
                    </td>
                    <td className="py-3 px-6 text-center">
                      <button
                        onClick={() => navigate(`/customer/${row.customer_id}`)}
                        className="px-3 py-1 rounded-md border border-[var(--border-color)] hover:border-[var(--accent)] hover:text-[var(--accent)] text-xs font-semibold text-[var(--text-secondary)] bg-[var(--bg-secondary)] transition-all cursor-pointer"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  </div>
);
};
