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
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-800 bg-zinc-900 text-[10px] font-black uppercase tracking-widest mb-8">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Sovereign Web Protocol Standard • v1.0
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-[100px] leading-[0.9] tracking-tighter font-semibold mb-8 text-white max-w-4xl">
              Invoices that belong <br />
              <span className="text-zinc-500">strictly to you.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-zinc-400 mb-10 max-w-2xl leading-relaxed">
              A professional invoice generator powered by the Sovereign Web Architecture. Encrypted with hardware biometric keys (FaceID/TouchID) and persisted via OPFS SyncAccess. No servers, no tracking, complete sovereignty.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button
                onClick={() => navigate('dashboard')}
                className="flex items-center justify-center gap-2 px-12 py-5 bg-white text-zinc-950 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-zinc-200 transition-all hover:scale-105 active:scale-95 w-full sm:w-auto"
              >
                Access Secured Data <LogIn className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>

          <div className="mb-32 max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl flex flex-col items-center text-center shrink-0 hover:border-zinc-700 transition-colors">
                <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center mb-6 text-white shadow-inner">
                  <Fingerprint className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2 underline decoration-zinc-800 underline-offset-4">Physical Security</h3>
                <p className="text-zinc-400 text-sm leading-relaxed mb-4 font-mono uppercase tracking-tight text-[11px]">
                  Unlock your data with your device biometrics. Your face or fingerprint creates the key locally without ever sending a password.
                </p>
              </div>

              <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl flex flex-col items-center text-center shrink-0 hover:border-zinc-700 transition-colors">
                <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center mb-6 text-white shadow-inner">
                  <HardDrive className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2 underline decoration-zinc-800 underline-offset-4">Local Storage</h3>
                <p className="text-zinc-400 text-sm leading-relaxed mb-4 font-mono uppercase tracking-tight text-[11px]">
                   Everything is saved on your machine using a high-speed local engine. It works offline and stays strictly private to your device.
                </p>
              </div>

              <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl flex flex-col items-center text-center shrink-0 hover:border-zinc-700 transition-colors">
                <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center mb-6 text-white shadow-inner">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2 underline decoration-zinc-800 underline-offset-4">Instant Access</h3>
                <p className="text-zinc-400 text-sm leading-relaxed mb-4 font-mono uppercase tracking-tight text-[11px]">
                  Fluid animations and haptic feedback make it feel like a professional tool. Zero server lag because there is no server.
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
