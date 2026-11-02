const QUESTIONNAIRE_PASS_STORAGE_KEY = 'esg_passport_questionnaire_pass_claims_v1';
const STORAGE_VERSION = 1;

export function normalizeQuestionText(text) {
  return String(text || '')
    .normalize('NFKC')
    .replace(/[\u2018\u2019\u2032]/g, "'")
    .replace(/[\u201C\u201D\u2033]/g, '"')
    .replace(/[\u2010-\u2015]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('en-US');
}

function normalizedQuestions(questions) {
  if (!Array.isArray(questions)) return [];
  return questions
    .map(question => normalizeQuestionText(
      question?.text ?? question?.questionText ?? question?.label,
    ))
    .filter(Boolean);
}

// A compact deterministic local identity, not a security boundary. Two seeded
// 32-bit FNV-1a passes make accidental collisions less likely without retaining
// or transmitting any original questionnaire text.
function fnv1a(value, seed) {
  let hash = seed >>> 0;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

// One short hash per question, so a claim can recognise the same questionnaire after a
// customer revises it, or after the reader confirms a slightly different question list.
// The exact-match fingerprint alone blocked both: a buyer who paid for a questionnaire
// was refused the corrected version of it. Hashes only - no question text is stored.
export function questionHashesFor(questions) {
  return [...new Set(normalizedQuestions(questions).map(text => fnv1a(text, 0x811c9dc5)))];
}

// Share of questions two lists have in common (Jaccard). At or above this, it is the same
// questionnaire, revised. Identical templates sent by two customers also pass - that
// errs toward the person who paid, which is the side to err on.
export const SAME_QUESTIONNAIRE_THRESHOLD = 0.8;

export function questionOverlap(a = [], b = []) {
  if (!a.length || !b.length) return 0;
  const left = new Set(a);
  const right = new Set(b);
  let shared = 0;
  for (const hash of left) if (right.has(hash)) shared += 1;
  return shared / (left.size + right.size - shared);
}

function isSameQuestionnaire(claim, fingerprint, questionHashes) {
  if (!claim) return false;
  if (claim.fingerprint === fingerprint) return true;
  return Array.isArray(claim.questionHashes)
    && questionOverlap(claim.questionHashes, questionHashes) >= SAME_QUESTIONNAIRE_THRESHOLD;
}

export function fingerprintQuestionnaire(questions) {
  const normalized = normalizedQuestions(questions);
  if (normalized.length === 0) return null;
  const identity = normalized.map(text => `${text.length}:${text}`).join('\u001f');
  return `qfp-v1-${normalized.length}-${fnv1a(identity, 0x811c9dc5)}${fnv1a(identity, 0x9e3779b9)}`;
}

function readClaims() {
  try {
    const parsed = JSON.parse(localStorage.getItem(QUESTIONNAIRE_PASS_STORAGE_KEY) || 'null');
    if (parsed?.version !== STORAGE_VERSION || typeof parsed.claims !== 'object') {
      return { version: STORAGE_VERSION, claims: {} };
    }
    return parsed;
  } catch {
    return { version: STORAGE_VERSION, claims: {} };
  }
}

export function getQuestionnairePassClaim(licenseKeyId) {
  if (!licenseKeyId) return null;
  return readClaims().claims[String(licenseKeyId)] || null;
}

/** Every pass claim on this device, keyed by licence reference — what a response pack carries. */
export function listQuestionnairePassClaims() {
  const { claims } = readClaims();
  return Object.entries(claims).map(([licenceRef, claim]) => ({ licenceRef, ...claim }));
}

/**
 * Re-enter claims from a response pack. A licence reference already claimed on this
 * device keeps what it has; the pack never overrides a live claim. Returns how many
 * were added.
 */
export function importQuestionnairePassClaims(claims) {
  const state = readClaims();
  let added = 0;
  for (const c of claims || []) {
    const key = String(c?.licenceRef || '');
    if (!key || !c?.fingerprint || state.claims[key]) continue;
    state.claims[key] = { fingerprint: c.fingerprint, displayName: String(c.displayName || 'Customer questionnaire'), claimedAt: c.claimedAt || new Date().toISOString(), ...(Array.isArray(c.questionHashes) ? { questionHashes: c.questionHashes.filter(h => typeof h === 'string').slice(0, 2000) } : {}) };
    added += 1;
  }
  if (added > 0) localStorage.setItem(QUESTIONNAIRE_PASS_STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, claims: state.claims }));
  return added;
}

export function claimQuestionnaire({ licenseKeyId, fingerprint, displayName, claimedAt, questionHashes = null }) {
  if (!licenseKeyId || !fingerprint) {
    throw new Error('Questionnaire Pass claim identity is unavailable. Revalidate the license and try again.');
  }

  const state = readClaims();
  const key = String(licenseKeyId);
  const existing = state.claims[key];
  if (existing && !isSameQuestionnaire(existing, fingerprint, questionHashes || [])) {
    throw new Error('This Questionnaire Pass is already assigned to another questionnaire.');
  }
  if (existing) return existing;

  const claim = {
    fingerprint,
    displayName: String(displayName || 'Customer questionnaire'),
    claimedAt: claimedAt || new Date().toISOString(),
    ...(Array.isArray(questionHashes) && questionHashes.length ? { questionHashes } : {}),
  };
  const updated = {
    version: STORAGE_VERSION,
    claims: { ...state.claims, [key]: claim },
  };
  localStorage.setItem(QUESTIONNAIRE_PASS_STORAGE_KEY, JSON.stringify(updated));

  const persisted = getQuestionnairePassClaim(licenseKeyId);
  if (persisted?.fingerprint !== fingerprint) {
    throw new Error('The Questionnaire Pass claim could not be saved on this device.');
  }
  return persisted;
}

export function getQuestionnairePassDecision({
  tier,
  licenseKeyId,
  questions,
  isBuiltInSample = false,
}) {
  const fingerprint = fingerprintQuestionnaire(questions);
  if (!fingerprint) return { status: 'unusable', fingerprint: null, claim: null };
  if (isBuiltInSample || tier !== 'questionnaire-pass') {
    return { status: 'allowed', fingerprint, claim: null };
  }

  const claim = getQuestionnairePassClaim(licenseKeyId);
  if (!claim) return { status: 'claim-required', fingerprint, claim: null };
  if (isSameQuestionnaire(claim, fingerprint, questionHashesFor(questions))) {
    return { status: 'allowed', fingerprint, claim };
  }
  return { status: 'blocked', fingerprint, claim };
}

export { QUESTIONNAIRE_PASS_STORAGE_KEY };
