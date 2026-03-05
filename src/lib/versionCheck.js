// ============================================
// VERSION CHECK
// ============================================
// Checks for newer versions on startup. Non-blocking — if the
// fetch fails (offline, CORS, etc.), the app works normally.

const VERSION_URL = 'https://esgforsuppliers.com/passport-version.json';
const CHECK_KEY = 'esg_passport_version_check';
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Returns the current app version from package.json (injected at build time).
 */
export const APP_VERSION = __APP_VERSION__;

/**
 * Check if a newer version is available.
 * Returns { available: true, latest, downloadUrl } or { available: false }.
 * Caches the result for 24h so we only check once per day.
 */
export async function checkForUpdate() {
  try {
    // Skip if we checked recently
    const cached = localStorage.getItem(CHECK_KEY);
    if (cached) {
      const { checkedAt, result } = JSON.parse(cached);
      if (Date.now() - checkedAt < CHECK_INTERVAL_MS) {
        return result;
      }
    }

    const res = await fetch(VERSION_URL, { cache: 'no-cache' });
    if (!res.ok) return { available: false };

    const data = await res.json();
    const result = isNewer(data.version, APP_VERSION)
      ? { available: true, latest: data.version, downloadUrl: data.downloadUrl, notes: data.notes }
      : { available: false };

    // Cache the result
    localStorage.setItem(CHECK_KEY, JSON.stringify({ checkedAt: Date.now(), result }));
    return result;
  } catch {
    // Offline or fetch failed — no problem
    return { available: false };
  }
}

/**
 * Simple semver comparison: is `remote` newer than `local`?
 */
function isNewer(remote, local) {
  if (!remote || !local) return false;
  const r = remote.split('.').map(Number);
  const l = local.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((r[i] || 0) > (l[i] || 0)) return true;
    if ((r[i] || 0) < (l[i] || 0)) return false;
  }
  return false;
}
