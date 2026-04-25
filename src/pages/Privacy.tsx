import React from 'react';
import { ArrowLeft } from 'lucide-react';

export default function Privacy({ navigate }: { navigate: (route: string) => void }) {
  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans selection:bg-zinc-100">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <button 
          onClick={() => navigate('landing')}
          className="flex items-center gap-2 text-zinc-400 hover:text-zinc-900 mb-12 transition-colors uppercase font-black tracking-widest text-[10px]"
        >
          <ArrowLeft className="w-4 h-4" /> Returns to Source
        </button>
        
        <h1 className="text-6xl font-black mb-12 text-zinc-900 tracking-tighter uppercase leading-none">Privacy Protocol</h1>
        
        <div className="max-w-none space-y-10 text-zinc-500 leading-relaxed italic">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] not-italic text-zinc-400">Last Enforced: April 25, 2026</p>
          
          <section>
            <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tight mb-4">1. The SWA Protocol Promise</h2>
            <p>
              Sovereignty Apps are built using our proprietary Sovereign Web App (SWA) Architecture. This means <strong className="text-zinc-900 not-italic uppercase font-bold">we do not operate servers, we do not have a central database, and we are physically incapable of accessing your data.</strong>
            </p>
            <p className="mt-4">
              Your usage data, files, and calculations are stored locally in your web browser using OPFS (Origin Private File System) and hardware-rooted WebAuthn keys.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tight mb-4">2. Zero Analytics</h2>
            <p>
              Your browser environment is a sanctuary. We do not inject tracking pixels, product analytics cookies, or biometric logging algorithms. We do not observe your dynamics.
            </p>
          </section>

          <section className="bg-zinc-50 p-8 rounded-[32px] border border-zinc-100 italic text-center">
            <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tight mb-4 not-italic">3. Data Persistence & Backup</h2>
            <p>
              Your data belongs strictly to your machine. Clearing your browser's private storage securely wipes all enclaves forever. <strong className="text-zinc-900 font-bold uppercase">If you intend to use this protocol for any duration, you must execute manual database exports regularly.</strong> We cannot recover data that we do not possess.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tight mb-4">4. Liability Limitation</h2>
            <p className="text-sm">
              By utilizing the SWA Architecture, you acknowledge that Sovereignty Apps, its developers, and affiliates are <strong className="text-zinc-900 font-bold uppercase">never liable for any data loss, financial impact, or damages</strong>—direct or indirect—now or in any future timeline. The protocol's local-first nature places all operational risk on the user Node.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tight mb-4">5. Transmission</h2>
            <p>
              For inquiries regarding the SWA Protocol specification, contact: <span className="text-zinc-900 font-bold border-b border-zinc-200">sovereigntyapps@gmail.com</span>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
