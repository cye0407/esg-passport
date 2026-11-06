// What this questionnaire needs, as a shopping list: the documents to have ready, the
// company details to type once, and the few questions only management can answer.
//
// The coverage report already knows, per question, which mapped data points are missing
// (`needs.documents`, from coverageFieldMap) and the question bank's own hint
// (`needs.prompt`, e.g. "electricity bills for the year"). On their own the mapped
// documents are noisy, because the engine suggests data points by DOMAIN: on the sample
// questionnaire the human-rights policy question asked for the HR report, and the Scope 1
// question asked for the electricity bill. A list built from that would send people
// looking for the wrong paper. So this layer decides, per question, in a fixed order:
//
//   1. a policy or certificate question needs THAT policy or certificate (by its words);
//   2. a target or "who is responsible" question is a management decision;
//   3. a company-profile question (name, country, address) is a company detail;
//   4. otherwise the mapped documents, narrowed to the ones the question bank's hint names;
//   5. nothing left means only the reader can answer it - a decision.
//
// Pure and deterministic, like coverage.js: no copy, no React. Every pattern has EN and
// DE wording because German questionnaires arrive with German questions.

const ANSWERED = new Set(['recovered', 'fromRecords']);

// Order matters: the supplier code before the general code of conduct, the certificate
// before the environmental policy.
const POLICY_PATTERNS = [
  ['supplierCode', /supplier code|code of conduct[^.?]*supplier|lieferantenkodex|verhaltenskodex[^.?]*lieferant/i],
  ['iso14001', /iso\s*14001|\bemas\b|environmental management system|umweltmanagementsystem/i],
  ['antiBribery', /brib|corruption|korruption|bestechung/i],
  ['whistleblowing', /whistleblow|grievance|hinweisgeber|beschwerde(mechanismus|verfahren|system)/i],
  ['humanRights', /human rights|modern slavery|menschenrecht|moderne sklaverei/i],
  ['healthSafety', /(health|safety|arbeitsschutz|arbeitssicherheit|gesundheitsschutz)[^.?]*(polic|richtlinie|leitlinie)|(polic|richtlinie|leitlinie)[^.?]*(health|safety|arbeitsschutz)/i],
  ['codeOfConduct', /code of conduct|verhaltenskodex/i],
  ['environmental', /environment[^.?]*(polic)|umwelt(politik|richtlinie|leitlinie)/i],
];
const ANY_POLICY = /\bpolic(y|ies)\b|richtlinie|leitlinie/i;

const DECISION = /\btarget|\bgoal|reduction plan|\bcommit|responsible for|who in your company|\bziel|verantwortlich|zuständig/i;
const COMPANY_DETAIL = /legal name|company name|registered|headquarter|country|address|firmenname|name (ihres|des) unternehmens|firmensitz|hauptsitz|\bland\b|adresse|anschrift/i;

// The question bank's hint, read for the document it names.
const HINT_DOCUMENTS = [
  ['electricityBill', /electric|strom/i],
  ['fuelInvoice', /fuel|\bgas\b|diesel|petrol|kraftstoff|heiz/i],
  ['waterBill', /water|wasser/i],
  ['wasteManifest', /waste|abfall|entsorg/i],
  ['safetyLog', /accident|injur|insurer|unfall|verletz/i],
  ['trainingRecord', /training|schulung|weiterbildung/i],
  ['hrReport', /\bhr\b|headcount|payroll|leaver|employee|personal|mitarbeit|beschäftigt/i],
];

export const DOCUMENT_GROUP = Object.freeze({
  electricityBill: 'environment',
  fuelInvoice: 'environment',
  waterBill: 'environment',
  wasteManifest: 'environment',
  hrReport: 'workforce',
  safetyLog: 'workforce',
  trainingRecord: 'workforce',
  'policy.environmental': 'policies',
  'policy.healthSafety': 'policies',
  'policy.humanRights': 'policies',
  'policy.codeOfConduct': 'policies',
  'policy.antiBribery': 'policies',
  'policy.whistleblowing': 'policies',
  'policy.supplierCode': 'policies',
  'policy.other': 'policies',
  'policy.iso14001': 'company',
  companyDetails: 'company',
});

