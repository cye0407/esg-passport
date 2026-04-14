import type { MappingRule, MetricKey } from '../types';
export declare function parseCSVLine(line: string): string[];
export declare function parseCSV(text: string): Record<string, string>[];
/**
 * Load mapping rules from a CSV file at the given URL.
 * Returns an empty array if loading fails.
 */
export declare function loadMappingRules(url: string): Promise<MappingRule[]>;
/**
 * Load metric key definitions from a CSV file at the given URL.
 * Returns an empty array if loading fails.
 */
export declare function loadMetricKeys(url: string): Promise<MetricKey[]>;
//# sourceMappingURL=configLoader.d.ts.map