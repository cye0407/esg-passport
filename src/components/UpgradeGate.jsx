import React, { useState } from 'react';
import { useLicense } from '@/components/LicenseContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Key, ExternalLink, Loader2, Upload, Sparkles, ListChecks, Globe } from 'lucide-react';

/**
 * Shows an upgrade prompt for free users trying to access paid features.
 * Includes license key activation inline — no redirect needed.
 */
export default function UpgradeGate({ feature }) {
  const { activate } = useLicense();
  const [licenseKey, setLicenseKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleActivate(e) {
    e.preventDefault();
    const key = licenseKey.trim();
    if (!key) {
      setError('Please enter a license key.');
      return;
    }

    setLoading(true);
    setError('');

    const result = await activate(key);
    if (!result.valid) {
      setError(result.error);
    }
    // If valid, LicenseContext updates isPaid → parent re-renders without the gate

    setLoading(false);
  }

  const features = [
    { icon: Upload, text: 'Upload any questionnaire — Excel, CSV, PDF, or Word' },
    { icon: Sparkles, text: '200+ answer templates matched to your questions automatically' },
    { icon: ListChecks, text: 'Pre-loaded templates for EcoVadis, CDP, and CSRD/VSME' },
    { icon: Globe, text: 'Multi-language export (English, German, French, Spanish)' },
  ];

  return (
    <div className="max-w-xl mx-auto py-12">
      <div className="bg-white border border-slate-200 rounded-none p-8">
        <div className="text-center space-y-3 mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-none bg-slate-800 mb-2">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">
            Unlock {feature || 'Response Generator'}
          </h2>
          <p className="text-slate-500 max-w-md mx-auto">
            Upgrade to ESG Passport Pro to upload questionnaires and generate professional answers from your tracked data.
          </p>
        </div>

        {/* Feature list */}
        <div className="space-y-3 mb-8">
          {features.map((f, i) => (
            <div key={i} className="flex items-start gap-3">
              <f.icon className="w-5 h-5 text-slate-700 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-slate-600">{f.text}</span>
            </div>
          ))}
        </div>

        {/* Buy button */}
        <a
          href="https://ecosystemsunited.lemonsqueezy.com/checkout/buy/a8b7a3e5-2b8c-4f6f-922c-f5e04a08fe73"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-none transition-colors mb-6"
        >
          Upgrade to Pro — €99/year
          <ExternalLink className="w-4 h-4" />
        </a>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-3 text-slate-400">Already purchased?</span>
          </div>
        </div>

        {/* License key activation */}
        <form onSubmit={handleActivate} className="space-y-3">
          <div className="relative">
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
              placeholder="Enter your license key"
              className="h-10 pl-10 font-mono text-sm"
              disabled={loading}
            />
          </div>
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          <Button
            type="submit"
            variant="outline"
            className="w-full h-10 text-sm"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Validating...
              </>
            ) : (
              'Activate License'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
