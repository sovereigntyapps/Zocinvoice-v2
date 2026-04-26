import React from 'react';
import { ArrowLeft } from 'lucide-react';

export default function Terms({ navigate }: { navigate: (route: string) => void }) {
  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans selection:bg-zinc-100">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <button 
          onClick={() => navigate('landing')}
          className="flex items-center gap-2 text-zinc-400 hover:text-zinc-900 mb-12 transition-colors uppercase font-black tracking-widest text-[10px]"
        >
          <ArrowLeft className="w-4 h-4" /> Returns to Source
        </button>
        
        <h1 className="text-6xl font-black mb-12 text-zinc-900 tracking-tighter uppercase leading-none">Terms of Service</h1>
        
        <div className="max-w-none space-y-10 text-zinc-500 leading-relaxed italic">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] not-italic text-zinc-400">Last Updated: April 25, 2026</p>
          
          <section>
            <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tight mb-4">1. Acceptance of Terms</h2>
            <p>
              By using this application, you accept and agree to be bound by the terms and provisions of this local-first execution environment.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tight mb-4">2. Description of Service</h2>
            <p>
              This software executes locally on your device. It is provided "as is" without warranty of any kind.
            </p>
          </section>

          <section className="bg-red-50 p-6 rounded-2xl border border-red-100">
            <h2 className="text-lg font-bold text-red-900 mb-3">
               Data Responsibility & Liability
            </h2>
            <p className="text-sm leading-relaxed text-red-800 mb-4">
              This application persists data locally in your browser. You are <strong>solely and exclusively responsible</strong> for making regular backups and securing your device. 
            </p>
            <p className="text-sm leading-relaxed text-red-800">
              Sovereignty Apps is not liable—now or in the future—for data loss, corruption, or any damages arising from the use of this software. <strong>No Backups = Data Loss Risk.</strong>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tight mb-4">3. Usage Policies</h2>
            <p>
              You agree not to reverse engineer the application binary or inject malicious scripts into the database execution thread.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
