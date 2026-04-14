import type { DomainPack } from '../types/domain-pack';
import type { ParseResult } from '../types/engine';
export interface PackRegistryEntry {
    /** The domain pack instance */
    pack: DomainPack<unknown, unknown>;
    /** Frameworks this pack handles */
    frameworks: string[];
    /** Human-readable label for UI */
    label: string;
    /** Short description for UI */
    description: string;
}
export interface PackDetectionResult {
    /** The recommended pack entry, or null if no match */
    entry: PackRegistryEntry | null;
    /** The detected framework string (from parser) */
    detectedFramework: string | undefined;
    /** How confident we are in the auto-selection */
    confidence: 'high' | 'low';
    /** Reason for the selection */
    reason: string;
}
/**
 * Register a domain pack with the frameworks it handles.
 */
export declare function registerPack(entry: PackRegistryEntry): void;
/**
 * Get all registered packs (for building UI dropdowns, etc.)
 */
export declare function getRegisteredPacks(): readonly PackRegistryEntry[];
/**
 * Get a pack by its name.
 */
export declare function getPackByName(name: string): PackRegistryEntry | undefined;
/**
 * Auto-detect which pack to use based on a ParseResult.
 *
 * Logic:
 * 1. If the parser detected a specific framework, find the pack that handles it → high confidence.
 * 2. If no framework detected, try keyword-scoring each pack's rules against the questions → low confidence.
 * 3. If still no match, return null so the UI can ask the user.
 */
export declare function detectPack(parseResult: ParseResult): PackDetectionResult;
/**
 * Clear registry (useful for testing).
 */
export declare function clearRegistry(): void;
//# sourceMappingURL=packRegistry.d.ts.map