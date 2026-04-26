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
    window.location.href = 'https://buy.stripe.com/14A3co9GGeWa1bofBi2Ji00';
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
        <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mb-6 shadow-sm">
          <Check className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold text-zinc-900 mb-2 tracking-tight">Upgrade Successful</h1>
        <p className="text-zinc-500 mb-8 max-w-md">
          Thank you for your purchase. Your Lifetime Pro License is now active and all features are unlocked.
        </p>
        <button 
          onClick={() => navigate('dashboard')}
          className="bg-zinc-900 text-white font-bold py-3 px-8 rounded-xl hover:bg-black transition-all active:scale-95 shadow-lg"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center p-8 mx-auto max-w-4xl py-12 md:py-20">
      <div className="text-center mb-16 space-y-4">
        <h1 className="text-4xl md:text-5xl font-extrabold text-zinc-900 tracking-tight">
          Upgrade to Pro
        </h1>
        <p className="text-zinc-500 text-lg max-w-lg mx-auto font-medium">
          Get lifetime access to professional features with a simple one-time payment. No monthly subscriptions.
        </p>
      </div>

      <div className="bg-white border border-zinc-200 rounded-3xl p-8 md:p-12 shadow-xl shadow-zinc-200/50 max-w-lg w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-zinc-900">Lifetime License</h2>
            <p className="text-zinc-500 text-sm">One-time payment</p>
          </div>
          <div className="text-right">
            <span className="text-zinc-400 line-through text-lg font-medium mr-2">$99</span>
            <span className="text-4xl font-black text-zinc-900">$49</span>
          </div>
        </div>

        <ul className="space-y-4 mb-10">
          {[
            "Advanced Business Analytics",
            "Secured Local Data Backups & Exports",
            "Custom Organization Branding & Logos",
            "Unlimited Client List",
            "Removal of 'Free Tier' Footer Branding",
            "Priority Support & Updates"
          ].map((feature, i) => (
            <li key={i} className="flex gap-3 items-center">
              <Check className="w-5 h-5 text-emerald-500 shrink-0" />
              <span className="text-zinc-600 font-medium">{feature}</span>
            </li>
          ))}
        </ul>

        <button
          onClick={handle1ClickPayment}
          className="w-full bg-zinc-900 text-white font-bold py-4 px-8 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-3 hover:bg-black shadow-lg shadow-zinc-900/10 mb-6"
        >
          <Crown className="w-5 h-5 text-amber-400 fill-amber-400" />
          Upgrade Now
        </button>

        <div className="pt-6 border-t border-zinc-100 flex flex-col items-center gap-4">
          <div className="flex items-center gap-4 opacity-40 grayscale">
            <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" className="h-5" />
          </div>
          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest text-center">
            Secured Payment · No Refunds on Software Licenses
          </p>
        </div>
      </div>

      <div className="mt-16 grid md:grid-cols-2 gap-8 max-w-3xl">
        <div className="text-center md:text-left">
          <h3 className="font-bold text-zinc-900 mb-2">Own Your Data</h3>
          <p className="text-sm text-zinc-500">Your data stays on your machine. Our license key activates features locally, ensuring your privacy is never compromised.</p>
        </div>
        <div className="text-center md:text-left">
          <h3 className="font-bold text-zinc-900 mb-2">Lifetime Access</h3>
          <p className="text-sm text-zinc-500">Stop paying monthly rents for your business tools. Pay once and use the software forever on this device.</p>
        </div>
      </div>
    </div>
  );
}
