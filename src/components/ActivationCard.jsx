import React, { useState } from 'react';
import { useLicense } from '@/components/LicenseContext';
import { useLanguage } from '@/components/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Key, Loader2, CheckCircle2, X, Mail } from 'lucide-react';

const DISMISS_KEY = 'esg_passport_activation_card_dismissed';

// Maps ?welcome=<value> to a tier type. Any truthy value falls back to the default
// (keeps the legacy ?welcome=1 redirect working). The localized copy is resolved in
// the component via t(), so this stays language-agnostic.
function normalizeWelcomeType(raw) {
  if (!raw) return null;
  const v = raw.toLowerCase();
  if (v === 'pro-plus' || v === 'proplus' || v === 'pro+') return 'proplus';
  return 'default';
}

export default function ActivationCard() {
  const { isPaid, activate, isChecking } = useLicense();
  const { lang, t } = useLanguage();
  const [dismissed, setDismissed] = useState(() => !!localStorage.getItem(DISMISS_KEY));
  const [licenseKey, setLicenseKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const welcomeType = typeof window !== 'undefined'
    ? normalizeWelcomeType(new URLSearchParams(window.location.search).get('welcome'))
    : null;
  const justPurchased = welcomeType !== null;

  // Don't pop up while the license context is still deciding — otherwise
  // buyers with the ?activate= auto-flow would briefly see the modal before
  // it self-dismisses.
  if (isChecking) return null;
  if (isPaid) return null;
  if (!justPurchased) return null;
  if (dismissed) return null;

  async function handleActivate(e) {
    e.preventDefault();
    const key = licenseKey.trim();
    if (!key) {
      setError(t('act.pasteKey'));
      return;
    }
    setLoading(true);
    setError('');
    const result = await activate(key);
    if (!result.valid) setError(result.error);
    setLoading(false);
  }

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  }

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) dismiss();
  }

  const headline = justPurchased ? t('act.welcomeHeadline') : t('act.haveKey');
  const subheadline = justPurchased
    ? (welcomeType === 'proplus' ? t('act.subProPlus') : t('act.subDefault'))
    : t('act.subGeneric');
  const paidPlanUrl = lang === 'de'
    ? 'https://esgforsuppliers.com/de/passport'
    : 'https://esgforsuppliers.com/passport';

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 animate-in fade-in"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="activation-card-title"
    >
      <div className={`relative w-full max-w-xl bg-white shadow-xl rounded-none border-2 ${justPurchased ? 'border-emerald-500' : 'border-slate-200'}`}>
        <button
          onClick={dismiss}
          aria-label={t('act.close')}
          className="absolute top-3 right-3 p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6">
          <div className="flex items-start gap-3 mb-4 pr-8">
            <div className={`w-10 h-10 flex items-center justify-center shrink-0 ${justPurchased ? 'bg-emerald-600' : 'bg-slate-900'}`}>
              {justPurchased ? <CheckCircle2 className="w-5 h-5 text-white" /> : <Key className="w-5 h-5 text-white" />}
            </div>
            <div>
              <h2 id="activation-card-title" className="text-base font-semibold text-slate-900">{headline}</h2>
              <p className="text-sm text-slate-600 mt-1">{subheadline}</p>
            </div>
          </div>

          <form onSubmit={handleActivate} className="space-y-3">
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
                placeholder="XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
                className="h-10 pl-10 font-mono text-xs"
                disabled={loading}
                autoFocus
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button
              type="submit"
              className="w-full h-10 bg-slate-900 hover:bg-slate-800 text-white"
              disabled={loading}
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('act.activating')}</>
              ) : (
                t('settings.activateLicense')
              )}
            </Button>
          </form>

          <p className="text-xs text-slate-500 mt-4 flex items-center gap-1.5">
            <Mail className="w-3 h-3" />
            {justPurchased
              ? <>{t('act.spamText')} <a href="mailto:contact@esgforsuppliers.com" className="underline">{t('act.contactSupport')}</a>.</>
              : <>{t('act.noLicenseYet')} <a href={paidPlanUrl} className="underline">{t('act.seePaidPlan')}</a></>}
          </p>
        </div>
      </div>
    </div>
  );
}
