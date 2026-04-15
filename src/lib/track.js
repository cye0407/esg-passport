/**
 * Anonymous funnel event tracking.
 *
 * Wraps @vercel/analytics so all event names live in one place and we can
 * swap providers later without touching call sites.
 *
 * Privacy contract:
 * - NEVER pass user-identifying data (email, company name, file contents,
 *   ESG values). Events should describe *what happened*, not *who* or *what
 *   they entered*. Keep props to small enums, counts, and error categories.
 * - All ESG data stays in the user's browser. These events are pure
 *   behavioral pings used to improve onboarding and conversion.
 */
import { track as vercelTrack } from '@vercel/analytics';

export function track(event, props) {
  try {
    vercelTrack(event, props);
  } catch {
    // Analytics must never break the app.
  }
}

/**
 * Fire an event at most once per browser. Useful for milestones like
 * "first save ever" where repeats would distort the funnel.
 */
export function trackOnce(event, props) {
  const key = `track_once:${event}`;
  try {
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, '1');
  } catch {
    // localStorage unavailable — fall through and just track.
  }
  track(event, props);
}

/**
 * Fire a `first_visit` event once per browser, capturing where the
 * visitor came from. Referrer host is normalized to a small set of
 * known sources to keep the Vercel breakdown readable.
 */
export function trackFirstVisit() {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);
  const referrerHost = (() => {
    try {
      return document.referrer ? new URL(document.referrer).hostname : '';
    } catch {
      return '';
    }
  })();
  const source = classifyReferrer(referrerHost, params.get('utm_source'));
  trackOnce('first_visit', {
    source,
    referrer_host: referrerHost || 'direct',
    utm_source: params.get('utm_source') || '',
    utm_medium: params.get('utm_medium') || '',
    utm_campaign: params.get('utm_campaign') || '',
  });
}

function classifyReferrer(host, utmSource) {
  if (utmSource) return utmSource.toLowerCase();
  if (!host) return 'direct';
  if (host.includes('linkedin')) return 'linkedin';
  if (host.includes('google')) return 'google';
  if (host.includes('twitter') || host.includes('t.co') || host.includes('x.com')) return 'twitter';
  if (host.includes('esgforsuppliers')) return 'esgforsuppliers';
  if (host.includes('catyeldi')) return 'catyeldi';
  return 'other';
}
