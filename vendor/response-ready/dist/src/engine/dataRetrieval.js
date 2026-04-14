// ============================================
// ResponseReady — Data Retrieval (Domain-Agnostic)
// ============================================
// Delegates to the domain pack's retrieveData() function.
// Provides generic utility functions for data point manipulation.
// ============================================
// Utility Functions
// ============================================
/** Add a data point if the value is present (not undefined, empty, or zero). */
export function addIfPresent(points, domain, field, label, value, options) {
    if (value !== undefined && value !== '' && value !== 0) {
        points.push({
            domain,
            field,
            label,
            value,
            confidence: options?.confidence ?? 'high',
            unit: options?.unit,
            period: options?.period,
        });
    }
}
/** Deduplicate data points by domain + field. */
export function deduplicatePoints(points) {
    const seen = new Set();
    return points.filter(p => {
        const key = `${p.domain}-${p.field}`;
        if (seen.has(key))
            return false;
        seen.add(key);
        return true;
    });
}
/** Create an empty DataContext with optional metadata. */
export function emptyDataContext(metadata) {
    return {
        company: [],
        operational: [],
        calculated: [],
        metadata: {
            sitesIncluded: [],
            dataGaps: [],
            ...metadata,
        },
    };
}
// ============================================
// Core Retrieval
// ============================================
/**
 * Retrieve data for a matched question using the domain pack's retrieval function.
 * This is a thin orchestration wrapper — the real logic is in the pack.
 */
export function retrieveData(matchResult, data, retrieveFn) {
    return retrieveFn(matchResult, data);
}
//# sourceMappingURL=dataRetrieval.js.map