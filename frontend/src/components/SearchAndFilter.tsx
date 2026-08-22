import React from 'react';
import { Search } from 'lucide-react';

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
  onChangeValue: (val: string) => void;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChangeValue,
  placeholder = 'Search by ID...',
  className = '',
  ...props
}) => {
  return (
    <div className={`relative flex-1 min-w-[200px] ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-tertiary)]">
        <Search size={16} />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChangeValue(e.target.value)}
        placeholder={placeholder}
        className="block w-full pl-9 pr-3 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-hidden focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition-all"
        {...props}
      />
    </div>
  );
};

interface FilterDropdownProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
  value: string;
  onChangeValue: (val: string) => void;
}

export const FilterDropdown: React.FC<FilterDropdownProps> = ({
  label,
  options,
  value,
  onChangeValue,
  className = '',
  ...props
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {label && (
        <span className="text-xs font-medium text-[var(--text-secondary)] whitespace-nowrap">
          {label}:
        </span>
      )}
      <select
        value={value}
        onChange={(e) => onChangeValue(e.target.value)}
        className="block py-2 pl-3 pr-8 border border-[var(--border-color)] rounded-lg bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] focus:outline-hidden focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition-all cursor-pointer"
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};
