// ============================================
// ESG Domain Pack — Assembly
// ============================================
// Assembles all ESG-specific modules into a single DomainPack.
import { ESG_KEYWORD_RULES, ESG_DOMAIN_SUGGESTIONS } from './keywordRules';
import { ESG_TERM_ALIASES } from './germanAliases';
import { ESG_EXCLUSION_PATTERNS } from './exclusionRules';
import { ESG_CLASSIFIER_SIGNALS, ESG_QUESTION_TYPES, ESG_DEFAULT_QUESTION_TYPE } from './classifierSignals';
import { ESG_ANSWER_TEMPLATES } from './answerTemplates';
import { ESG_SCRUB_RULES } from './scrubRules';
import { ESG_FRAMEWORK_NOTES, ESG_FIELD_TO_METRIC_KEY } from './frameworkNotes';
import { ESG_EXPORT_SHEETS } from './exportConfig';
import { esgIndustryContextProvider } from './industryContext';
import { esgMaturityResolver } from './matrixGenerator';
import { esgMatrixGenerator } from './matrixGenerator';
import { esgInformalPracticeHandler } from './informalPractices';
import { esgRetrieveData } from './dataModel';
import { ESG_TOPIC_REQUIREMENTS } from './topicRequirements';
import { esgQuestionBankHook } from './questionBank/hook';
// ============================================
// Assembled Pack
// ============================================
export const esgDomainPack = {
    name: 'esg',
    version: '1.0.0',
    // Keyword Matching
    keywordRules: ESG_KEYWORD_RULES,
    domainSuggestions: ESG_DOMAIN_SUGGESTIONS,
    termAliases: ESG_TERM_ALIASES,
    exclusionPatterns: ESG_EXCLUSION_PATTERNS,
    // Question Classification
    questionTypes: [...ESG_QUESTION_TYPES],
    classifierSignals: ESG_CLASSIFIER_SIGNALS,
    defaultQuestionType: ESG_DEFAULT_QUESTION_TYPE,
    // Answer Generation
    answerTemplates: ESG_ANSWER_TEMPLATES,
    frameworkNotes: ESG_FRAMEWORK_NOTES,
    fieldToMetricKey: ESG_FIELD_TO_METRIC_KEY,
    topicRequirements: ESG_TOPIC_REQUIREMENTS,
    // Context Providers
    industryContextProvider: esgIndustryContextProvider,
    maturityResolver: esgMaturityResolver,
    matrixGenerator: esgMatrixGenerator,
    informalPracticeHandler: esgInformalPracticeHandler,
    // Defensive Rewriting
    scrubRules: ESG_SCRUB_RULES,
    // Question Bank — canonical routing runs before the topic pipeline; retrieval carries the raw
    // record so the bank can answer from the fields a question names, and nothing else.
    questionBank: esgQuestionBankHook,
    // Data Retrieval
    retrieveData: (matchResult, data) => ({ ...esgRetrieveData(matchResult, data), raw: data }),
    // Excel Export
    exportSheets: ESG_EXPORT_SHEETS,
};
export { ESG_QUESTION_BANK, ESG_BANK_MAPPINGS, getCanonicalQuestion, summarizeLegalBasis } from './questionBank';
export { matchCanonical, matchCanonicalAll, matchCanonicalBatch } from './questionBank/matcher';
export { renderBankAnswer } from './questionBank/render';
export { SUPPORTED_COUNTRIES } from './emissionFactors';
//# sourceMappingURL=index.js.map