import React from 'react';
import { Crown, Lock } from 'lucide-react';
import { useLicense } from '../../hooks/useLicense';

interface ProGuardProps {
  children: React.ReactNode;
  navigate: (route: string) => void;
  title?: string;
  description?: string;
}

export default function ProGuard({ 
  children, 
  navigate, 
  title = "Pro Feature", 
  description = "This advanced feature is part of our Lifetime Pro License." 
}: ProGuardProps) {
  const { isUnlocked } = useLicense();

  if (isUnlocked === null) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (isUnlocked) {
    return <>{children}</>;
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-2xl mx-auto text-center h-[70vh]">
      <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-amber-100">
        <Lock className="w-10 h-10" />
      </div>
      <h1 className="text-3xl font-bold text-zinc-900 mb-2 tracking-tight">{title}</h1>
      <p className="text-zinc-500 mb-8 max-w-md font-medium text-lg leading-relaxed">
        {description}
      </p>
      <button 
        onClick={() => navigate('upgrade')}
        className="flex items-center gap-3 bg-zinc-900 text-white font-bold py-4 px-10 rounded-2xl hover:bg-black transition-all active:scale-95 shadow-xl shadow-zinc-900/10"
      >
        <Crown className="w-5 h-5 text-amber-400 fill-amber-400" />
        Upgrade to Pro
      </button>
    </div>
  );
}
