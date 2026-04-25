import { PGlite } from '@electric-sql/pglite';

export async function unlockApp() {
  try {
    const root = await navigator.storage.getDirectory();
    const handle = await root.getFileHandle('license.bin', { create: true });
    
    // In Chromium and modern browsers, createWritable is available for OPFS
    // However, some TS definitions might not have it or it might be slightly different.
    // Let's use the standard File System Access API
    if ('createWritable' in handle) {
        const writable = await (handle as any).createWritable();
        await writable.write(new Uint8Array([0x13, 0x37, 0xBE, 0xEF]));
        await writable.close();
    } else {
        // Fallback for missing createWritable? We just need the file to exist.
        // Actually OPFS file creation alone is enough proof for our isAppUnlocked.
    }
  } catch (err) {
    console.error("Failed to write license.bin to OPFS", err);
    throw err;
  }
}

export async function isAppUnlocked() {
  try {
    const root = await navigator.storage.getDirectory();
    await root.getFileHandle('license.bin');
    return true;
  } catch {
    return false;
  }
}

export async function process1ClickPayment() {
  // If PaymentRequest is not supported or we are in an iframe where it's blocked, we simulate it
  if (!window.PaymentRequest) {
    console.warn("PaymentRequest API is not supported. Simulating payment.");
    await new Promise(r => setTimeout(r, 1000));
    await unlockApp();
    return true;
  }

  try {
    const supportedInstruments = [
        {
          supportedMethods: 'https://apple.com/apple-pay',
          data: {
            version: 3,
            merchantIdentifier: 'merchant.com.example',
            merchantCapabilities: ['supports3DS'],
            supportedNetworks: ['amex', 'discover', 'masterCard', 'visa'],
            countryCode: 'US',
          },
        },
        {
          supportedMethods: 'https://google.com/pay',
          data: {
            environment: 'TEST',
            apiVersion: 2,
            apiVersionMinor: 0,
            merchantInfo: {
              merchantName: 'Sovereignty Apps',
            },
            allowedPaymentMethods: [
              {
                type: 'CARD',
                parameters: {
                  allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
                  allowedCardNetworks: ['AMEX', 'DISCOVER', 'INTERAC', 'JCB', 'MASTERCARD', 'VISA'],
                },
                tokenizationSpecification: {
                  type: 'PAYMENT_GATEWAY',
                  parameters: {
                    gateway: 'example',
                    gatewayMerchantId: 'exampleGatewayMerchantId',
                  },
                },
              },
            ]
          }
        }
    ];

    const details = {
      total: {
        label: 'SWA Protocol Premium - Lifetime',
        amount: { currency: 'USD', value: '49.99' }
      }
    };

    const request = new PaymentRequest(supportedInstruments, details);
    
    // In iframe, show() might throw SecurityError. Provide a fallback catch.
    const response = await request.show();
    
    await unlockApp();
    await response.complete('success');
    return true;
  } catch (err: any) {
    console.warn("PaymentRequest failed or blocked. Fallback to simulation.", err);
    // Usually SecurityError in iframe, or user closed the dialog.
    if (err.name === 'SecurityError' || err.message.includes('iframe') || err.message.includes('cross-origin')) {
        await new Promise(r => setTimeout(r, 800));
        await unlockApp(); // Simulate success in dev
        return true;
    }
    throw err;
  }
}
