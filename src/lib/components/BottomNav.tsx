import React from 'react';
import { LayoutDashboard, Users, FileText, Settings } from 'lucide-react';
import { clsx } from 'clsx';

export default function BottomNav({ currentRoute, navigate, className = '' }: any) {
  const navItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className={clsx("fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-2 z-50 pb-safe", className)}>
      {navItems.map((item) => {
        const isActive = currentRoute === item.id || currentRoute.startsWith(item.id + '-');
        return (
          <button
            key={item.id}
            onClick={() => navigate(item.id)}
            className={clsx(
              'flex flex-col items-center p-2 rounded-lg text-xs font-medium transition-colors min-w-[64px]',
              isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'
            )}
          >
            <item.icon className={clsx('w-6 h-6 mb-1', isActive ? 'text-blue-600' : 'text-gray-400')} />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
