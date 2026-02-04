// ============================================
// Phase 2: Question Classification Engine
// ============================================
// Classifies each question into POLICY / MEASURE / KPI to select
// the appropriate drafting style from the template matrix.

export type QuestionType = 'POLICY' | 'MEASURE' | 'KPI';

export interface ClassificationResult {
  questionId: string;
  questionType: QuestionType;
  confidence: 'high' | 'medium' | 'low';
  matchedSignals: string[];
}

// ---------------------------------------------------------------------------
// Signal patterns — ordered by specificity
// ---------------------------------------------------------------------------

interface SignalRule {
  type: QuestionType;
  patterns: RegExp[];
  keywords: string[];
  weight: number; // higher = more specific
}

const SIGNAL_RULES: SignalRule[] = [
  // ---- POLICY signals ----
  {
    type: 'POLICY',
    patterns: [
      /\bpolicy\b/i,
      /\bpolicies\b/i,
      /\bcommitment\b/i,
      /\bcommit(?:ted|ting)?\b/i,
      /\bprinciples?\b/i,
      /\bcode of conduct\b/i,
      /\bstandards?\s+(?:of|for)\b/i,
      /\bcharter\b/i,
      /\bstatement\b/i,
      /\bdoes your (?:company|organization|organisation)\s+(?:have|adhere|follow|maintain|subscribe)/i,
      /\bhave you (?:adopted|implemented|established|signed)\b/i,
      /\bformal(?:ized|ised)?\s+(?:approach|framework|guideline)\b/i,
      /\boverall\s+(?:approach|strategy|vision|position)\b/i,
      /\bmanagement\s+(?:system|approach|framework|standard)\b/i,
      /\bsigned?\s+(?:up|on|to)\b/i,
      /\badhere\b/i,
      /\bvoluntary\s+(?:initiative|standard|code|pledge)\b/i,
      /\bun\s+global\s+compact\b/i,
      /\biso\s+\d+/i,
    ],
    keywords: [
      'policy', 'policies', 'commitment', 'adhere', 'principle', 'charter',
      'code of conduct', 'pledge', 'statement', 'framework', 'vision',
      'strategy', 'position', 'signed', 'subscribe', 'management system',
      'management approach', 'overall approach', 'guideline', 'declaration',
    ],
    weight: 10,
  },

  // ---- MEASURE signals ----
  {
    type: 'MEASURE',
    patterns: [
      /\baction(?:s)?\b/i,
      /\bmeasure(?:s)?\b/i,
      /\binitiative(?:s)?\b/i,
      /\bprocedure(?:s)?\b/i,
      /\bprocess(?:es)?\b/i,
      /\bprogram(?:me|s)?\b/i,
      /\bproject(?:s)?\b/i,
      /\btraining\b/i,
      /\bimplemented?\b/i,
      /\bsteps?\s+(?:taken|to)\b/i,
      /\bwhat\s+(?:actions|measures|steps|initiatives)\b/i,
      /\bhow\s+(?:do|does|is|are)\s+(?:you|your|the)\s+(?:company|organization|organisation)?\s*(?:manage|address|handle|mitigate|ensure|promote|reduce|prevent)/i,
      /\bdescribe\s+(?:your|the)\s+(?:measures|actions|processes|procedures|initiatives|approach|efforts)/i,
      /\binspection(?:s)?\b/i,
      /\baudit(?:s|ing)?\b/i,
      /\bassess(?:ment|ing)?\b/i,
      /\bprevention\b/i,
      /\bmitigation\b/i,
      /\bcorrective\b/i,
      /\boperational\s+control(?:s)?\b/i,
      /\brisk\s+(?:assessment|management|mitigation)\b/i,
      /\bdue\s+diligence\b/i,
    ],
    keywords: [
      'actions', 'measures', 'initiatives', 'procedures', 'processes',
      'programmes', 'projects', 'training', 'implement', 'steps taken',
      'manage', 'address', 'handle', 'mitigate', 'ensure', 'promote',
      'reduce', 'prevent', 'inspection', 'audit', 'assessment', 'prevention',
      'corrective', 'due diligence', 'risk assessment', 'operational controls',
    ],
    weight: 8,
  },

  // ---- KPI / REPORTING signals ----
  {
    type: 'KPI',
    patterns: [
      /\bindicator(?:s)?\b/i,
      /\bkpi(?:s)?\b/i,
      /\bmetric(?:s)?\b/i,
      /\btotal\b/i,
      /\bnumber\s+of\b/i,
      /\bpercentage\b/i,
      /\brate\b/i,
      /\bfrequency\b/i,
      /\bintensity\b/i,
      /\bper\s+(?:employee|fte|capita|unit|tonne|revenue)\b/i,
      /\bquantif(?:y|ied)\b/i,
      /\bhow\s+(?:much|many)\b/i,
      /\bwhat\s+(?:is|are|was|were)\s+(?:your|the)\s+(?:total|annual|monthly)\b/i,
      /\bmonitor(?:ing)?\b/i,
      /\btrack(?:ing|ed)?\b/i,
      /\breport(?:ing|ed)?\b/i,
      /\bdata\b/i,
      /\bbaseline\b/i,
      /\btarget(?:s)?\b/i,
      /\btrend(?:s)?\b/i,
      /\byear[\s-]over[\s-]year\b/i,
      /\bscope\s+[123]\s+emission/i,
      /\btco2e?\b/i,
      /\bkwh\b/i,
      /\bm[³3]\b/i,
      /\btonnes?\b/i,
      /\bkg\b/i,
      /\bverif(?:y|ied|ication)\b/i,
      /\bthird[\s-]party\b/i,
      /\bexternal[\s-](?:audit|assurance|verification)\b/i,
    ],
    keywords: [
      'indicators', 'kpi', 'metrics', 'total', 'number of', 'percentage',
      'rate', 'frequency', 'intensity', 'per employee', 'quantify', 'how much',
      'how many', 'monitoring', 'tracking', 'reporting', 'data', 'baseline',
      'target', 'trend', 'year-over-year', 'verification', 'assurance',
      'third-party', 'external audit',
    ],
    weight: 8,
  },
];

