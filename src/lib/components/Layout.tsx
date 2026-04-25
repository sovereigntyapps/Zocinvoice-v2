import React from 'react';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

interface LayoutProps {
  children: React.ReactNode;
  currentRoute: string;
  navigate: (route: string, params?: any) => void;
}

export default function Layout({ children, currentRoute, navigate }: LayoutProps) {
  return (
    <div className="flex h-screen bg-zinc-50 text-zinc-900 font-sans overflow-hidden">
      <Sidebar currentRoute={currentRoute} navigate={navigate} className="hidden md:flex shrink-0" />
      <main className="flex-1 overflow-y-auto flex flex-col pt-16 md:pt-0">
        <div className="p-4 md:p-8 pb-24 md:pb-8 flex flex-col flex-1">
          <div className="mx-auto w-full max-w-7xl flex-1">
            {children}
          </div>
        </div>
      </main>
      <BottomNav currentRoute={currentRoute} navigate={navigate} className="md:hidden" />
    </div>
  );
}
