export { parseQuestionFile, reprocessWithMapping, parseQuestionsFromText } from './questionParser';
export { parseCSV, parseCSVLine, loadMappingRules, loadMetricKeys } from './configLoader';
export { createMatcher } from './keywordMatcher';
export type { KeywordMatcherInstance } from './keywordMatcher';
export { createClassifier } from './questionClassifier';
export type { ClassifierInstance } from './questionClassifier';
export { retrieveData, addIfPresent, deduplicatePoints, emptyDataContext } from './dataRetrieval';
export { createAnswerGenerator, buildDataMap, val, has, num, str, fmt } from './answerGenerator';
export type { AnswerGeneratorDeps, AnswerGeneratorInstance } from './answerGenerator';
export { createRewriter } from './defensiveRewriter';
export type { RewriterInstance } from './defensiveRewriter';
export { exportToExcel, exportToBuffer } from './excelExporter';
export type { ExportOptions } from './excelExporter';
//# sourceMappingURL=index.d.ts.map