// ---------------------------------------------------------------------------
// Classification logic
// ---------------------------------------------------------------------------

interface TypeScore {
  type: QuestionType;
  score: number;
  signals: string[];
}

function scoreQuestion(text: string): TypeScore[] {
  const normalized = text.toLowerCase();
  const scores: Record<QuestionType, { score: number; signals: string[] }> = {
    'POLICY': { score: 0, signals: [] },
    'MEASURE': { score: 0, signals: [] },
    'KPI': { score: 0, signals: [] },
  };

  for (const rule of SIGNAL_RULES) {
    // Pattern matching (higher fidelity)
    for (const pattern of rule.patterns) {
      if (pattern.test(text)) {
        scores[rule.type].score += rule.weight;
        scores[rule.type].signals.push(pattern.source.replace(/\\b/g, '').slice(0, 30));
        break; // one pattern match per rule is enough
      }
    }

    // Keyword matching (broader net)
    for (const kw of rule.keywords) {
      if (normalized.includes(kw)) {
        scores[rule.type].score += Math.ceil(rule.weight / 2);
        scores[rule.type].signals.push(kw);
        break; // one keyword match per rule is enough
      }
    }
  }

  return Object.entries(scores)
    .map(([type, { score, signals }]) => ({
      type: type as QuestionType,
      score,
      signals: [...new Set(signals)],
    }))
    .sort((a, b) => b.score - a.score);
}

/**
 * Classify a single question into POLICY / MEASURE / KPI.
 */
export function classifyQuestion(questionId: string, questionText: string, category?: string): ClassificationResult {
  // Combine question text with category for richer signal
  const combinedText = category ? `${questionText} [${category}]` : questionText;
  const ranked = scoreQuestion(combinedText);

  const top = ranked[0];
  const runner = ranked[1];

  // Determine confidence based on score gap
  let confidence: 'high' | 'medium' | 'low';
  if (top.score === 0) {
    confidence = 'low';
  } else if (top.score >= 15 && top.score - runner.score >= 5) {
    confidence = 'high';
  } else if (top.score >= 8) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }

  return {
    questionId,
    questionType: top.score > 0 ? top.type : 'MEASURE', // default to MEASURE when ambiguous
    confidence,
    matchedSignals: top.signals.slice(0, 5),
  };
}

/**
 * Classify a batch of questions.
 */
export function classifyQuestions(
  questions: Array<{ id: string; text: string; category?: string }>
): ClassificationResult[] {
  return questions.map(q => classifyQuestion(q.id, q.text, q.category));
}

/**
 * Get classification statistics for analytics/display.
 */
export function getClassificationStats(results: ClassificationResult[]): {
  policy: number;
  measure: number;
  kpi: number;
  highConfidence: number;
} {
  return {
    policy: results.filter(r => r.questionType === 'POLICY').length,
    measure: results.filter(r => r.questionType === 'MEASURE').length,
    kpi: results.filter(r => r.questionType === 'KPI').length,
    highConfidence: results.filter(r => r.confidence === 'high').length,
  };
}
