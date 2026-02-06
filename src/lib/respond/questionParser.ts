import * as XLSX from 'xlsx';
import { v4 as uuid } from 'uuid';
import type { ParsedQuestion, ParseResult, ColumnMapping } from './types';

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

const FRAMEWORK_PATTERNS: Record<string, RegExp[]> = {
  CSRD: [/csrd/i, /esrs/i, /e1\./i, /s1\./i, /g1\./i],
  GRI: [/gri\s?\d{3}/i, /gri-/i],
  CDP: [/cdp/i, /c\d+\.\d+/i],
  EcoVadis: [/ecovadis/i, /ev-/i],
  SASB: [/sasb/i],
  TCFD: [/tcfd/i],
  UN_SDG: [/sdg/i, /un sdg/i]
};

function detectColumnMapping(headers: string[], sampleRows?: Record<string, unknown>[]): ColumnMapping {
  const mapping: ColumnMapping = { questionText: '' };
  const normalizedHeaders = headers.map(h => h?.toLowerCase().trim() || '');

  for (const [field, patterns] of Object.entries(COLUMN_PATTERNS)) {
    for (let i = 0; i < normalizedHeaders.length; i++) {
      const header = normalizedHeaders[i];
      if (patterns.some(p => header.includes(p) || header === p)) {
        (mapping as unknown as Record<string, string>)[field] = headers[i];
        break;
      }
    }
  }

  // If no question column found, heuristically pick the best candidate
  if (!mapping.questionText && headers.length > 0 && sampleRows && sampleRows.length > 0) {
    let bestCol = '';
    let bestScore = 0;
    for (const header of headers) {
      const values = sampleRows.map(r => String(r[header] || '')).filter(v => v.length > 0);
      if (values.length === 0) continue;
      const avgLen = values.reduce((sum, v) => sum + v.length, 0) / values.length;
      // Bonus for question marks
      const questionMarkRate = values.filter(v => v.includes('?')).length / values.length;
      // Bonus for interrogative/imperative starts
      const actionWordRate = values.filter(v =>
        INTERROGATIVE_START.test(v) || IMPERATIVE_START.test(v)
      ).length / values.length;
      // Penalize very long average text (likely guidance columns)
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

  // Last resort: use first column
  if (!mapping.questionText && headers.length > 0) {
    mapping.questionText = headers[0];
  }

  return mapping;
}

function detectFramework(questions: ParsedQuestion[]): string | undefined {
  const allText = questions.map(q => `${q.text} ${q.category || ''} ${q.referenceId || ''}`).join(' ');
  for (const [framework, patterns] of Object.entries(FRAMEWORK_PATTERNS)) {
    if (patterns.some(p => p.test(allText))) return framework;
  }
  return undefined;
}

function parseRequired(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const str = String(value).toLowerCase().trim();
  if (['yes', 'y', 'true', '1', 'required', 'mandatory'].includes(str)) return true;
  if (['no', 'n', 'false', '0', 'optional'].includes(str)) return false;
  return undefined;
}

// ---------------------------------------------------------------------------
// Text-to-questions: shared by PDF and DOCX parsers
// ---------------------------------------------------------------------------

// Structured numbering: CDP uses (1.1), (3.5.1), (7.30.14.8) etc.
const STRUCTURED_NUMBERING = /^\(\d+(?:\.\d+)+\)\s+/;
// Broader imperative list for structured-numbered items (CDP context)
const STRUCT_IMPERATIVE = /^(describe|explain|provide|list|report|disclose|specify|identify|outline|quantify|assess|evaluate|discuss|summarize|summarise|select|indicate|state|confirm)\b/i;
// Table of contents lines: trailing dots optionally followed by page number
const TOC_LINE = /\.{4,}\s*\d*\s*$/;

function questionsFromText(text: string, fileName: string): ParseResult {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const questions: ParsedQuestion[] = [];
  let currentCategory: string | undefined;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip TOC-style lines (trailing dots with optional page number)
    if (TOC_LINE.test(line)) continue;

    // Heuristic: short lines that don't end with '?' are likely section headers
    if (line.length < 50 && !line.includes('?') && !line.match(/^\d+[\.\)]/) && !STRUCTURED_NUMBERING.test(line)) {
      currentCategory = line.replace(/[:.]$/, '').trim();
      continue;
    }

    // Check for structured numbering BEFORE stripping — strongest question signal
    const hasStructuredId = STRUCTURED_NUMBERING.test(line);

    // Strip leading numbering (e.g. "1.", "1)", "Q1.", "Q1:", "(1.1)", "(3.5.1)")
    const cleaned = line
      .replace(/^\(\d+(?:\.\d+)*\)\s*/, '')
      .replace(/^(?:Q?\d+[\.\)\:]?\s*)/i, '')
      .trim();
    if (!cleaned) continue;

    // If it had structured numbering (e.g. CDP), use broader imperative list
    // since words like "select"/"indicate"/"state" ARE question stems in this context
    if (hasStructuredId && cleaned.length >= 10) {
      const isQuestion = ENDS_WITH_QUESTION.test(cleaned)
        || INTERROGATIVE_START.test(cleaned)
        || IMPERATIVE_START.test(cleaned)
        || STRUCT_IMPERATIVE.test(cleaned);
      if (!isQuestion) continue;
      questions.push({
        id: uuid(),
        rowIndex: i + 1,
        text: cleaned,
        category: currentCategory,
        rawRow: { text: line },
      });
      continue;
    }

    // Skip non-question content
    if (!looksLikeQuestion(cleaned)) continue;

    questions.push({
      id: uuid(),
      rowIndex: i + 1,
      text: cleaned,
      category: currentCategory,
      rawRow: { text: line },
    });
  }

  // Deduplicate by normalized text
  const seen = new Set<string>();
  const deduped: ParsedQuestion[] = [];
  for (const q of questions) {
    const key = q.text.toLowerCase().trim().replace(/\s+/g, ' ');
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(q);
    }
  }

  const detectedFramework = detectFramework(deduped);
  if (detectedFramework) deduped.forEach(q => { q.framework = detectedFramework; });

  return {
    success: deduped.length > 0,
    questions: deduped,
    errors: deduped.length === 0 ? ['No questions could be extracted from the document. Make sure the file contains questionnaire items.'] : [],
    metadata: {
      fileName,
      totalRows: lines.length,
      parsedRows: deduped.length,
      detectedFramework,
      columnMapping: { questionText: 'text' },
    },
  };
}

