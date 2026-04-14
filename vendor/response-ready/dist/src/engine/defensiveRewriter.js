// ============================================
// ResponseReady — Defensive Rewriter (Domain-Agnostic)
// ============================================
// Post-processes generated answers to scrub AI-isms,
// convert passive language to active roadmap language,
// and ensure sentence variety across batches.
// Scrub rules are injectable from the DomainPack.
// ============================================
// Sentence Opener Variety
// ============================================
const VARIETY_OPENERS = [
    'Our organization ',
    'We ',
    'Our team ',
    'Our operations ',
    'Across our facilities, ',
    'Within our management approach, ',
    'As part of our commitment, ',
    'In line with our objectives, ',
    'Through our operational practices, ',
    'To support continuous improvement, ',
];
function applyVariety(answers) {
    if (answers.length <= 3)
        return answers;
    const result = [...answers];
    let lastOpener = '';
    let repeatCount = 0;
    let varietyIdx = 0;
    for (let i = 0; i < result.length; i++) {
        const firstSentence = result[i].split(/[.!?]/)[0] || '';
        const opener = firstSentence.slice(0, 20).toLowerCase();
        if (opener === lastOpener) {
            repeatCount++;
        }
        else {
            repeatCount = 0;
            lastOpener = opener;
        }
        if (repeatCount >= 2) {
            const newOpener = VARIETY_OPENERS[varietyIdx % VARIETY_OPENERS.length];
            varietyIdx++;
            const match = result[i].match(/^(Our organization|Our company|We|Our)\s+/i);
            if (match) {
                result[i] = newOpener + result[i].slice(match[0].length);
                if (newOpener.endsWith(', ') && result[i].length > newOpener.length) {
                    const afterOpener = result[i].slice(newOpener.length);
                    result[i] = newOpener + afterOpener.charAt(0).toLowerCase() + afterOpener.slice(1);
                }
            }
            repeatCount = 0;
        }
    }
    return result;
}
/**
 * Create a defensive rewriter from domain-specific scrub rules.
 * @param scrubRules - Pattern-replacement pairs from the domain pack
 */
export function createRewriter(scrubRules) {
    function rewriteAnswer(text) {
        let result = text;
        for (const rule of scrubRules) {
            const pattern = typeof rule.pattern === 'string'
                ? new RegExp(rule.pattern, 'gi')
                : rule.pattern;
            result = result.replace(pattern, rule.replacement);
        }
        // Clean up artifacts
        result = result.replace(/\s{2,}/g, ' ').trim();
        result = result.replace(/^\s*[,;]\s*/gm, '');
        result = result.replace(/\.\s*\./g, '.');
        // Capitalize first character
        if (result.length > 0 && result[0] !== result[0].toUpperCase()) {
            result = result[0].toUpperCase() + result.slice(1);
        }
        return result;
    }
    function rewriteAnswerBatch(answers) {
        const rewritten = answers.map(a => rewriteAnswer(a));
        return applyVariety(rewritten);
    }
    return { rewriteAnswer, rewriteAnswerBatch };
}
//# sourceMappingURL=defensiveRewriter.js.map