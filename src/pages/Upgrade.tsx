import React, { useState, useEffect } from 'react';
import { Crown, Zap, Shield, HardDrive, Check, Loader2, Key } from 'lucide-react';
import { isAppUnlocked, process1ClickPayment } from '../lib/license';

export default function Upgrade({ navigate }: { navigate: (route: string) => void }) {
  const [isUnlocked, setIsUnlocked] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    isAppUnlocked().then(setIsUnlocked).catch(() => setIsUnlocked(false));
  }, []);

  const handle1ClickPayment = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      await process1ClickPayment();
      setIsUnlocked(true);
    } catch (err: any) {
      console.error(err);
      if (err.name !== 'AbortError') {
        setError(err.message || "Failed to process payment");
      }
    } finally {
      setIsProcessing(false);
    }
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
        <div className="w-20 h-20 bg-emerald-500/20 text-emerald-500 rounded-3xl flex items-center justify-center mb-6 border border-emerald-500/30">
          <Key className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">Sovereign Protocol Unlocked</h1>
        <p className="text-zinc-400 text-lg mb-8">
          Your OPFS <code>license.bin</code> is securely persisted on this device. You have lifetime access to all premium features.
        </p>
        <button 
          onClick={() => navigate('dashboard')}
          className="bg-white text-zinc-950 font-bold py-3 px-8 rounded-xl hover:bg-zinc-200 transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center p-8 mx-auto max-w-4xl py-12 md:py-24">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-4 flex justify-center items-center gap-3">
          <Crown className="w-10 h-10 text-amber-500" /> Upgrade to Premium
        </h1>
        <p className="text-zinc-400 text-lg max-w-xl mx-auto">
          Activate the <strong>LicenseManager Engine</strong>. Own your software with a one-time 1-click payment and secure your cryptographic license inside your device's OPFS.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 w-full">
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 flex flex-col">
          <h2 className="text-2xl font-bold text-white mb-2">Lifetime Access</h2>
          <p className="text-zinc-500 mb-8">One 1-click payment, yours forever.</p>
          
          <div className="text-5xl font-black text-white tracking-tight mb-8">
            $49<span className="text-xl text-zinc-500 font-medium tracking-normal">.99</span>
          </div>

          <div className="space-y-4 mb-10 flex-1">
            <div className="flex gap-3 text-zinc-300">
              <Check className="w-5 h-5 text-emerald-500 shrink-0" />
              <span>Unlimited native hardware invoicing</span>
            </div>
            <div className="flex gap-3 text-zinc-300">
              <Check className="w-5 h-5 text-emerald-500 shrink-0" />
              <span>OPFS <code>license.bin</code> cryptography</span>
            </div>
            <div className="flex gap-3 text-zinc-300">
              <Check className="w-5 h-5 text-emerald-500 shrink-0" />
              <span>Zero-knowledge client data exports</span>
            </div>
            <div className="flex gap-3 text-zinc-300">
              <Check className="w-5 h-5 text-emerald-500 shrink-0" />
              <span>Future protocol updates included</span>
            </div>
          </div>

          <button
            onClick={handle1ClickPayment}
            disabled={isProcessing}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-6 rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
            ) : (
              <><Zap className="w-5 h-5 text-blue-300 group-hover:text-white transition-colors" /> 1-Click Pay</>
            )}
          </button>
          {error && <div className="text-red-400 text-sm mt-3 text-center">{error}</div>}
          
          <p className="text-center text-xs text-zinc-600 mt-4">
            Secured by W3C Web Payments API. Supports Apple Pay & Google Pay.
          </p>
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
             <div className="flex items-center gap-4 mb-4">
               <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex justify-center items-center text-amber-500">
                 <Shield className="w-6 h-6" />
               </div>
               <div>
                  <h3 className="text-white font-bold text-lg">No Subscriptions</h3>
                  <p className="text-zinc-500 text-sm">Stop paying SaaS rent</p>
               </div>
             </div>
             <p className="text-zinc-400 text-sm">Sovereignty Apps are built on local-first protocols. You buy the software once, it runs entirely on your device with no recurring server costs.</p>
          </div>
          
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
             <div className="flex items-center gap-4 mb-4">
               <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex justify-center items-center text-emerald-500">
                 <HardDrive className="w-6 h-6" />
               </div>
               <div>
                  <h3 className="text-white font-bold text-lg">Hardware Bound</h3>
                  <p className="text-zinc-500 text-sm">Validating via OPFS</p>
               </div>
             </div>
             <p className="text-zinc-400 text-sm">Upon 1-click payment, a cryptographic <code>license.bin</code> is secured in your Origin Private File System using the LicenseManager Engine.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
