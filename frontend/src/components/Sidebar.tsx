import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Receipt, 
  LineChart, 
  Activity, 
  Wifi, 
  WifiOff, 
  X, 
  Menu 
} from 'lucide-react';

interface SidebarProps {
  apiOnline: boolean | null;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ apiOnline, isOpen, onClose }) => {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Customers', path: '/customers', icon: Users },
    { name: 'Transactions', path: '/transactions', icon: Receipt },
    { name: 'Prediction', path: '/prediction', icon: LineChart },
  ];

  return (
    <>
      {/* Mobile Sidebar backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 border-r border-[var(--border-color)] bg-[var(--bg-secondary)] transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-[var(--accent)] text-white rounded-lg">
              <Activity size={20} />
            </div>
            <span className="font-bold text-lg tracking-tight text-[var(--text-primary)]">
              SegmentIQ
            </span>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 rounded-md hover:bg-[var(--bg-primary)] lg:hidden text-[var(--text-secondary)] cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => onClose()}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[var(--accent-light)] text-[var(--accent)] border-l-4 border-[var(--accent)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)]'
                }`
              }
            >
              <item.icon size={18} />
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* Bottom Panel with API Status Indicator */}
        <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-primary)]/50">
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xs">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">API Status</span>
            <div className="flex items-center gap-1.5">
              {apiOnline === null ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-slate-400 animate-pulse"></span>
                  <span className="text-xs text-[var(--text-tertiary)]">Checking...</span>
                </>
              ) : apiOnline ? (
                <>
                  <Wifi size={12} className="text-[var(--color-vip-text)]" />
                  <span className="text-xs font-semibold text-[var(--color-vip-text)]">Connected</span>
                </>
              ) : (
                <>
                  <WifiOff size={12} className="text-[var(--color-danger-text)]" />
                  <span className="text-xs font-semibold text-[var(--color-danger-text)]">Offline</span>
                </>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
export { Menu };
