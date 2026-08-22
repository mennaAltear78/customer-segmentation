import React from 'react';
import { AlertCircle, FolderOpen, RefreshCcw } from 'lucide-react';

interface LoadingStateProps {
  rows?: number;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ rows = 5 }) => {
  return (
    <div className="w-full space-y-4 py-8">
      <div className="h-8 bg-[var(--border-color)] opacity-20 rounded animate-pulse w-1/4"></div>
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, idx) => (
          <div key={idx} className="h-12 bg-[var(--border-color)] opacity-10 rounded animate-pulse flex items-center justify-between px-4">
            <div className="h-4 bg-[var(--border-color)] opacity-25 rounded w-1/6"></div>
            <div className="h-4 bg-[var(--border-color)] opacity-25 rounded w-1/4"></div>
            <div className="h-4 bg-[var(--border-color)] opacity-25 rounded w-1/12"></div>
            <div className="h-4 bg-[var(--border-color)] opacity-25 rounded w-1/6"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface EmptyStateProps {
  title?: string;
  message: string;
  actionButton?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Data Found',
  message,
  actionButton,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 rounded-xl border border-dashed border-[var(--border-color)] bg-[var(--bg-secondary)] text-center shadow-sm">
      <div className="p-3 bg-[var(--bg-primary)] rounded-full text-[var(--text-tertiary)] mb-4">
        <FolderOpen size={32} />
      </div>
      <h3 className="text-lg font-medium text-[var(--text-primary)] mb-1">{title}</h3>
      <p className="text-sm text-[var(--text-secondary)] max-w-md mb-6">{message}</p>
      {actionButton}
    </div>
  );
};

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
}) => {
  return (
    <div className="p-6 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-sm">
      <div className="flex items-start gap-4">
        <div className="p-2 bg-red-100 dark:bg-red-950/30 text-[var(--color-danger-text)] rounded-lg">
          <AlertCircle size={24} />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">{title}</h3>
          <p className="text-sm text-[var(--text-secondary)] mb-4">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-2 px-4 py-2 border border-[var(--border-color)] hover:border-[var(--text-secondary)] rounded-lg text-sm font-medium text-[var(--text-primary)] bg-[var(--bg-primary)] transition-all cursor-pointer"
            >
              <RefreshCcw size={16} />
              Retry Request
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
