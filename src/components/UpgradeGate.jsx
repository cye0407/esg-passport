import React, { useState } from 'react';
import { useLicense } from '@/components/LicenseContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Shield, Key, ExternalLink, Loader2, Upload, Sparkles, ListChecks, Globe,
  Mail, FileText, Inbox, CheckCircle2,
} from 'lucide-react';

const GATE_CONTENT = {
  'ESG Report': {
    description: 'Upgrade to ESG Passport Pro to turn your tracked data into a shareable ESG Passport report.',
    features: [
      { icon: FileText, text: 'Generate a shareable ESG Passport from your tracked data' },
      { icon: CheckCircle2, text: 'Show buyers your latest metrics, policies, and company profile in one place' },
      { icon: Globe, text: 'Export a professional report you can review before sending' },
      { icon: Sparkles, text: 'Keep your passport updated as your data changes' },
    ],
    cta: 'Get ESG Passport Pro - €299',
  },
  'Request Management': {
    description: 'Upgrade to ESG Passport Pro to track customer questionnaires, deadlines, and prepared responses in one workflow.',
    features: [
      { icon: Inbox, text: 'Track incoming customer requests and deadlines in one place' },
      { icon: Upload, text: 'Open each request directly in the response workflow' },
      { icon: ListChecks, text: 'Keep prepared answers, review status, and follow-up work organized' },
      { icon: Sparkles, text: 'Reduce manual back-and-forth when multiple questionnaires are in flight' },
    ],
    cta: 'Get ESG Passport Pro - €299',
  },
  default: {
    description: 'Upgrade to ESG Passport Pro to upload questionnaires and prepare professional answer drafts from your tracked data.',
    features: [
      { icon: Upload, text: 'Upload any questionnaire - Excel, CSV, PDF, or Word' },
      { icon: Sparkles, text: '200+ answer templates matched to your questions automatically' },
      { icon: ListChecks, text: 'Pre-loaded templates for EcoVadis, CDP, and CSRD/VSME' },
      { icon: Globe, text: 'Editable answers with inline edit, mark N/A, and save to library' },
    ],
    cta: 'Get ESG Passport Pro - €299',
  },
};

/**
 * Shows an upgrade prompt for free users trying to access paid features.
 * Includes license key activation inline - no redirect needed.
 */
export default function UpgradeGate({ feature }) {
  const { activate } = useLicense();
  const [licenseKey, setLicenseKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const content = GATE_CONTENT[feature] || GATE_CONTENT.default;

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

    setLoading(false);
  }

  return (
    <div className="max-w-xl mx-auto py-12">
      <div className="bg-white border border-slate-200 rounded-none p-8">
        <div className="text-center space-y-3 mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-none bg-slate-800 mb-2">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">
            Unlock {feature || 'Response Assistant'}
          </h2>
          <p className="text-slate-500 max-w-md mx-auto">
            {content.description}
          </p>
        </div>

        <div className="space-y-3 mb-8">
          {content.features.map((item, index) => (
            <div key={index} className="flex items-start gap-3">
              <item.icon className="w-5 h-5 text-slate-700 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-slate-600">{item.text}</span>
            </div>
          ))}
        </div>

        <a
          href="https://catyeldi.lemonsqueezy.com/checkout/buy/a8b7a3e5-2b8c-4f6f-922c-f5e04a08fe73"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-none transition-colors mb-6"
        >
          {content.cta}
          <ExternalLink className="w-4 h-4" />
        </a>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-3 text-slate-400">Already purchased?</span>
          </div>
        </div>

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

        <p className="text-center text-xs text-slate-400 mt-6">
          <Mail className="w-3 h-3 inline mr-1" />
          Questions? <a href="mailto:contact@esgforsuppliers.com" className="underline hover:text-slate-600">contact@esgforsuppliers.com</a>
        </p>
      </div>
    </div>
  );
}
