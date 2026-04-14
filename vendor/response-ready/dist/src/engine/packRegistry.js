// ============================================
// ResponseReady — Pack Registry & Auto-Selection
// ============================================
// Maps detected frameworks to domain packs and provides
// auto-selection logic based on parsed questionnaire content.
// ============================================
// Registry
// ============================================
const entries = [];
/**
 * Register a domain pack with the frameworks it handles.
 */
export function registerPack(entry) {
    entries.push(entry);
}
/**
 * Get all registered packs (for building UI dropdowns, etc.)
 */
export function getRegisteredPacks() {
    return entries;
}
/**
 * Get a pack by its name.
 */
export function getPackByName(name) {
    return entries.find(e => e.pack.name === name);
}
/**
 * Auto-detect which pack to use based on a ParseResult.
 *
 * Logic:
 * 1. If the parser detected a specific framework, find the pack that handles it → high confidence.
 * 2. If no framework detected, try keyword-scoring each pack's rules against the questions → low confidence.
 * 3. If still no match, return null so the UI can ask the user.
 */
export function detectPack(parseResult) {
    const { detectedFramework } = parseResult.metadata;
    // --- Step 1: Framework match ---
    if (detectedFramework) {
        for (const entry of entries) {
            if (entry.frameworks.includes(detectedFramework)) {
                return {
                    entry,
                    detectedFramework,
                    confidence: 'high',
                    reason: `Detected ${detectedFramework} framework — using ${entry.label}.`,
                };
            }
        }
        // Framework detected but no pack registered for it — still useful info
        return {
            entry: null,
            detectedFramework,
            confidence: 'low',
            reason: `Detected ${detectedFramework} framework but no matching pack is registered.`,
        };
    }
    // --- Step 2: Keyword scoring fallback ---
    if (parseResult.questions.length > 0 && entries.length > 0) {
        const allText = parseResult.questions.map(q => q.text.toLowerCase()).join(' ');
        let bestEntry = null;
        let bestScore = 0;
        for (const entry of entries) {
            let score = 0;
            for (const rule of entry.pack.keywordRules) {
                for (const kw of rule.keywords) {
                    if (allText.includes(kw.toLowerCase())) {
                        score += rule.weight;
                    }
                }
            }
            if (score > bestScore) {
                bestScore = score;
                bestEntry = entry;
            }
        }
        // Require a minimum score threshold to avoid false positives
        if (bestEntry && bestScore >= 30) {
            return {
                entry: bestEntry,
                detectedFramework: undefined,
                confidence: 'low',
                reason: `No specific framework detected. Best keyword match: ${bestEntry.label} (score: ${bestScore}). Please confirm.`,
            };
        }
    }
    // --- Step 3: No match ---
    return {
        entry: null,
        detectedFramework: undefined,
        confidence: 'low',
        reason: 'Could not determine the questionnaire type. Please select manually.',
    };
}
/**
 * Clear registry (useful for testing).
 */
export function clearRegistry() {
    entries.length = 0;
}
//# sourceMappingURL=packRegistry.js.map