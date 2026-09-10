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
 *
 * That contract used to be only a comment, and a comment does not stop a
 * `rawText.slice(0, 30)` from reaching Vercel. It is now enforced: EVENT_SCHEMA
 * below is an allowlist, and everything not on it is dropped.
 *
 *   - An event with no schema entry is sent with NO properties at all.
 *   - A property with no validator on its event is dropped.
 *   - A property whose value fails its validator is dropped.
 *
 * So adding a new tracked property is a deliberate edit to this file, made by
 * someone looking straight at the privacy contract. That is the point.
 */
import { track as vercelTrack } from '@vercel/analytics';

// --- validators -------------------------------------------------------------
// Each returns the value to send, or undefined to drop the property.

/** One of a fixed set of internal names. Anything else is dropped. */
const oneOf = (...values) => {
  const allowed = new Set(values);
  return value => (allowed.has(value) ? value : undefined);
};

/** One of a fixed set, with everything else collapsed into a bucket. Use when
 *  the miss is itself the signal — an unsupported upload, say. */
const oneOfOr = (fallback, ...values) => {
  const allowed = new Set(values);
  return value => (allowed.has(value) ? value : fallback);
};

/** A non-negative whole number. */
const count = () => value =>
  (Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : undefined);

/** An internal identifier: lowercase, no spaces, no punctuation beyond _ - .
 *  Document text does not survive this — it carries capitals, spaces and
 *  digits in shapes this rejects — but a slug like `policy_environmental` does. */
const SLUG = /^[a-z0-9][a-z0-9_.-]{0,39}$/;
const slug = () => value => (typeof value === 'string' && SLUG.test(value) ? value : undefined);

/** An in-app route, e.g. `/data`. */
const ROUTE = /^\/[a-z0-9/_-]{0,40}$/;
const route = () => value => (typeof value === 'string' && ROUTE.test(value) ? value : undefined);

/** A JS error constructor name, e.g. `TypeError`. */
const ERROR_NAME = /^[A-Za-z]{1,40}$/;
const errorName = () => value =>
  (typeof value === 'string' && ERROR_NAME.test(value) ? value : undefined);

/** A reporting period: `2025` or `2025-03`. The extractor's bare-year fallback
 *  can pick up an invoice or account number, so anything else becomes `other`
 *  rather than shipping a number off the customer's bill. */
const PERIOD = /^\d{4}(-\d{2})?$/;
const period = () => value => {
  if (typeof value !== 'string') return undefined;
  if (value === 'fallback_current_month') return value;
  return PERIOD.test(value) ? value : 'other';
};

/** A campaign or referrer token from the URL. Free-form by nature, so it is
 *  shape-limited rather than allowlisted, and never longer than a token. */
const URL_TOKEN = /^[a-z0-9][a-z0-9_.-]{0,63}$/;
const urlToken = () => value =>
  (typeof value === 'string' && URL_TOKEN.test(value) ? value : undefined);

const bool = () => value => {
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === 'false') return value;
  return undefined;
};

const TIER = oneOf('free', 'questionnaire-pass', 'pro', 'pro-plus');
const LANGUAGE = oneOf('en', 'de');
const ENTRY_MODE = oneOf('monthly', 'annual');
const UPLOAD_EXT = oneOfOr('other', '.xlsx', '.xls', '.csv', '.pdf', '.docx');
const PARSE_OUTCOME = oneOf('success', 'empty', 'error');
const PARSE_CONFIDENCE = oneOf('high', 'medium', 'low', 'unknown');

// --- the allowlist ----------------------------------------------------------
// Event → the properties it may send, and the only shapes they may take.
// An event listed with {} is sent bare; an event absent entirely is ALSO sent
// bare, so a forgotten entry fails closed.

