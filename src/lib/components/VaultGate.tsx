import React, { useState, useEffect } from 'react';
import { Fingerprint, Lock, ShieldCheck, AlertTriangle, KeyRound } from 'lucide-react';
import { createVault, unlockVault, isGhostVaultSupported, WebAuthnVaultError } from '../vault';

interface VaultGateProps {
  children: React.ReactNode;
  onUnlocked: (key: Uint8Array) => void;
}

export default function VaultGate({ children, onUnlocked }: VaultGateProps) {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [hasVault, setHasVault] = useState<boolean>(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    isGhostVaultSupported().then(res => setSupported(res));
    const savedCredId = localStorage.getItem('WA_VAULT_CRED_ID');
    if (savedCredId) {
      setHasVault(true);
    }
  }, []);

  const handleCreateVault = async () => {
    try {
      setIsUnlocking(true);
      setError(null);
      const { credentialId } = await createVault();
      
      // Save the credential ID locally. This is NOT a secret. It just identifies the hardware key.
      localStorage.setItem('WA_VAULT_CRED_ID', credentialId);
      setHasVault(true);
      
      // Wait a moment and then automatically trigger unlock to derive the key
      const { derivedKey } = await unlockVault(credentialId);
      onUnlocked(derivedKey);
      setUnlocked(true);
    } catch (err: any) {
      console.error(err);
      setError(err instanceof WebAuthnVaultError ? err.message : 'An unexpected error occurred during vault creation.');
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleUnlock = async () => {
    try {
      setIsUnlocking(true);
      setError(null);
      const savedCredId = localStorage.getItem('WA_VAULT_CRED_ID');
      if (!savedCredId) throw new Error("Vault not found.");

      const { derivedKey } = await unlockVault(savedCredId);
      onUnlocked(derivedKey);
      setUnlocked(true);
    } catch (err: any) {
      console.error(err);
      setError(err instanceof WebAuthnVaultError ? err.message : 'Biometric unlock failed. Please try again.');
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleReset = () => {
    if (window.confirm("WARNING: This will sever the connection to your hardware key. If data was encrypted with it, it will be lost forever. Continue?")) {
      localStorage.removeItem('WA_VAULT_CRED_ID');
      setHasVault(false);
      setError(null);
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
            {hasVault ? <Lock className="text-zinc-100" size={28} /> : <ShieldCheck className="text-zinc-100" size={28} />}
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Identity Enclave</h1>
          <p className="text-sm text-zinc-400 mb-8 max-w-xs leading-relaxed">
            {hasVault 
              ? "Biometric signature required to derive decryption keys and unlock local storage." 
              : "Initialize the SWA Protocol. Secure your data with a hardware-derived PRF key."}
          </p>

          {supported === false && (
            <div className="bg-red-950/30 border border-red-900 text-red-400 text-xs p-3 rounded mb-6 flex items-start text-left">
              <AlertTriangle size={16} className="mr-2 flex-shrink-0 mt-0.5" />
              <span>Your browser does not support WebAuthn or the hardware required for PRF key derivation.</span>
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
              <button
                onClick={handleUnlock}
                disabled={isUnlocking || window.self !== window.top}
                className="w-full flex items-center justify-center bg-white text-zinc-900 font-semibold py-3 px-4 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {isUnlocking ? (
                  <span className="animate-pulse">Deriving Key...</span>
                ) : (
                  <>
                    <Fingerprint size={18} className="mr-2 group-hover:scale-110 transition-transform" />
                    Unlock Vault
                  </>
                )}
              </button>
              <button 
                onClick={handleReset}
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors w-full"
              >
                Reset Vault Connection
              </button>
            </div>
          ) : (
            <button
              onClick={handleCreateVault}
              disabled={isUnlocking || supported === false || window.self !== window.top}
              className="w-full flex items-center justify-center bg-white text-zinc-900 font-semibold py-3 px-4 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
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
          )}

          <div className="mt-8 pt-6 border-t border-zinc-800 w-full text-center">
            <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">SWA Protocol • SOVEREIGN</span>
          </div>
        </div>
      </div>
    </div>
  );
}
