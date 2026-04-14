// ============================================
// ResponseReady — Excel Exporter (ExcelJS)
// ============================================
// Exports answer drafts to professionally styled Excel files.
// Sheet definitions are injectable from the DomainPack.
import ExcelJS from 'exceljs';
// ============================================
// Brand Colors
// ============================================
const COLORS = {
    ink: '1A1A1A',
    cream: 'FDFBF7',
    ivory: 'F7F5F0',
    muted: '6B6B6B',
    white: 'FFFFFF',
    // Confidence
    providedBg: 'E8F5E9',
    providedText: '2E7D32',
    estimatedBg: 'FFF8E1',
    estimatedText: 'F57F17',
    unknownBg: 'FFEBEE',
    unknownText: 'C62828',
    // Misc
    sectionBg: 'EDEDED',
    warningBg: 'B71C1C',
};
// Table starts at B2 (col 2, row 2) — leaves a spacer column and row
const START_COL = 2;
const START_ROW = 2;
// ============================================
// Helpers
// ============================================
/** Convert 1-based column number to Excel letter (1=A, 2=B, 27=AA). */
function colLetter(n) {
    let s = '';
    let num = n;
    while (num > 0) {
        num--;
        s = String.fromCharCode(65 + (num % 26)) + s;
        num = Math.floor(num / 26);
    }
    return s;
}
/** Get the cell at (row, absolute column) accounting for offset. */
function cell(ws, row, col) {
    return ws.getCell(row, col);
}
// ============================================
// Style Helpers
// ============================================
function styleHeaderCells(ws, rowNum, colCount) {
    const row = ws.getRow(rowNum);
    row.height = 28;
    for (let i = 0; i < colCount; i++) {
        const c = cell(ws, rowNum, START_COL + i);
        c.font = { bold: true, color: { argb: COLORS.white }, size: 11 };
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.ink } };
        c.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        c.border = { bottom: { style: 'thin', color: { argb: COLORS.ink } } };
    }
}
function styleDataCells(ws, rowNum, colCount, isEven) {
    for (let i = 0; i < colCount; i++) {
        const c = cell(ws, rowNum, START_COL + i);
        c.font = { size: 10, color: { argb: COLORS.ink } };
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isEven ? COLORS.ivory : COLORS.white } };
        c.alignment = { vertical: 'top', wrapText: true };
        c.border = { bottom: { style: 'hair', color: { argb: 'DDDDDD' } } };
    }
}
function styleConfidenceCell(c, value) {
    const v = (value || '').toLowerCase();
    if (v === 'provided') {
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.providedBg } };
        c.font = { size: 10, bold: true, color: { argb: COLORS.providedText } };
    }
    else if (v === 'estimated') {
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.estimatedBg } };
        c.font = { size: 10, bold: true, color: { argb: COLORS.estimatedText } };
    }
    else if (v === 'unknown' || v === 'needs review') {
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.unknownBg } };
        c.font = { size: 10, bold: true, color: { argb: COLORS.unknownText } };
    }
    c.alignment = { vertical: 'top', horizontal: 'center' };
}
function styleSectionCells(ws, rowNum, colCount) {
    const row = ws.getRow(rowNum);
    row.height = 24;
    for (let i = 0; i < colCount; i++) {
        const c = cell(ws, rowNum, START_COL + i);
        c.font = { bold: true, size: 10, color: { argb: COLORS.ink } };
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.sectionBg } };
        c.alignment = { vertical: 'middle' };
        c.border = {
            top: { style: 'thin', color: { argb: COLORS.muted } },
            bottom: { style: 'thin', color: { argb: COLORS.muted } },
        };
    }
}
// ============================================
// Worksheet Setup (common for all sheets)
// ============================================
function setupWorksheet(workbook, name, opts) {
    const headerRow = START_ROW;
    const ws = workbook.addWorksheet(name, {
        properties: { defaultRowHeight: 18 },
        views: [{
                showGridLines: opts.showGridLines ?? false,
                ...(opts.freezeHeader !== false ? { state: 'frozen', ySplit: headerRow, xSplit: 0 } : {}),
            }],
    });
    // Spacer column A
    ws.getColumn(1).width = 2;
    // Data columns starting at B
    for (let i = 0; i < opts.columnWidths.length; i++) {
        ws.getColumn(START_COL + i).width = opts.columnWidths[i];
    }
    // Spacer row 1
    ws.getRow(1).height = 8;
    return ws;
}
// ============================================
// Generic Sheet Builders (defaults)
// ============================================
function buildDefaultAnswersSheet(drafts) {
    const headers = [
        'QuestionID', 'Question', 'Type', 'Category',
        'Answer', 'Confidence', 'Assumptions', 'Data Gaps',
    ];
    const rows = drafts.map(d => [
        d.questionId,
        d.questionText,
        d.questionType || '',
        d.category || '',
        d.answer,
        d.confidenceSource,
        (d.assumptions || []).join('; '),
        d.hasDataGaps ? d.dataContext.metadata.dataGaps.join('; ') : '',
    ]);
    return { headers, rows, columnWidths: [12, 50, 10, 15, 60, 14, 30, 30], style: 'table' };
}
function buildDefaultReviewSheet(drafts) {
    const headers = ['Status', 'Question', 'Category', 'Action Required'];
    const rows = [];
    const estimated = drafts.filter(d => d.confidenceSource === 'estimated');
    if (estimated.length > 0) {
        rows.push(['', '--- Estimated Values \u2014 Verify with Source Documents ---', '', '']);
        for (const d of estimated) {
            const text = d.questionText.length > 80 ? d.questionText.slice(0, 80) + '...' : d.questionText;
            rows.push(['\u2610', text, d.category || '', 'Verify value and update if needed']);
        }
    }
    const unknown = drafts.filter(d => d.confidenceSource === 'unknown');
    if (unknown.length > 0) {
        rows.push(['', '--- Unknown Values \u2014 Data Collection Needed ---', '', '']);
        for (const d of unknown) {
            const text = d.questionText.length > 80 ? d.questionText.slice(0, 80) + '...' : d.questionText;
            const action = d.promptForMissing ? `Collect data: ${d.promptForMissing}` : 'Collect required data';
            rows.push(['\u2610', text, d.category || '', action]);
        }
    }
    return { headers, rows, columnWidths: [8, 65, 18, 50], style: 'checklist' };
}
// ============================================
// SheetData → ExcelJS Worksheet
// ============================================
function writeRow(ws, rowNum, data) {
    for (let i = 0; i < data.length; i++) {
        const val = data[i];
        if (val !== null && val !== undefined) {
            cell(ws, rowNum, START_COL + i).value = val;
        }
    }
}
function applySheetData(workbook, sheetName, sheetData) {
    const style = sheetData.style || 'table';
    const colCount = sheetData.headers.length;
    if (style === 'summary') {
        applySummaryStyle(workbook, sheetName, sheetData);
        return;
    }
    const isChecklist = style === 'checklist';
    const ws = setupWorksheet(workbook, sheetName, {
        columnWidths: sheetData.columnWidths || [],
        freezeHeader: !isChecklist, // Don't freeze on checklist (banner + header)
    });
    let currentRow = START_ROW;
    // Warning banner for checklist sheets
    if (isChecklist) {
        const bannerRow = currentRow;
        const bannerText = '\u26A0  DELETE THIS SHEET BEFORE SENDING TO A CUSTOMER';
        const lastCol = START_COL + colCount - 1;
        cell(ws, bannerRow, START_COL).value = bannerText;
        ws.mergeCells(bannerRow, START_COL, bannerRow, lastCol);
        const bannerCell = cell(ws, bannerRow, START_COL);
        bannerCell.font = { bold: true, size: 13, color: { argb: COLORS.white } };
        bannerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.warningBg } };
        bannerCell.alignment = { vertical: 'middle', horizontal: 'center' };
        bannerCell.border = {
            bottom: { style: 'medium', color: { argb: COLORS.warningBg } },
        };
        ws.getRow(bannerRow).height = 36;
        currentRow++;
        // Empty row after banner
        ws.getRow(currentRow).height = 8;
        currentRow++;
        // Freeze at banner + spacer + header
        ws.views = [{
                showGridLines: false,
                state: 'frozen',
                ySplit: currentRow, // freeze after header row (which will be currentRow)
                xSplit: 0,
            }];
    }
    // Header row
    const headerRowNum = currentRow;
    writeRow(ws, headerRowNum, sheetData.headers);
    styleHeaderCells(ws, headerRowNum, colCount);
    currentRow++;
    // Auto-filter on header
    if (colCount >= 3) {
        const fromCol = colLetter(START_COL);
        const toCol = colLetter(START_COL + colCount - 1);
        ws.autoFilter = `${fromCol}${headerRowNum}:${toCol}${headerRowNum}`;
    }
    // Detect Confidence column
    const confidenceCol = sheetData.headers.findIndex(h => h.toLowerCase() === 'confidence');
    // Data rows
    let dataRowIndex = 0;
    for (const rowData of sheetData.rows) {
        const isSectionSep = typeof rowData[1] === 'string' && rowData[1].startsWith('---');
        writeRow(ws, currentRow, rowData);
        if (isSectionSep) {
            styleSectionCells(ws, currentRow, colCount);
        }
        else {
            styleDataCells(ws, currentRow, colCount, dataRowIndex % 2 === 0);
            if (confidenceCol >= 0) {
                styleConfidenceCell(cell(ws, currentRow, START_COL + confidenceCol), String(rowData[confidenceCol] || ''));
            }
            dataRowIndex++;
        }
        currentRow++;
    }
}
// ============================================
// Executive Summary Styling
// ============================================
function applySummaryStyle(workbook, sheetName, sheetData) {
    const ws = setupWorksheet(workbook, sheetName, {
        columnWidths: sheetData.columnWidths || [],
        freezeHeader: false,
    });
    const colCount = sheetData.headers.length;
    let currentRow = START_ROW;
    for (const rowData of sheetData.rows) {
        writeRow(ws, currentRow, rowData);
        const firstCell = String(rowData[0] || '');
        const lastCol = START_COL + colCount - 1;
        // Title row (e.g. "ESG Response Summary — CompanyName")
        if (firstCell.includes('Summary') && !firstCell.startsWith('  ')) {
            ws.getRow(currentRow).height = 36;
            const c = cell(ws, currentRow, START_COL);
            c.font = { bold: true, size: 18, color: { argb: COLORS.ink } };
            c.border = { bottom: { style: 'medium', color: { argb: COLORS.ink } } };
            ws.mergeCells(currentRow, START_COL, currentRow, lastCol);
            currentRow++;
            continue;
        }
        // Footer row (e.g. "Generated by ESG Passport")
        if (firstCell.startsWith('Generated by')) {
            ws.getRow(currentRow).height = 20;
            cell(ws, currentRow, START_COL).font = { italic: true, size: 9, color: { argb: COLORS.muted } };
            ws.mergeCells(currentRow, START_COL, currentRow, lastCol);
            currentRow++;
            continue;
        }
        // Empty/spacer rows
        if (!firstCell) {
            ws.getRow(currentRow).height = 10;
            currentRow++;
            continue;
        }
        // Section headers (e.g. "Key Facts:", "Energy & Greenhouse Gases:")
        if (firstCell.endsWith(':') && !firstCell.startsWith('  ') && (rowData[1] === null || rowData[1] === undefined)) {
            ws.getRow(currentRow).height = 24;
            const c = cell(ws, currentRow, START_COL);
            c.font = { bold: true, size: 11, color: { argb: COLORS.ink } };
            c.border = { bottom: { style: 'thin', color: { argb: COLORS.muted } } };
            ws.mergeCells(currentRow, START_COL, currentRow, lastCol);
            currentRow++;
            continue;
        }
        // Checkmark rows (policies: "  ✓")
        if (firstCell.trim() === '\u2713') {
            cell(ws, currentRow, START_COL).font = { size: 10, color: { argb: COLORS.providedText } };
            cell(ws, currentRow, START_COL + 1).font = { size: 10, color: { argb: COLORS.ink } };
            currentRow++;
            continue;
        }
        // Indented data rows (e.g. "  Company: ...", "  Electricity  166,000 kWh")
        if (firstCell.startsWith('  ')) {
            cell(ws, currentRow, START_COL).font = { size: 10, color: { argb: COLORS.muted } };
            if (colCount > 1)
                cell(ws, currentRow, START_COL + 1).font = { size: 10, color: { argb: COLORS.ink } };
            currentRow++;
            continue;
        }
        // Narrative paragraphs (long text, no colon at end, not indented)
        // These are body text — wrap across the full width
        if (firstCell.length > 40) {
            const c = cell(ws, currentRow, START_COL);
            c.font = { size: 10.5, color: { argb: COLORS.ink } };
            c.alignment = { vertical: 'top', wrapText: true };
            ws.mergeCells(currentRow, START_COL, currentRow, lastCol);
            // Estimate row height based on text length and column width (~90 chars wide)
            const lines = Math.ceil(firstCell.length / 85);
            ws.getRow(currentRow).height = Math.max(18, lines * 16);
            currentRow++;
            continue;
        }
        // Fallback
        cell(ws, currentRow, START_COL).font = { size: 10, color: { argb: COLORS.muted } };
        cell(ws, currentRow, START_COL + 1).font = { size: 10, color: { argb: COLORS.ink } };
        currentRow++;
    }
}
// ============================================
// File Name Helper
// ============================================
function buildFileName(metadata, customName) {
    if (customName)
        return `${customName}.xlsx`;
    const company = metadata.companyName
        ? metadata.companyName.replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
        : 'responses';
    const date = metadata.generatedAt.slice(0, 10);
    return `ESG-Responses-${company}-${date}.xlsx`;
}
/**
 * Export answer drafts to a styled Excel workbook and trigger download.
 */