const EVENT_SCHEMA = {
  // Access and conversion
  paywall_hit: { feature: slug() },
  checkout_opened: { source: slug(), from_tier: TIER },
  upgrade_cta_click: { source: slug(), from_tier: TIER },
  license_activated: { fallback: bool(), source: slug(), tier: TIER },

  // Questionnaire Pass
  questionnaire_pass_claim_started: { tier: TIER, source: slug(), question_count: count() },
  questionnaire_pass_claimed: { tier: TIER, source: slug(), question_count: count() },
  questionnaire_pass_second_questionnaire_blocked: {
    tier: TIER,
    source: slug(),
    question_count: count(),
  },
  questionnaire_pass_upgrade_clicked: { tier: TIER, source: slug() },

  // Onboarding
  onboarding_started: {},
  onboarding_profile_started: {},
  onboarding_profile_completed: {},
  onboarding_completed: { destination: route() },
  onboarding_skipped: { destination: route() },

  // Data entry and extraction
  data_page_viewed: {},
  data_first_save: {},
  data_saved: { mode: ENTRY_MODE },
  source_set: { hasValue: bool() },
  year_data_cleared: { year: count() },
  // `lead_field` is the extractor's own field name (an EXTRACT_FIELD_MAP key),
  // which is what tells us whether people are dropping in power bills or waste
  // manifests. It replaced a 30-character slice of the document's raw text.
  bill_extracted: {
    fields: count(),
    periodType: ENTRY_MODE,
    extractedPeriod: period(),
    lead_field: slug(),
    // How many staged bills were applied together — the annual path batches a year.
    documents: count(),
  },

  // Data entry: CSV import
  csv_import_started: {},
  csv_import_cancelled: {},
  csv_import_succeeded: { rows: count(), format: slug() },
  csv_import_failed: { error: slug() },

  // The dashboard's two drop targets, and the switcher between them. `tab` is the one
  // number that says whether the default-selection rules in homeTab.js are right: a
  // switch immediately after landing means the wrong door was open.
  dashboard_questionnaire_dropped: {},
  dashboard_questionnaire_rejected: { ext: UPLOAD_EXT },
  dashboard_documents_dropped: { documents: count() },
  dashboard_document_rejected: { ext: UPLOAD_EXT },
  home_tab_switched: { tab: slug() },
  home_documents_cta: { documents: count() },

  // Evidence
  evidence_page_viewed: { wanted: count() },
  evidence_documents_extracted: { documents: count(), fields: count() },

  // Confirming the parsed question list. The parser finds 22 of ~50 questions in a real
  // SAQ, and a wrong denominator makes every number on the coverage report false — so
  // `kept` and `dropped` are the pair that says whether this step is earning its place.
  questionnaire_confirm_shown: { questions: count(), rows: count(), thin: bool(), ext: UPLOAD_EXT },
  questionnaire_confirmed: { kept: count(), dropped: count() },
  // Someone acted on the thin-parse warning by going to pick the question column
  // themselves. Pairs with questionnaire_confirm_shown's `thin` flag: shown-but-never-
  // remapped means the warning is being read and ignored, which is worth knowing.
  questionnaire_remap_opened: { columns: count() },

  // The coverage report. `coverage_report_viewed` is the number that says the free tier
  // change worked: over the previous year the funnel recorded two paywall hits, because
  // nobody could get far enough to see one.
  coverage_report_viewed: {
    questions: count(),
    from_records: count(),
    written: count(),
    unanswerable: count(),
    policy_gaps: count(),
  },
  coverage_resumed: { questions: count() },
  coverage_add_documents_click: { document: slug() },
  coverage_enter_figures_click: { document: slug() },
  coverage_checklist_downloaded: { documents: count() },

  // Respond
  respond_page_viewed: {},
  respond_handoff_received: {},
  respond_reprepare: { questions: count() },
  respond_upload_started: { ext: UPLOAD_EXT },
  respond_upload_rejected: { ext: UPLOAD_EXT },
  respond_parse_completed: {
    ext: UPLOAD_EXT,
    outcome: PARSE_OUTCOME,
    questions: count(),
    rows: count(),
    confidence: PARSE_CONFIDENCE,
    manual_mapping: bool(),
    thin: bool(),
  },
  respond_generation_started: { questions: count() },
  respond_answers_generated: { count: count(), framework: slug() },
  respond_generation_failed: { error: errorName() },
  respond_answer_language_regenerated: { language: LANGUAGE },
  respond_batch_export_completed: { templates: count() },
  respond_demo_library_loaded: { source: slug() },

  // Policies
  policy_saved: { builder: slug(), adopted: bool() },
  policy_downloaded: { builder: slug(), adopted: bool() },
  policy_builder_locked_click: { builder: slug() },
  policy_adoption_invalidated: { builder: slug() },
  policy_free_template_download: {},

  // Acquisition
  first_visit: {
    source: urlToken(),
    referrer_host: urlToken(),
    utm_source: urlToken(),
    utm_medium: urlToken(),
    utm_campaign: urlToken(),
  },
};

/**
 * Reduce an event's properties to the allowlisted, correctly shaped subset.
 * Deny-by-default: unknown events and unknown properties send nothing.
 */
export function sanitizeAnalyticsProperties(event, props = {}) {
  const schema = EVENT_SCHEMA[event];
  if (!schema) {
    if (import.meta.env?.DEV) {
      // Fail loudly in development, silently in production.
      console.warn(`[track] "${event}" has no EVENT_SCHEMA entry — sent without properties.`);
    }
    return {};
  }

  const sanitized = {};
  for (const [name, validate] of Object.entries(schema)) {
    const value = validate(props?.[name]);
    if (value !== undefined) sanitized[name] = value;
  }
  return sanitized;
}

export function track(event, props) {
  try {
    vercelTrack(event, sanitizeAnalyticsProperties(event, props));
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

/** Exported for the privacy test: every event the app is allowed to send. */
export const TRACKED_EVENTS = Object.keys(EVENT_SCHEMA);
