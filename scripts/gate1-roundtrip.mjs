// Gate 1 — "original workbook survives the round-trip" (DESIGN-original-workbook-and-reuse.md §4).
//
// For every questionnaire in testing/benchmark/manifest.json (twins excluded):
//   1. write a sample answer into every expected answer cell with the engine's writer
//   2. reload with ExcelJS: every answer landed; formula, validation, merge, hidden-sheet,
//      hidden-column and frozen-pane counts equal the original's
//   3. reload with SheetJS: every answer landed (a second, independent reader)
//   4. diff the zip parts: only the target sheet part(s) and, when formulas exist,
//      xl/workbook.xml may differ
//   5. pre-filled cells were refused (never overwritten); formula cells were refused
//
// Outputs go to testing/benchmark/out/ (ignored) with a sidecar JSON per file so
// gate1-excel-check.ps1 can open each one in desktop Excel and read the answers back —
// the half of the gate no library can stand in for.
//
// Usage: node scripts/gate1-roundtrip.mjs            → testing/benchmark/gate1-<date>.tsv
//        node scripts/gate1-roundtrip.mjs --print

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ExcelJS from 'exceljs';
import JSZip from 'jszip';
import XLSX from 'xlsx';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import { loadHarness } from './export-harness-utils.mjs';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const BENCH_DIR = path.resolve(SCRIPT_DIR, '..', 'testing', 'benchmark');
const OUT_DIR = path.join(BENCH_DIR, 'out');
const MANIFEST = path.join(BENCH_DIR, 'manifest.json');
const dom = { DOMParser, XMLSerializer };

const sample = (i, text) =>
  /\(kwh\)|\(tco2e\)|\(mwh\)|\(m³\)|\(kg\)|number of|percentage|how many|proportion|total hours|hours per|anzahl|wie viele|wie hoch/i.test(text)
    ? 100 + i
    : `Answer ${i + 1} — from record`;

async function inspectExcelJS(bytes, sheetName) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
  let formulas = 0;
  let hiddenSheets = 0;
  for (const ws of wb.worksheets) {
    if (ws.state === 'hidden') hiddenSheets++;
    ws.eachRow(r => r.eachCell(c => { if (c.formula) formulas++; }));
  }
  const ws = wb.getWorksheet(sheetName);
  return {
    wb,
    formulas,
    hiddenSheets,
    validations: Object.keys(ws?.dataValidations?.model || {}).length,
    merges: Object.keys(ws?._merges || {}).length,
    hiddenCols: ws?.columns?.filter(c => c && c.hidden).length || 0,
    frozen: ws?.views?.[0]?.state === 'frozen' ? ws.views[0].ySplit : 0,
  };
}

async function partsDiff(a, b) {
  const za = await JSZip.loadAsync(a);
  const zb = await JSZip.loadAsync(b);
  const names = new Set([...Object.keys(za.files), ...Object.keys(zb.files)].filter(n => !n.endsWith('/')));
  const changed = [];
  for (const n of names) {
    const fa = za.file(n);
    const fb = zb.file(n);
    if (!fa || !fb) { changed.push(n); continue; }
    if (!(await fa.async('nodebuffer')).equals(await fb.async('nodebuffer'))) changed.push(n);
  }
  return changed.sort();
}


