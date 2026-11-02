// Public "before / after" sample for the marketing site.
//
// Builds a fully synthetic buyer questionnaire (a fictional retailer asking a fictional
// supplier), then completes it the way the app does: the vendored engine parses the
// workbook, matches and drafts every question against the app's own demo workspace
// (Hartmann Precision, src/lib/demoData.js, seeded through the real store), the app's
// buildOriginalWrites decides which drafts go into the buyer's cells, and the engine's
// writeAnswersIntoWorkbook writes them into the original file. Then both files are read
// back with ExcelJS to prove what survived.
//
// Usage:
//   node scripts/build-public-sample.mjs <outDir>
// Writes <outDir>/sample-esg-questionnaire.xlsx, <outDir>/sample-esg-questionnaire-completed.xlsx
// and <outDir>/sample-build-report.json. Nothing here touches the network.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import ExcelJS from 'exceljs';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(SCRIPT_DIR, '..');
const VENDOR = path.join(APP_ROOT, 'vendor', 'response-ready', 'dist');
const require = createRequire(import.meta.url);

const outDir = path.resolve(process.argv[2] || path.join(APP_ROOT, 'testing', 'public-sample'));
fs.mkdirSync(outDir, { recursive: true });

// ---------------------------------------------------------------- localStorage shim
// demoData/store are the app's real code paths and persist through localStorage.
const mem = new Map();
globalThis.localStorage = {
  getItem: k => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: k => mem.delete(k),
  clear: () => mem.clear(),
  key: i => [...mem.keys()][i] ?? null,
  get length() { return mem.size; },
};
globalThis.window = globalThis.window || { localStorage: globalThis.localStorage };

// ---------------------------------------------------------------- bundle app + engine
const entry = path.join(os.tmpdir(), `public-sample-entry-${process.pid}.mjs`);
const bundle = path.join(os.tmpdir(), `public-sample-bundle-${process.pid}.cjs`);
fs.writeFileSync(entry, `
export { createResponseEngine } from ${JSON.stringify(path.join(VENDOR, 'src', 'index.js'))};
export * as engineModule from ${JSON.stringify(path.join(VENDOR, 'src', 'index.js'))};
export { esgDomainPack } from ${JSON.stringify(path.join(VENDOR, 'domain-packs', 'esg', 'index.js'))};
export { loadDemoData } from ${JSON.stringify(path.join(APP_ROOT, 'src', 'lib', 'demoData.js'))};
export { buildCompanyData, buildCompanyProfile } from ${JSON.stringify(path.join(APP_ROOT, 'src', 'lib', 'dataBridge.js'))};
export { buildOriginalWrites } from ${JSON.stringify(path.join(APP_ROOT, 'src', 'lib', 'originalWorkbook.js'))};
export { detectQuestionnaireLanguage } from ${JSON.stringify(path.join(APP_ROOT, 'src', 'lib', 'questionnaireLanguage.js'))};
`);
await build({
  entryPoints: [entry],
  bundle: true,
  format: 'cjs',
  platform: 'node',
  target: ['node22'],
  outfile: bundle,
  alias: { '@': path.join(APP_ROOT, 'src') },
  resolveExtensions: ['.js', '.jsx', '.ts', '.mjs', '.json'],
  nodePaths: [path.join(APP_ROOT, 'node_modules')],
  logLevel: 'error',
  // pdf parsing is never reached for an xlsx; keep the heavy browser-only deps out.
  external: ['pdfjs-dist', 'pdfjs-dist/*', 'mammoth'],
});
const app = require(bundle);

// ---------------------------------------------------------------- 1. the questionnaire
const BUYER = 'Lindqvist Home & Garden Group';
const QUESTIONS = [
  ['Company', 'C1', 'Registered legal name of your company'],
  ['Company', 'C2', 'Number of employees (FTE) at the end of the last financial year'],
  ['Company', 'C3', 'In which country is your company headquartered?'],
  ['Environment', 'E1', 'Does your company have a documented environmental policy?'],
  ['Environment', 'E2', 'Is your company certified to ISO 14001 or an equivalent environmental management system?'],
  ['Environment', 'E3', 'What was your total electricity consumption (kWh) in the last reporting year?'],
  ['Environment', 'E4', 'What percentage of your electricity comes from renewable sources?'],
  ['Environment', 'E5', 'What were your Scope 1 greenhouse gas emissions (tCO2e) in the last reporting year?'],
  ['Environment', 'E6', 'What were your Scope 2 greenhouse gas emissions (tCO2e) in the last reporting year?'],
  ['Environment', 'E7', 'What was your total water consumption (m³) in the last reporting year?'],
  ['Environment', 'E8', 'How much waste did your company generate in the last reporting year, and what share was recycled?'],
  ['Environment', 'E9', 'Have you set a target to reduce your greenhouse gas emissions? Please describe it.'],
  ['Social', 'S1', 'Do you have a health and safety policy covering all employees?'],
  ['Social', 'S2', 'How many lost-time injuries were recorded in the last reporting year?'],
  ['Social', 'S3', 'What was your employee turnover rate in the last reporting year?'],
  ['Social', 'S4', 'How many hours of training did employees receive on average in the last year?'],
  ['Social', 'S5', 'Do you have a human rights or modern slavery policy?'],
  ['Governance', 'G1', 'Does your company have a code of conduct that applies to all employees?'],
  ['Governance', 'G2', 'Do you have an anti-bribery and corruption policy?'],
  ['Governance', 'G3', 'Do you have a whistleblowing or grievance mechanism available to employees and third parties?'],
  ['Governance', 'G4', 'Do you have a supplier code of conduct that you require your own suppliers to follow?'],
  ['Governance', 'G5', 'Who in your company is responsible for sustainability, and how often is it reviewed by management?'],
];

