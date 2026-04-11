import React from 'react';
import { LayoutDashboard, Users, FileText, Settings, BarChart3 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface SidebarProps {
  currentRoute: string;
  navigate: (route: string, params?: any) => void;
  className?: string;
}

export default function Sidebar({ currentRoute, navigate, className = '' }: SidebarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className={twMerge("w-64 bg-white border-r border-gray-200 flex-col", className)}>
      <div className="p-6 border-b border-gray-100">
        <h1 className="text-xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
            Z
          </div>
          ZOC Invoice
        </h1>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = currentRoute === item.id || currentRoute.startsWith(item.id + '-');
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={twMerge(
                clsx(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )
              )}
            >
              <item.icon className={clsx('w-5 h-5', isActive ? 'text-blue-600' : 'text-gray-400')} />
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-100 text-xs text-gray-400 text-center">
        ZOC 3.0 Architecture
      </div>
    </aside>
  );
}
