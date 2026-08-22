import React from 'react';
import type{ LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  iconClassName?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  description,
  icon: Icon,
  iconClassName = 'text-[var(--accent)] bg-[var(--accent-light)]',
}) => {
  return (
    <div className="p-6 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex justify-between items-start">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
            {label}
          </span>
          <h3 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] mt-1.5">
            {value}
          </h3>
          {description && (
            <p className="text-xs text-[var(--text-secondary)] mt-2">
              {description}
            </p>
          )}
        </div>
        <div className={`p-2.5 rounded-lg ${iconClassName}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
};
