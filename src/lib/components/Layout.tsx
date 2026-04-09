import React from 'react';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import SyncStatus from './SyncStatus';

interface LayoutProps {
  children: React.ReactNode;
  currentRoute: string;
  navigate: (route: string, params?: any) => void;
}

export default function Layout({ children, currentRoute, navigate }: LayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden">
      <Sidebar currentRoute={currentRoute} navigate={navigate} className="hidden md:flex" />
      <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8 flex flex-col">
        <div className="mx-auto max-w-5xl w-full flex-1">
          {children}
        </div>
        <footer className="mt-12 text-center text-sm text-gray-400">
          Free Invoice Generator by <span className="font-semibold text-gray-500">Sovereignty Apps</span>
        </footer>
      </main>
      <BottomNav currentRoute={currentRoute} navigate={navigate} className="md:hidden" />
      <SyncStatus />
    </div>
  );
}
