export type PlaybookFieldType = 'text' | 'textarea' | 'number' | 'currency' | 'date' | 'select' | 'multiselect' | 'boolean';
export type PlaybookOutputType = 'draft' | 'matrix' | 'checklist' | 'summary' | 'evidence-list' | 'risk-register';
export interface PlaybookIntakeField {
    id: string;
    label: string;
    type: PlaybookFieldType;
    required: boolean;
    helpText?: string;
    options?: string[];
}
export interface PlaybookUploadSlot {
    id: string;
    label: string;
    required: boolean;
    acceptedFormats: string[];
    examples: string[];
}
export interface PlaybookOutput {
    id: string;
    label: string;
    type: PlaybookOutputType;
    description: string;
}
export interface PlaybookReviewCheck {
    id: string;
    label: string;
    severity: 'blocking' | 'warning' | 'advisory';
}
export interface Playbook {
    id: string;
    label: string;
    focusArea: string;
    description: string;
    businessPain: string;
    recommendedPackNames: string[];
    tags: string[];
    detectionKeywords: string[];
    intakeFields: PlaybookIntakeField[];
    uploadSlots: PlaybookUploadSlot[];
    outputs: PlaybookOutput[];
    reviewChecklist: PlaybookReviewCheck[];
    starterQuestions: string[];
}
export interface PlaybookDetectionInput {
    text?: string;
    fileNames?: string[];
    tags?: string[];
}
export interface PlaybookDetectionResult {
    playbook: Playbook | null;
    confidence: 'high' | 'medium' | 'low' | 'none';
    score: number;
    matchedKeywords: string[];
    reason: string;
}
//# sourceMappingURL=playbook.d.ts.map