// ---------------------------------------------------------------------------
// PDF parsing via pdfjs-dist
// ---------------------------------------------------------------------------

async function parsePdfFile(file: File): Promise<ParseResult> {
  try {
    const pdfjsLib = await import('pdfjs-dist');

    // Set up the worker using the bundled worker file
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const textParts: string[] = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();

      // Use Y-position to detect line breaks instead of joining everything
      const items = content.items.filter(
        (item): item is { str: string; transform: number[] } =>
          'str' in item && 'transform' in item
      );

      if (items.length === 0) continue;

      const lines: string[] = [];
      let currentLine = items[0].str;
      let lastY = items[0].transform[5];

      for (let j = 1; j < items.length; j++) {
        const item = items[j];
        const y = item.transform[5];
        // Y coordinate changes by more than 3px → new line
        if (Math.abs(y - lastY) > 3) {
          lines.push(currentLine.trim());
          currentLine = item.str;
        } else {
          currentLine += ' ' + item.str;
        }
        lastY = y;
      }
      if (currentLine.trim()) lines.push(currentLine.trim());

      textParts.push(lines.filter(l => l.length > 0).join('\n'));
    }

    const fullText = textParts.join('\n');
    return questionsFromText(fullText, file.name);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error parsing PDF';
    return {
      success: false, questions: [], errors: [`Failed to parse PDF: ${message}`],
      metadata: { fileName: file.name, totalRows: 0, parsedRows: 0, columnMapping: { questionText: '' } },
    };
  }
}

// ---------------------------------------------------------------------------
// DOCX parsing via mammoth
// ---------------------------------------------------------------------------

async function parseDocxFile(file: File): Promise<ParseResult> {
  try {
    const mammoth = await import('mammoth');
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return questionsFromText(result.value, file.name);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error parsing Word document';
    return {
      success: false, questions: [], errors: [`Failed to parse Word document: ${message}`],
      metadata: { fileName: file.name, totalRows: 0, parsedRows: 0, columnMapping: { questionText: '' } },
    };
  }
}

// ---------------------------------------------------------------------------
// Excel / CSV parsing (original logic)
// ---------------------------------------------------------------------------

