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
        
        <h1 className="text-4xl font-black mb-12 text-zinc-900 tracking-tighter uppercase leading-none">Terms of Service</h1>
        
        <div className="space-y-10 text-zinc-600 leading-relaxed">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">Last Updated: April 25, 2026</p>
          
          <section>
            <h2 className="text-xl font-bold text-zinc-900 mb-4 tracking-tight">1. Acceptance of Terms</h2>
            <p>
              By accessing and using this application ("Service"), you accept and agree to be bound by the terms and provision of this agreement.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-zinc-900 mb-4 tracking-tight">2. Description of Service</h2>
            <p>
              The Service is a local-first invoicing application provided "as is" and "as available". We reserve the right to modify or discontinue the Service with or without notice to you.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-bold text-zinc-900 mb-4 tracking-tight">3. User Responsibilities</h2>
            <p>
              You are responsible for obtaining access to the Service and that access may involve third-party fees (such as Internet service provider or airtime charges). Because this application uses local-first data storage, you are fully responsible for backing up your own data and securing your local device environment.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-zinc-900 mb-4 tracking-tight">4. Prohibited Uses</h2>
            <p className="mb-3">You agree not to use the Service:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>In any way that violates any applicable local, state, or international law.</li>
              <li>To transmit, or procure the sending of, any advertising or promotional material without our prior written consent.</li>
              <li>To impersonate or attempt to impersonate the Company, a Company employee, another user, or any other person or entity.</li>
              <li>To engage in any other conduct that restricts or inhibits anyone's use or enjoyment of the Service.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-zinc-900 mb-4 tracking-tight">5. Disclaimer of Warranties</h2>
            <p>
              Your use of the Service is at your sole risk. The Service is provided on an "as is" and "as available" basis without any warranties of any kind, either express or implied, including, but not limited to, implied warranties of merchantability, fitness for a particular purpose, or non-infringement.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-bold text-zinc-900 mb-4 tracking-tight">6. Limitation of Liability</h2>
            <p>
              In no event will Sovereignty Apps, its affiliates, or their licensors, service providers, employees, agents, officers, or directors be liable for damages of any kind, under any legal theory, arising out of or in connection with your use, or inability to use, the Service. This includes any direct, indirect, special, incidental, consequential, or punitive damages.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
