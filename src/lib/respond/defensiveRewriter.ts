// ============================================
// Phase 3: Defensive Language Post-Processor
// ============================================
// Performs a final pass on generated text to:
// 1. Scrub AI-ism patterns
// 2. Convert passive gap language to active roadmap language
// 3. Ensure sentence variety across a batch

// ---------------------------------------------------------------------------
// Pattern scrubbing rules — ordered by priority
// ---------------------------------------------------------------------------

interface RewriteRule {
  /** Regex to detect the AI-ism */
  pattern: RegExp;
  /** Replacement string (may use $1, $2 capture groups) */
  replacement: string;
}

const SCRUB_RULES: RewriteRule[] = [
  // --- Opening "AI-ism" hedges ---
  { pattern: /^Based on (?:the |our )?(?:available |provided |current )?data,?\s*/i, replacement: '' },
  { pattern: /^As (?:a|an) (?:small |medium-sized |large )?(?:manufacturing |industrial |logistics |construction |chemical |food |textile |technology |professional services? )?company,?\s*/i, replacement: '' },
  { pattern: /^As (?:a|an) organization,?\s*/i, replacement: '' },
  { pattern: /^It is important to note that\s*/i, replacement: '' },
  { pattern: /^It should be noted that\s*/i, replacement: '' },
  { pattern: /^We would like to (?:highlight|note|mention) that\s*/i, replacement: '' },
  { pattern: /^In terms of\s+/i, replacement: 'Regarding ' },
  { pattern: /^With regard(?:s)? to\s+/i, replacement: 'Regarding ' },

  // --- Mid-sentence hedges ---
  { pattern: /\bhowever,? it is worth noting that\s*/gi, replacement: '' },
  { pattern: /\bit is worth (?:noting|mentioning|highlighting) that\s*/gi, replacement: '' },
  { pattern: /\bwe acknowledge that\s*/gi, replacement: '' },
  { pattern: /\bwe recognize that\s*/gi, replacement: '' },

  // --- Passive "gap" language → active roadmap language ---
  { pattern: /\b(?:monitoring|tracking) of (\w+) (?:is|has) not (?:yet )?(?:been )?(?:established|implemented)/gi, replacement: 'we are implementing $1 monitoring through site-level tracking' },
  { pattern: /\bwe do not (?:yet |currently )?(?:have|maintain) (?:a )?(?:formal )?(\w+) (?:policy|document|procedure)/gi, replacement: 'we are developing a formal $1 policy' },
  { pattern: /\bno (?:formal )?(?:policy|document|procedure) (?:is|has been) (?:established|in place)/gi, replacement: 'a formal policy is currently in development' },
  { pattern: /\binsufficient data (?:is|was) (?:currently )?available/gi, replacement: 'we are establishing data collection processes' },
  { pattern: /\bwe do not (?:yet |currently )?(?:track|monitor|measure) /gi, replacement: 'we are establishing tracking for ' },
  { pattern: /\bdata (?:is|was) not (?:yet )?(?:available|collected)/gi, replacement: 'data collection is currently being established' },
  { pattern: /\bwe lack\b/gi, replacement: 'we are developing' },
  { pattern: /\bthere is no\b/gi, replacement: 'we are establishing' },

  // --- Generic AI filler ---
  { pattern: /\bin conclusion,?\s*/gi, replacement: '' },
  { pattern: /\boverall,?\s*/gi, replacement: '' },
  { pattern: /\bin summary,?\s*/gi, replacement: '' },
  { pattern: /\bto summarize,?\s*/gi, replacement: '' },
  { pattern: /\bmoreover,?\s*/gi, replacement: 'Additionally, ' },
  { pattern: /\bfurthermore,?\s*/gi, replacement: 'Additionally, ' },
];

// ---------------------------------------------------------------------------
// Sentence opener variety check
// ---------------------------------------------------------------------------

