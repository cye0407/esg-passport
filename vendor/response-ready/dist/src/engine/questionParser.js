// ============================================
// ResponseReady — Question Parser (Domain-Agnostic)
// ============================================
// Parses questionnaire files (Excel, CSV, PDF, DOCX) into ParsedQuestion[].
// No domain-specific logic — works for any questionnaire type.
import * as XLSX from 'xlsx';
import { v4 as uuid } from 'uuid';
// ============================================
// Column Detection
// ============================================
const COLUMN_PATTERNS = {
    questionText: [
        'question', 'questions', 'query', 'text', 'description',
        'indicator', 'metric', 'requirement', 'disclosure',
        'question text', 'question_text', 'questiontext',
        'ask', 'item', 'criteria', 'criterion'
    ],
    category: [
        'category', 'topic', 'theme', 'section', 'pillar',
        'area', 'domain', 'group', 'type', 'classification'
    ],
    subcategory: [
        'subcategory', 'sub-category', 'sub_category', 'subtopic',
        'sub-topic', 'sub_topic', 'subsection', 'sub-section'
    ],
    referenceId: [
        'id', 'ref', 'reference', 'code', 'number', 'ref_id',
        'question_id', 'indicator_id', 'disclosure_id',
        'gri', 'esrs', 'sasb', 'cdp'
    ],
    required: [
        'required', 'mandatory', 'optional', 'must', 'shall'
    ]
};
const FRAMEWORK_PATTERNS = {
    // --- ESG / Sustainability Reporting ---
    CSRD: [/csrd/i, /esrs/i, /e1\./i, /s1\./i, /g1\./i],
    GRI: [/gri\s?\d{3}/i, /gri-/i],
    CDP: [/cdp/i, /c\d+\.\d+/i],
    EcoVadis: [/ecovadis/i, /ev-/i],
    SASB: [/sasb/i],
    TCFD: [/tcfd/i],
    UN_SDG: [/sdg/i, /un sdg/i],
    // --- Certifications / Ecolabels ---
    'GLOBALG.A.P.': [/globalg\.?a\.?p/i, /\bggn\b/i, /\bifa\b.*(?:checklist|control|audit|standard)/i, /\bgrasp\b/i, /control\s*point.*(?:cb|af|fv|cc)\b/i, /plant\s*protection\s*product/i, /\bpre-?harvest\s*interval\b/i, /\bmrl\b.*(?:test|result|limit|compliance)/i],
    'B_CORP': [/\bb[\s-]?corp\b/i, /\bb[\s-]?impact/i, /\bbia\b.*(?:score|assessment|question)/i, /\bb[\s-]?lab\b/i],
    'ISO_14001': [/iso\s*14001/i, /\bems\b.*(?:audit|management|review)/i, /clause\s*[4-9]\.\d/i, /environmental\s*management\s*system/i],
    'ORGANIC_EU': [/\borganic\b.*(?:certif|regulation|audit|inspection|standard)/i, /\beu\s*organic\b/i, /regulation.*2018\/848/i, /\busda\s*organic\b/i],
    'RAINFOREST_ALLIANCE': [/rainforest\s*alliance/i, /\butz\b/i, /\bra[\s-]cert/i],
    'FAIRTRADE': [/\bfairtrade\b/i, /\bfair\s*trade\b.*(?:certif|standard|audit|premium)/i, /\bflo\b.*(?:standard|certif)/i],
};
function detectColumnMapping(headers, sampleRows) {
    const mapping = { questionText: '' };
    const normalizedHeaders = headers.map(h => h?.toLowerCase().trim() || '');
    for (const [field, patterns] of Object.entries(COLUMN_PATTERNS)) {
        for (let i = 0; i < normalizedHeaders.length; i++) {
            const header = normalizedHeaders[i];
            if (patterns.some(p => header.includes(p) || header === p)) {
                mapping[field] = headers[i];
                break;
            }
        }
    }
    if (!mapping.questionText && headers.length > 0 && sampleRows && sampleRows.length > 0) {
        let bestCol = '';
        let bestScore = 0;
        for (const header of headers) {
            const values = sampleRows.map(r => String(r[header] || '')).filter(v => v.length > 0);
            if (values.length === 0)
                continue;
            const avgLen = values.reduce((sum, v) => sum + v.length, 0) / values.length;
            const questionMarkRate = values.filter(v => v.includes('?')).length / values.length;
            const actionWordRate = values.filter(v => INTERROGATIVE_START.test(v) || IMPERATIVE_START.test(v)).length / values.length;
            const lengthFactor = avgLen > 300 ? avgLen * 0.1 : avgLen * 0.3;
            const score = lengthFactor + (questionMarkRate * 300) + (actionWordRate * 200);
            if (score > bestScore) {
                bestScore = score;
                bestCol = header;
            }
        }
        if (bestCol && bestScore > 40) {
            mapping.questionText = bestCol;
        }
    }
    if (!mapping.questionText && headers.length > 0) {
        mapping.questionText = headers[0];
    }
    return mapping;
}
function detectFramework(questions) {
    const allText = questions.map(q => `${q.text} ${q.category || ''} ${q.referenceId || ''}`).join(' ');
    for (const [framework, patterns] of Object.entries(FRAMEWORK_PATTERNS)) {
        if (patterns.some(p => p.test(allText)))
            return framework;
    }
    return undefined;
}
function parseRequired(value) {
    if (value === undefined || value === null || value === '')
        return undefined;
    const s = String(value).toLowerCase().trim();
    if (['yes', 'y', 'true', '1', 'required', 'mandatory'].includes(s))
        return true;
    if (['no', 'n', 'false', '0', 'optional'].includes(s))
        return false;
    return undefined;
}
// ============================================
// Question Detection Heuristics
// ============================================
const STRUCTURED_NUMBERING = /^\(\d+(?:\.\d+)+\)\s+/;
const TOC_LINE = /\.{4,}\s*\d*\s*$/;
const SKIP_PATTERNS = [
    /^(copyright|confidential|disclaimer|version\s*[\d\.]|page\s*\d|©)/i,
    /^\d+$/,
    /^[\d\.\-\/\s,\(\)%]+$/,
    /^(yes|no|true|false|x|n\/a)$/i,
    /^(guidance|note[s:\s]|instructions?[\s:]|tip[\s:]|example[\s:]|please note|see also|refer to|for more|this question|you should|if you|the purpose|this section|in this|further guidance|additional info)/i,
    /^(select from|select one|select all that|choose one|choose from|click|enter a|type your|dropdown|response option|please select|upload your|attach your|free text|open.?ended)/i,
    /^(total|subtotal|n\/a|none|not applicable|other \(specify\)|grand total|all of the above|not yet|no change|same as|see above)/i,
    /^(column|row|field|header|label|unit|format|data type|response type|answer type|scoring|weight|points)/i,
    /^[☐☑✓✗✘●○■□▪▫►▶]\s/,
];
const INTERROGATIVE_START = /^(what|how|does|do|is|are|has|have|which|who|where|when|why|can|will|would|should|could|may|might|shall)\b/i;
const IMPERATIVE_START = /^(describe|explain|provide|list|report|disclose|specify|identify|outline|quantify|assess|evaluate|discuss|summarize|summarise)\b/i;
const REFERENCE_ID = /^(C\d+[\.\-]\d|E\d[\.\-]|S\d[\.\-]|G\d[\.\-]|GRI\s*\d{3}|ESRS\s*[ESGO]\d|SASB|Q\d{1,3}[\.\-])/i;
const ENDS_WITH_QUESTION = /\?\s*[)"\u201D]?\s*$/;
function looksLikeQuestion(text) {
    if (text.length < 10)
        return ENDS_WITH_QUESTION.test(text);
    if (text.length > 300)
        return false;
    if (/^[a-z]/.test(text))
        return false;
    if (SKIP_PATTERNS.some(p => p.test(text)))
        return false;
    if (ENDS_WITH_QUESTION.test(text))
        return true;
    if (INTERROGATIVE_START.test(text))
        return true;
    if (IMPERATIVE_START.test(text))
        return true;
    if (REFERENCE_ID.test(text))
        return true;
    return false;
}
// ============================================
// Text-to-Questions (shared by PDF + DOCX)
// ============================================
function questionsFromText(text, fileName) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const questions = [];
    let currentCategory;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (TOC_LINE.test(line))
            continue;
        if (line.length < 50 && !line.includes('?') && !line.match(/^\d+[\.\)]/) && !STRUCTURED_NUMBERING.test(line)) {
            currentCategory = line.replace(/[:.]$/, '').trim();
            continue;
        }
        const hasStructuredId = STRUCTURED_NUMBERING.test(line);
        const cleaned = line
            .replace(/^\(\d+(?:\.\d+)*\)\s*/, '')
            .replace(/^(?:Q?\d+[\.\)\:]?\s*)/i, '')
            .trim();
        if (!cleaned)
            continue;
        if (hasStructuredId && cleaned.length >= 10) {
            const isQuestion = ENDS_WITH_QUESTION.test(cleaned)
                || INTERROGATIVE_START.test(cleaned)
                || IMPERATIVE_START.test(cleaned)
                || cleaned.length > 80;
            if (!isQuestion)
                continue;
            questions.push({ id: uuid(), rowIndex: i + 1, text: cleaned, category: currentCategory, rawRow: { text: line } });
            continue;
        }
        if (!looksLikeQuestion(cleaned))
            continue;
        questions.push({ id: uuid(), rowIndex: i + 1, text: cleaned, category: currentCategory, rawRow: { text: line } });
    }
    const seen = new Set();
    const deduped = [];
    for (const q of questions) {
        const key = q.text.toLowerCase().trim().replace(/\s+/g, ' ');
        if (!seen.has(key)) {
            seen.add(key);
            deduped.push(q);
        }
    }
    const detectedFramework = detectFramework(deduped);
    if (detectedFramework)
        deduped.forEach(q => { q.framework = detectedFramework; });
    return {
        success: deduped.length > 0,
        questions: deduped,
        errors: deduped.length === 0 ? ['No questions could be extracted from the document. Make sure the file contains questionnaire items.'] : [],
        metadata: { fileName, totalRows: lines.length, parsedRows: deduped.length, detectedFramework, columnMapping: { questionText: 'text' } },
    };
}
// ============================================
// PDF Parsing
// ============================================
async function parsePdfFile(file) {
    try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const textParts = [];
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const content = await page.getTextContent();
            const items = content.items
                .filter((item) => 'str' in item && 'transform' in item)
                .map((item) => item);
            if (items.length === 0)
                continue;
            const lines = [];
            let currentLine = items[0].str;
            let lastY = items[0].transform[5];
            for (let j = 1; j < items.length; j++) {
                const item = items[j];
                const y = item.transform[5];
                if (Math.abs(y - lastY) > 3) {
                    lines.push(currentLine.trim());
                    currentLine = item.str;
                }
                else {
                    currentLine += ' ' + item.str;
                }
                lastY = y;
            }
            if (currentLine.trim())
                lines.push(currentLine.trim());
            textParts.push(lines.filter(l => l.length > 0).join('\n'));
        }
        return questionsFromText(textParts.join('\n'), file.name);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error parsing PDF';
        return {
            success: false, questions: [], errors: [`Failed to parse PDF: ${message}`],
            metadata: { fileName: file.name, totalRows: 0, parsedRows: 0, columnMapping: { questionText: '' } },
        };
    }
}
// ============================================
// DOCX Parsing
// ============================================
async function parseDocxFile(file) {
    try {
        const mammoth = await import('mammoth');
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        return questionsFromText(result.value, file.name);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error parsing Word document';
        return {
            success: false, questions: [], errors: [`Failed to parse Word document: ${message}`],
            metadata: { fileName: file.name, totalRows: 0, parsedRows: 0, columnMapping: { questionText: '' } },
        };
    }
}
// ============================================
// Excel / CSV Parsing
// ============================================
function parseSheetData(jsonData, columnMapping, sheetLabel) {
    const questions = [];
    for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        const questionText = String(row[columnMapping.questionText] || '').trim();
        if (!questionText)
            continue;
        if (!looksLikeQuestion(questionText))
            continue;
        const question = { id: uuid(), rowIndex: i + 2, text: questionText, rawRow: row };
        if (columnMapping.category)
            question.category = String(row[columnMapping.category] || '').trim() || undefined;
        if (!question.category && sheetLabel)
            question.category = sheetLabel;
        if (columnMapping.subcategory)
            question.subcategory = String(row[columnMapping.subcategory] || '').trim() || undefined;
        if (columnMapping.referenceId)
            question.referenceId = String(row[columnMapping.referenceId] || '').trim() || undefined;
        if (columnMapping.required)
            question.required = parseRequired(row[columnMapping.required]);
        questions.push(question);
    }
    return questions;
}
const SKIP_SHEET_PATTERN = /^(intro|guidance|instruction|definition|dropdown|option|admin|validation|response.?status|summary|about|help|readme|cover|glossary|reference|changelog|version|menu|list|lookup|data.?valid|mapping|config|translation|language)/i;
function shouldSkipSheet(name) {
    return SKIP_SHEET_PATTERN.test(name.trim());
}
async function parseSpreadsheetFile(file) {
    const errors = [];
    try {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        if (workbook.SheetNames.length === 0) {
            return { success: false, questions: [], errors: ['No sheets found in file'], metadata: { fileName: file.name, totalRows: 0, parsedRows: 0, columnMapping: { questionText: '' } } };
        }
        const allQuestions = [];
        let primaryMapping = { questionText: '' };
        let totalRows = 0;
        let availableColumns = [];
        let sheetsSkipped = 0;
        for (const sheetName of workbook.SheetNames) {
            if (workbook.SheetNames.length > 1 && shouldSkipSheet(sheetName)) {
                sheetsSkipped++;
                continue;
            }
            const sheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
            if (jsonData.length === 0)
                continue;
            const headers = Object.keys(jsonData[0]);
            if (availableColumns.length === 0)
                availableColumns = headers;
            const columnMapping = detectColumnMapping(headers, jsonData.slice(0, 10));
            if (!primaryMapping.questionText && columnMapping.questionText) {
                primaryMapping = columnMapping;
            }
            if (!columnMapping.questionText)
                continue;
            totalRows += jsonData.length;
            const useSheetLabel = workbook.SheetNames.length > 1 ? sheetName : undefined;
            allQuestions.push(...parseSheetData(jsonData, columnMapping, useSheetLabel));
        }
        const seen = new Set();
        const dedupedQuestions = [];
        for (const q of allQuestions) {
            const key = q.text.toLowerCase().trim().replace(/\s+/g, ' ');
            if (!seen.has(key)) {
                seen.add(key);
                dedupedQuestions.push(q);
            }
        }
        let autoDetectionConfidence = 'high';
        if (dedupedQuestions.length === 0) {
            autoDetectionConfidence = 'low';
        }
        else if (totalRows > 0 && dedupedQuestions.length / totalRows < 0.5) {
            autoDetectionConfidence = 'medium';
        }
        if (dedupedQuestions.length > 100) {
            errors.push(`Extracted ${dedupedQuestions.length} questions — this seems high. Review the results and consider using manual column mapping if needed.`);
            autoDetectionConfidence = 'low';
        }
        if (dedupedQuestions.length === 0 && totalRows > 0) {
            return {
                success: false, questions: [], errors: ['Could not identify question column. Try renaming the header to "Question" or use manual column mapping.'],
                metadata: { fileName: file.name, totalRows, parsedRows: 0, columnMapping: primaryMapping, availableColumns, autoDetectionConfidence },
            };
        }
        const detectedFramework = detectFramework(dedupedQuestions);
        if (detectedFramework)
            dedupedQuestions.forEach(q => { q.framework = detectedFramework; });
        return {
            success: dedupedQuestions.length > 0, questions: dedupedQuestions, errors,
            metadata: {
                fileName: file.name, totalRows, parsedRows: dedupedQuestions.length,
                detectedFramework, columnMapping: primaryMapping,
                availableColumns, autoDetectionConfidence,
                sheetsProcessed: workbook.SheetNames.length,
            },
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error parsing file';
        return { success: false, questions: [], errors: [message], metadata: { fileName: file.name, totalRows: 0, parsedRows: 0, columnMapping: { questionText: '' } } };
    }
}
// ============================================
// Re-parse with Manual Mapping
// ============================================
export async function reprocessWithMapping(file, manualMapping) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const allQuestions = [];
        let totalRows = 0;
        for (const sheetName of workbook.SheetNames) {
            const sheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
            if (jsonData.length === 0)
                continue;
            totalRows += jsonData.length;
            const useSheetLabel = workbook.SheetNames.length > 1 ? sheetName : undefined;
            allQuestions.push(...parseSheetData(jsonData, manualMapping, useSheetLabel));
        }
        const detectedFramework = detectFramework(allQuestions);
        if (detectedFramework)
            allQuestions.forEach(q => { q.framework = detectedFramework; });
        return {
            success: allQuestions.length > 0, questions: allQuestions,
            errors: allQuestions.length === 0 ? ['No questions found with the selected column mapping.'] : [],
            metadata: { fileName: file.name, totalRows, parsedRows: allQuestions.length, detectedFramework, columnMapping: manualMapping },
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return { success: false, questions: [], errors: [message], metadata: { fileName: file.name, totalRows: 0, parsedRows: 0, columnMapping: manualMapping } };
    }
}
// ============================================
// Main Entry Point
// ============================================
function getFileExtension(name) {
    return name.split('.').pop()?.toLowerCase() || '';
}
export async function parseQuestionFile(file) {
    const ext = getFileExtension(file.name);
    switch (ext) {
        case 'pdf':
            return parsePdfFile(file);
        case 'docx':
            return parseDocxFile(file);
        case 'doc':
            return {
                success: false, questions: [],
                errors: ['Legacy .doc format is not supported. Please save the file as .docx and try again.'],
                metadata: { fileName: file.name, totalRows: 0, parsedRows: 0, columnMapping: { questionText: '' } },
            };
        case 'xlsx':
        case 'xls':
        case 'csv':
            return parseSpreadsheetFile(file);
        default:
            return {
                success: false, questions: [],
                errors: [`Unsupported file format: .${ext}. Please upload an Excel (.xlsx), CSV, PDF, or Word (.docx) file.`],
                metadata: { fileName: file.name, totalRows: 0, parsedRows: 0, columnMapping: { questionText: '' } },
            };
    }
}
export function parseQuestionsFromText(text) {
    return text.split('\n').filter(line => line.trim().length > 0).map((line, index) => ({
        id: uuid(), rowIndex: index + 1, text: line.trim(), rawRow: { text: line }
    }));
}
//# sourceMappingURL=questionParser.js.map