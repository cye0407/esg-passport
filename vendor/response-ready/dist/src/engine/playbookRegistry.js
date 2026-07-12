// ============================================
// ResponseReady - Playbook Registry & Detection
// ============================================
// Playbooks are focused workflows that sit above domain packs.
import { SME_PLAYBOOKS } from '../playbooks/sme';
const registeredPlaybooks = [...SME_PLAYBOOKS];
function normalize(value) {
    return value.toLowerCase().replace(/[_-]+/g, ' ');
}
function unique(values) {
    return [...new Set(values)];
}
function buildSearchText(input) {
    return [
        input.text,
        ...(input.fileNames || []),
        ...(input.tags || []),
    ]
        .filter((value) => typeof value === 'string' && value.trim().length > 0)
        .map(normalize)
        .join(' ');
}
function confidenceFor(score) {
    if (score >= 30)
        return 'high';
    if (score >= 15)
        return 'medium';
    if (score > 0)
        return 'low';
    return 'none';
}
export function registerPlaybook(playbook) {
    const existingIndex = registeredPlaybooks.findIndex((candidate) => candidate.id === playbook.id);
    if (existingIndex >= 0) {
        registeredPlaybooks[existingIndex] = playbook;
        return;
    }
    registeredPlaybooks.push(playbook);
}
export function getRegisteredPlaybooks() {
    return registeredPlaybooks;
}
export function getDefaultPlaybooks() {
    return SME_PLAYBOOKS;
}
export function getPlaybookById(id) {
    return registeredPlaybooks.find((playbook) => playbook.id === id);
}
export function clearPlaybooks() {
    registeredPlaybooks.length = 0;
}
export function resetPlaybooks() {
    registeredPlaybooks.length = 0;
    registeredPlaybooks.push(...SME_PLAYBOOKS);
}
export function scorePlaybooks(input) {
    const searchText = buildSearchText(input);
    return registeredPlaybooks
        .map((playbook) => {
        const matchedKeywords = unique(playbook.detectionKeywords.filter((keyword) => searchText.includes(normalize(keyword))));
        const tagMatches = (input.tags || []).filter((tag) => playbook.tags.includes(normalize(tag)));
        const score = matchedKeywords.length * 10 + tagMatches.length * 5;
        const confidence = confidenceFor(score);
        return {
            playbook,
            confidence,
            score,
            matchedKeywords,
            reason: matchedKeywords.length > 0
                ? `Matched ${matchedKeywords.join(', ')}.`
                : 'No playbook-specific keywords matched.',
        };
    })
        .sort((a, b) => b.score - a.score || a.playbook.label.localeCompare(b.playbook.label));
}
export function detectPlaybook(input) {
    const [best] = scorePlaybooks(input);
    if (!best || best.score === 0) {
        return {
            playbook: null,
            confidence: 'none',
            score: 0,
            matchedKeywords: [],
            reason: 'No playbook matched. Ask the user to choose a focus area manually.',
        };
    }
    return best;
}
//# sourceMappingURL=playbookRegistry.js.map