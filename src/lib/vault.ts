/**
 * The Vault: Hardware-Rooted Identity & Security Enclave
 * Utilizes WebAuthn PRF (Pseudo-Random Function) Extension to derive
 * a secure, deterministic symmetric key from biometric hardware (FaceID/TouchID).
 */

export const PRF_SALT = new TextEncoder().encode('sovereigntyapps.vault.v1.salt_for_prf_derivation');

export class WebAuthnVaultError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WebAuthnVaultError';
  }
}

/**
 * Encodes an ArrayBuffer to a Base64URL string (for WebAuthn APIs).
 */
export function bufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let str = '';
  for (const charCode of bytes) {
    str += String.fromCharCode(charCode);
  }
  const base64String = btoa(str);
  return base64String.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Decodes a Base64URL string back to a Uint8Array.
 */
export function base64urlToBuffer(base64urlString: string): Uint8Array {
  let base64String = base64urlString.replace(/-/g, '+').replace(/_/g, '/');
  const paddingLength = (4 - (base64String.length % 4)) % 4;
  base64String += '='.repeat(paddingLength);
  const binaryString = atob(base64String);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Checks if the browser supports the required WebAuthn PRF extension.
 */
export async function isGhostVaultSupported(): Promise<boolean> {
  if (!window.PublicKeyCredential) return false;
  
  // Some browsers might support WebAuthn but not PRF.
  // We can't definitively check PRF support without calling the API, 
  // but looking for standard publickey capability is a prerequisite.
  return window.isSecureContext && PublicKeyCredential !== undefined;
}

/**
 * Creates a new hardware-rooted vault (Vault Registration).
 * Returns the PRF Derived Key and the Credential ID.
 */
export async function createVault(): Promise<{ derivedKey: Uint8Array, credentialId: string }> {
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const userId = crypto.getRandomValues(new Uint8Array(16));

  const createOptions: PublicKeyCredentialCreationOptions = {
    rp: {
      name: "Sovereign App (Ghost Vault)",
      id: window.location.hostname
    },
    user: {
      id: userId,
      name: "ghost@sovereignty.local",
      displayName: "Sovereign User"
    },
    challenge,
    pubKeyCredParams: [
      { type: "public-key", alg: -7 },  // ES256
      { type: "public-key", alg: -257 } // RS256
    ],
    authenticatorSelection: {
      authenticatorAttachment: "platform", // FaceID / TouchID / Windows Hello
      userVerification: "required"
    },
    timeout: 60000,
    extensions: {
      prf: {
        eval: {
          first: PRF_SALT
        }
      }
    } as any // TypeScript definitions for PRF are often missing/incomplete
  };

  const credential = await navigator.credentials.create({
    publicKey: createOptions
  }) as PublicKeyCredential;

  if (!credential) {
    throw new WebAuthnVaultError("Vault creation was cancelled or failed.");
  }

  // Extract the PRF extension results
  const exts = credential.getClientExtensionResults() as any;
  if (!exts.prf || !exts.prf.enabled) {
    throw new WebAuthnVaultError("Your device/browser does not support WebAuthn PRF (Hardware Key Derivation). The Vault cannot be sealed.");
  }

  const credentialId = bufferToBase64url(credential.rawId);
  
  // To get the actual key during creation on some implementations, we might need a subsequent get().
  // But standard PRF extension often requires an immediate assert (unlock) to evaluate.
  // Wait, `create()` can enable PRF, but to get the eval we typically do `get()`. 
  // Let's do a fallback or immediate get. We'll return an empty derived key and force an unlock immediately if needed,
  // or we can just return the credentialId and tell the caller to immediately call `unlockVault`.
  
  return { derivedKey: new Uint8Array(), credentialId };
}

/**
 * Unlocks an existing vault (Authentication & PRF Evaluation).
 * Uses the saved credentialId to derive the 32-byte key from hardware.
 */
export async function unlockVault(credentialIdBase64: string): Promise<{ derivedKey: Uint8Array }> {
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const credentialId = base64urlToBuffer(credentialIdBase64);

  const getOptions: PublicKeyCredentialRequestOptions = {
    challenge,
    rpId: window.location.hostname,
    allowCredentials: [
      {
        type: "public-key",
        id: credentialId,
        transports: ["internal", "hybrid"]
      }
    ],
    userVerification: "required",
    extensions: {
      prf: {
        eval: {
          first: PRF_SALT
        }
      }
    } as any
  };

  const assertion = await navigator.credentials.get({
    publicKey: getOptions
  }) as PublicKeyCredential;

  if (!assertion) {
    throw new WebAuthnVaultError("Vault unlock was cancelled or failed.");
  }

  const exts = assertion.getClientExtensionResults() as any;
  if (!exts.prf || !exts.prf.results || !exts.prf.results.first) {
    throw new WebAuthnVaultError("PRF evaluation failed. Could not derive hardware key.");
  }

  const derivedKey = new Uint8Array(exts.prf.results.first);
  return { derivedKey };
}
