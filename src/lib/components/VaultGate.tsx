import React, { useState, useEffect } from 'react';
import { Fingerprint, Lock, ShieldCheck, AlertTriangle, KeyRound, ShieldHalf, LayoutDashboard } from 'lucide-react';
import { createVault, unlockVault, isGhostVaultSupported, WebAuthnVaultError, deriveKeyFromPassphrase } from '../vault';

interface VaultGateProps {
  children: React.ReactNode;
  onUnlocked: (key: Uint8Array) => void;
}

type VaultMode = 'hard' | 'hybrid';

export default function VaultGate({ children, onUnlocked }: VaultGateProps) {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [hasVault, setHasVault] = useState<boolean>(false);
  const [vaultMode, setVaultMode] = useState<VaultMode>('hard');
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [showHybridOption, setShowHybridOption] = useState(false);

  useEffect(() => {
    isGhostVaultSupported().then(res => setSupported(res));
    const savedCredId = localStorage.getItem('WA_VAULT_CRED_ID');
    const savedMode = localStorage.getItem('WA_VAULT_MODE') as VaultMode;
    
    if (savedCredId || savedMode === 'hybrid') {
      setHasVault(true);
      if (savedMode) setVaultMode(savedMode);
    }
  }, []);

  const handleCreateVault = async () => {
    try {
      setIsUnlocking(true);
      setError(null);
      const { credentialId } = await createVault();
      
      localStorage.setItem('WA_VAULT_CRED_ID', credentialId);
      localStorage.setItem('WA_VAULT_MODE', 'hard');
      setHasVault(true);
      setVaultMode('hard');
      
      const { derivedKey } = await unlockVault(credentialId);
      onUnlocked(derivedKey);
      setUnlocked(true);
    } catch (err: any) {
      console.error(err);
      const msg = err instanceof WebAuthnVaultError ? err.message : 'An unexpected error occurred during vault creation.';
      setError(msg);
      
      // If PRF failed, show the hybrid fallback option
      if (msg.includes("PRF") || msg.includes("support")) {
        setShowHybridOption(true);
      }
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleCreateHybridVault = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passphrase) return;

    try {
      setIsUnlocking(true);
      setError(null);
      
      const derivedKey = await deriveKeyFromPassphrase(passphrase);
      
      // For hybrid, we don't have a credentialId, we just store that we use hybrid mode
      localStorage.setItem('WA_VAULT_MODE', 'hybrid');
      // Store a non-sensitive identifier to show we have a vault
      localStorage.setItem('WA_VAULT_HYBRID_INIT', 'true');
      
      setHasVault(true);
      setVaultMode('hybrid');
      onUnlocked(derivedKey);
      setUnlocked(true);
    } catch (err: any) {
      console.error(err);
      setError('Hybrid key derivation failed.');
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleUnlock = async () => {
    try {
      setIsUnlocking(true);
      setError(null);
      
      if (vaultMode === 'hard') {
        const savedCredId = localStorage.getItem('WA_VAULT_CRED_ID');
        if (!savedCredId) throw new Error("Vault not found.");

        const { derivedKey } = await unlockVault(savedCredId);
        onUnlocked(derivedKey);
        setUnlocked(true);
      } else {
        if (!passphrase) {
          setError("Passphrase required.");
          return;
        }
        const derivedKey = await deriveKeyFromPassphrase(passphrase);
        onUnlocked(derivedKey);
        setUnlocked(true);
      }
    } catch (err: any) {
      console.error(err);
      setError(err instanceof WebAuthnVaultError ? err.message : 'Unlock failed. Please try again.');
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleReset = () => {
    if (window.confirm("WARNING: This will sever the connection to your identity. If data was encrypted with it, it will be lost forever. Continue?")) {
      localStorage.removeItem('WA_VAULT_CRED_ID');
      localStorage.removeItem('WA_VAULT_MODE');
      localStorage.removeItem('WA_VAULT_HYBRID_INIT');
      setHasVault(false);
      setVaultMode('hard');
      setError(null);
      setPassphrase('');
      setShowHybridOption(false);
    }
  };

  // If successfully unlocked, render the inner application (Data Enclave)
  if (unlocked) {
    return <>{children}</>;
  }

  // Render the Security Enclave interface
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-300 font-sans p-4 select-none">
      <div className="max-w-md w-full bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        {/* Subtle grid background for the brutalist "Ghost" feel */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none opacity-20"></div>
        
        <div className="text-center relative z-10 flex flex-col items-center">
          <div className="h-16 w-16 bg-zinc-800 border border-zinc-700 shadow-inner rounded-full flex items-center justify-center mb-6">
            {vaultMode === 'hard' ? (
               hasVault ? <Lock className="text-zinc-100" size={28} /> : <ShieldCheck className="text-zinc-100" size={28} />
            ) : (
              <ShieldHalf className="text-zinc-100" size={28} />
            )}
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">
            {vaultMode === 'hard' ? 'Identity Enclave' : 'Hybrid Enclave'}
          </h1>
          <p className="text-sm text-zinc-400 mb-8 max-w-xs leading-relaxed">
            {vaultMode === 'hard' 
              ? (hasVault 
                  ? "Biometric signature required to derive decryption keys and unlock local storage." 
                  : "Initialize the SWA Protocol. Secure your data with a hardware-derived PRF key.")
              : "Derived Key Enclave: Secure your data with a local passphrase and PBKDF2 (600k rounds)."}
          </p>

          {supported === false && vaultMode === 'hard' && (
            <div className="bg-red-950/30 border border-red-900 text-red-400 text-xs p-3 rounded mb-6 flex flex-col items-start text-left w-full gap-2">
              <div className="flex items-center">
                <AlertTriangle size={16} className="mr-2 flex-shrink-0" />
                <span className="font-bold">Hardware Support Missing</span>
              </div>
              <p>Your device does not support WebAuthn or PRF. Please use the Hybrid Fallback mode below.</p>
              <button 
                onClick={() => { setVaultMode('hybrid'); setError(null); }}
                className="text-white underline font-medium hover:text-zinc-200 mt-1"
              >
                Switch to Hybrid Passphrase 
              </button>
            </div>
          )}

          {showHybridOption && !hasVault && vaultMode === 'hard' && (
             <div className="bg-indigo-950/30 border border-indigo-900 text-indigo-400 text-xs p-3 rounded mb-6 flex flex-col items-start text-left w-full gap-2">
                <div className="flex items-center">
                  <Fingerprint size={16} className="mr-2 flex-shrink-0" />
                  <span className="font-bold">Hardware Init Failed</span>
                </div>
                <p>WebAuthn PRF is not available on this device. You can still secure your data using a passphrase-based Hybrid Enclave.</p>
                <button 
                  onClick={() => { setVaultMode('hybrid'); setError(null); }}
                  className="text-white underline font-medium hover:text-zinc-200 mt-1"
                >
                  Use Hybrid Passphrase Fallback
                </button>
             </div>
          )}

          {window.self !== window.top && (
            <div className="bg-amber-950/30 border border-amber-900 text-amber-400 text-xs p-3 rounded mb-6 flex flex-col items-start text-left w-full gap-2">
              <div className="flex items-start">
                <AlertTriangle size={16} className="mr-2 flex-shrink-0 mt-0.5" />
                <span className="font-bold">Preview Environment Detected</span>
              </div>
              <p>WebAuthn Hardware Identity requires a top-level window context. Please open this app in a new tab using the ↗️ button in the top-right corner of the preview to initialize the Vault.</p>
            </div>
          )}

          {error && (
            <div className="bg-orange-950/30 border border-orange-900 text-orange-400 text-xs p-3 rounded mb-8 w-full">
              {error.includes("publickey-credentials-create") || error.includes("publickey-credentials-get") ? "WebAuthn is not supported inside this preview iframe. Please open the app in a new tab using the ↗️ button in the top right." : error}
            </div>
          )}

          {hasVault ? (
            <div className="w-full space-y-4">
              {vaultMode === 'hybrid' && (
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest ml-1">Master Passphrase</label>
                  <input
                    type="password"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-white transition-colors"
                  />
                </div>
              )}
              <button
                onClick={handleUnlock}
                disabled={isUnlocking || (vaultMode === 'hard' && window.self !== window.top)}
                className="w-full flex items-center justify-center bg-white text-zinc-900 font-semibold py-3 px-4 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {isUnlocking ? (
                  <span className="animate-pulse">Deriving Key...</span>
                ) : (
                  <>
                    {vaultMode === 'hard' ? <Fingerprint size={18} className="mr-2" /> : <Lock size={18} className="mr-2" />}
                    {vaultMode === 'hard' ? 'Unlock with Biometrics' : 'Unseal Vault'}
                  </>
                )}
              </button>
              <button 
                onClick={handleReset}
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors w-full"
              >
                Reset Identity Connection
              </button>
            </div>
          ) : (
            <div className="w-full space-y-4">
              {vaultMode === 'hard' ? (
                <button
                  onClick={handleCreateVault}
                  disabled={isUnlocking || supported === false || window.self !== window.top}
                  className="w-full flex items-center justify-center bg-white text-zinc-900 font-semibold py-3 px-4 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                >
                  {isUnlocking ? (
                    <span className="animate-pulse">Sealing Vault...</span>
                  ) : (
                    <>
                      <KeyRound size={18} className="mr-2 group-hover:scale-110 transition-transform" />
                      Initialize Hardware Identity
                    </>
                  )}
                </button>
              ) : (
                <form onSubmit={handleCreateHybridVault} className="space-y-4">
                   <div className="space-y-1 text-left text-zinc-400 text-xs px-2 mb-4">
                      <p>Hybrid mode creates a local vault derived from your passphrase. Key derivation happens on-device using 600,000 PBKDF2 iterations.</p>
                   </div>
                   <div className="space-y-1 text-left">
                    <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest ml-1">Set Master Passphrase</label>
                    <input
                      type="password"
                      required
                      value={passphrase}
                      onChange={(e) => setPassphrase(e.target.value)}
                      placeholder="Enter a strong passphrase"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-white transition-colors"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isUnlocking || !passphrase}
                    className="w-full flex items-center justify-center bg-white text-zinc-900 font-semibold py-3 px-4 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                  >
                    {isUnlocking ? (
                      <span className="animate-pulse">Deriving Identity...</span>
                    ) : (
                      <>
                        <ShieldHalf size={18} className="mr-2 group-hover:scale-110 transition-transform" />
                        Seal Hybrid Vault
                      </>
                    )}
                  </button>
                  <button 
                    type="button"
                    onClick={() => { setVaultMode('hard'); setError(null); }}
                    className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors w-full"
                  >
                    Back to Hardware Mode
                  </button>
                </form>
              )}
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-zinc-800 w-full text-center">
            <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">SWA Protocol • SOVEREIGN</span>
          </div>
        </div>
      </div>
    </div>
  );
}