async function gateOne(writer, entry) {
  const src = path.join(BENCH_DIR, entry.file);
  const original = new Uint8Array(fs.readFileSync(src));
  const writes = entry.expected.map((e, i) => ({ sheet: e.sheet || entry.sheet, cell: e.answerCell, value: sample(i, e.text) }));
  const prefilled = entry.expected.filter(e => e.prefilled).map(e => `${e.sheet || entry.sheet}!${e.answerCell}`);

  const { bytes, report } = await writer(original, writes, { dom });
  const outFile = path.join(OUT_DIR, `${entry.id}-completed.xlsx`);
  fs.writeFileSync(outFile, bytes);

  const before = await inspectExcelJS(original, entry.sheet);
  const after = await inspectExcelJS(bytes, entry.sheet);

  // 2. ExcelJS: every non-refused write landed
  const refusedCells = new Set(report.refused.map(r => `${r.target.sheet}!${r.target.cell}`));
  const expectedWrites = writes.filter(w => !refusedCells.has(`${w.sheet}!${w.cell}`));
  let landedExcelJS = 0;
  for (const w of expectedWrites) {
    const v = after.wb.getWorksheet(w.sheet)?.getCell(w.cell).value;
    if (String(v) === String(w.value)) landedExcelJS++;
  }
  // 3. SheetJS
  const sj = XLSX.read(bytes, { type: 'array' });
  let landedSheetJS = 0;
  for (const w of expectedWrites) {
    const v = sj.Sheets[w.sheet]?.[w.cell]?.v;
    if (String(v) === String(w.value)) landedSheetJS++;
  }
  // 4. parts
  const changed = await partsDiff(original, bytes);
  const allowed = new Set([...report.touchedParts]);
  const unexpectedParts = changed.filter(p => !allowed.has(p));
  // 5. refusals
  const prefilledRefused = prefilled.every(c => report.refused.some(r => `${r.target.sheet}!${r.target.cell}` === c && r.reason === 'non-empty'));
  const formulaRefusals = report.refused.filter(r => r.reason === 'formula').length;

  const structureKept =
    before.formulas === after.formulas && before.hiddenSheets === after.hiddenSheets &&
    before.validations === after.validations && before.merges === after.merges &&
    before.hiddenCols === after.hiddenCols && before.frozen === after.frozen;

  const pass = landedExcelJS === expectedWrites.length && landedSheetJS === expectedWrites.length &&
    structureKept && unexpectedParts.length === 0 && prefilledRefused;

  // sidecar for the Excel COM check: a few cells to read back, and one formula cell if any
  const probe = expectedWrites.slice(0, 3).map(w => ({ sheet: w.sheet, cell: w.cell, value: String(w.value) }));
  fs.writeFileSync(outFile.replace(/\.xlsx$/, '.json'), JSON.stringify({ sheet: entry.sheet, probe, formulas: after.formulas }, null, 2));

  return {
    fixture: entry.id,
    writes: writes.length,
    landed_exceljs: `${landedExcelJS}/${expectedWrites.length}`,
    landed_sheetjs: `${landedSheetJS}/${expectedWrites.length}`,
    formulas: `${before.formulas}→${after.formulas}`,
    validations: `${before.validations}→${after.validations}`,
    merges: `${before.merges}→${after.merges}`,
    hidden_sheets: `${before.hiddenSheets}→${after.hiddenSheets}`,
    hidden_cols: `${before.hiddenCols}→${after.hiddenCols}`,
    frozen: `${before.frozen}→${after.frozen}`,
    parts_changed: changed.length,
    unexpected_parts: unexpectedParts.join(' ') || '-',
    recalc_on_open: report.recalcOnOpen ? 'yes' : 'no',
    prefilled_kept: prefilled.length ? (prefilledRefused ? `yes (${prefilled.length})` : 'NO') : 'n/a',
    formula_refusals: formulaRefusals,
    pass: pass ? 'PASS' : 'FAIL',
    output: path.relative(process.cwd(), outFile),
  };
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const { writeAnswersIntoWorkbook } = await loadHarness();
fs.mkdirSync(OUT_DIR, { recursive: true });

const rows = [];
for (const entry of manifest.fixtures) {
  if (entry.completedTwinOf || !entry.expected || !entry.expected[0]?.answerCell) continue;
  rows.push(await gateOne(writeAnswersIntoWorkbook, entry));
}

const cols = Object.keys(rows[0]);
const tsv = [cols.join('\t'), ...rows.map(r => cols.map(c => r[c]).join('\t'))].join('\n') + '\n';
const out = path.join(BENCH_DIR, `gate1-${new Date().toISOString().slice(0, 10)}.tsv`);
fs.writeFileSync(out, tsv);
const passed = rows.filter(r => r.pass === 'PASS').length;
console.log(`wrote ${path.relative(process.cwd(), out)} — ${passed}/${rows.length} pass the library half of Gate 1; run scripts/gate1-excel-check.ps1 for the Excel half`);

if (process.argv.includes('--print')) {
  for (const r of rows) {
    console.log(`\n${r.fixture}  ${r.pass}`);
    for (const c of cols) if (c !== 'fixture' && c !== 'pass') console.log(`  ${c.padEnd(18)} ${r[c]}`);
  }
}
