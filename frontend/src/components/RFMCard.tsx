import React from 'react';
import { Calendar, RefreshCw, DollarSign } from 'lucide-react';

interface RFMCardProps {
  recency: number | string;
  frequency: number | string;
  monetary: number | string;
}

export const RFMCard: React.FC<RFMCardProps> = ({ recency, frequency, monetary }) => {
  const formattedMonetary = typeof monetary === 'number' 
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(monetary)
    : monetary;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="p-5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-lg">
            <Calendar size={18} />
          </div>
          <span className="text-sm font-medium text-[var(--text-secondary)]">Recency</span>
        </div>
        <p className="text-2xl font-bold text-[var(--text-primary)]">{recency} days</p>
        <p className="text-xs text-[var(--text-tertiary)] mt-1.5">
          Days since the customer's latest purchase
        </p>
      </div>

      <div className="p-5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <RefreshCw size={18} />
          </div>
          <span className="text-sm font-medium text-[var(--text-secondary)]">Frequency</span>
        </div>
        <p className="text-2xl font-bold text-[var(--text-primary)]">{frequency} invoices</p>
        <p className="text-xs text-[var(--text-tertiary)] mt-1.5">
          Distinct invoices recorded for this customer
        </p>
      </div>

      <div className="p-5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
            <DollarSign size={18} />
          </div>
          <span className="text-sm font-medium text-[var(--text-secondary)]">Monetary</span>
        </div>
        <p className="text-2xl font-bold text-[var(--text-primary)]">{formattedMonetary}</p>
        <p className="text-xs text-[var(--text-tertiary)] mt-1.5">
          Total transaction value
        </p>
      </div>
    </div>
  );
};
