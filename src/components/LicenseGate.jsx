import React, { useState, useEffect } from 'react';
import { Shield, Key, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  hasActiveLicense,
  validateLicenseKey,
  storeLicense,
  revalidateStoredLicense,
} from '@/lib/license';

/**
 * Wraps the entire app. Shows license activation screen if no valid license.
 * Once activated, renders children (the actual app).
 */
export default function LicenseGate({ children }) {
  const [status, setStatus] = useState('checking'); // checking | unlocked | locked
  const [licenseKey, setLicenseKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkLicense();
  }, []);

  async function checkLicense() {
    if (!hasActiveLicense()) {
      setStatus('locked');
      return;
    }

    // Has a stored key — re-validate in background
    const valid = await revalidateStoredLicense();
    setStatus(valid ? 'unlocked' : 'locked');
  }

  async function handleActivate(e) {
    e.preventDefault();
    const key = licenseKey.trim();
    if (!key) {
      setError('Please enter a license key.');
      return;
    }

    setLoading(true);
    setError('');

    const result = await validateLicenseKey(key);

    if (result.valid) {
      storeLicense(key, result.instance_id);
      setStatus('unlocked');
    } else {
      setError(result.error);
    }

    setLoading(false);
  }

  // Still checking stored license
  if (status === 'checking') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
      </div>
    );
  }

  // License valid — render the app
  if (status === 'unlocked') {
    return children;
  }

  // No license — show activation screen
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl p-8 shadow-xl border border-slate-200">
          <div className="text-center space-y-3 mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-800 mb-2">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">ESG Passport</h1>
            <p className="text-slate-500">
              Enter your license key to get started.
            </p>
          </div>

          <form onSubmit={handleActivate} className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value)}
                  placeholder="XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
                  className="h-12 pl-10 font-mono text-sm"
                  disabled={loading}
                  autoFocus
                />
              </div>
              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base"
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

          <div className="mt-8 pt-6 border-t border-slate-200 space-y-3">
            <a
              href="https://esgforsuppliers.com/passport"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Get a license at esgforsuppliers.com
            </a>
            <p className="text-xs text-slate-400 text-center">
              Your license key was emailed after purchase. Check your inbox for an email from Ecosystems United.
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-slate-400">
            ESG Passport by ESG for Suppliers
          </p>
        </div>
      </div>
    </div>
  );
}