export const GROUP_ORDER = Object.freeze(['environment', 'workforce', 'policies', 'company']);

// Reading order inside a group, so the list is the same every time.
const DOCUMENT_ORDER = Object.keys(DOCUMENT_GROUP);

function policyFor(text) {
  for (const [key, pattern] of POLICY_PATTERNS) {
    if (pattern.test(text)) {
      // The certificate is its own thing; every other pattern only counts when the
      // question is actually about a written policy, procedure or code.
      if (key === 'iso14001' || key === 'whistleblowing' || key === 'codeOfConduct' || key === 'supplierCode' || ANY_POLICY.test(text)) {
        return `policy.${key}`;
      }
    }
  }
  return ANY_POLICY.test(text) ? 'policy.other' : null;
}

function hintText(needs) {
  return needs?.prompts?.en || needs?.prompt || '';
}

/** What one open question needs: { kind: 'document', documents: [...] } | { kind: 'company' } | { kind: 'decision' }. */
export function requirementFor(question, topic) {
  const text = question?.questionText || '';
  const policy = policyFor(text);
  if (policy) return { kind: 'document', documents: [policy] };
  if (DECISION.test(text)) return { kind: 'decision' };
  const mapped = [...new Set((question?.needs?.documents || []).map(d => d.document))];
  if (topic === 'other' && mapped.length === 0 && COMPANY_DETAIL.test(text)) return { kind: 'company' };

  const hint = hintText(question?.needs);
  const named = HINT_DOCUMENTS.filter(([, pattern]) => pattern.test(hint)).map(([document]) => document);
  if (mapped.length > 0) {
    const narrowed = named.length ? mapped.filter(document => named.includes(document)) : [];
    return { kind: 'document', documents: narrowed.length ? narrowed : mapped };
  }
  // No mapped field, but the bank names a document we know.
  if (named.length > 0) return { kind: 'document', documents: [named[0]] };
  return { kind: 'decision' };
}

/**
 * The questionnaire's requirements, from `coverage.topics`.
 *
 * Counts are counts of QUESTIONS: `covered` is how many open questions the documents
 * and company details would answer, `decisions` the ones only the reader can, and
 * `answered` the ones already answered from their records. They sum to `total`.
 */
export function buildRequirements(topics) {
  const documents = new Map();
  const companyQuestions = [];
  const decisions = [];
  let answered = 0;
  let total = 0;

  for (const bucket of topics || []) {
    for (const question of bucket.questions || []) {
      total += 1;
      if (ANSWERED.has(question.state)) { answered += 1; continue; }
      const entry = { questionId: question.questionId, questionText: question.questionText };
      const need = requirementFor(question, bucket.topic);
      if (need.kind === 'decision') { decisions.push(entry); continue; }
      const keys = need.kind === 'company' ? ['companyDetails'] : need.documents;
      if (need.kind === 'company') companyQuestions.push(entry);
      for (const key of keys) {
        if (!documents.has(key)) documents.set(key, { key, group: DOCUMENT_GROUP[key] || 'policies', questions: [] });
        documents.get(key).questions.push(entry);
      }
    }
  }

  const sorted = [...documents.values()].sort((a, b) => DOCUMENT_ORDER.indexOf(a.key) - DOCUMENT_ORDER.indexOf(b.key));
  const groups = GROUP_ORDER
    .map(group => ({ group, documents: sorted.filter(d => d.group === group) }))
    .filter(g => g.documents.length > 0)
    .map(g => ({ ...g, questionCount: new Set(g.documents.flatMap(d => d.questions.map(q => q.questionId))).size }));

  const covered = total - answered - decisions.length;
  return {
    total,
    answered,
    covered,
    // Real documents only: company details are a short form, not something to go and find.
    documentCount: sorted.filter(d => d.key !== 'companyDetails').length,
    hasCompanyDetails: companyQuestions.length > 0,
    groups,
    decisions,
  };
}
