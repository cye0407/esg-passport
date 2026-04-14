import type { SignalRule, ClassificationResult } from '../types';
export interface ClassifierInstance {
    classifyQuestion: (questionId: string, questionText: string, category?: string) => ClassificationResult;
    classifyQuestions: (questions: Array<{
        id: string;
        text: string;
        category?: string;
    }>) => ClassificationResult[];
    getClassificationStats: (results: ClassificationResult[]) => {
        byType: Record<string, number>;
        highConfidence: number;
    };
}
/**
 * Create a question classifier from domain-specific signal rules.
 * @param signalRules - Signal rules from the domain pack
 * @param questionTypes - Valid question types (e.g. ['POLICY', 'MEASURE', 'KPI'])
 * @param defaultType - Fallback type when classification is ambiguous
 */
export declare function createClassifier(signalRules: SignalRule[], questionTypes: string[], defaultType?: string): ClassifierInstance;
//# sourceMappingURL=questionClassifier.d.ts.map