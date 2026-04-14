// ============================================
// ResponseReady — Config Loader (Domain-Agnostic)
// ============================================
// Generic CSV/JSON configuration loading utilities.
// Domain packs use these to load their own config files.
// ============================================
// CSV Parsing Utilities
// ============================================
export function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (inQuotes) {
            if (ch === '"' && line[i + 1] === '"') {
                current += '"';
                i++;
            }
            else if (ch === '"') {
                inQuotes = false;
            }
            else {
                current += ch;
            }
        }
        else {
            if (ch === '"') {
                inQuotes = true;
            }
            else if (ch === ',') {
                result.push(current.trim());
                current = '';
            }
            else {
                current += ch;
            }
        }
    }
    result.push(current.trim());
    return result;
}
export function parseCSV(text) {
    const lines = text.split('\n').map(l => l.replace(/\r$/, '')).filter(l => l.trim());
    if (lines.length < 2)
        return [];
    const headers = parseCSVLine(lines[0]);
    return lines.slice(1).map(line => {
        const values = parseCSVLine(line);
        const row = {};
        headers.forEach((h, i) => { row[h] = values[i] || ''; });
        return row;
    });
}
// ============================================
// Generic Config Loaders
// ============================================
/**
 * Load mapping rules from a CSV file at the given URL.
 * Returns an empty array if loading fails.
 */
export async function loadMappingRules(url) {
    try {
        const resp = await fetch(url);
        if (!resp.ok)
            throw new Error(`Failed to load mapping rules: ${resp.status}`);
        const text = await resp.text();
        const rows = parseCSV(text);
        return rows.map(row => ({
            priority: parseInt(row.priority) || 99,
            patternType: row.patternType || 'keyword',
            pattern: row.pattern || '',
            category: row.category || '',
            metricKeys: row.metricKeys ? row.metricKeys.split(',').map(k => k.trim()) : [],
            answerTemplate: row.answerTemplate || '',
            promptIfMissing: row.promptIfMissing || '',
        })).sort((a, b) => a.priority - b.priority);
    }
    catch (err) {
        console.warn('Failed to load mapping rules from CSV, using empty set:', err);
        return [];
    }
}
/**
 * Load metric key definitions from a CSV file at the given URL.
 * Returns an empty array if loading fails.
 */
export async function loadMetricKeys(url) {
    try {
        const resp = await fetch(url);
        if (!resp.ok)
            throw new Error(`Failed to load metric keys: ${resp.status}`);
        const text = await resp.text();
        const rows = parseCSV(text);
        return rows.map(row => ({
            key: row.metricKey || '',
            label: row.label || '',
            unit: row.unit || '',
            period: row.period || '',
            allowedInputType: row.allowedInputType === 'boolean' ? 'boolean' : 'number',
            definition: row.definition || '',
            notes: row.notes || '',
        }));
    }
    catch (err) {
        console.warn('Failed to load metric keys from CSV, using empty set:', err);
        return [];
    }
}
//# sourceMappingURL=configLoader.js.map