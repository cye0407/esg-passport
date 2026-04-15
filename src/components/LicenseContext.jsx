import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  hasActiveLicense,
  validateLicenseKey,
  storeLicense,
  revalidateStoredLicense,
} from '@/lib/license';
import { track } from '@/lib/track';
import ActivationCard from '@/components/ActivationCard';

const LicenseContext = createContext({
  isPaid: false,
  isChecking: true,
  activate: async () => ({ valid: false, error: '' }),
});

export function useLicense() {
  return useContext(LicenseContext);
}

/**
 * Provides license status to the entire app.
 * Free users pass through — no blocking. License status determines
 * which features are available (data tracking = free, response generator = paid).
 */
export function LicenseProvider({ children }) {
  const [isPaid, setIsPaid] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [autoActivation, setAutoActivation] = useState(null);

  const activate = useCallback(async (key, { source = 'manual' } = {}) => {
    const result = await validateLicenseKey(key);
    if (result.valid) {
      storeLicense(key, result.instance_id);
      setIsPaid(true);
      track('license_activated', { fallback: result.fallback ? 'true' : 'false', source });
    }
    return result;
  }, []);

  useEffect(() => {
    bootstrap();
    async function bootstrap() {
      // Post-purchase redirect lands on /app/?activate=<key>. Consume it
      // before revalidating anything stored, so a fresh buyer gets flipped
      // to paid immediately without leaving the key in the URL bar.
      const urlKey = readActivationKeyFromUrl();
      if (urlKey) {
        const result = await activate(urlKey, { source: 'post_purchase_redirect' });
        setAutoActivation({ ok: result.valid, error: result.error || null });
        setIsChecking(false);
        return;
      }

      if (!hasActiveLicense()) {
        setIsPaid(false);
        setIsChecking(false);
        return;
      }
      const valid = await revalidateStoredLicense();
      setIsPaid(valid);
      setIsChecking(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <LicenseContext.Provider value={{ isPaid, isChecking, activate, autoActivation }}>
      {autoActivation && (
        <AutoActivationBanner
          result={autoActivation}
          onDismiss={() => setAutoActivation(null)}
        />
      )}
      <ActivationCard />
      {children}
    </LicenseContext.Provider>
  );
}

function AutoActivationBanner({ result, onDismiss }) {
  const success = result.ok;
  return (
    <div
      className={`fixed top-0 inset-x-0 z-50 px-4 py-3 text-sm text-white flex items-center justify-center gap-4 ${success ? 'bg-emerald-600' : 'bg-red-600'}`}
      role="status"
    >
      <span>
        {success
          ? 'Pro license activated — all features unlocked.'
          : `Activation failed: ${result.error || 'unknown error'}. Paste your key in Settings to try again.`}
      </span>
      <button
        onClick={onDismiss}
        className="underline underline-offset-2 hover:no-underline"
      >
        Dismiss
      </button>
    </div>
  );
}

function readActivationKeyFromUrl() {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const key = params.get('activate');
  if (!key) return null;
  // Strip the param so the key doesn't linger in browser history / shared links.
  params.delete('activate');
  const qs = params.toString();
  const newUrl = `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`;
  window.history.replaceState({}, document.title, newUrl);
  return key;
}