const HEADER_ROW = 6;
const FIRST_Q_ROW = HEADER_ROW + 1;

async function buildQuestionnaire() {
  const wb = new ExcelJS.Workbook();
  wb.creator = BUYER;
  wb.created = new Date(Date.UTC(2026, 0, 15));

  const intro = wb.addWorksheet('Read me first');
  intro.getColumn(1).width = 100;
  [
    [`${BUYER} — Supplier Sustainability Questionnaire 2026`, { bold: true, size: 14 }],
    ['FICTIONAL EXAMPLE. The buyer, the supplier and every figure in this file are invented for demonstration.', { italic: true, color: { argb: 'FF6B6B6B' } }],
    [''],
    ['Please answer every question on the "Questionnaire" sheet in the column "Your answer".', {}],
    ['Where you attach evidence, select "Yes" in the column "Evidence attached".', {}],
    ['Return this file to your Lindqvist buyer within 30 days.', {}],
  ].forEach(([text, font], i) => {
    const cell = intro.getCell(`A${i + 1}`);
    cell.value = text;
    cell.font = { name: 'Calibri', ...font };
  });

  const ws = wb.addWorksheet('Questionnaire', { views: [{ state: 'frozen', ySplit: HEADER_ROW }] });
  ws.columns = [
    { key: 'ref', width: 7 },
    { key: 'section', width: 14 },
    { key: 'question', width: 62 },
    { key: 'answer', width: 70 },
    { key: 'evidence', width: 16 },
    { key: 'comments', width: 30 },
  ];
  ws.mergeCells('A1:F1');
  ws.getCell('A1').value = `${BUYER} · Supplier Sustainability Questionnaire 2026`;
  ws.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FF1F3B2D' } };
  ws.mergeCells('A2:F2');
  ws.getCell('A2').value = 'Fictional example for demonstration only.';
  ws.getCell('A2').font = { italic: true, color: { argb: 'FF6B6B6B' } };
  ws.getCell('A4').value = 'Supplier name:';
  ws.getCell('A4').font = { bold: true };
  ws.mergeCells('B4:C4');
  ws.getCell('B4').value = 'Hartmann Precision (fictional)';

  const header = ws.getRow(HEADER_ROW);
  header.values = ['Ref', 'Section', 'Question', 'Your answer', 'Evidence attached', 'Buyer comments'];
  header.height = 22;
  header.eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F3B2D' } };
    cell.alignment = { vertical: 'middle', wrapText: true };
    cell.border = { bottom: { style: 'thin', color: { argb: 'FF999999' } } };
  });

  QUESTIONS.forEach(([section, ref, text], i) => {
    const r = FIRST_Q_ROW + i;
    const row = ws.getRow(r);
    row.values = [ref, section, text, null, null, null];
    row.alignment = { vertical: 'top', wrapText: true };
    ws.getCell(`D${r}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF8E1' } };
    ws.getCell(`E${r}`).dataValidation = {
      type: 'list', allowBlank: true, formulae: ['"Yes,No"'],
      showErrorMessage: true, errorTitle: 'Yes or No', error: 'Please choose Yes or No.',
    };
  });
  // One buyer pre-fill: the buyer's own comment, which the writer must never touch.
  ws.getCell(`F${FIRST_Q_ROW + 8}`).value = 'Location-based figure is fine.';

  return wb;
}

// ---------------------------------------------------------------- helpers
async function inspect(bytes) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(Buffer.from(bytes));
  const ws = wb.getWorksheet('Questionnaire');
  const validations = Object.keys(ws.dataValidations?.model || {}).length;
  const fills = [];
  ws.getRow(HEADER_ROW).eachCell(c => fills.push(c.fill?.fgColor?.argb || ''));
  return {
    wb,
    ws,
    sheets: wb.worksheets.map(s => s.name),
    rows: ws.rowCount,
    validations,
    merges: Object.keys(ws._merges || {}).length,
    frozen: ws.views?.[0]?.state === 'frozen' ? ws.views[0].ySplit : 0,
    widths: ws.columns.map(c => c.width),
    headerFills: fills.join(','),
    questions: QUESTIONS.map((_, i) => String(ws.getCell(`C${FIRST_Q_ROW + i}`).value || '')),
  };
}

// ---------------------------------------------------------------- 2. complete it
const blankWb = await buildQuestionnaire();
const originalBytes = new Uint8Array(await blankWb.xlsx.writeBuffer());
const blankName = 'sample-esg-questionnaire.xlsx';
fs.writeFileSync(path.join(outDir, blankName), originalBytes);

app.loadDemoData();
const companyData = app.buildCompanyData();
const profile = app.buildCompanyProfile();

const engine = app.createResponseEngine(app.esgDomainPack);
const file = new File([originalBytes], blankName, {
  type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
});
const parsed = await engine.parseFile(file);
const questions = parsed.questions || [];
const language = app.detectQuestionnaireLanguage(questions);
const matchResults = engine.matchQuestions(questions, { language });
const classifications = engine.classifyQuestions?.(questions) || [];
const dataContexts = matchResults.map(mr => engine.retrieveData(mr, companyData));
const drafts = engine.generateDrafts(questions, matchResults, dataContexts, {
  useLLM: false,
  includeMethodology: true,
  includeAssumptions: true,
  includeLimitations: true,
  verbosity: 'standard',
  aggregateSites: true,
  language: 'en',
}, profile, classifications);

const { writes, leftBlank, noCell } = app.buildOriginalWrites(questions, drafts);
const { bytes: completedBytes, report } = await app.engineModule.writeAnswersIntoWorkbook(
  originalBytes, writes, { dom: { DOMParser, XMLSerializer } },
);
const completedName = 'sample-esg-questionnaire-completed.xlsx';
fs.writeFileSync(path.join(outDir, completedName), completedBytes);

// ---------------------------------------------------------------- 3. verify
const before = await inspect(originalBytes);
const after = await inspect(completedBytes);
let landed = 0;
for (const w of writes) {
  const v = after.wb.getWorksheet(w.sheet)?.getCell(w.cell).value;
  if (String(v ?? '') === String(w.value)) landed += 1;
}
const prefillCell = `F${FIRST_Q_ROW + 8}`;
const checks = {
  parsed_questions: `${questions.length}/${QUESTIONS.length}`,
  with_answer_cell: questions.filter(q => q.location?.answerCell).length,
  answer_cells_in_column_D: questions.every(q => /^D\d+$/.test(q.location?.answerCell || '')),
  writes: writes.length,
  landed: `${landed}/${writes.length}`,
  left_blank_low_confidence: leftBlank,
  no_cell: noCell,
  refused: report.refused.length,
  sheets_same: JSON.stringify(before.sheets) === JSON.stringify(after.sheets),
  sheets: after.sheets.join(' | '),
  question_text_and_order_same: JSON.stringify(before.questions) === JSON.stringify(after.questions),
  validations: `${before.validations}→${after.validations}`,
  merges: `${before.merges}→${after.merges}`,
  frozen_rows: `${before.frozen}→${after.frozen}`,
  column_widths_same: JSON.stringify(before.widths) === JSON.stringify(after.widths),
  header_fill_same: before.headerFills === after.headerFills,
  buyer_comment_kept: String(after.ws.getCell(prefillCell).value) === 'Location-based figure is fine.',
  evidence_column_untouched: QUESTIONS.every((_, i) => after.ws.getCell(`E${FIRST_Q_ROW + i}`).value == null),
};

const perQuestion = questions.map(q => {
  const d = drafts.find(x => x.questionId === q.id);
  const w = writes.find(x => x.cell === q.location?.answerCell);
  return {
    cell: q.location?.answerCell,
    question: q.text,
    confidence: d?.answerConfidence,
    source: d?.confidenceSource,
    written: Boolean(w),
    answer: w ? w.value : (d?.answer || ''),
  };
});

const result = { outDir, files: [blankName, completedName], checks, perQuestion };
fs.writeFileSync(path.join(outDir, 'sample-build-report.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify(checks, null, 2));
for (const p of perQuestion) {
  console.log(`\n${p.cell} [${p.confidence}/${p.source}] ${p.written ? 'WRITTEN' : 'blank'}  ${p.question}\n   ${p.answer.slice(0, 300)}`);
}
fs.rmSync(entry, { force: true });
fs.rmSync(bundle, { force: true });
