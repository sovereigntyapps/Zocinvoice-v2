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
        
        <h1 className="text-4xl font-black mb-12 text-zinc-900 tracking-tighter uppercase leading-none">Privacy Policy</h1>
        
        <div className="space-y-10 text-zinc-600 leading-relaxed">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">Last Updated: April 25, 2026</p>
          
          <section>
            <h2 className="text-xl font-bold text-zinc-900 mb-4 tracking-tight">1. Information Collection</h2>
            <p>
              This application is designed as a "local-first" platform. This means that all data you enter, including client information, invoices, and settings, is stored entirely locally on your device within your browser's persistent storage. We do not collect, transmit, or store this data on our servers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-zinc-900 mb-4 tracking-tight">2. Use of Information</h2>
            <p>
              Because your personal and business data does not leave your device, we do not use your information for analytics, marketing, or any other external purpose. The application only processes data locally to provide you with the core functionality of generating and managing invoices.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-zinc-900 mb-4 tracking-tight">3. Data Security and Backup</h2>
            <p>
              Since data is stored locally, the security of your data is dependent on the security of your device. You are responsible for protecting your device from unauthorized access. Similarly, if your browser storage is cleared, or if you use the application in a private browsing mode, your data may be permanently lost. We strongly recommend routinely exporting your data or maintaining separate backups.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-zinc-900 mb-4 tracking-tight">4. Third-Party Services</h2>
            <p>
              We may use third-party services (such as Stripe) solely for the purpose of processing payments for premium feature unlocks. These services have their own privacy policies regarding the data they collect during the checkout process.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-zinc-900 mb-4 tracking-tight">5. Contact Us</h2>
            <p>
              If you have any questions or concerns about this policy or our privacy practices, please contact us at: <span className="font-medium">sovereigntyapps@gmail.com</span>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
