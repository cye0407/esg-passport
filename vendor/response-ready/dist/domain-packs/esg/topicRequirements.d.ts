export interface TopicRequirement {
    /** Fields that MUST be present for a data-backed answer */
    requiredFields: string[];
    /** Fields that improve the answer but aren't strictly required */
    optionalFields?: string[];
    /** Human-readable description of what's missing when a required field is absent */
    gapDescriptions: Record<string, string>;
}
export declare const ESG_TOPIC_REQUIREMENTS: Record<string, TopicRequirement>;
/**
 * Check which required fields are missing for a set of topics.
 * Returns gap descriptions for all missing required fields.
 */
export declare function checkTopicGaps(topics: string[], dataMap: Map<string, {
    value: unknown;
}>): string[];
//# sourceMappingURL=topicRequirements.d.ts.map