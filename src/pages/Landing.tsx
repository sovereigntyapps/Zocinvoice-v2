import React from 'react';
import { ArrowRight, Shield, Zap, HardDrive, FileText } from 'lucide-react';

interface LandingProps {
  navigate: (route: string, params?: any) => void;
}

export default function Landing({ navigate }: LandingProps) {
  return (
    <div className="min-h-screen bg-[#f5f5f4] text-[#0a0a0a] font-sans selection:bg-blue-200">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-gray-200 bg-white/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#0a0a0a] rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">Sovereignty Apps</span>
        </div>
        <button
          onClick={() => navigate('dashboard')}
          className="text-sm font-medium hover:text-gray-600 transition-colors"
        >
          Go to Dashboard
        </button>
      </header>

      {/* Hero Section - Split Layout */}
      <main className="grid grid-cols-1 lg:grid-cols-2 min-h-[calc(100vh-73px)]">
        {/* Left Pane - Copy */}
        <div className="p-8 md:p-16 lg:p-24 flex flex-col justify-center relative">
          <div className="absolute top-8 left-8 text-[11px] uppercase tracking-[0.08em] font-semibold text-gray-400 [writing-mode:vertical-rl] rotate-180 hidden lg:block">
            Zero-Operating-Cost Architecture
          </div>
          
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-8">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              100% Free & Private
            </div>
            
            <h1 className="text-6xl md:text-7xl lg:text-[112px] leading-[0.88] tracking-[-0.02em] font-semibold mb-8 text-[#0a0a0a]">
              Invoice.<br />
              <span className="text-gray-400">Locally.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-md leading-relaxed">
              A professional invoice generator that runs entirely in your browser. No sign-ups, no subscriptions, and your financial data never leaves your device.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button
                onClick={() => navigate('dashboard')}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-[#0a0a0a] text-white rounded-full font-medium hover:bg-gray-800 transition-all hover:scale-105 active:scale-95"
              >
                Launch App (Free) <ArrowRight className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-500 font-medium">No credit card required</span>
            </div>
          </div>
        </div>

        {/* Right Pane - Visuals */}
        <div className="bg-[#0a0a0a] p-8 md:p-16 lg:p-24 flex flex-col justify-center relative overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-b from-gray-800/20 to-transparent"></div>
          <div className="absolute -right-20 -top-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 space-y-6 max-w-md mx-auto w-full">
            {/* Feature Card 1 */}
            <div className="bg-white/10 backdrop-blur-md border border-white/10 p-6 rounded-2xl transform -rotate-2 hover:rotate-0 transition-transform">
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center mb-4">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Absolute Privacy</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Your data is stored in PGlite, a local database running directly in your browser. We literally cannot see your invoices.
              </p>
            </div>

            {/* Feature Card 2 */}
            <div className="bg-white/10 backdrop-blur-md border border-white/10 p-6 rounded-2xl transform rotate-2 hover:rotate-0 transition-transform ml-4 md:ml-12">
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center mb-4">
                <HardDrive className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Google Drive Sync</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Securely backup your database to a hidden app-specific folder in your own Google Drive. Restore anywhere.
              </p>
            </div>

            {/* Feature Card 3 */}
            <div className="bg-white/10 backdrop-blur-md border border-white/10 p-6 rounded-2xl transform -rotate-1 hover:rotate-0 transition-transform">
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center mb-4">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Zero Latency</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Because there are no servers to talk to, everything happens instantly. Generate PDFs in milliseconds.
              </p>
            </div>
          </div>
          
          {/* Footer Links */}
          <div className="absolute bottom-8 left-0 w-full flex justify-center gap-6 text-sm text-gray-500 z-20">
            <button onClick={() => navigate('privacy')} className="hover:text-white transition-colors">Privacy Policy</button>
            <button onClick={() => navigate('terms')} className="hover:text-white transition-colors">Terms of Service</button>
          </div>
        </div>
      </main>
    </div>
  );
}
