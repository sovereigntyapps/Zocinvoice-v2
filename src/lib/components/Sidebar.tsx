import React from 'react';
import { LayoutDashboard, Users, FileText, Settings, BarChart3, Crown } from 'lucide-react';
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
    { id: 'upgrade', label: 'Upgrade', icon: Crown },
  ];

  return (
    <aside className={twMerge("w-64 bg-zinc-950 border-r border-zinc-800 flex-col", className)}>
      <div className="p-6 border-b border-zinc-navbar/10">
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2 cursor-pointer" onClick={() => navigate('landing')}>
          <div className="w-8 h-8 rounded bg-zinc-100 flex items-center justify-center">
            <Crown className="w-5 h-5 text-zinc-950" />
          </div>
          SWA Protocol
        </h1>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = currentRoute === item.id;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={twMerge(
                clsx(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-zinc-800/50 text-white border border-zinc-700/50'
                    : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300 border border-transparent'
                )
              )}
            >
              <item.icon className={clsx('w-4 h-4', isActive ? 'text-zinc-300' : 'text-zinc-500')} />
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className="p-4 border-t border-zinc-800 text-xs text-zinc-600 text-center font-mono">
        SWA 1.0 • SOVEREIGN
      </div>
    </aside>
  );
}
