// ============================================
// LICENSE KEY VALIDATION (via Vercel proxy)
// ============================================
// Browser can't call LemonSqueezy API directly (CORS).
// Calls /api/validate-license and /api/deactivate-license instead.

const LICENSE_STORAGE_KEY = 'esg_passport_license';

// Use relative URL in production (same origin), absolute for local dev
function apiUrl(path) {
  // Vite dev server runs on a different port than Vercel functions
  // In production, /api/* routes are served by Vercel serverless functions
  return path;
}

/**
 * Validate a license key via our server-side proxy.
 * Returns { valid, error, instance_id } on success.
 */
export async function validateLicenseKey(key) {
  try {
    const response = await fetch(apiUrl('/api/validate-license'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        license_key: key,
        instance_name: getInstanceName(),
      }),
    });

    const data = await response.json();

    if (data.valid) {
      return { valid: true, instance_id: data.instance?.id || null };
    }

    // Map common error codes to user-friendly messages
    const errorMessages = {
      'not_found': 'License key not found. Please check and try again.',
      'expired': 'This license has expired. Please renew at esgforsuppliers.com.',
      'disabled': 'This license has been deactivated. Please contact support.',
      'limit_reached': 'This license is already active on another device. Please deactivate it there first, or contact support.',
    };

    return {
      valid: false,
      error: errorMessages[data.error] || data.error || 'Invalid license key.',
    };
  } catch (err) {
    return {
      valid: false,
      error: 'Could not verify license. Please check your internet connection and try again.',
    };
  }
}

/**
 * Deactivate a license instance (for "log out" or device transfer).
 */
export async function deactivateLicense() {
  const stored = getStoredLicense();
  if (!stored?.key || !stored?.instance_id) return;

  try {
    await fetch(apiUrl('/api/deactivate-license'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        license_key: stored.key,
        instance_id: stored.instance_id,
      }),
    });
  } catch {
    // Silently fail — user can still clear local storage
  }

  localStorage.removeItem(LICENSE_STORAGE_KEY);
}

/**
 * Store a validated license in localStorage.
 */
export function storeLicense(key, instance_id) {
  localStorage.setItem(LICENSE_STORAGE_KEY, JSON.stringify({
    key,
    instance_id,
    activated_at: new Date().toISOString(),
    last_validated: new Date().toISOString(),
  }));
}

/**
 * Get stored license from localStorage.
 */
export function getStoredLicense() {
  try {
    const raw = localStorage.getItem(LICENSE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Check if the user has an active license (local check only).
 */
export function hasActiveLicense() {
  const stored = getStoredLicense();
  return stored?.key && stored?.activated_at ? true : false;
}

/**
 * Check if the user has paid Pro features (response generator, requests).
 * Free tier: data tracking, dashboard, settings, onboarding.
 * Paid tier: questionnaire upload, answer generation, request management.
 */
export function isPaidUser() {
  return hasActiveLicense();
}

/**
 * Re-validate a stored license key (e.g., on app launch, once per week).
 * Returns true if still valid, false if expired/revoked.
 * On network error, assumes still valid (offline-friendly).
 */
export async function revalidateStoredLicense() {
  const stored = getStoredLicense();
  if (!stored?.key) return false;

  // Only re-validate once per 7 days
  const lastValidated = stored.last_validated ? new Date(stored.last_validated) : new Date(0);
  const daysSinceValidation = (Date.now() - lastValidated.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceValidation < 7) return true;

  try {
    const result = await validateLicenseKey(stored.key);
    if (result.valid) {
      storeLicense(stored.key, result.instance_id || stored.instance_id);
      return true;
    }

    // Only revoke if we got a definitive "invalid" from the API
    if (result.error && !result.error.includes('internet connection')) {
      localStorage.removeItem(LICENSE_STORAGE_KEY);
      return false;
    }
  } catch {
    // Network error — don't revoke, assume still valid
  }

  return true;
}

/**
 * Generate a stable instance name for this browser/device.
 */
function getInstanceName() {
  const ua = navigator.userAgent || 'unknown';
  const lang = navigator.language || 'en';
  return `web-${lang}-${ua.slice(0, 40)}`;
}
