import { exportToBuffer, exportToExcel } from '../engine/excelExporter';
import { buildWorkspaceExportSheets } from './workspaceArtifacts';
export function buildWorkspaceExportMetadata(workspace, options = {}) {
    return {
        companyName: options.companyName,
        generatedAt: options.generatedAt || new Date().toISOString(),
        packName: workspace.packName,
        packVersion: workspace.packVersion,
        extra: {
            playbookId: workspace.playbook.id,
            playbookLabel: workspace.playbook.label,
            totalQuestions: workspace.metrics.totalQuestions,
            readyCount: workspace.metrics.readyCount,
            reviewCount: workspace.metrics.reviewCount,
            dataNeededCount: workspace.metrics.dataNeededCount,
            ...options.extra,
        },
    };
}
export async function exportWorkspaceToBuffer(workspace, options = {}) {
    return exportToBuffer({
        answerDrafts: workspace.items.map(item => item.draft),
        metadata: buildWorkspaceExportMetadata(workspace, options),
        customSheets: buildWorkspaceExportSheets(workspace),
    });
}
export async function exportWorkspaceToExcel(workspace, options = {}) {
    return exportToExcel({
        answerDrafts: workspace.items.map(item => item.draft),
        metadata: buildWorkspaceExportMetadata(workspace, options),
        customSheets: buildWorkspaceExportSheets(workspace),
        fileName: options.fileName,
    });
}
//# sourceMappingURL=workspaceExport.js.map