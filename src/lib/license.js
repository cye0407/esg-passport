// ============================================
// LICENSE KEY VALIDATION (via Vercel proxy)
// ============================================
// Browser can't call LemonSqueezy API directly (CORS).
// Calls /api/validate-license and /api/deactivate-license instead.

const LICENSE_STORAGE_KEY = 'esg_passport_license';
const LICENSE_INSTANCE_NAME_KEY = 'esg_passport_license_instance_name';
// The API routes only exist on the Passport's own Vercel deployment.
// esgforsuppliers.com proxies /app/* to here but NOT /api/*, so when the
// app is loaded via the marketing-site proxy we have to call the Passport
// deployment's API directly (cross-origin, with CORS allowed by the route).
const PASSPORT_API_ORIGIN = 'https://esg-passport-seven.vercel.app';

function apiUrl(path) {
  if (typeof window === 'undefined') return `${PASSPORT_API_ORIGIN}${path}`;
  const host = window.location.hostname;
  if (host === 'esg-passport-seven.vercel.app') return path; // same-origin
  return `${PASSPORT_API_ORIGIN}${path}`;
}

function isLocalDev() {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1';
}

function generateInstanceName() {
  if (typeof window === 'undefined') return 'web-server';
  const id = window.crypto?.randomUUID?.()
    || `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `web-${id}`;
}

function getInstanceName() {
  if (typeof window === 'undefined') return 'web-server';
  const existing = localStorage.getItem(LICENSE_INSTANCE_NAME_KEY);
  if (existing) return existing;
  const generated = generateInstanceName();
  localStorage.setItem(LICENSE_INSTANCE_NAME_KEY, generated);
  return generated;
}

async function requestLicenseValidation(key, {
  allowLocalDevFallback = true,
  instanceName = getInstanceName(),
  instanceId = null,
} = {}) {
  // If we already have an instance_id, ask the server to validate it
  // (cheap, idempotent). Otherwise we're activating for the first time.
  const body = instanceId
    ? { license_key: key, instance_id: instanceId }
    : { license_key: key, instance_name: instanceName };

  const response = await fetch(apiUrl('/api/validate-license'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    if (allowLocalDevFallback && isLocalDev()) return { valid: true, instance_id: null, fallback: true };
    return { valid: false, error: 'License validation failed. Please try again.' };
  }

  const data = await response.json();

  if (!response.ok) {
    if (allowLocalDevFallback && isLocalDev() && (response.status >= 500 || data.error === 'Could not reach license server' || data.error === 'License server not configured')) {
      return { valid: true, instance_id: null, fallback: true };
    }
    return {
      valid: false,
      error: data.error || 'License validation failed.',
    };
  }

  // /activate returns { activated: true, ... }, /validate returns { valid: true, ... }
  if (data.activated || data.valid) {
    return { valid: true, instance_id: data.instance?.id || null };
  }

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
}

/**
 * Validate a license key.
 * Tries server validation first (works on hosted version at esgforsuppliers.com).
 * Falls back to format check if server is unreachable (works for downloaded zip).
 * Returns { valid, error, instance_id } on success.
 */
export async function validateLicenseKey(key, { instanceId = null } = {}) {
  // First, basic format check
  if (!key || typeof key !== 'string' || key.trim().length < 8) {
    return { valid: false, error: 'That doesn\u2019t look like a valid license key. Please check and try again.' };
  }

  try {
    return await requestLicenseValidation(key, { instanceId });
  } catch {
    // Server unreachable — likely running from downloaded zip.
    // Accept the key based on format check alone.
    return { valid: true, instance_id: null };
  }
}

/**
 * Deactivate a license instance (for "log out" or device transfer).
 */
export async function deactivateLicense() {
  const stored = getStoredLicense();
  if (!stored?.key) {
    return { ok: false, error: 'No active license found on this device.' };
  }

  let instanceId = stored.instance_id;

  if (!instanceId) {
    try {
      const refreshed = await requestLicenseValidation(stored.key, {
        allowLocalDevFallback: false,
        instanceName: stored.instance_name || getInstanceName(),
      });
      if (refreshed.valid && refreshed.instance_id) {
        instanceId = refreshed.instance_id;
        storeLicense(stored.key, instanceId, {
          activated_at: stored.activated_at,
          instance_name: stored.instance_name,
        });
      }
    } catch {
      return { ok: false, error: 'Could not reach the license server. Your license was not deactivated.' };
    }
  }

  if (!instanceId) {
    return { ok: false, error: 'Could not identify the active license instance for this device.' };
  }

  try {
    const response = await fetch(apiUrl('/api/deactivate-license'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        license_key: stored.key,
        instance_id: instanceId,
      }),
    });

    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json') ? await response.json() : null;

    if (!response.ok) {
      return { ok: false, error: data?.error || 'License deactivation failed. Please try again.' };
    }
  } catch {
    return { ok: false, error: 'Could not reach the license server. Your license was not deactivated.' };
  }

  localStorage.removeItem(LICENSE_STORAGE_KEY);
  return { ok: true };
}

/**
 * Store a validated license in localStorage.
 */
export function storeLicense(key, instance_id, metadata = {}) {
  const now = new Date().toISOString();
  localStorage.setItem(LICENSE_STORAGE_KEY, JSON.stringify({
    key,
    instance_id: instance_id ?? null,
    instance_name: metadata.instance_name || getInstanceName(),
    activated_at: metadata.activated_at || now,
    last_validated: metadata.last_validated || now,
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
 * Check if the user has paid Pro features (response assistant, requests).
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
    const result = await validateLicenseKey(stored.key, { instanceId: stored.instance_id });
    if (result.valid) {
      storeLicense(stored.key, result.instance_id || stored.instance_id, {
        activated_at: stored.activated_at,
        instance_name: stored.instance_name,
      });
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

