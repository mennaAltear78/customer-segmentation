import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, DollarSign, Receipt, TrendingUp,
  Sparkles, ShieldAlert, BarChart2, Target,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { getDashboardData, type DashboardData } from '../api/dashboardApi';
import { LoadingState, ErrorState, EmptyState } from '../components/States';
import { Header } from '../components/Header';

interface DashboardProps {
  onApiStatusChange: (status: boolean) => void;
  onMenuToggle: () => void;
}

/* ─── Theme-aware helpers ────────────────────────────────────── */
function useDarkMode() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  useEffect(() => {
    const obs = new MutationObserver(() =>
      setDark(document.documentElement.classList.contains('dark'))
    );
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

/* ─── KPI Card ───────────────────────────────────────────────── */
interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  lightIconBg: string;   // e.g. 'bg-cyan-100'
  lightIconText: string; // e.g. 'text-cyan-600'
  darkGlowColor: string; // rgba hex for glow blob
  darkAccentBg: string;  // e.g. 'dark:bg-cyan-500/20'
}
const KpiCard: React.FC<KpiCardProps> = ({ label, value, sub, icon, lightIconBg, lightIconText, darkGlowColor, darkAccentBg }) => (
  <div className="
    relative overflow-hidden rounded-2xl p-5 flex flex-col gap-3 transition-all duration-300 hover:-translate-y-1
    border border-slate-200 bg-white shadow-sm hover:shadow-md
    dark:border-white/10 dark:bg-[#101827] dark:shadow-none
  "
    style={{ ['--glow' as any]: darkGlowColor }}
  >
    {/* Dark mode glow blob */}
    <div
      className="absolute -top-4 -right-4 w-20 h-20 rounded-full blur-2xl opacity-0 dark:opacity-25 pointer-events-none transition-opacity"
      style={{ background: darkGlowColor }}
    />
    {/* Dark mode glass bg */}
    <div className="absolute inset-0 rounded-2xl opacity-0 dark:opacity-100 pointer-events-none"
      style={{ background: 'rgba(255,255,255,0.04)' }} />

    <div className="relative flex items-center justify-between">
      <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 dark:text-white/40">
        {label}
      </span>
      <div className={`p-2 rounded-xl ${lightIconBg} ${lightIconText} ${darkAccentBg} dark:text-current`}>
        {icon}
      </div>
    </div>
    <div className="relative">
      <span className="text-3xl font-black leading-none text-slate-800 dark:text-white">{value}</span>
      {sub && <p className="text-[11px] text-slate-400 dark:text-white/40 mt-1">{sub}</p>}
    </div>
  </div>
);

/* ─── Section title ──────────────────────────────────────────── */
const SectionTitle: React.FC<{ title: string; sub?: string; action?: React.ReactNode }> = ({ title, sub, action }) => (
  <div className="flex items-end justify-between mb-4">
    <div>
      <h3 className="text-sm font-bold uppercase tracking-widest text-slate-700 dark:text-white/80">{title}</h3>
      {sub && <p className="text-[11px] text-slate-400 dark:text-white/35 mt-0.5">{sub}</p>}
    </div>
    {action}
  </div>
);

/* ─── Glass / card panel ─────────────────────────────────────── */
const Panel: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div
    className={`relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors dark:border-white/10 dark:bg-[#101827] dark:shadow-[0_8px_32px_rgba(0,0,0,0.22)] ${className}`}
  >
    <div className="relative z-10">{children}</div>
  </div>
);

/* ─── Adaptive Recharts tooltip ──────────────────────────────── */
const ChartTooltip = ({ active, payload, label, dark }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl border px-3 py-2 text-xs backdrop-blur-md shadow-lg"
      style={{
        background: dark ? 'rgba(7,11,20,0.92)' : 'rgba(255,255,255,0.97)',
        borderColor: dark ? 'rgba(255,255,255,0.1)' : '#e2e8f0',
      }}
    >
      <p className="mb-1 font-semibold" style={{ color: dark ? 'rgba(255,255,255,0.45)' : '#64748b' }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-bold">
          {p.name}: {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
        </p>
      ))}
    </div>
  );
};

