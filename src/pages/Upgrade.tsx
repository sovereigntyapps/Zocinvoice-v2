import React, { useState, useEffect } from 'react';
import { Crown, Zap, Shield, HardDrive, Check, Loader2, Key } from 'lucide-react';
import { isAppUnlocked } from '../lib/license';

export default function Upgrade({ navigate }: { navigate: (route: string) => void }) {
  const [isUnlocked, setIsUnlocked] = useState<boolean | null>(null);

  useEffect(() => {
    isAppUnlocked().then(setIsUnlocked).catch(() => setIsUnlocked(false));
  }, []);

  const handle1ClickPayment = async () => {
    // SWA Pattern: Redirect to Stripe Payment Link
    // The developer must set the success URL in Stripe Dashboard to the app's URL + ?unlocked=true&session_id={CHECKOUT_SESSION_ID}
    window.location.href = 'https://buy.stripe.com/test_3cs3do42A0eX37y3cc'; // Placeholder link
  };

  if (isUnlocked === null) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 text-zinc-600 animate-spin" />
      </div>
    );
  }

  if (isUnlocked) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-2xl mx-auto text-center h-full animate-in fade-in duration-1000">
        <div className="w-24 h-24 bg-zinc-950 text-white rounded-[32px] flex items-center justify-center mb-8 shadow-2xl shadow-zinc-200">
          <Key className="w-12 h-12" />
        </div>
        <h1 className="text-4xl font-black text-zinc-900 mb-4 tracking-tighter uppercase">Activation Successful</h1>
        <p className="text-zinc-500 text-lg mb-10 leading-relaxed italic">
          Your hardware-rooted license is secured. The SWA Protocol is now fully operational with unrestricted local-first capabilities.
        </p>
        <button 
          onClick={() => navigate('dashboard')}
          className="bg-zinc-900 hover:bg-black text-white font-black py-4 px-12 rounded-2xl transition-all active:scale-95 shadow-xl shadow-zinc-200 uppercase tracking-widest text-[10px]"
        >
          Enter Workspace
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center p-8 mx-auto max-w-5xl py-12 md:py-20 animate-in fade-in duration-700">
      <div className="text-center mb-16 space-y-4 w-full">
        <div className="mb-12">
          <h1 className="text-5xl font-black text-zinc-900 tracking-tighter uppercase leading-none">Upgrade</h1>
          <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-[0.2em] mt-2">Personal Node Hardening</p>
        </div>
        
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-100 border border-zinc-200 rounded-full mb-2">
           <Crown className="w-4 h-4 text-zinc-900" />
           <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">License Acquisition</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-black text-zinc-900 tracking-tighter uppercase leading-[0.9]">
          OWN YOUR <br /> <span className="text-zinc-300">INFRASTRUCTURE</span>
        </h2>
        <p className="text-zinc-500 text-lg max-w-xl mx-auto font-medium leading-relaxed italic">
          One payment. Zero subscriptions. Permanent local-first ownership.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 w-full items-start">
        <div className="bg-white border border-zinc-200 rounded-[48px] p-12 flex flex-col shadow-2xl shadow-zinc-200 relative overflow-hidden group hover:border-zinc-900 transition-all">
          <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
             <Zap className="w-64 h-64 text-zinc-900 -mr-24 -mt-24" />
          </div>
          
          <div className="relative z-10">
            <h2 className="text-2xl font-black text-zinc-900 mb-2 uppercase tracking-tight">Full License</h2>
            <p className="text-zinc-400 mb-12 font-mono text-[10px] uppercase tracking-widest">Permanent Node Hardening</p>
            
            <div className="flex items-baseline gap-1 mb-12">
              <span className="text-3xl font-bold text-zinc-200 line-through mr-3">$99</span>
              <span className="text-7xl font-black text-zinc-900 tracking-tighter">$49</span>
              <span className="text-xl text-zinc-400 font-bold uppercase tracking-widest">.00</span>
            </div>

            <div className="space-y-6 mb-12">
              {[
                "Unlimited ledger transaction depth",
                "OPFS hardware-rooted backup protocol",
                "Advanced intelligence & analytics suite",
                "Zero-knowledge data enclaves",
                "Lifetime cryptographic updates"
              ].map((feature, i) => (
                <div key={i} className="flex gap-4 items-center">
                  <div className="w-6 h-6 rounded-full bg-zinc-950 flex items-center justify-center shrink-0 shadow-lg shadow-zinc-200">
                     <Check className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-zinc-600 font-bold text-sm uppercase tracking-tight">{feature}</span>
                </div>
              ))}
            </div>

            <button
              onClick={handle1ClickPayment}
              className="w-full bg-zinc-900 hover:bg-black text-white font-black py-5 px-8 rounded-[24px] transition-all active:scale-[0.98] flex items-center justify-center gap-3 group shadow-xl shadow-zinc-200 text-[10px] uppercase tracking-widest"
            >
              <Zap className="w-5 h-5 fill-white" /> Activate Protocol
            </button>
            
            <div className="mt-10 pt-8 border-t border-zinc-100 text-center space-y-4">
              <div className="flex items-center justify-center gap-4 opacity-30 invert grayscale">
                <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" className="h-5" />
              </div>
              <p className="text-[9px] font-black text-zinc-300 uppercase tracking-[0.2em] leading-relaxed max-w-xs mx-auto">
                Encrypted Transaction Stream · No Refunds on Digital Licenses
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-white border border-zinc-100 rounded-[32px] p-10 group hover:border-zinc-200 transition-all shadow-xl shadow-zinc-100/50">
             <div className="flex items-center gap-6 mb-6">
               <div className="w-16 h-16 bg-zinc-50 border border-zinc-100 rounded-2xl flex justify-center items-center text-zinc-900 shadow-inner group-hover:scale-110 transition-transform">
                 <Shield className="w-8 h-8" />
               </div>
               <div>
                  <h3 className="text-zinc-900 font-black text-xl tracking-tight uppercase leading-none mb-2">Non-Custodial</h3>
                  <p className="text-zinc-400 text-[9px] font-mono uppercase tracking-widest">No Cloud Dependencies</p>
               </div>
             </div>
             <p className="text-zinc-500 text-sm leading-relaxed italic">
               The SWA architecture ensures your billing data never leaves your machine. Your license is a local key that activates hardware-level persistence.
             </p>
          </div>
          
          <div className="bg-white border border-zinc-100 rounded-[32px] p-10 group hover:border-zinc-200 transition-all shadow-xl shadow-zinc-100/50">
             <div className="flex items-center gap-6 mb-6">
               <div className="w-16 h-16 bg-zinc-50 border border-zinc-100 rounded-2xl flex justify-center items-center text-zinc-900 shadow-inner group-hover:scale-110 transition-transform">
                 <HardDrive className="w-8 h-8" />
               </div>
               <div>
                  <h3 className="text-zinc-900 font-black text-xl tracking-tight uppercase leading-none mb-2">Local Persistence</h3>
                  <p className="text-zinc-400 text-[9px] font-mono uppercase tracking-widest">OPFS Hardware Root</p>
               </div>
             </div>
             <p className="text-zinc-500 text-sm leading-relaxed italic">
               Restore sovereignty over your business tools. Once activated, the LicenseManager removes all trial constraints forever.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
