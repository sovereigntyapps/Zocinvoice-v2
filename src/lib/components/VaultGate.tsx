import React, { useState, useEffect } from 'react';
import { Fingerprint, Lock, ShieldCheck, AlertTriangle, KeyRound, ShieldHalf, LayoutDashboard } from 'lucide-react';
import { createVault, unlockVault, isGhostVaultSupported, WebAuthnVaultError, deriveKeyFromPassphrase, createVerificationToken, verifyKey } from '../vault';

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
      
      const token = await createVerificationToken(derivedKey);
      localStorage.setItem('WA_VAULT_VERIFY', token);
      
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
      
      const token = await createVerificationToken(derivedKey);
      localStorage.setItem('WA_VAULT_VERIFY', token);
      
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
        
        const token = localStorage.getItem('WA_VAULT_VERIFY');
        if (token) {
          const isValid = await verifyKey(derivedKey, token);
          if (!isValid) throw new Error("Security verification failed. Invalid biometrics.");
        }
        
        onUnlocked(derivedKey);
        setUnlocked(true);
      } else {
        if (!passphrase) {
          setError("Passphrase required.");
          return;
        }
        const derivedKey = await deriveKeyFromPassphrase(passphrase);
        
        const token = localStorage.getItem('WA_VAULT_VERIFY');
        if (token) {
          const isValid = await verifyKey(derivedKey, token);
          if (!isValid) {
            setError("Incorrect passphrase.");
            return;
          }
        }
        
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
      localStorage.removeItem('WA_VAULT_VERIFY');
      setHasVault(false);
      setVaultMode('hard');
      setError(null);
      setPassphrase('');
      setShowHybridOption(false);
    }
  };

  // If successfully unlocked, render the application
  if (unlocked) {
    return <>{children}</>;
  }

  // Render the Security interface
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 text-zinc-900 font-sans p-6 select-none">
      <div className="max-w-md w-full bg-white border border-zinc-200 rounded-[48px] p-12 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] relative overflow-hidden">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-50"></div>
        
        <div className="text-center relative z-10 flex flex-col items-center">
          <div className="h-20 w-20 bg-zinc-900 border border-zinc-800 shadow-xl rounded-[28px] flex items-center justify-center mb-8 transform hover:scale-105 transition-transform">
            {vaultMode === 'hard' ? (
               hasVault ? <Lock className="text-white" size={32} /> : <ShieldCheck className="text-white" size={32} />
            ) : (
              <ShieldHalf className="text-white" size={32} />
            )}
          </div>
          
          <h1 className="text-4xl font-black text-zinc-900 mb-2 tracking-tighter uppercase leading-none">
            {vaultMode === 'hard' ? 'Security' : 'Access'}
          </h1>
          <p className="text-[10px] font-black text-zinc-400 mb-10 uppercase tracking-[0.3em]">
            {vaultMode === 'hard' ? 'Biometric Unlock' : 'Password Login'}
          </p>

          <p className="text-sm text-zinc-500 mb-10 max-w-xs leading-relaxed italic">
            {vaultMode === 'hard' 
              ? (hasVault 
                  ? "Use your biometric signature to securely unlock your local data." 
                  : "Enable security to protect your data with a unique hardware-derived key.")
              : "Standard Security: Protect your data with a master passphrase."}
          </p>

          {supported === false && vaultMode === 'hard' && !hasVault && (
            <div className="bg-zinc-50 border border-zinc-200 text-zinc-600 text-xs p-5 rounded-[24px] mb-8 flex flex-col items-start text-left w-full gap-3">
              <div className="flex items-center">
                <AlertTriangle size={18} className="mr-2 flex-shrink-0 text-amber-500" />
                <span className="font-black text-zinc-900 uppercase tracking-tight">Biometrics Unavailable</span>
              </div>
              <p className="text-zinc-500 leading-relaxed font-medium">
                Your device does not support WebAuthn hardware keys. You are still fully secured by our cryptographic password derivation (PBKDF2).
              </p>
              <button 
                onClick={() => { setVaultMode('hybrid'); setError(null); }}
                className="text-zinc-900 font-black uppercase tracking-widest text-[10px] underline underline-offset-4 mt-1"
              >
                Use Password Mode
              </button>
            </div>
          )}

          {showHybridOption && !hasVault && vaultMode === 'hard' && (
             <div className="bg-zinc-50 border border-zinc-200 text-zinc-600 text-xs p-5 rounded-[24px] mb-8 flex flex-col items-start text-left w-full gap-3">
                <div className="flex items-center">
                  <Fingerprint size={18} className="mr-2 flex-shrink-0 text-amber-500" />
                  <span className="font-black text-zinc-900 uppercase tracking-tight">Init Failed</span>
                </div>
                <p className="font-medium text-zinc-500 leading-relaxed">Hardware security is not available. Rest assured, you are still fully secured by our cryptographic password derivation.</p>
                <button 
                  onClick={() => { setVaultMode('hybrid'); setError(null); }}
                  className="text-zinc-900 font-black uppercase tracking-widest text-[10px] underline underline-offset-4 mt-1"
                >
                  Use Password Mode
                </button>
             </div>
          )}

          {window.self !== window.top && (
            <div className="bg-amber-50 border border-amber-100 text-amber-600 text-xs p-6 rounded-[24px] mb-8 flex flex-col items-start text-left w-full gap-3">
              <div className="flex items-start">
                <AlertTriangle size={18} className="mr-3 flex-shrink-0 mt-0.5" />
                <span className="font-black uppercase tracking-tight">Environment Alert</span>
              </div>
              <p className="italic text-amber-700">WebAuthn requires a top-level window. Open the application in a new tab via the ↗️ button to initialize hardware identity.</p>
            </div>
          )}

          {error && (
            <div className="bg-zinc-900 text-white font-mono text-[10px] p-5 rounded-[24px] mb-10 w-full uppercase tracking-widest leading-loose">
              {error.includes("publickey-credentials-create") || error.includes("publickey-credentials-get") ? "Access Denied: WebAuthn restricted in current context. Use new tab." : error}
            </div>
          )}

          {hasVault ? (
            <div className="w-full space-y-6">
              {vaultMode === 'hybrid' && (
                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Master Passphrase</label>
                  <input
                    type="password"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-[20px] py-4 px-6 text-zinc-900 font-black focus:outline-none focus:ring-2 focus:ring-zinc-900/5 transition-all text-center tracking-widest"
                  />
                </div>
              )}
              <button
                onClick={handleUnlock}
                disabled={isUnlocking || (vaultMode === 'hard' && window.self !== window.top)}
                className="w-full flex items-center justify-center bg-zinc-950 text-white font-black uppercase tracking-widest text-[10px] py-5 px-6 rounded-[24px] hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed group shadow-2xl shadow-zinc-900/20 active:scale-95"
              >
                {isUnlocking ? (
                  <span className="animate-pulse">Deriving Key...</span>
                ) : (
                  <>
                    {vaultMode === 'hard' ? <Fingerprint size={18} className="mr-3" /> : <Lock size={18} className="mr-3" />}
                    {vaultMode === 'hard' ? 'Unlock Account' : 'Login'}
                  </>
                )}
              </button>
              <button 
                onClick={handleReset}
                className="text-[10px] font-black text-zinc-400 hover:text-zinc-900 transition-colors w-full uppercase tracking-[0.2em]"
              >
                Reset Node Identity
              </button>
            </div>
          ) : (
            <div className="w-full space-y-6">
              {vaultMode === 'hard' ? (
                <button
                  onClick={handleCreateVault}
                  disabled={isUnlocking || supported === false || window.self !== window.top}
                  className="w-full flex items-center justify-center bg-zinc-950 text-white font-black uppercase tracking-widest text-[10px] py-5 px-6 rounded-[24px] hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed group shadow-2xl shadow-zinc-900/40 active:scale-95"
                >
                  {isUnlocking ? (
                    <span className="animate-pulse">Sealing Vault...</span>
                  ) : (
                    <>
                      <KeyRound size={18} className="mr-3 group-hover:rotate-12 transition-transform" />
                      Set up Security
                    </>
                  )}
                </button>
              ) : (
                <form onSubmit={handleCreateHybridVault} className="space-y-6">
                   <div className="text-left text-zinc-500 text-[11px] font-medium px-2 mb-2 leading-relaxed bg-zinc-100 p-4 rounded-2xl border border-zinc-200">
                      <strong className="text-zinc-900 font-bold block mb-1">Hardware Setup Skipped</strong>
                      You are still fully secured by our offline cryptographic key derivation process. Choose a strong master passphrase.
                   </div>
                   <div className="space-y-2 text-left">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Set Master Passphrase</label>
                    <input
                      type="password"
                      required
                      value={passphrase}
                      onChange={(e) => setPassphrase(e.target.value)}
                      placeholder="Enter Secure Phrase"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-[20px] py-4 px-6 text-zinc-900 font-black focus:outline-none focus:ring-2 focus:ring-zinc-900/5 transition-all text-center tracking-widest"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isUnlocking || !passphrase}
                    className="w-full flex items-center justify-center bg-zinc-950 text-white font-black uppercase tracking-widest text-[10px] py-5 px-6 rounded-[24px] hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed group shadow-2xl shadow-zinc-900/40 active:scale-95"
                  >
                    {isUnlocking ? (
                      <span className="animate-pulse">Deriving Identity...</span>
                    ) : (
                      <>
                        <ShieldHalf size={18} className="mr-3" />
                        Enable Security
                      </>
                    )}
                  </button>
                  <button 
                    type="button"
                    onClick={() => { setVaultMode('hard'); setError(null); }}
                    className="text-[10px] font-black text-zinc-400 hover:text-zinc-900 transition-colors w-full uppercase tracking-[0.2em]"
                  >
                    Back to Hardware
                  </button>
                </form>
              )}
            </div>
          )}

          <div className="mt-12 pt-8 border-t border-zinc-50 w-full text-center">
            <span className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.4em]">Local First • Private App</span>
          </div>
        </div>
      </div>
    </div>
  );
}
