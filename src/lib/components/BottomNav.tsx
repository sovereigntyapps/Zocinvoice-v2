import React from 'react';
import { LayoutDashboard, Users, FileText, Settings, BarChart3 } from 'lucide-react';
import { clsx } from 'clsx';

export default function BottomNav({ currentRoute, navigate, className = '' }: any) {
  const navItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className={clsx("fixed bottom-0 left-0 right-0 bg-zinc-950 border-t border-zinc-800 flex justify-around p-2 z-50 pb-safe", className)}>
      {navItems.map((item) => {
        const isActive = currentRoute === item.id;
        return (
          <button
            key={item.id}
            onClick={() => navigate(item.id)}
            className={clsx(
              'flex flex-col items-center p-2 rounded-lg text-xs font-medium transition-colors min-w-[64px]',
              isActive ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
            )}
          >
            <item.icon className={clsx('w-6 h-6 mb-1', isActive ? 'text-white' : 'text-zinc-500')} />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
