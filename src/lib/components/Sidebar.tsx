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
    <aside className={twMerge("w-64 bg-white border-r border-zinc-200 flex flex-col", className)}>
      <div className="p-6 border-b border-zinc-100">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 flex items-center gap-2 cursor-pointer transition-opacity hover:opacity-80" onClick={() => navigate('landing')}>
          <div className="w-8 h-8 rounded bg-zinc-950 flex items-center justify-center">
            <Crown className="w-5 h-5 text-white" />
          </div>
          Sovereign Hub
        </h1>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = currentRoute === item.id;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={twMerge(
                clsx(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all',
                  isActive
                    ? 'bg-zinc-100 text-zinc-900 shadow-sm'
                    : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 border border-transparent'
                )
              )}
            >
              <item.icon className={clsx('w-4 h-4 transition-colors', isActive ? 'text-zinc-900' : 'text-zinc-400')} />
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className="p-6 border-t border-zinc-100 text-[10px] text-zinc-400 text-center font-mono uppercase tracking-[0.2em]">
        Node v1.0 • Sovereign
      </div>
    </aside>
  );
}
