import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, FileText, Settings, BarChart3, Crown } from 'lucide-react';
import { clsx } from 'clsx';
import { isAppUnlocked } from '../license';

export default function BottomNav({ currentRoute, navigate, className = '' }: any) {
  const [isUnlocked, setIsUnlocked] = useState<boolean | null>(null);

  useEffect(() => {
    isAppUnlocked().then(setIsUnlocked).catch(() => setIsUnlocked(false));
  }, []);

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
      
      {!isUnlocked && isUnlocked !== null && (
        <button
          onClick={() => navigate('upgrade')}
          className={clsx(
            'flex flex-col items-center p-2 rounded-lg text-xs font-black transition-colors min-w-[64px]',
            currentRoute === 'upgrade' ? 'text-amber-400' : 'text-amber-500/80 hover:text-amber-400'
          )}
        >
          <Crown className={clsx('w-6 h-6 mb-1', currentRoute === 'upgrade' ? 'text-amber-400 fill-amber-400' : 'text-amber-500/80')} />
          Pro
        </button>
      )}
    </nav>
  );
}
