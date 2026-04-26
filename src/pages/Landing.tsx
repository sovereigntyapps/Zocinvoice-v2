import React from 'react';
import { ArrowRight, Shield, Zap, Fingerprint, LayoutDashboard, Crown, LogIn, HardDrive } from 'lucide-react';

interface LandingProps {
  navigate: (route: string, params?: any) => void;
}

export default function Landing({ navigate }: LandingProps) {
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-300 font-sans selection:bg-zinc-800">
      <header className="px-6 py-4 flex items-center justify-between border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-zinc-100 flex items-center justify-center">
            <Crown className="w-5 h-5 text-zinc-950" />
          </div>
          <span className="font-bold text-lg tracking-tight text-white">Sovereign Invoice</span>
        </div>
        <button
          onClick={() => navigate('dashboard')}
          className="text-sm font-medium hover:text-white transition-colors"
        >
          Open App
        </button>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-20 lg:py-32">
        <div className="flex flex-col items-center text-center mb-24">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-800 bg-zinc-900 text-xs font-medium tracking-wide mb-8">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Local First • Secured
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-[100px] leading-[0.9] tracking-tighter font-semibold mb-8 text-white max-w-4xl">
            Invoices that belong <br />
            <span className="text-zinc-500">strictly to you.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-zinc-400 mb-10 max-w-2xl leading-relaxed">
            A professional invoice generator locked behind cryptographic biometric keys. Your financial data is saved directly in your browser hardware. No sign-ups, no subscriptions, zero servers.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button
              onClick={() => navigate('dashboard')}
              className="flex items-center justify-center gap-2 px-8 py-4 bg-white text-zinc-950 rounded-lg font-bold hover:bg-zinc-200 transition-all hover:scale-105 active:scale-95 w-full sm:w-auto"
            >
              Get Started <LogIn className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>

        <div className="mb-32 max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl flex flex-col items-center text-center shrink-0">
              <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center mb-6 text-white shadow-inner">
                <Fingerprint className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Biometric Security</h3>
              <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                Secured by FaceID / TouchID. Your device hardware provides the master key to unlock your financial data.
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl flex flex-col items-center text-center shrink-0">
              <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center mb-6 text-white shadow-inner">
                <HardDrive className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Local Storage</h3>
              <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                Data is saved directly to your machine. High-performance local database ensures your info never leaves your device.
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl flex flex-col items-center text-center shrink-0">
              <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center mb-6 text-white shadow-inner">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Zero Latency</h3>
              <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                Everything executes locally. Operations happen in sub-milliseconds because there is no server to wait for.
              </p>
            </div>

          </div>
        </div>
      </main>

      <footer className="border-t border-zinc-800 py-8 text-center text-sm text-zinc-500 px-6">
        <div className="flex justify-center gap-6 mb-4">
          <button onClick={() => navigate('privacy')} className="hover:text-white transition-colors">Privacy</button>
          <button onClick={() => navigate('terms')} className="hover:text-white transition-colors">Terms</button>
        </div>
        <p>© {new Date().getFullYear()} Sovereignty Apps. Built for Sovereignty.</p>
      </footer>
    </div>
  );
}
