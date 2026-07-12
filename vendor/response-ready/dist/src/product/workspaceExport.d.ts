import type { ExportMetadata } from '../types';
import type { PlaybookWorkspace } from './playbookWorkspace';
export interface WorkspaceExportOptions {
    companyName?: string;
    generatedAt?: string;
    fileName?: string;
    extra?: Record<string, string | number | boolean | null | undefined>;
}
export declare function buildWorkspaceExportMetadata(workspace: PlaybookWorkspace, options?: WorkspaceExportOptions): ExportMetadata;
export declare function exportWorkspaceToBuffer(workspace: PlaybookWorkspace, options?: WorkspaceExportOptions): Promise<Uint8Array>;
export declare function exportWorkspaceToExcel(workspace: PlaybookWorkspace, options?: WorkspaceExportOptions): Promise<void>;
//# sourceMappingURL=workspaceExport.d.ts.map