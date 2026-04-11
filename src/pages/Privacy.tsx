import React from 'react';
import { ArrowLeft } from 'lucide-react';

export default function Privacy({ navigate }: { navigate: (route: string) => void }) {
  return (
    <div className="min-h-screen bg-[#f5f5f4] text-[#0a0a0a] font-sans">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <button 
          onClick={() => navigate('landing')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>
        
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        
        <div className="prose prose-gray max-w-none space-y-6 text-gray-700">
          <p><strong>Last Updated: April 10, 2026</strong></p>
          
          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. The "Zero-Operating-Cost" Promise</h2>
          <p>
            Sovereignty Invoices is built on a local-first architecture. This means that <strong>we do not have servers, we do not have a central database, and we literally cannot see your data.</strong>
          </p>
          <p>
            All of your clients, invoices, and settings are stored locally in your web browser using PGlite (a local PostgreSQL database).
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. Analytics and Tracking</h2>
          <p>
            We do not use Google Analytics, Facebook Pixels, or any other third-party tracking scripts. We do not know who you are, how many invoices you create, or how much money you make.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. Data Deletion</h2>
          <p>
            Because your data lives on your device, you are in complete control of its deletion. You can delete your data at any time by clearing your browser's site data/cookies.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Contact</h2>
          <p>
            If you have any questions about this privacy policy, please contact us at sovereigntyapps@gmail.com.
          </p>
        </div>
      </div>
    </div>
  );
}
