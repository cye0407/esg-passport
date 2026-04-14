// ============================================
// GlobalG.A.P. Domain Pack — Classifier Signals
// ============================================
// GlobalG.A.P. IFA control points fall into three question types:
//   DOCUMENT — "Do you have a documented policy/plan/procedure?"
//   PRACTICE — "Describe the practice/method/measure in place."
//   RECORD   — "Can you provide records/evidence/data?"
export const GAP_QUESTION_TYPES = ['DOCUMENT', 'PRACTICE', 'RECORD'];
export const GAP_DEFAULT_QUESTION_TYPE = 'PRACTICE';
export const GAP_CLASSIFIER_SIGNALS = [
    // ---- DOCUMENT signals ----
    {
        type: 'DOCUMENT',
        patterns: [
            /\bdocument(?:ed|ation)?\b/i,
            /\bwritten\s+(?:policy|plan|procedure|protocol|instruction)\b/i,
            /\bformal\s+(?:policy|plan|procedure|protocol)\b/i,
            /\bmanagement\s+(?:plan|system)\b/i,
            /\bpolicy\b/i, /\bpolicies\b/i,
            /\bplan\s+(?:in place|available|established|documented)\b/i,
            /\bprocedure\b/i, /\bprotocol\b/i,
            /\bis there (?:a |an )?(?:documented|written|formal)\b/i,
            /\bdo you have (?:a |an )?(?:documented|written|formal)\b/i,
            /\bhaccp\s+plan\b/i,
            /\brisk\s+assessment\b/i,
            /\bcode of (?:conduct|practice)\b/i,
            /\bstandard\s+operating\s+procedure\b/i, /\bsop\b/i,
        ],
        keywords: [
            'document', 'documented', 'documentation', 'policy', 'plan',
            'procedure', 'protocol', 'sop', 'written', 'formal',
            'management plan', 'management system', 'haccp plan',
            'risk assessment', 'code of practice',
        ],
        weight: 10,
    },
    // ---- PRACTICE signals ----
    {
        type: 'PRACTICE',
        patterns: [
            /\bpractice(?:s)?\b/i, /\bmethod(?:s)?\b/i,
            /\bmeasure(?:s)?\b/i, /\baction(?:s)?\b/i,
            /\bprocess(?:es)?\b/i, /\bstep(?:s)?\b/i,
            /\bhow (?:do|does|is|are)\b/i,
            /\bdescribe\s+(?:your|the|how)\b/i,
            /\bwhat\s+(?:measures|actions|steps|methods|practices)\b/i,
            /\bimplement(?:ed|ation)?\b/i,
            /\bappl(?:y|ied|ication)\b/i,
            /\bcarr(?:y|ied) out\b/i,
            /\bensure\b/i, /\bprevent\b/i, /\bmanage\b/i,
            /\bcontrol\b/i, /\bmonitor(?:ing)?\b/i,
            /\binspect(?:ion)?\b/i,
            /\bcalibrat(?:e|ion|ed)\b/i,
            /\btrain(?:ed|ing)\b/i,
        ],
        keywords: [
            'practice', 'practices', 'method', 'measure', 'action',
            'process', 'step', 'implement', 'apply', 'application',
            'ensure', 'prevent', 'manage', 'control', 'monitor',
            'inspect', 'inspection', 'calibration', 'training',
            'describe', 'carry out',
        ],
        weight: 8,
    },
    // ---- RECORD signals ----
    {
        type: 'RECORD',
        patterns: [
            /\brecord(?:s|ed|ing)?\b/i,
            /\blog(?:s|ged|ging)?\b/i,
            /\bevidence\b/i,
            /\bproof\b/i,
            /\bcertificate(?:s)?\b/i,
            /\breport(?:s)?\b/i,
            /\btest\s+result(?:s)?\b/i,
            /\banalysis\s+result(?:s)?\b/i,
            /\baudit\s+(?:report|result|finding)\b/i,
            /\bshow\b/i, /\bprovide\b/i, /\bdemonstrate\b/i,
            /\bcan you (?:provide|show|demonstrate)\b/i,
            /\bavailable\s+(?:records|evidence|documentation)\b/i,
            /\bdate(?:s)?\s+(?:of|when)\b/i,
            /\bquantit(?:y|ies)\b/i, /\bvolume(?:s)?\b/i,
            /\bdata\b/i, /\bfigure(?:s)?\b/i,
        ],
        keywords: [
            'record', 'records', 'log', 'logs', 'evidence', 'proof',
            'certificate', 'report', 'test result', 'analysis result',
            'audit report', 'show', 'provide', 'demonstrate',
            'date', 'quantity', 'volume', 'data', 'figures',
        ],
        weight: 8,
    },
];
//# sourceMappingURL=classifierSignals.js.map