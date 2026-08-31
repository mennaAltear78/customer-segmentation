import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, DollarSign, Receipt, TrendingUp, AlertTriangle,
  ArrowRight, Sparkles, Activity, ShieldAlert, BarChart2, Zap, Target,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
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
  <div className={`
    relative overflow-hidden rounded-2xl p-5 flex flex-col gap-3 transition-all duration-300 hover:-translate-y-1
    border border-slate-200 bg-white shadow-sm hover:shadow-md
    dark:border-white/10 dark:shadow-none
  `}
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
    className={`relative rounded-2xl border border-slate-200 bg-white shadow-sm p-5 dark:border-white/8 dark:shadow-none ${className}`}
  >
    {/* Dark glass overlay */}
    <div className="absolute inset-0 rounded-2xl opacity-0 dark:opacity-100 pointer-events-none"
      style={{ background: 'rgba(255,255,255,0.04)', boxShadow: '0 8px 32px rgba(0,0,0,0.35)' }} />
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
  const gridColor = isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9';

  if (loading) return <div className="p-6 lg:p-8 min-h-screen bg-slate-50 dark:bg-[#070b14]"><LoadingState rows={6} /></div>;
  if (error || !dashboardData) {
    return (
      <div className="p-6 lg:p-8 min-h-screen bg-slate-50 dark:bg-[#070b14]">
        <ErrorState title="Network Connection Error" message={error || 'Unable to connect.'} onRetry={() => fetchData()} />
      </div>
    );
  }

  const {
    total_customers = 0,
    total_transactions = 0,
    total_revenue = 0,
    churn_rate = 0,
    segments = {},
    churn = { churn: 0, not_churn: 0 },
    revenue_over_time = [],
    top_customers = [],
    customers_at_risk = [],
    recent_transactions = [],
  } = dashboardData || {};

  const segmentEntries = Object.entries(segments).map(([name, value], idx) => ({
    name, value: value as number,
    pct: total_customers > 0 ? ((value as number) / total_customers) * 100 : 0,
    color: getSegColor(name, idx),
  }));

  const churnPct = total_customers > 0 ? Math.round((churn.churn / total_customers) * 100) : 0;
  const churnPieData = [
    { name: 'Churn Risk', value: churn.churn, fill: '#f43f5e' },
    { name: 'Stable', value: churn.not_churn, fill: '#10b981' },
  ];
  const avgOrderValue = total_transactions > 0 ? total_revenue / total_transactions : 0;

  const riskLabel = churnPct > 50 ? 'HIGH' : churnPct > 25 ? 'MEDIUM' : 'LOW';
  const riskBarColor = churnPct > 50
    ? 'linear-gradient(90deg,#f43f5e,#fb7185)'
    : churnPct > 25 ? 'linear-gradient(90deg,#f59e0b,#fbbf24)'
    : 'linear-gradient(90deg,#10b981,#34d399)';
  const riskTextClass = churnPct > 50 ? 'text-rose-500 dark:text-rose-400' : churnPct > 25 ? 'text-amber-500 dark:text-amber-400' : 'text-emerald-500 dark:text-emerald-400';

  // const makeTooltip = () => <ChartTooltip dark={isDark} />;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-[#070b14]">
      <Header
        title="Customer Analytics"
        subtitle="Real-time segmentation, churn forecasting, and revenue intelligence."
        onRefresh={() => fetchData(true)}
        refreshing={refreshing}
        onMenuToggle={onMenuToggle}
      />

      <div className="p-6 lg:p-8 space-y-8 flex-1 overflow-y-auto">

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
          <KpiCard label="At-Risk Count" value={churn.churn.toLocaleString()} sub={`of ${total_customers} customers`}
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
                    <div className="h-2 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
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

        {/* ── ROW 3: Timeseries Charts ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <Panel>
            <SectionTitle title="Revenue Over Time" sub="Monthly aggregated ledger revenue (£)" />
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenue_over_time} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={isDark ? 0.25 : 0.15} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="month" tick={{ fill: axisColor, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: axisColor, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip dark={isDark} />} />
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2.5}
                    fill="url(#revenueGrad)" name="Revenue (£)" dot={false}
                    activeDot={{ r: 5, fill: '#10b981', stroke: isDark ? '#070b14' : '#fff', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel>
            <SectionTitle title="Transaction Volume" sub="Monthly order count by ledger period" />
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenue_over_time} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="txGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#818cf8" stopOpacity={1} />
                      <stop offset="100%" stopColor="#4f46e5" stopOpacity={isDark ? 0.7 : 0.5} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="month" tick={{ fill: axisColor, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: axisColor, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip dark={isDark} />} />
                  <Bar dataKey="transactions" fill="url(#txGrad)" radius={[5, 5, 0, 0]} name="Orders" maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        {/* ── ROW 4: Customer Insight Tables ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Top Spenders */}
          <Panel>
            <SectionTitle
              title="Top Spenders"
              sub="Highest monetary value profiles"
              action={
                <button onClick={() => navigate('/customers')}
                  className="flex items-center gap-1 text-xs font-semibold text-amber-500 hover:text-amber-400 dark:text-amber-400 dark:hover:text-amber-300 transition-colors">
                  All <ArrowRight size={11} />
                </button>
              }
            />
            <div className="space-y-2">
              {top_customers.length === 0 ? <EmptyState message="No profiles." /> :
                top_customers.slice(0, 6).map((c, idx) => (
                  <div key={c.customer_id}
                    className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 hover:border-amber-300 hover:bg-amber-50 dark:border-white/5 dark:hover:border-amber-400/30 dark:hover:bg-white/5 transition-all cursor-pointer"
                    onClick={() => navigate(`/customer/${c.customer_id}`)}>
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black flex-shrink-0"
                      style={{
                        background: idx === 0 ? 'linear-gradient(135deg,#fbbf24,#f59e0b)' :
                          idx === 1 ? 'linear-gradient(135deg,#94a3b8,#64748b)' :
                          idx === 2 ? 'linear-gradient(135deg,#cd7c3a,#92400e)' :
                          isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9',
                        color: idx < 3 ? '#000' : isDark ? 'rgba(255,255,255,0.5)' : '#94a3b8',
                      }}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold text-indigo-500 dark:text-indigo-400 font-mono">#{c.customer_id}</span>
                      <div className="mt-0.5">
                        <span className="text-[10px] text-slate-400 dark:text-white/40">{c.segment}</span>
                      </div>
                    </div>
                    <span className="text-xs font-black text-amber-500 dark:text-amber-400">
                      £{c.monetary.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                ))}
            </div>
          </Panel>

          {/* Churn Risk Profiles */}
          <Panel>
            <SectionTitle
              title="Churn Risk Alerts"
              sub="Highest predicted churn probability"
              action={
                <button onClick={() => navigate('/customers')}
                  className="flex items-center gap-1 text-xs font-semibold text-rose-500 hover:text-rose-400 dark:text-rose-400 dark:hover:text-rose-300 transition-colors">
                  All <ArrowRight size={11} />
                </button>
              }
            />
            <div className="space-y-2">
              {customers_at_risk.length === 0 ? <EmptyState message="No risk alerts." /> :
                customers_at_risk.slice(0, 6).map((c) => {
                  const riskPct2 = Math.round(c.churn_probability * 100);
                  const riskColor2 = riskPct2 > 80 ? '#f43f5e' : riskPct2 > 60 ? '#f97316' : '#f59e0b';
                  return (
                    <div key={c.customer_id}
                      className="p-2.5 rounded-xl border border-slate-100 hover:border-rose-200 hover:bg-rose-50 dark:border-white/5 dark:hover:border-rose-400/30 dark:hover:bg-white/5 transition-all cursor-pointer"
                      onClick={() => navigate(`/customer/${c.customer_id}`)}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-xs font-bold text-indigo-500 dark:text-indigo-400 font-mono">#{c.customer_id}</span>
                        <span className="text-xs font-black" style={{ color: riskColor2 }}>{riskPct2}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-100 dark:bg-white/8 overflow-hidden">
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${riskPct2}%`, background: `linear-gradient(90deg, ${riskColor2}80, ${riskColor2})` }} />
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-white/30 mt-1 block">{c.segment}</span>
                    </div>
                  );
                })}
            </div>
          </Panel>

          {/* Recent Transactions */}
          <Panel>
            <SectionTitle
              title="Recent Sales"
              sub="Latest ledger transaction entries"
              action={
                <button onClick={() => navigate('/add-data')}
                  className="flex items-center gap-1 text-xs font-semibold text-cyan-500 hover:text-cyan-400 dark:text-cyan-400 dark:hover:text-cyan-300 transition-colors">
                  Add <ArrowRight size={11} />
                </button>
              }
            />
            <div className="space-y-2">
              {recent_transactions.length === 0 ? <EmptyState message="No sales records." /> :
                recent_transactions.slice(0, 6).map((tx, idx) => (
                  <div key={tx.id ?? idx}
                    className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 dark:border-white/5 dark:hover:bg-white/5 transition-all">
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-500/15 flex items-center justify-center flex-shrink-0">
                      <Receipt size={13} className="text-indigo-500 dark:text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-semibold text-slate-700 dark:text-white/80 font-mono truncate">{tx.invoice_no}</div>
                      <button onClick={() => navigate(`/customer/${tx.customer_id}`)}
                        className="text-[10px] text-indigo-500 dark:text-indigo-400 hover:underline font-mono">
                        #{tx.customer_id}
                      </button>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 block">£{tx.total_price.toFixed(2)}</span>
                      <span className="text-[10px] text-slate-400 dark:text-white/30">{tx.quantity} units</span>
                    </div>
                  </div>
                ))}
            </div>
          </Panel>
        </div>

        {/* ── ROW 5: Breakdown + Summary ── */}
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
                { label: 'Stable Customers', value: churn.not_churn.toLocaleString(), icon: <Zap size={14} />, color: '#f59e0b' },
                { label: 'Revenue Months', value: revenue_over_time.length, icon: <Activity size={14} />, color: '#22d3ee' },
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
