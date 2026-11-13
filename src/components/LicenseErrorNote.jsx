import React from 'react';
import { AlertCircle } from 'lucide-react';

// One way to show a licence problem, wherever a key is entered. Not red (house rule): an
// amber-tinted panel with dark text. For a key that is already active elsewhere it adds the
// next step - a buyer who met "This license key has reached the activation limit." in red
// had nothing to do but give up.
const FREE_LICENCE_MAILTO = 'mailto:contact@esgforsuppliers.com?subject=Free%20my%20licence';

export default function LicenseErrorNote({ message, code, t }) {
  if (!message) return null;
  return (
    <div role="alert" data-testid="license-error" className="flex items-start gap-2 border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
      <div>
        <p>{message}</p>
        {code === 'limit_reached' && (
          <a href={FREE_LICENCE_MAILTO} className="mt-1 inline-block font-semibold underline underline-offset-2">
            {t('lic.err.limitReachedCta')}
          </a>
        )}
      </div>
    </div>
  );
}
