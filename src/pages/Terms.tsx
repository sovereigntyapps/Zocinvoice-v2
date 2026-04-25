import React from 'react';
import { ArrowLeft } from 'lucide-react';

export default function Terms({ navigate }: { navigate: (route: string) => void }) {
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-300 font-sans selection:bg-zinc-800">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <button 
          onClick={() => navigate('landing')}
          className="flex items-center gap-2 text-zinc-500 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back Base
        </button>
        
        <h1 className="text-4xl font-bold mb-8 text-white tracking-tight">Terms of Sovereignty</h1>
        
        <div className="prose prose-invert max-w-none space-y-6 text-zinc-400">
          <p><strong>Last Enforced: April 25, 2026</strong></p>
          
          <h2 className="text-2xl font-semibold text-zinc-100 mt-8 mb-4">1. Acceptance of Terms</h2>
          <p>
            By initializing the SWA Protocol, you accept and agree to be bound by the terms and provision of this local execution environment.
          </p>

          <h2 className="text-2xl font-semibold text-zinc-100 mt-8 mb-4">2. Description of Architecture</h2>
          <p>
            Sovereignty Apps are provided via the Sovereign Web App (SWA) Architecture. The software executes locally. It is provided "as is" and "as available".
          </p>

          <h2 className="text-2xl font-semibold text-zinc-100 mt-8 mb-4">3. Data Responsibility & Liability</h2>
          <p className="text-red-400">
            <strong>CRITICAL INCIDENT PROTOCOL:</strong> Because this application stores data fundamentally inside your physical browser instance, <strong>you are solely responsible for executing database exports and securing your biometric derived keys.</strong> 
          </p>
          <p>
            If your browser cache is evicted, or hardware keys are lost, the data will be cryptographically or physically inaccessible forever. We cannot un-encrypt it or recover it. Sovereignty Apps shall not be liable for any lost data, lost profits, or consequential damages.
          </p>

          <h2 className="text-2xl font-semibold text-zinc-100 mt-8 mb-4">4. Sovereign Operations</h2>
          <p>
            You agree not to modify the binary or deploy malicious scripts against the WASM components.
          </p>
        </div>
      </div>
    </div>
  );
}
