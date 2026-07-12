import React, { useState } from 'react';
import { useLicense } from '@/components/LicenseContext';
import { useLanguage } from '@/components/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Shield, Key, ExternalLink, Loader2, Upload, Sparkles, ListChecks, Globe,
  Mail, FileText, CheckCircle2,
} from 'lucide-react';

// Copy is stored as i18n keys and resolved with t() at render (module-level, no hook here).
const GATE_CONTENT = {
  'ESG Report': {
    titleKey: 'gate.reportTitle',
    descKey: 'gate.reportDesc',
    features: [
      { icon: FileText, textKey: 'gate.reportF1' },
      { icon: CheckCircle2, textKey: 'gate.reportF2' },
      { icon: Globe, textKey: 'gate.reportF3' },
      { icon: Sparkles, textKey: 'gate.reportF4' },
    ],
  },
  default: {
    titleKey: 'gate.defaultTitle',
    descKey: 'gate.defaultDesc',
    features: [
      { icon: Upload, textKey: 'gate.defaultF1' },
      { icon: Sparkles, textKey: 'gate.defaultF2' },
      { icon: ListChecks, textKey: 'gate.defaultF3' },
      { icon: Globe, textKey: 'gate.defaultF4' },
    ],
  },
};

/**
 * Shows an upgrade prompt for free users trying to access paid features.
 * Includes license key activation inline - no redirect needed.
 */
export default function UpgradeGate({ feature }) {
  const { activate } = useLicense();
  const { t } = useLanguage();
  const [licenseKey, setLicenseKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const content = GATE_CONTENT[feature] || GATE_CONTENT.default;

  async function handleActivate(e) {
    e.preventDefault();
    const key = licenseKey.trim();
    if (!key) {
      setError(t('settings.enterKey'));
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
            {t(content.titleKey)}
          </h2>
          <p className="text-slate-500 max-w-md mx-auto">
            {t(content.descKey)}
          </p>
        </div>

        <div className="space-y-3 mb-8">
          {content.features.map((item, index) => (
            <div key={index} className="flex items-start gap-3">
              <item.icon className="w-5 h-5 text-slate-700 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-slate-600">{t(item.textKey)}</span>
            </div>
          ))}
        </div>

        <a
          href="https://catyeldi.lemonsqueezy.com/checkout/buy/d5cb1011-fdd1-4936-afe8-819f53073970"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-none transition-colors mb-6"
        >
          {t('gate.cta')}
          <ExternalLink className="w-4 h-4" />
        </a>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-3 text-slate-400">{t('respond.alreadyPurchased')}</span>
          </div>
        </div>

        <form onSubmit={handleActivate} className="space-y-3">
          <div className="relative">
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
              placeholder={t('settings.licenseKeyPh')}
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
                {t('gate.validating')}
              </>
            ) : (
              t('settings.activateLicense')
            )}
          </Button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          <Mail className="w-3 h-3 inline mr-1" />
          {t('gate.questions')} <a href="mailto:contact@esgforsuppliers.com" className="underline hover:text-slate-600">contact@esgforsuppliers.com</a>
        </p>
      </div>
    </div>
  );
}
