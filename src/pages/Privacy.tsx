import React from 'react';
import { ArrowLeft } from 'lucide-react';

export default function Privacy({ navigate }: { navigate: (route: string) => void }) {
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-300 font-sans selection:bg-zinc-800">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <button 
          onClick={() => navigate('landing')}
          className="flex items-center gap-2 text-zinc-500 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back Base
        </button>
        
        <h1 className="text-4xl font-bold mb-8 text-white tracking-tight">Privacy Protocol</h1>
        
        <div className="prose prose-invert max-w-none space-y-6 text-zinc-400">
          <p><strong>Last Enforced: April 25, 2026</strong></p>
          
          <h2 className="text-2xl font-semibold text-zinc-100 mt-8 mb-4">1. The SWA Protocol Promise</h2>
          <p>
            Sovereignty Apps are built using the Sovereign Web App (SWA) Architecture. This means <strong>we do not operate servers, we do not have a central database, and we are physically incapable of accessing your data.</strong>
          </p>
          <p>
            Your usage data, files, and calculations are stored locally in your web browser using OPFS (Origin Private File System) and WebAuthn derived keys.
          </p>

          <h2 className="text-2xl font-semibold text-zinc-100 mt-8 mb-4">2. Zero Analytics</h2>
          <p>
            Your browser is a sanctuary. We do not inject tracking pixels or product analytics algorithms. We don't want to know what you do.
          </p>

          <h2 className="text-2xl font-semibold text-zinc-100 mt-8 mb-4">3. Data Deletion</h2>
          <p>
            Your data is intrinsically volatile and belongs strictly to your machine. Clearing your browser storage securely wipes it forever.
          </p>

          <h2 className="text-2xl font-semibold text-zinc-100 mt-8 mb-4">4. Transmission</h2>
          <p>
            If you have questions about the SWA Protocol, contact: sovereigntyapps@gmail.com.
          </p>
        </div>
      </div>
    </div>
  );
}
