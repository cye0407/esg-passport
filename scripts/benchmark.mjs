// Benchmark: run the current engine over testing/benchmark/manifest.json and write a TSV
// that the reset plan (RESET-AUDIT-2026-09-11.md, Phase 1) can compare against later.
//
// Every number here describes what the product does TODAY. The point of the file is to
// stop a rebuilt product from flattering itself, so nothing in it is smoothed:
//
//   detected_auto      questions the parser finds with no help
//   detected_manual    questions it finds after the user picks the question column
//   expected           hand-counted ground truth from the manifest
//   missed             expected questions no detected row matched (by row, then by text)
//   false_positives    detected rows that are not questions
//   truncated          matched, but the detected text is a strict prefix of the real one
//   proven / suggested / needs_you
//                      drafts by confidence: high = proven by records, medium = suggested
//                      wording (review required), low/none = needs information from you.
//                      Run twice: with the rich fixture company and with an empty company,
//                      so the template layer's contribution is visible on its own.
//   answer_cells       detected answer cell vs the manifest's, per matched question
//   existing_answers_seen  questions whose answer cell already held content (twins, pre-fills)
//   copying_required   whether the user still has to move answers into the buyer's file
//
// Usage:  node scripts/benchmark.mjs            → testing/benchmark/baseline-<date>.tsv
//         node scripts/benchmark.mjs --print    → also echo the table

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createEngine, generateDraftsForQuestions, loadFixture } from './export-harness-utils.mjs';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const BENCH_DIR = path.resolve(SCRIPT_DIR, '..', 'testing', 'benchmark');
const MANIFEST = path.join(BENCH_DIR, 'manifest.json');
const COMPANY_FIXTURE = path.resolve(SCRIPT_DIR, '..', 'testing', 'fixtures', 'esg-for-suppliers.json');

const norm = s => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();

function fileBlob(filePath) {
  return new File([fs.readFileSync(filePath)], path.basename(filePath));
}

// Match detected questions to expected ones. Row first (the parser's rowIndex is
// header-relative, so rows only line up when the manifest says how far the header is
// from row 1), then by text: exact, then prefix (= truncated), then containment.
function reconcile(detected, expected, defaultSheet) {
  const remaining = [...expected];
  let truncated = 0;
  let falsePositives = 0;
  let cellsRight = 0;
  let cellsWrong = 0;
  let cellsMissing = 0;
  const wrongCells = [];
  for (const q of detected) {
    const dt = norm(q.text);
    let idx = remaining.findIndex(e => norm(e.text) === dt);
    if (idx < 0) {
      idx = remaining.findIndex(e => norm(e.text).startsWith(dt) && dt.length >= 12);
      if (idx >= 0) truncated += 1;
    }
    if (idx < 0) idx = remaining.findIndex(e => dt.includes(norm(e.text)) && norm(e.text).length >= 12);
    if (idx < 0) { falsePositives += 1; continue; }
    const [e] = remaining.splice(idx, 1);
    // The answer cell is what write-back needs; a wrong one puts an answer in the wrong box.
    const got = q.location?.answerCell;
    const gotSheet = q.location?.sheet;
    const wantSheet = e.sheet || defaultSheet;
    if (!got) cellsMissing += 1;
    else if (got === e.answerCell && (!wantSheet || gotSheet === wantSheet)) cellsRight += 1;
    else { cellsWrong += 1; wrongCells.push(`${e.answerCell}→${got}`); }
  }
  return { missed: remaining.length, truncated, falsePositives, missedList: remaining.map(e => e.text), cellsRight, cellsWrong, cellsMissing, wrongCells };
}

function confidenceCounts(drafts) {
  const c = { proven: 0, suggested: 0, needsYou: 0 };
  for (const d of drafts) {
    if (d.answerConfidence === 'high') c.proven += 1;
    else if (d.answerConfidence === 'medium') c.suggested += 1;
    else c.needsYou += 1;
  }
  return c;
}

async function benchmarkOne(engine, entry, richCompany) {
  const filePath = path.join(BENCH_DIR, entry.file);
  const auto = await engine.parseFile(fileBlob(filePath));
  const manual = entry.mapping ? await engine.parseWithMapping(fileBlob(filePath), entry.mapping) : null;
  // Manual mapping is what a user falls back to when auto-detection fails, so it is
  // scored only then. Scoring whichever found MORE would reward over-collection.
  const best = (!auto.success || auto.questions.length === 0) && manual ? manual : auto;

  const expectedCount = entry.expected ? entry.expected.length : entry.expectedCount;
  const rec = entry.expected ? reconcile(best.questions, entry.expected, entry.sheet) : { missed: Math.max(0, expectedCount - best.questions.length), truncated: null, falsePositives: Math.max(0, best.questions.length - expectedCount), missedList: [], cellsRight: 0, cellsWrong: 0, cellsMissing: best.questions.length, wrongCells: [] };
  const existing = best.questions.filter(q => q.existingAnswer !== undefined && q.existingAnswer !== '').length;

  const rich = confidenceCounts(generateDraftsForQuestions(engine, best.questions, richCompany, undefined));
  const empty = confidenceCounts(generateDraftsForQuestions(engine, best.questions, { companyName: 'Benchmark Co' }, undefined));

  return {
    fixture: entry.id,
    sheets: auto.metadata.sheetsProcessed ?? '',
    rows: auto.metadata.totalRows,
    expected: expectedCount,
    detected_auto: auto.questions.length,
    auto_ok: auto.success ? 'yes' : 'no',
    detected_manual: manual ? manual.questions.length : 'n/a',
    missed: rec.missed,
    false_positives: rec.falsePositives,
    truncated: rec.truncated ?? 'n/a',
    proven_rich: rich.proven, suggested_rich: rich.suggested, needs_you_rich: rich.needsYou,
    proven_empty: empty.proven, suggested_empty: empty.suggested, needs_you_empty: empty.needsYou,
    answer_cells: entry.expected ? `${rec.cellsRight}/${entry.expected.length} right, ${rec.cellsWrong} wrong, ${rec.cellsMissing} none` : 'n/a (no answer column in file)',
    existing_answers_seen: existing,
    copying_required: 'yes (export is a new workbook)',
    minutes: '',
    missed_list: rec.missedList.join(' || '),
    wrong_cells: rec.wrongCells.join(' '),
  };
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const engine = await createEngine();
const richCompany = loadFixture(COMPANY_FIXTURE).companyData;

const rows = [];
for (const entry of manifest.fixtures) rows.push(await benchmarkOne(engine, entry, richCompany));

const cols = Object.keys(rows[0]);
const tsv = [cols.join('\t'), ...rows.map(r => cols.map(c => r[c]).join('\t'))].join('\n') + '\n';
const out = path.join(BENCH_DIR, `baseline-${new Date().toISOString().slice(0, 10)}.tsv`);
fs.writeFileSync(out, tsv);
console.log(`wrote ${path.relative(process.cwd(), out)}`);

if (process.argv.includes('--print')) {
  for (const r of rows) {
    console.log(`\n${r.fixture}`);
    for (const c of cols) if (c !== 'fixture') console.log(`  ${c.padEnd(18)} ${r[c]}`);
  }
}