export async function exportToExcel(opts) {
    const { answerDrafts, metadata, customSheets, fileName } = opts;
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'ESG Passport';
    workbook.created = new Date();
    if (customSheets && customSheets.length > 0) {
        for (const sheetConfig of customSheets) {
            const sheetData = sheetConfig.buildSheet(answerDrafts, metadata);
            applySheetData(workbook, sheetConfig.name, sheetData);
        }
    }
    else {
        applySheetData(workbook, 'Answers', buildDefaultAnswersSheet(answerDrafts));
        applySheetData(workbook, 'Review Checklist', buildDefaultReviewSheet(answerDrafts));
    }
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = buildFileName(metadata, fileName);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
/**
 * Build Excel workbook as a buffer (for server-side or programmatic use).
 */
export async function exportToBuffer(opts) {
    const { answerDrafts, metadata, customSheets } = opts;
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'ESG Passport';
    workbook.created = new Date();
    if (customSheets && customSheets.length > 0) {
        for (const sheetConfig of customSheets) {
            const sheetData = sheetConfig.buildSheet(answerDrafts, metadata);
            applySheetData(workbook, sheetConfig.name, sheetData);
        }
    }
    else {
        applySheetData(workbook, 'Answers', buildDefaultAnswersSheet(answerDrafts));
        applySheetData(workbook, 'Review Checklist', buildDefaultReviewSheet(answerDrafts));
    }
    const buffer = await workbook.xlsx.writeBuffer();
    return new Uint8Array(buffer);
}
//# sourceMappingURL=excelExporter.js.map