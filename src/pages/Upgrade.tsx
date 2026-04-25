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
      <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-2xl mx-auto text-center h-full">
        <div className="w-24 h-24 bg-emerald-500/10 text-emerald-400 rounded-3xl flex items-center justify-center mb-8 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.15)] animate-in zoom-in duration-700">
          <Key className="w-12 h-12" />
        </div>
        <h1 className="text-4xl font-black text-white mb-4 tracking-tighter uppercase">Protocol Active</h1>
        <p className="text-zinc-500 text-lg mb-10 leading-relaxed">
          Your hardware-rooted <code className="text-emerald-400">license.bin</code> is securely persisted on this node. You have unrestricted access to all local-first enclave features.
        </p>
        <button 
          onClick={() => navigate('dashboard')}
          className="bg-white text-zinc-950 font-black py-4 px-10 rounded-2xl hover:bg-zinc-200 transition-all active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)] uppercase tracking-widest text-xs"
        >
          Enter Intelligence Matrix
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center p-8 mx-auto max-w-5xl py-16 md:py-24">
      <div className="text-center mb-20 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full mb-2">
           <Crown className="w-4 h-4 text-amber-500" />
           <span className="text-[10px] font-mono text-amber-500 uppercase tracking-[0.2em] font-bold">Premium Protocol Access</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase leading-[0.9]">
          Unlock Global <br /> <span className="text-zinc-700">Sovereignty</span>
        </h1>
        <p className="text-zinc-500 text-lg max-w-xl mx-auto font-medium leading-relaxed">
          Activate the <strong>LicenseManager Engine</strong>. Own your software with a one-time 1-click payment and secure your cryptographic license inside your device's OPFS.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-12 w-full">
        <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/80 rounded-[40px] p-10 flex flex-col shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
             <Zap className="w-48 h-48 text-white -mr-20 -mt-20" />
          </div>
          
          <div className="relative z-10">
            <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Lifetime Protocol</h2>
            <p className="text-zinc-500 mb-10 font-mono text-xs uppercase tracking-widest">Single Payment / Eternal Persistence</p>
            
            <div className="flex items-baseline gap-1 mb-10">
              <span className="text-3xl font-bold text-zinc-600 line-through mr-2">$99</span>
              <span className="text-6xl font-black text-white tracking-tighter">$49</span>
              <span className="text-xl text-zinc-500 font-bold uppercase tracking-widest">.99</span>
            </div>

            <div className="space-y-5 mb-12">
              <div className="flex gap-4 items-center">
                <div className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                   <Check className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <span className="text-zinc-300 font-medium">Unlimited native hardware invoicing</span>
              </div>
              <div className="flex gap-4 items-center">
                <div className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                   <Check className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <span className="text-zinc-300 font-medium">OPFS <code>license.bin</code> cryptography</span>
              </div>
              <div className="flex gap-4 items-center">
                <div className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                   <Check className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <span className="text-zinc-300 font-medium">No-Limit Transaction Intelligence</span>
              </div>
              <div className="flex gap-4 items-center">
                <div className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                   <Check className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <span className="text-zinc-300 font-medium">Zero-knowledge secure exports</span>
              </div>
            </div>

            <button
              onClick={handle1ClickPayment}
              className="w-full bg-white text-zinc-950 font-black py-5 px-8 rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 group shadow-[0_0_30px_rgba(255,255,255,0.1)] text-xs uppercase tracking-widest"
            >
              <Zap className="w-5 h-5 fill-zinc-950" /> Activate One-Click License
            </button>
            
            <div className="mt-8 pt-8 border-t border-zinc-800">
              <p className="text-center text-[10px] font-mono text-zinc-600 uppercase tracking-widest leading-relaxed">
                Secured by Stripe · All major payment protocols supported <br />
                <span className="text-amber-500/50">Notice: This is digital software. No refunds will be provided after license initialization.</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-zinc-900/20 backdrop-blur-md border border-zinc-900 rounded-3xl p-8 group hover:border-zinc-800 transition-all">
             <div className="flex items-center gap-5 mb-6">
               <div className="w-14 h-14 bg-zinc-950 border border-zinc-800 rounded-2xl flex justify-center items-center text-amber-500 shadow-inner group-hover:scale-110 transition-transform">
                 <Shield className="w-7 h-7" />
               </div>
               <div>
                  <h3 className="text-white font-black text-xl tracking-tight uppercase leading-none mb-1">Zero SaaS Rent</h3>
                  <p className="text-zinc-600 text-[10px] font-mono uppercase tracking-widest italic">Terminate Subscription Drain</p>
               </div>
             </div>
             <p className="text-zinc-400 text-sm leading-relaxed">
               Sovereignty Apps are built on local-first protocols. You buy the software once, it runs entirely on your device with no recurring server costs.
             </p>
          </div>
          
          <div className="bg-zinc-900/20 backdrop-blur-md border border-zinc-900 rounded-3xl p-8 group hover:border-zinc-800 transition-all">
             <div className="flex items-center gap-5 mb-6">
               <div className="w-14 h-14 bg-zinc-950 border border-zinc-800 rounded-2xl flex justify-center items-center text-emerald-500 shadow-inner group-hover:scale-110 transition-transform">
                 <HardDrive className="w-7 h-7" />
               </div>
               <div>
                  <h3 className="text-white font-black text-xl tracking-tight uppercase leading-none mb-1">Node Specific</h3>
                  <p className="text-zinc-600 text-[10px] font-mono uppercase tracking-widest italic">Validating via OPFS Enclave</p>
               </div>
             </div>
             <p className="text-zinc-400 text-sm leading-relaxed">
               Upon 1-click payment, a cryptographic <code>license.bin</code> is secured in your Origin Private File System using the LicenseManager Engine.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
