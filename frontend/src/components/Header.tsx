import React, { useEffect, useState } from 'react';
import { RefreshCw, Sun, Moon, Menu } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
  onMenuToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onRefresh,
  refreshing = false,
  onMenuToggle,
}) => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'light' || savedTheme === 'dark') {
        return savedTheme;
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <header className="flex items-center justify-between h-16 px-6 lg:px-8 border-b border-[var(--border-color)] bg-[var(--bg-secondary)] sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          onClick={onMenuToggle}
          className="p-2 rounded-md hover:bg-[var(--bg-primary)] lg:hidden text-[var(--text-secondary)] cursor-pointer"
        >
          <Menu size={20} />
        </button>

        {/* Headings */}
        <div className="text-left">
          <h1 className="text-lg font-bold leading-tight text-[var(--text-primary)] m-0">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-[var(--text-secondary)] mt-0.5 hidden sm:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-2">
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="p-2 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)] disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center"
            title="Refresh Data"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          </button>
        )}

        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)] transition-all cursor-pointer flex items-center justify-center"
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>
      </div>
    </header>
  );
};
