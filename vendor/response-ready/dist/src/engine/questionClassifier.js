// ============================================
// ResponseReady — Question Classifier (Domain-Agnostic)
// ============================================
// Classifies questions by type using injectable signal rules.
// No hardcoded signals — all domain knowledge comes from the DomainPack.
function scoreQuestion(text, signalRules, questionTypes) {
    const scores = {};
    for (const t of questionTypes) {
        scores[t] = { score: 0, signals: [] };
    }
    for (const rule of signalRules) {
        if (!scores[rule.type])
            scores[rule.type] = { score: 0, signals: [] };
        // Pattern matching (higher fidelity)
        for (const pattern of rule.patterns) {
            if (pattern.test(text)) {
                scores[rule.type].score += rule.weight;
                scores[rule.type].signals.push(pattern.source.replace(/\\b/g, '').slice(0, 30));
                break;
            }
        }
        // Keyword matching (broader net)
        const normalized = text.toLowerCase();
        for (const kw of rule.keywords) {
            if (normalized.includes(kw)) {
                scores[rule.type].score += Math.ceil(rule.weight / 2);
                scores[rule.type].signals.push(kw);
                break;
            }
        }
    }
    return Object.entries(scores)
        .map(([type, { score, signals }]) => ({
        type,
        score,
        signals: [...new Set(signals)],
    }))
        .sort((a, b) => b.score - a.score);
}
/**
 * Create a question classifier from domain-specific signal rules.
 * @param signalRules - Signal rules from the domain pack
 * @param questionTypes - Valid question types (e.g. ['POLICY', 'MEASURE', 'KPI'])
 * @param defaultType - Fallback type when classification is ambiguous
 */
export function createClassifier(signalRules, questionTypes, defaultType = questionTypes[0] || 'UNKNOWN') {
    function classifyQuestion(questionId, questionText, category) {
        const combinedText = category ? `${questionText} [${category}]` : questionText;
        const ranked = scoreQuestion(combinedText, signalRules, questionTypes);
        const top = ranked[0];
        const runner = ranked[1];
        let confidence;
        if (!top || top.score === 0) {
            confidence = 'low';
        }
        else if (top.score >= 15 && runner && top.score - runner.score >= 5) {
            confidence = 'high';
        }
        else if (top.score >= 8) {
            confidence = 'medium';
        }
        else {
            confidence = 'low';
        }
        return {
            questionId,
            questionType: top && top.score > 0 ? top.type : defaultType,
            confidence,
            matchedSignals: top ? top.signals.slice(0, 5) : [],
        };
    }
    function classifyQuestions(questions) {
        return questions.map(q => classifyQuestion(q.id, q.text, q.category));
    }
    function getClassificationStats(results) {
        const byType = {};
        for (const t of questionTypes)
            byType[t] = 0;
        for (const r of results) {
            byType[r.questionType] = (byType[r.questionType] || 0) + 1;
        }
        return {
            byType,
            highConfidence: results.filter(r => r.confidence === 'high').length,
        };
    }
    return { classifyQuestion, classifyQuestions, getClassificationStats };
}
//# sourceMappingURL=questionClassifier.js.map