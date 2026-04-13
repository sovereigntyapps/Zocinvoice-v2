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
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden print:h-auto print:overflow-visible print:bg-white">
      <Sidebar currentRoute={currentRoute} navigate={navigate} className="hidden md:flex print:hidden" />
      <main className="flex-1 overflow-y-auto flex flex-col print:overflow-visible">
        <div className="p-4 md:p-8 pb-24 md:pb-8 flex flex-col flex-1 print:p-0">
          <div className="mx-auto max-w-5xl w-full flex-1 print:max-w-none print:w-full">
            {children}
          </div>
          <footer className="mt-12 text-center text-sm text-gray-400 print:hidden">
            Free Invoice Generator by <span className="font-semibold text-gray-500">Sovereign Invoice</span>
          </footer>
        </div>
      </main>
      <BottomNav currentRoute={currentRoute} navigate={navigate} className="md:hidden print:hidden" />
    </div>
  );
}
