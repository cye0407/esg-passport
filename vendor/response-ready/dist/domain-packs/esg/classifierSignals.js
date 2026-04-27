export const ESG_QUESTION_TYPES = ['POLICY', 'MEASURE', 'KPI'];
export const ESG_DEFAULT_QUESTION_TYPE = 'MEASURE';
export const ESG_CLASSIFIER_SIGNALS = [
    // ---- POLICY signals ----
    {
        type: 'POLICY',
        patterns: [
            /\bpolicy\b/i, /\bpolicies\b/i, /\bcommitment\b/i, /\bcommit(?:ted|ting)?\b/i,
            /\bprinciples?\b/i, /\bcode of conduct\b/i, /\bstandards?\s+(?:of|for)\b/i,
            /\bcharter\b/i, /\bstatement\b/i,
            /\bdoes your (?:company|organization|organisation)\s+(?:have|adhere|follow|maintain|subscribe)/i,
            /\bhave you (?:adopted|implemented|established|signed)\b/i,
            /\bformal(?:ized|ised)?\s+(?:approach|framework|guideline)\b/i,
            /\boverall\s+(?:approach|strategy|vision|position)\b/i,
            /\bmanagement\s+(?:system|approach|framework|standard)\b/i,
            /\bsigned?\s+(?:up|on|to)\b/i, /\badhere\b/i,
            /\bvoluntary\s+(?:initiative|standard|code|pledge)\b/i,
            /\bun\s+global\s+compact\b/i, /\biso\s+\d+/i,
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
            /\baction(?:s)?\b/i, /\bmeasure(?:s)?\b/i, /\binitiative(?:s)?\b/i,
            /\bprocedure(?:s)?\b/i, /\bprocess(?:es)?\b/i, /\bprogram(?:me|s)?\b/i,
            /\bproject(?:s)?\b/i, /\btraining\b/i, /\bimplemented?\b/i,
            /\bsteps?\s+(?:taken|to)\b/i,
            /\bwhat\s+(?:actions|measures|steps|initiatives)\b/i,
            /\bhow\s+(?:do|does|is|are)\s+(?:you|your|the)\s+(?:company|organization|organisation)?\s*(?:manage|address|handle|mitigate|ensure|promote|reduce|prevent)/i,
            /\bdescribe\s+(?:your|the)\s+(?:measures|actions|processes|procedures|initiatives|approach|efforts)/i,
            /\binspection(?:s)?\b/i, /\baudit(?:s|ing)?\b/i, /\bassess(?:ment|ing)?\b/i,
            /\bprevention\b/i, /\bmitigation\b/i, /\bcorrective\b/i,
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
            /\bindicator(?:s)?\b/i, /\bkpi(?:s)?\b/i, /\bmetric(?:s)?\b/i,
            /\btotal\b/i, /\bnumber\s+of\b/i, /\bpercentage\b/i, /\brate\b/i,
            /\bfrequency\b/i, /\bintensity\b/i,
            /\bper\s+(?:employee|fte|capita|unit|tonne|revenue)\b/i,
            /\bquantif(?:y|ied)\b/i, /\bhow\s+(?:much|many)\b/i,
            /\bwhat\s+(?:is|are|was|were)\s+(?:your|the)\s+(?:total|annual|monthly)\b/i,
            /\bmonitor(?:ing)?\b/i, /\btrack(?:ing|ed)?\b/i, /\breport(?:ing|ed)?\b/i,
            /\bdata\b/i, /\bbaseline\b/i, /\btarget(?:s)?\b/i, /\btrend(?:s)?\b/i,
            /\byear[\s-]over[\s-]year\b/i,
            /\bscope\s+[123]\s+emission/i, /\btco2e?\b/i, /\bkwh\b/i,
            /\bm[³3]\b/i, /\btonnes?\b/i, /\bkg\b/i,
            /\bverif(?:y|ied|ication)\b/i, /\bthird[\s-]party\b/i,
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
//# sourceMappingURL=classifierSignals.js.map