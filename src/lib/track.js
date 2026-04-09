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
