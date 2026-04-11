import React from 'react';
import { ArrowLeft } from 'lucide-react';

export default function Terms({ navigate }: { navigate: (route: string) => void }) {
  return (
    <div className="min-h-screen bg-[#f5f5f4] text-[#0a0a0a] font-sans">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <button 
          onClick={() => navigate('landing')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>
        
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        
        <div className="prose prose-gray max-w-none space-y-6 text-gray-700">
          <p><strong>Last Updated: April 10, 2026</strong></p>
          
          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Acceptance of Terms</h2>
          <p>
            By accessing and using Sovereignty Invoices, you accept and agree to be bound by the terms and provision of this agreement.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. Description of Service</h2>
          <p>
            Sovereignty Invoices is a free, local-first invoice generation tool. The service is provided "as is" and "as available" without any warranties of any kind.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. Data Responsibility & Liability</h2>
          <p>
            <strong>CRITICAL:</strong> Because this application stores data locally in your web browser, <strong>you are solely responsible for backing up your data.</strong> 
          </p>
          <p>
            If you clear your browser cache, uninstall your browser, or lose your device, your data will be permanently lost. Sovereignty Apps shall not be liable for any lost data, lost profits, or any special, incidental, or consequential damages arising out of or in connection with our site or services.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Acceptable Use</h2>
          <p>
            You agree not to use the service for any illegal or unauthorized purpose. You must not, in the use of the service, violate any laws in your jurisdiction.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Modifications to Service</h2>
          <p>
            We reserve the right to modify or discontinue, temporarily or permanently, the service with or without notice at any time.
          </p>
        </div>
      </div>
    </div>
  );
}
