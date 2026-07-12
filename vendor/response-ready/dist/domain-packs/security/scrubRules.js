export const SECURITY_SCRUB_RULES = [
    { pattern: /\bfully compliant\b/gi, replacement: 'aligned with applicable requirements' },
    { pattern: /\bguaranteed secure\b/gi, replacement: 'designed to reduce security risk' },
    { pattern: /\bno security risk\b/gi, replacement: 'security risks are managed through documented controls' },
    { pattern: /\bzero risk\b/gi, replacement: 'reduced risk' },
    { pattern: /\bunhackable\b/gi, replacement: 'protected by implemented security controls' },
    { pattern: /\b100% secure\b/gi, replacement: 'protected by implemented security controls' },
];
//# sourceMappingURL=scrubRules.js.map