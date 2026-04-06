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
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden">
      <Sidebar currentRoute={currentRoute} navigate={navigate} className="hidden md:flex" />
      <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
        <div className="mx-auto max-w-5xl">
          {children}
        </div>
      </main>
      <BottomNav currentRoute={currentRoute} navigate={navigate} className="md:hidden" />
    </div>
  );
}
