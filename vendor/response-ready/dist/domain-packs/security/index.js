import { SECURITY_ANSWER_TEMPLATES } from './answerTemplates';
import { SECURITY_CLASSIFIER_SIGNALS, SECURITY_DEFAULT_QUESTION_TYPE, SECURITY_QUESTION_TYPES } from './classifierSignals';
import { securityRetrieveData } from './dataModel';
import { SECURITY_EXPORT_SHEETS } from './exportConfig';
import { SECURITY_DOMAIN_SUGGESTIONS, SECURITY_KEYWORD_RULES } from './keywordRules';
import { SECURITY_SCRUB_RULES } from './scrubRules';
export const securityDomainPack = {
    name: 'security',
    version: '0.1.0',
    keywordRules: SECURITY_KEYWORD_RULES,
    // This pack's rules top out at weight 10, below the default 'high' band (15), so it declares
    // its own bands. (Previously the matcher auto-derived these from the max rule weight, which
    // silently changed every pack's contract; the cut-offs are now explicit per pack.)
    confidenceThresholds: { high: 10, medium: 8 },
    domainSuggestions: SECURITY_DOMAIN_SUGGESTIONS,
    questionTypes: [...SECURITY_QUESTION_TYPES],
    classifierSignals: SECURITY_CLASSIFIER_SIGNALS,
    defaultQuestionType: SECURITY_DEFAULT_QUESTION_TYPE,
    answerTemplates: SECURITY_ANSWER_TEMPLATES,
    scrubRules: SECURITY_SCRUB_RULES,
    retrieveData: securityRetrieveData,
    exportSheets: SECURITY_EXPORT_SHEETS,
};
//# sourceMappingURL=index.js.map