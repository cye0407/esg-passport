import { PRODUCT_OPS_RFP_ANSWER_TEMPLATES } from './answerTemplates';
import { PRODUCT_OPS_RFP_CLASSIFIER_SIGNALS, PRODUCT_OPS_RFP_DEFAULT_QUESTION_TYPE, PRODUCT_OPS_RFP_QUESTION_TYPES } from './classifierSignals';
import { productOpsRfpRetrieveData } from './dataModel';
import { PRODUCT_OPS_RFP_EXPORT_SHEETS } from './exportConfig';
import { PRODUCT_OPS_RFP_DOMAIN_SUGGESTIONS, PRODUCT_OPS_RFP_KEYWORD_RULES } from './keywordRules';
export const productOpsRfpDomainPack = {
    name: 'product-ops-rfp',
    version: '0.1.0',
    keywordRules: PRODUCT_OPS_RFP_KEYWORD_RULES,
    // Rules top out at weight 10, below the default 'high' band (15); declare explicit bands so a
    // top-weight hit reaches 'high' without the matcher auto-deriving bands for every pack.
    confidenceThresholds: { high: 10, medium: 8 },
    domainSuggestions: PRODUCT_OPS_RFP_DOMAIN_SUGGESTIONS,
    questionTypes: [...PRODUCT_OPS_RFP_QUESTION_TYPES],
    classifierSignals: PRODUCT_OPS_RFP_CLASSIFIER_SIGNALS,
    defaultQuestionType: PRODUCT_OPS_RFP_DEFAULT_QUESTION_TYPE,
    answerTemplates: PRODUCT_OPS_RFP_ANSWER_TEMPLATES,
    retrieveData: productOpsRfpRetrieveData,
    exportSheets: PRODUCT_OPS_RFP_EXPORT_SHEETS,
};
//# sourceMappingURL=index.js.map