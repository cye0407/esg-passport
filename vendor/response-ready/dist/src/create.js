// ============================================
// ResponseReady — Engine Factory
// ============================================
// createResponseEngine(pack) wires a DomainPack into the
// generic processing pipeline and returns a ready-to-use engine.
import { parseQuestionFile, reprocessWithMapping, parseQuestionsFromText } from './engine/questionParser';
import { createMatcher } from './engine/keywordMatcher';
import { createClassifier } from './engine/questionClassifier';
import { createAnswerGenerator } from './engine/answerGenerator';
import { createRewriter } from './engine/defensiveRewriter';
import { exportToExcel, exportToBuffer } from './engine/excelExporter';
import { loadMappingRules } from './engine/configLoader';
// ============================================
// Factory Function
// ============================================
/**
 * Create a fully-wired response engine from a domain pack.
 *
 * @example
 * ```ts
 * import { createResponseEngine } from 'response-ready';
 * import { esgDomainPack } from 'response-ready/domain-packs/esg';
 *
 * const engine = createResponseEngine(esgDomainPack);
 * const result = await engine.parseFile(file);
 * const matches = engine.matchQuestions(result.questions);
 * ```
 */
export function createResponseEngine(pack) {
    // Wire up matcher
    const matcher = createMatcher(pack.keywordRules, pack.domainSuggestions);
    // Wire up classifier (optional)
    const classifier = pack.classifierSignals && pack.questionTypes
        ? createClassifier(pack.classifierSignals, pack.questionTypes, pack.defaultQuestionType)
        : null;
    // Wire up answer generator
    const generator = createAnswerGenerator({
        templates: pack.answerTemplates,
        frameworkNotes: pack.frameworkNotes,
        fieldToMetricKey: pack.fieldToMetricKey,
        scrubRules: pack.scrubRules,
        topicRequirements: pack.topicRequirements,
        maturityResolver: pack.maturityResolver,
        matrixGenerator: pack.matrixGenerator,
        informalPracticeHandler: pack.informalPracticeHandler,
        industryContextProvider: pack.industryContextProvider,
    });
    // Wire up rewriter
    const rewriter = createRewriter(pack.scrubRules || []);
    return {
        packName: pack.name,
        packVersion: pack.version,
        // Parsing
        parseFile: parseQuestionFile,
        parseWithMapping: reprocessWithMapping,
        parseText: parseQuestionsFromText,
        // Matching
        matcher,
        matchQuestion: matcher.matchQuestion,
        matchQuestions: matcher.matchQuestions,
        // Classification
        classifier,
        classifyQuestion: classifier ? classifier.classifyQuestion : null,
        classifyQuestions: classifier ? classifier.classifyQuestions : null,
        // Data Retrieval
        retrieveData: (matchResult, data) => pack.retrieveData(matchResult, data),
        // Answer Generation
        generator,
        generateDraft: generator.generateAnswerDraft,
        generateDrafts: generator.generateAnswerDrafts,
        // Rewriting
        rewriter,
        // Export
        exportToExcel: (opts) => exportToExcel({ ...opts, customSheets: pack.exportSheets }),
        exportToBuffer: (opts) => exportToBuffer({ ...opts, customSheets: pack.exportSheets }),
        // Config Loading
        loadCsvRules: async (url) => {
            const rules = await loadMappingRules(url);
            matcher.setCsvRules(rules);
            return rules;
        },
        // LLM Prompt
        buildLLMPrompt: pack.buildLLMPrompt,
    };
}
//# sourceMappingURL=create.js.map