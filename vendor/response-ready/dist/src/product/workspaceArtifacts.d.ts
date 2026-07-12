import type { ExportSheetConfig } from '../types';
import type { PlaybookWorkspace } from './playbookWorkspace';
export interface ResponseMatrixRow {
    questionId: string;
    question: string;
    answer: string;
    reviewStatus: string;
    owner: string;
    domain: string;
    topics: string;
    confidence: string;
    confidenceSource: string;
    sources: string;
    evidence: string;
}
export interface MissingInfoRow {
    questionId: string;
    question: string;
    domain: string;
    owner: string;
    actionRequired: string;
    dataGaps: string;
    promptForMissing: string;
}
export interface EvidenceChecklistRow {
    questionId: string;
    question: string;
    reviewStatus: string;
    owner: string;
    suggestedEvidence: string;
    sourceReferences: string;
    missingEvidence: boolean;
}
export declare function buildResponseMatrixRows(workspace: PlaybookWorkspace): ResponseMatrixRow[];
export declare function buildMissingInfoRows(workspace: PlaybookWorkspace): MissingInfoRow[];
export declare function buildEvidenceChecklistRows(workspace: PlaybookWorkspace): EvidenceChecklistRow[];
export declare function buildWorkspaceExportSheets(workspace: PlaybookWorkspace): ExportSheetConfig[];
//# sourceMappingURL=workspaceArtifacts.d.ts.map