const VARIETY_OPENERS: string[] = [
  'Our organization ',
  'We ',
  'Our team ',
  'Our operations ',
  'Across our facilities, ',
  'Within our management approach, ',
  'As part of our commitment, ',
  'In line with our objectives, ',
  'Through our operational practices, ',
  'To support continuous improvement, ',
];

/**
 * Check that sentences in a batch don't all start with the same phrase.
 * If more than 3 consecutive answers start identically, vary the opener.
 */
function applyVariety(answers: string[]): string[] {
  if (answers.length <= 3) return answers;

  const result = [...answers];
  let lastOpener = '';
  let repeatCount = 0;
  let varietyIdx = 0;

  for (let i = 0; i < result.length; i++) {
    const firstSentence = result[i].split(/[.!?]/)[0] || '';
    const opener = firstSentence.slice(0, 20).toLowerCase();

    if (opener === lastOpener) {
      repeatCount++;
    } else {
      repeatCount = 0;
      lastOpener = opener;
    }

    // If we've seen the same opener 3+ times in a row, swap it
    if (repeatCount >= 2) {
      const newOpener = VARIETY_OPENERS[varietyIdx % VARIETY_OPENERS.length];
      varietyIdx++;

      // Replace the first word(s) up to the first comma or main verb
      const match = result[i].match(/^(Our organization|Our company|We|Our)\s+/i);
      if (match) {
        result[i] = newOpener + result[i].slice(match[0].length);
        // Ensure first character after opener is lowercase if opener ends with comma
        if (newOpener.endsWith(', ') && result[i].length > newOpener.length) {
          const afterOpener = result[i].slice(newOpener.length);
          result[i] = newOpener + afterOpener.charAt(0).toLowerCase() + afterOpener.slice(1);
        }
      }
      repeatCount = 0;
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Post-processing pipeline
// ---------------------------------------------------------------------------

/**
 * Apply all defensive rewriting rules to a single answer string.
 */
export function rewriteAnswer(text: string): string {
  let result = text;

  // Apply scrub rules
  for (const rule of SCRUB_RULES) {
    result = result.replace(rule.pattern, rule.replacement);
  }

  // Clean up artifacts: double spaces, leading spaces, orphan punctuation
  result = result.replace(/\s{2,}/g, ' ').trim();
  result = result.replace(/^\s*[,;]\s*/gm, '');
  result = result.replace(/\.\s*\./g, '.');

  // Ensure the first character is uppercase after stripping openers
  if (result.length > 0 && result[0] !== result[0].toUpperCase()) {
    result = result[0].toUpperCase() + result.slice(1);
  }

  return result;
}

/**
 * Apply defensive rewriting to a batch of answers with variety check.
 */
export function rewriteAnswerBatch(answers: string[]): string[] {
  // First pass: individual rewriting
  const rewritten = answers.map(a => rewriteAnswer(a));
  // Second pass: variety check
  return applyVariety(rewritten);
}

// ---------------------------------------------------------------------------
// Evidence mapping — generates "Evidence Required" descriptions
// ---------------------------------------------------------------------------

export interface EvidenceRequirement {
  questionId: string;
  questionType?: 'POLICY' | 'MEASURE' | 'KPI';
  evidenceDescription: string;
  acceptableDocuments: string[];
  methodologyNote?: string;
}

const EVIDENCE_BY_TYPE: Record<string, { description: string; documents: string[] }> = {
  'POLICY': {
    description: 'Formal policy document, signed by senior management, covering the topic area',
    documents: [
      'Standalone policy document (PDF, signed, dated)',
      'Relevant section of Employee Handbook (with version and page reference)',
      'Board-approved sustainability/ESG strategy document',
      'Management system manual (e.g., ISO 14001, ISO 45001)',
    ],
  },
  'MEASURE': {
    description: 'Documentation of specific actions, procedures, or programmes in place',
    documents: [
      'Standard Operating Procedures (SOPs) for the relevant process',
      'Training records or training plan documentation',
      'Inspection/audit reports (internal or external)',
      'Programme descriptions with implementation dates',
      'Meeting minutes demonstrating regular management review',
    ],
  },
  'KPI': {
    description: 'Source data with clear methodology and calculation basis',
    documents: [
      'Utility invoices (electricity, gas, water) for the reporting period',
      'Waste manifests or disposal records',
      'HR system reports (headcount, training hours, incident logs)',
      'Third-party verification/assurance statement (if available)',
      'Internal calculation spreadsheet with methodology notes',
    ],
  },
};

const DOMAIN_EVIDENCE: Record<string, { documents: string[]; methodology?: string }> = {
  'emissions': {
    documents: ['Utility invoices', 'Fuel purchase records', 'GHG inventory calculation spreadsheet'],
    methodology: 'Estimated using activity data and standard emission factors (IEA 2023 grid factors for Scope 2; DEFRA factors for Scope 1). Error margin: +/- 5-10% depending on data granularity.',
  },
  'energy_electricity': {
    documents: ['Electricity invoices for all sites for the reporting period', 'Renewable energy certificates or PPAs'],
    methodology: 'Annual electricity consumption aggregated from monthly utility invoices. Renewable percentage based on green tariff or certificate documentation.',
  },
  'energy_fuel': {
    documents: ['Natural gas invoices', 'Diesel purchase records', 'Fleet fuel card statements'],
    methodology: 'Fuel volumes from supplier invoices. Scope 1 emissions calculated using DEFRA conversion factors.',
  },
  'energy_water': {
    documents: ['Water utility invoices or meter readings for all sites'],
    methodology: 'Annual water withdrawal from metered supply invoices.',
  },
  'waste': {
    documents: ['Waste collection manifests', 'Recycling certificates', 'Hazardous waste consignment notes'],
    methodology: 'Waste quantities from waste contractor reports. Diversion rate = (recycled + recovered) / total waste.',
  },
  'workforce': {
    documents: ['HR system headcount report', 'Payroll summary for reporting period'],
  },
  'health_safety': {
    documents: ['Incident log/register for the reporting period', 'OSHA 300 log or equivalent', 'Safety committee meeting minutes'],
    methodology: 'TRIR = (Number of recordable incidents × 200,000) / Total hours worked.',
  },
  'training': {
    documents: ['Training records database export', 'Training plan with completion status'],
    methodology: 'Total training hours from LMS or manual records, divided by average headcount.',
  },
  'regulatory': {
    documents: ['Certificate copies (ISO 14001, ISO 45001, etc.)', 'Latest external audit report'],
  },
};

/**
 * Generate evidence requirements for a draft answer.
 */
export function generateEvidenceRequirement(
  questionId: string,
  questionType: 'POLICY' | 'MEASURE' | 'KPI' | undefined,
  domain: string | null,
  confidenceSource: 'provided' | 'estimated' | 'unknown',
  isEstimate: boolean
): EvidenceRequirement {
  const type = questionType || 'MEASURE';
  const typeEvidence = EVIDENCE_BY_TYPE[type] || EVIDENCE_BY_TYPE['MEASURE'];
  const domainEvidence = domain ? DOMAIN_EVIDENCE[domain] : null;

  // Merge documents: type-specific + domain-specific
  const allDocuments = [...typeEvidence.documents];
  if (domainEvidence) {
    for (const doc of domainEvidence.documents) {
      if (!allDocuments.includes(doc)) allDocuments.push(doc);
    }
  }

  // Methodology note for estimated KPIs
  let methodologyNote: string | undefined;
  if ((isEstimate || confidenceSource === 'estimated') && domainEvidence?.methodology) {
    methodologyNote = domainEvidence.methodology;
  }

  return {
    questionId,
    questionType: type,
    evidenceDescription: typeEvidence.description,
    acceptableDocuments: allDocuments,
    methodologyNote,
  };
}