// Content that is clearly NOT a question
const SKIP_PATTERNS = [
  /^(copyright|confidential|disclaimer|version\s*[\d\.]|page\s*\d|©)/i,
  /^\d+$/,                        // Just a number
  /^[\d\.\-\/\s,\(\)%]+$/,       // Just numbers/dates/percentages
  /^(yes|no|true|false|x|n\/a)$/i, // Just a boolean/flag value
  // Guidance / instruction indicators
  /^(guidance|note[s:\s]|instructions?[\s:]|tip[\s:]|example[\s:]|please note|see also|refer to|for more|this question|you should|if you|the purpose|this section|in this|further guidance|additional info)/i,
  // UI / form artifacts
  /^(select from|select one|select all that|choose one|choose from|click|enter a|type your|dropdown|response option|please select|upload your|attach your|free text|open.?ended)/i,
  // Row labels / totals
  /^(total|subtotal|n\/a|none|not applicable|other \(specify\)|grand total|all of the above|not yet|no change|same as|see above)/i,
  // Column headers that leak through
  /^(column|row|field|header|label|unit|format|data type|response type|answer type|scoring|weight|points)/i,
  // Checkbox / radio items from PDFs
  /^[☐☑✓✗✘●○■□▪▫►▶]\s/,
];

// Positive signals that text is actually asking for information
const INTERROGATIVE_START = /^(what|how|does|do|is|are|has|have|which|who|where|when|why|can|will|would|should|could|may|might|shall)\b/i;
const IMPERATIVE_START = /^(describe|explain|provide|list|report|disclose|specify|identify|outline|quantify|assess|evaluate|discuss|summarize|summarise)\b/i;
const REFERENCE_ID = /^(C\d+[\.\-]\d|E\d[\.\-]|S\d[\.\-]|G\d[\.\-]|GRI\s*\d{3}|ESRS\s*[ESGO]\d|SASB|Q\d{1,3}[\.\-])/i;

// Question mark at end of line (optionally followed by closing quotes/parens/whitespace)
const ENDS_WITH_QUESTION = /\?\s*[)"\u201D]?\s*$/;

function looksLikeQuestion(text: string): boolean {
  // Too short to be meaningful (unless it ends with ?)
  if (text.length < 10) return ENDS_WITH_QUESTION.test(text);
  // Too long — real questions are concise
  if (text.length > 300) return false;
  // Mid-sentence fragment — real questions start with uppercase
  if (/^[a-z]/.test(text)) return false;
  // Obvious junk / noise
  if (SKIP_PATTERNS.some(p => p.test(text))) return false;
  // Ends with question mark — very likely a question
  if (ENDS_WITH_QUESTION.test(text)) return true;
  // Starts with interrogative word
  if (INTERROGATIVE_START.test(text)) return true;
  // Starts with imperative/disclosure word
  if (IMPERATIVE_START.test(text)) return true;
  // Contains a framework reference ID at start
  if (REFERENCE_ID.test(text)) return true;
  // No positive signal — not a question
  return false;
}

function parseSheetData(
  jsonData: Record<string, unknown>[],
  columnMapping: ColumnMapping,
  sheetLabel?: string
): ParsedQuestion[] {
  const questions: ParsedQuestion[] = [];
  for (let i = 0; i < jsonData.length; i++) {
    const row = jsonData[i];
    const questionText = String(row[columnMapping.questionText] || '').trim();
    if (!questionText) continue;
    if (!looksLikeQuestion(questionText)) continue;

    const question: ParsedQuestion = { id: uuid(), rowIndex: i + 2, text: questionText, rawRow: row };
    if (columnMapping.category) question.category = String(row[columnMapping.category] || '').trim() || undefined;
    if (!question.category && sheetLabel) question.category = sheetLabel;
    if (columnMapping.subcategory) question.subcategory = String(row[columnMapping.subcategory] || '').trim() || undefined;
    if (columnMapping.referenceId) question.referenceId = String(row[columnMapping.referenceId] || '').trim() || undefined;
    if (columnMapping.required) question.required = parseRequired(row[columnMapping.required]);
    questions.push(question);
  }
  return questions;
}

// Sheets that are unlikely to contain questions
const SKIP_SHEET_PATTERN = /^(intro|guidance|instruction|definition|dropdown|option|admin|validation|response.?status|summary|about|help|readme|cover|glossary|reference|changelog|version|menu|list|lookup|data.?valid|mapping|config|translation|language)/i;

function shouldSkipSheet(name: string): boolean {
  return SKIP_SHEET_PATTERN.test(name.trim());
}

