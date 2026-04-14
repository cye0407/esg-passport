// ============================================
// GlobalG.A.P. Domain Pack — Assembly
// ============================================
// Assembles all GlobalG.A.P. IFA modules into a single DomainPack.
import { GAP_KEYWORD_RULES, GAP_DOMAIN_SUGGESTIONS } from './keywordRules';
import { GAP_CLASSIFIER_SIGNALS, GAP_QUESTION_TYPES, GAP_DEFAULT_QUESTION_TYPE } from './classifierSignals';
import { GAP_ANSWER_TEMPLATES } from './answerTemplates';
import { GAP_SCRUB_RULES } from './scrubRules';
import { GAP_EXPORT_SHEETS } from './exportConfig';
import { gapRetrieveData } from './dataModel';
// ============================================
// Framework Notes
// ============================================
const GAP_FRAMEWORK_NOTES = {
    'GLOBALG.A.P.': 'Aligned with GlobalG.A.P. IFA v6 Integrated Farm Assurance standard.',
    'GlobalG.A.P.': 'Aligned with GlobalG.A.P. IFA v6 Integrated Farm Assurance standard.',
    'IFA': 'Aligned with GlobalG.A.P. Integrated Farm Assurance standard.',
    'GRASP': 'Aligned with GlobalG.A.P. GRASP (Risk Assessment on Social Practice) add-on module.',
};
// ============================================
// Assembled Pack
// ============================================
export const gapDomainPack = {
    name: 'globalg-a-p',
    version: '1.0.0',
    // Keyword Matching
    keywordRules: GAP_KEYWORD_RULES,
    domainSuggestions: GAP_DOMAIN_SUGGESTIONS,
    // Question Classification
    questionTypes: [...GAP_QUESTION_TYPES],
    classifierSignals: GAP_CLASSIFIER_SIGNALS,
    defaultQuestionType: GAP_DEFAULT_QUESTION_TYPE,
    // Answer Generation
    answerTemplates: GAP_ANSWER_TEMPLATES,
    frameworkNotes: GAP_FRAMEWORK_NOTES,
    // Defensive Rewriting
    scrubRules: GAP_SCRUB_RULES,
    // Data Retrieval
    retrieveData: gapRetrieveData,
    // Excel Export
    exportSheets: GAP_EXPORT_SHEETS,
};
//# sourceMappingURL=index.js.map