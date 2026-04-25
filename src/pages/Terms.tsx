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
        
        <h1 className="text-6xl font-black mb-12 text-zinc-900 tracking-tighter uppercase leading-none">Terms of Sovereignty</h1>
        
        <div className="max-w-none space-y-10 text-zinc-500 leading-relaxed italic">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] not-italic text-zinc-400">Last Enforced: April 25, 2026</p>
          
          <section>
            <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tight mb-4">1. Acceptance of Terms</h2>
            <p>
              By initializing the SWA Protocol, you accept and agree to be bound by the terms and provisions of this hardware-rooted local execution environment.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tight mb-4">2. Description of Architecture</h2>
            <p>
              Sovereignty Apps are distributed via our proprietary Sovereign Web App (SWA) Architecture. The software executes locally and autonomously. It is provided "as is" without warranty of any kind.
            </p>
          </section>

          <section className="bg-red-50 p-8 rounded-[32px] border border-red-100">
            <h2 className="text-xl font-black text-red-950 uppercase tracking-tight mb-4 flex items-center gap-2">
               Absolute Liability Invariant
            </h2>
            <p className="text-red-900 font-bold mb-4">
              Because this application persists data fundamentally inside your local browser enclave, you are <strong className="uppercase">solely and exclusively responsible</strong> for executing periodic database snapshots and hardware key security. 
            </p>
            <p className="text-red-800 text-sm italic mb-4">
              If your browser's private storage is evicted, or biometric keys are lost, the data will be cryptographically inaccessible. <strong className="not-italic">Sovereignty Apps and its affiliates are not liable—now or in the future—for data corruption, loss of access, lost revenue, or any damages arising from your use of this software.</strong>
            </p>
            <p className="text-red-900 font-bold text-xs uppercase tracking-widest">
              No Backups = Permanent Data Risk
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tight mb-4">4. Sovereign Operations</h2>
            <p>
              You agree not to reverse engineer the WASM binary or inject malicious scripts into the PGLite execution thread.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