async function parseSpreadsheetFile(file: File): Promise<ParseResult> {
  const errors: string[] = [];

  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    if (workbook.SheetNames.length === 0) {
      return { success: false, questions: [], errors: ['No sheets found in file'], metadata: { fileName: file.name, totalRows: 0, parsedRows: 0, columnMapping: { questionText: '' } } };
    }

    const allQuestions: ParsedQuestion[] = [];
    let primaryMapping: ColumnMapping = { questionText: '' };
    let totalRows = 0;
    let availableColumns: string[] = [];
    let sheetsSkipped = 0;

    for (const sheetName of workbook.SheetNames) {
      // Skip sheets that clearly don't contain questions
      if (workbook.SheetNames.length > 1 && shouldSkipSheet(sheetName)) {
        sheetsSkipped++;
        continue;
      }

      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '', raw: false });
      if (jsonData.length === 0) continue;

      const headers = Object.keys(jsonData[0]);
      if (availableColumns.length === 0) availableColumns = headers;

      const columnMapping = detectColumnMapping(headers, jsonData.slice(0, 10));
      if (!primaryMapping.questionText && columnMapping.questionText) {
        primaryMapping = columnMapping;
      }

      if (!columnMapping.questionText) continue;

      totalRows += jsonData.length;
      const useSheetLabel = workbook.SheetNames.length > 1 ? sheetName : undefined;
      allQuestions.push(...parseSheetData(jsonData, columnMapping, useSheetLabel));
    }

    // Deduplicate by normalized question text
    const seen = new Set<string>();
    const dedupedQuestions: ParsedQuestion[] = [];
    for (const q of allQuestions) {
      const key = q.text.toLowerCase().trim().replace(/\s+/g, ' ');
      if (!seen.has(key)) {
        seen.add(key);
        dedupedQuestions.push(q);
      }
    }

    // Detection confidence
    let autoDetectionConfidence: 'high' | 'medium' | 'low' = 'high';
    if (dedupedQuestions.length === 0) {
      autoDetectionConfidence = 'low';
    } else if (totalRows > 0 && dedupedQuestions.length / totalRows < 0.5) {
      autoDetectionConfidence = 'medium';
    }

    // Sanity warning for unusually high extraction counts
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
    if (detectedFramework) dedupedQuestions.forEach(q => { q.framework = detectedFramework; });

    return {
      success: dedupedQuestions.length > 0, questions: dedupedQuestions, errors,
      metadata: {
        fileName: file.name, totalRows, parsedRows: dedupedQuestions.length,
        detectedFramework, columnMapping: primaryMapping,
        availableColumns, autoDetectionConfidence,
        sheetsProcessed: workbook.SheetNames.length,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error parsing file';
    return { success: false, questions: [], errors: [message], metadata: { fileName: file.name, totalRows: 0, parsedRows: 0, columnMapping: { questionText: '' } } };
  }
}

/**
 * Re-parse a spreadsheet file with explicit column mapping provided by the user.
 */
export async function reprocessWithMapping(file: File, manualMapping: ColumnMapping): Promise<ParseResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const allQuestions: ParsedQuestion[] = [];
    let totalRows = 0;

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '', raw: false });
      if (jsonData.length === 0) continue;
      totalRows += jsonData.length;
      const useSheetLabel = workbook.SheetNames.length > 1 ? sheetName : undefined;
      allQuestions.push(...parseSheetData(jsonData, manualMapping, useSheetLabel));
    }

    const detectedFramework = detectFramework(allQuestions);
    if (detectedFramework) allQuestions.forEach(q => { q.framework = detectedFramework; });

    return {
      success: allQuestions.length > 0, questions: allQuestions,
      errors: allQuestions.length === 0 ? ['No questions found with the selected column mapping.'] : [],
      metadata: { fileName: file.name, totalRows, parsedRows: allQuestions.length, detectedFramework, columnMapping: manualMapping },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, questions: [], errors: [message], metadata: { fileName: file.name, totalRows: 0, parsedRows: 0, columnMapping: manualMapping } };
  }
}

// ---------------------------------------------------------------------------
// Main entry point — dispatches based on file extension
// ---------------------------------------------------------------------------

function getFileExtension(name: string): string {
  return name.split('.').pop()?.toLowerCase() || '';
}

export async function parseQuestionFile(file: File): Promise<ParseResult> {
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

export function parseQuestionsFromText(text: string): ParsedQuestion[] {
  return text.split('\n').filter(line => line.trim().length > 0).map((line, index) => ({
    id: uuid(), rowIndex: index + 1, text: line.trim(), rawRow: { text: line }
  }));
}