/* ─── Segment colors ─────────────────────────────────────────── */
const SEGMENT_COLORS: Record<string, string> = {
  'Champions / VIP': '#10b981',
  'Potential Loyalists': '#6366f1',
  'At-Risk / Hibernating': '#f59e0b',
};
const getSegColor = (name: string, idx: number) => {
  if (SEGMENT_COLORS[name]) return SEGMENT_COLORS[name];
  return ['#22d3ee', '#a78bfa', '#fb7185', '#34d399', '#fbbf24'][idx % 5];
};

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
export const Dashboard: React.FC<DashboardProps> = ({ onApiStatusChange, onMenuToggle }) => {
  const navigate = useNavigate();
  const isDark = useDarkMode();

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const data = await getDashboardData();
      setDashboardData(data);
      onApiStatusChange(true);
    } catch (err: any) {
      console.error(err);
      setError('Unable to connect to the API. Please verify backend API accessibility.');
      onApiStatusChange(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Chart axis & grid colors adapt to theme
  const axisColor = isDark ? 'rgba(255,255,255,0.28)' : '#94a3b8';

  if (loading) return <div className="p-6 lg:p-8 min-h-screen bg-slate-50 dark:bg-[#070b14]"><LoadingState rows={6} /></div>;
  if (error || !dashboardData) {
    return (
      <div className="p-6 lg:p-8 min-h-screen bg-slate-50 dark:bg-[#070b14]">
        <ErrorState title="Network Connection Error" message={error || 'Unable to connect.'} onRetry={() => fetchData()} />
      </div>
    );
  }

  // Extract nested properties with robust default fallbacks supporting both flat and nested shapes
  const segmentation = (dashboardData as any).segmentation || {};
  const churn = (dashboardData as any).churn || {};
  const transactions = (dashboardData as any).transactions || {};

  const total_customers = segmentation.total_customers 
    ?? (dashboardData as any).total_customers 
    ?? 0;

  const total_transactions = transactions.total_transactions 
    ?? (dashboardData as any).total_transactions 
    ?? 0;

  const total_revenue = transactions.total_revenue 
    ?? (dashboardData as any).total_revenue 
    ?? 0;

  const churn_rate = churn.average_churn_probability 
    ?? (dashboardData as any).churn_rate 
    ?? 0;

  const champions = segmentation.champions 
    ?? (dashboardData as any).segments?.['Champions / VIP'] 
    ?? 0;

  const potential_loyalists = segmentation.potential_loyalists 
    ?? (dashboardData as any).segments?.['Potential Loyalists'] 
    ?? 0;

  const at_risk_customers = segmentation.at_risk_customers 
    ?? (dashboardData as any).segments?.['At-Risk / Hibernating'] 
    ?? 0;

  const churned_customers = churn.churned_customers 
    ?? churn.churn 
    ?? 0;

  const not_churned_customers = churn.not_churned_customers 
    ?? churn.not_churn 
    ?? 0;

  // const total_predictions = churn.total_predictions 
  //   ?? (churned_customers + not_churned_customers) 
  //   ?? 0;

  const avgOrderValue = transactions.average_transaction_value 
    ?? ((dashboardData as any).average_transaction_value 
    ?? (total_transactions > 0 ? total_revenue / total_transactions : 0));

  // Build segments mapping dictionary
  const segments = {
    'Champions / VIP': champions,
    'Potential Loyalists': potential_loyalists,
    'At-Risk / Hibernating': at_risk_customers,
  };

  const segmentEntries = Object.entries(segments).map(([name, value], idx) => ({
    name, value: value as number,
    pct: total_customers > 0 ? ((value as number) / total_customers) * 100 : 0,
    color: getSegColor(name, idx),
  }));

  const churnPct = total_customers > 0 ? Math.round((churned_customers / total_customers) * 100) : 0;
  const churnPieData = [
    { name: 'Churn Risk', value: churned_customers, fill: '#f43f5e' },
    { name: 'Stable', value: not_churned_customers, fill: '#10b981' },
  ];

  const riskLabel = churnPct > 50 ? 'HIGH' : churnPct > 25 ? 'MEDIUM' : 'LOW';
  const riskBarColor = churnPct > 50
    ? 'linear-gradient(90deg,#f43f5e,#fb7185)'
    : churnPct > 25 ? 'linear-gradient(90deg,#f59e0b,#fbbf24)'
    : 'linear-gradient(90deg,#10b981,#34d399)';
  const riskTextClass = churnPct > 50 ? 'text-rose-500 dark:text-rose-400' : churnPct > 25 ? 'text-amber-500 dark:text-amber-400' : 'text-emerald-500 dark:text-emerald-400';

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-[#070b14]">
      <Header
        title="Customer Analytics"
        subtitle="Real-time segmentation, churn forecasting, and revenue intelligence."
        onRefresh={() => fetchData(true)}
        refreshing={refreshing}
        onMenuToggle={onMenuToggle}
      />

      <div className="flex-1 space-y-8 overflow-y-auto bg-slate-50 p-6 transition-colors dark:bg-[#070b14] lg:p-8">

        {/* ── ROW 1: KPI Strip (6 cards) ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <KpiCard label="Total Customers" value={total_customers.toLocaleString()} sub="Active accounts"
            icon={<Users size={16} />} lightIconBg="bg-cyan-100" lightIconText="text-cyan-600"
            darkGlowColor="#22d3ee" darkAccentBg="dark:bg-cyan-500/20 dark:text-cyan-400" />
          <KpiCard label="Transactions" value={total_transactions.toLocaleString()} sub="Ledger entries"
            icon={<Receipt size={16} />} lightIconBg="bg-violet-100" lightIconText="text-violet-600"
            darkGlowColor="#8b5cf6" darkAccentBg="dark:bg-violet-500/20 dark:text-violet-400" />
          <KpiCard label="Total Revenue" value={`£${(total_revenue / 1000).toFixed(0)}k`} sub={`£${total_revenue.toLocaleString()}`}
            icon={<DollarSign size={16} />} lightIconBg="bg-emerald-100" lightIconText="text-emerald-600"
            darkGlowColor="#10b981" darkAccentBg="dark:bg-emerald-500/20 dark:text-emerald-400" />
          <KpiCard label="Avg Order Value" value={`£${avgOrderValue.toFixed(0)}`} sub="Per transaction"
            icon={<TrendingUp size={16} />} lightIconBg="bg-amber-100" lightIconText="text-amber-600"
            darkGlowColor="#f59e0b" darkAccentBg="dark:bg-amber-500/20 dark:text-amber-400" />
          <KpiCard label="Churn Rate" value={`${(churn_rate * 100).toFixed(1)}%`} sub="High-risk share"
            icon={<ShieldAlert size={16} />} lightIconBg="bg-rose-100" lightIconText="text-rose-600"
            darkGlowColor="#f43f5e" darkAccentBg="dark:bg-rose-500/20 dark:text-rose-400" />
          <KpiCard label="At-Risk Count" value={(churn.churned_customers || 0).toLocaleString()} sub={`of ${total_customers} customers`}
            icon={<AlertTriangle size={16} />} lightIconBg="bg-orange-100" lightIconText="text-orange-600"
            darkGlowColor="#f97316" darkAccentBg="dark:bg-orange-500/20 dark:text-orange-400" />
        </div>

        {/* ── ROW 2: Segmentation + Churn Donut ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Segment Distribution */}
          <Panel className="lg:col-span-8">
            <SectionTitle
              title="Customer Segmentation"
              sub="ML clustering — K-Means segment distribution across all profiles"
              action={
                <button onClick={() => navigate('/customers')}
                  className="flex items-center gap-1 text-xs font-semibold text-indigo-500 hover:text-indigo-400 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">
                  View All <ArrowRight size={12} />
                </button>
              }
            />
            {/* Progress bars */}
            <div className="space-y-4 mt-2">
              {segmentEntries.length === 0 ? <EmptyState message="No segment data yet." /> :
                segmentEntries.map((seg, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between items-center mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: seg.color }} />
                        <span className="text-xs font-semibold text-slate-700 dark:text-white/80">{seg.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400 dark:text-white/40">{seg.value.toLocaleString()} customers</span>
                        <span className="text-xs font-black w-12 text-right" style={{ color: seg.color }}>{seg.pct.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${seg.pct}%`, background: `linear-gradient(90deg, ${seg.color}90, ${seg.color})` }} />
                    </div>
                  </div>
                ))}
            </div>

            {/* Mini bar chart */}
            {segmentEntries.length > 0 && (
              <div className="mt-6 h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={segmentEntries} barCategoryGap="30%">
                    <XAxis dataKey="name" tick={{ fill: axisColor, fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip content={<ChartTooltip dark={isDark} />} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} name="Customers">
                      {segmentEntries.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Panel>

          {/* Churn Donut */}
          <Panel className="lg:col-span-4 relative flex flex-col">
            <SectionTitle title="Churn Overview" sub="Predictive risk distribution" />

            <div className="relative flex items-center justify-center my-2" style={{ minHeight: 180 }}>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={churnPieData} cx="50%" cy="50%"
                    innerRadius={58} outerRadius={78} paddingAngle={4}
                    dataKey="value" strokeWidth={0}>
                    {churnPieData.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip dark={isDark} />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-black leading-none text-slate-800 dark:text-white">{churnPct}%</span>
                <span className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-white/40 mt-1">Churn Risk</span>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-3 mt-auto">
              {churnPieData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: item.fill }} />
                    <span className="text-xs text-slate-600 dark:text-white/60">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-white">{item.value.toLocaleString()}</span>
                    <span className="text-[10px] text-slate-400 dark:text-white/35 w-10 text-right">
                      {total_customers > 0 ? ((item.value / total_customers) * 100).toFixed(0) : 0}%
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Risk meter */}
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/8">
              <div className="flex justify-between text-[10px] mb-1.5">
                <span className="text-slate-400 dark:text-white/40">Risk Level</span>
                <span className={`font-bold ${riskTextClass}`}>{riskLabel}</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 dark:bg-white/8 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${churnPct}%`, background: riskBarColor }} />
              </div>
            </div>
          </Panel>
        </div>

        {/* ── ROW 3: Breakdown + Summary ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Segment Value Breakdown */}
          <Panel>
            <SectionTitle title="Segment Value Breakdown" sub="Customer share per ML cluster" />
            <div className="space-y-3">
              {segmentEntries.length === 0 ? <EmptyState message="No segment data." /> :
                segmentEntries.map((seg, idx) => (
                  <div key={idx}
                    className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 dark:border-white/5 dark:hover:bg-white/5 transition-all">
                    <div className="w-3 h-10 rounded-full flex-shrink-0" style={{ background: seg.color }} />
                    <div className="flex-1">
                      <div className="text-xs font-bold text-slate-700 dark:text-white/80 mb-1">{seg.name}</div>
                      <div className="text-[10px] text-slate-400 dark:text-white/35">
                        {seg.value.toLocaleString()} customers · {seg.pct.toFixed(1)}% of base
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black" style={{ color: seg.color }}>{seg.pct.toFixed(0)}%</div>
                      <div className="text-[10px] text-slate-400 dark:text-white/35">share</div>
                    </div>
                  </div>
                ))}
            </div>
          </Panel>

          {/* Performance Summary Grid */}
          <Panel>
            <SectionTitle title="Performance Summary" sub="Key business health indicators" />
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Avg Rev / Customer', value: `£${total_customers > 0 ? (total_revenue / total_customers).toFixed(0) : 0}`, icon: <DollarSign size={14} />, color: '#10b981' },
                { label: 'Avg Txns / Customer', value: total_customers > 0 ? (total_transactions / total_customers).toFixed(1) : 0, icon: <BarChart2 size={14} />, color: '#818cf8' },
                { label: 'Customer Retention', value: `${(100 - churn_rate * 100).toFixed(1)}%`, icon: <Target size={14} />, color: '#34d399' },
                // { label: 'Stable Customers', value: churn?.not_churned_customers.toLocaleString(), icon: <Zap size={14} />, color: '#f59e0b' },
                // { label: 'Total Predictions', value: churn.total_predictions.toLocaleString(), icon: <Activity size={14} />, color: '#22d3ee' },
                { label: 'Unique Segments', value: segmentEntries.length, icon: <Sparkles size={14} />, color: '#f472b6' },
              ].map((item, idx) => (
                <div key={idx}
                  className="p-3 rounded-xl border border-slate-100 bg-slate-50 dark:border-white/6 flex flex-col gap-2 dark:bg-white/[0.025]">
                  <div className="flex items-center gap-2">
                    <span style={{ color: item.color }}>{item.icon}</span>
                    <span className="text-[10px] text-slate-400 dark:text-white/35 uppercase tracking-wider">{item.label}</span>
                  </div>
                  <span className="text-lg font-black leading-none text-slate-800 dark:text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>

      </div>
    </div>
  );
};
