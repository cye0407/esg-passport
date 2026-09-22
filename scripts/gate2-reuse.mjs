// Gate 2 — "previous answers materially reduce the job" (DESIGN-original-workbook-and-reuse.md §5).
//
// Two gates, decided 2026-09-13:
//   SHIP gate     same-form pairs (the completed twin as prior, the original as new):
//                 ≥ 95% recovered, 0 incorrect. The annual case.
//   HEADLINE gate cross-form pairs, scored against testing/benchmark/reuse-pairs.json:
//                 ≥ 50% usefully pre-filled (correct + acceptable), < 5% incorrect.
//                 Decides what the site may claim, not whether the product ships.
//
// A recovered answer is "correct" when the prior question is listed for the new one,
// "acceptable" when listed as a useful starting point, and INCORRECT otherwise — including
// every trap in `mustNot`. Every recovered answer must carry a source; every `high` must
// have staleness 'clear'.
//
// Usage: node scripts/gate2-reuse.mjs [--print]   → testing/benchmark/gate2-<date>.tsv

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createEngine, loadHarness, generateDraftsForQuestions, loadFixture } from './export-harness-utils.mjs';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const BENCH_DIR = path.resolve(SCRIPT_DIR, '..', 'testing', 'benchmark');
const manifest = JSON.parse(fs.readFileSync(path.join(BENCH_DIR, 'manifest.json'), 'utf8'));
const pairs = JSON.parse(fs.readFileSync(path.join(BENCH_DIR, 'reuse-pairs.json'), 'utf8'));
const COMPANY = path.resolve(SCRIPT_DIR, '..', 'testing', 'fixtures', 'esg-for-suppliers.json');

const norm = s => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
const fixture = id => manifest.fixtures.find(f => f.id === id);

async function parse(engine, id) {
  const e = fixture(id);
  const file = new File([fs.readFileSync(path.join(BENCH_DIR, e.file))], path.basename(e.file));
  return engine.parseFile(file);
}

function scorePair(questions, matches, labels, priors) {
  const total = questions.length;
  let recovered = 0, correct = 0, acceptable = 0, incorrect = 0, trapsHit = 0, noSource = 0, highButStale = 0;
  const wrong = [];
  const priorById = new Map(priors.map(p => [p.id, p]));
  questions.forEach((q, i) => {
    const m = matches[i];
    if (!m) return;
    recovered++;
    const label = labels ? labels[q.text] : null;
    const pq = norm(m.prior.question);
    const inList = list => (list || []).some(t => norm(t) === pq);
    if (labels === 'same') { if (pq === norm(q.text)) correct++; else { incorrect++; wrong.push(`${q.text} ← ${m.prior.question}`); } }
    else if (label && inList(label.correct)) correct++;
    else if (label && inList(label.acceptable)) acceptable++;
    else { incorrect++; if (label && inList(label.mustNot)) trapsHit++; wrong.push(`${q.text} ← ${m.prior.question} (${m.tier} ${m.score.toFixed(2)})`); }
    if (!priorById.get(m.prior.id)?.sourceFile) noSource++;
  });
  return { total, recovered, correct, acceptable, incorrect, trapsHit, noSource, highButStale, wrong };
}

const engine = await createEngine();
const { priorAnswersFromQuestions, matchPriorAnswers, applyPriorAnswers } = await loadHarness();
const company = loadFixture(COMPANY).companyData;

const rows = [];
async function runPair(pair, kind) {
  const priorParsed = await parse(engine, pair.prior);
  const newParsed = await parse(engine, pair.new);
  const priors = priorAnswersFromQuestions(priorParsed.questions, { sourceFile: fixture(pair.prior).file.split('/').pop(), sourceDate: '2025-09-30', approved: true });
  const matches = matchPriorAnswers(newParsed.questions, priors, { reportingYear: 2026 });
  const labels = kind === 'same' ? 'same' : (pair.labels || {});
  const s = scorePair(newParsed.questions, matches, labels, priors);

  // provenance + confidence rules on the applied drafts
  const drafts = applyPriorAnswers(generateDraftsForQuestions(engine, newParsed.questions, company, undefined), matches);
  const recoveredDrafts = drafts.filter(d => d.source === 'previous');
  const missingRef = recoveredDrafts.filter(d => !d.sourceRef?.file).length;
  const highStale = recoveredDrafts.filter(d => d.answerConfidence === 'high' && d.staleness !== 'clear').length;
  const stillNeedYouBefore = generateDraftsForQuestions(engine, newParsed.questions, company, undefined).filter(d => !['high', 'medium'].includes(d.answerConfidence)).length;
  const stillNeedYouAfter = drafts.filter(d => !['high', 'medium'].includes(d.answerConfidence)).length;

  const useful = s.correct + s.acceptable;
  const incorrectRate = s.recovered ? s.incorrect / s.recovered : 0;
  const pass = kind === 'same'
    ? (s.correct / s.total >= 0.95 && s.incorrect === 0 && missingRef === 0 && highStale === 0)
    : (useful / s.total >= 0.5 && incorrectRate < 0.05 && missingRef === 0 && highStale === 0);

  rows.push({
    kind, prior: pair.prior, new: pair.new,
    questions: s.total, priors: priors.length,
    recovered: s.recovered, correct: s.correct, acceptable: s.acceptable, incorrect: s.incorrect, traps_hit: s.trapsHit,
    useful_pct: Math.round((useful / s.total) * 100), incorrect_pct_of_recovered: Math.round(incorrectRate * 100),
    need_you_before: stillNeedYouBefore, need_you_after: stillNeedYouAfter,
    missing_source: missingRef, high_but_stale: highStale,
    pass: pass ? 'PASS' : 'FAIL',
    wrong: s.wrong.join(' || '),
  });
}

for (const pair of pairs.sameForm) await runPair(pair, 'same');
for (const pair of pairs.crossForm) await runPair(pair, 'cross');

const cols = Object.keys(rows[0]);
fs.writeFileSync(path.join(BENCH_DIR, `gate2-${new Date().toISOString().slice(0, 10)}.tsv`), [cols.join('\t'), ...rows.map(r => cols.map(c => r[c]).join('\t'))].join('\n') + '\n');

const same = rows.filter(r => r.kind === 'same');
const cross = rows.filter(r => r.kind === 'cross');
const sum = (rs, k) => rs.reduce((n, r) => n + r[k], 0);
console.log(`SHIP gate (same-form):     ${sum(same, 'correct')}/${sum(same, 'questions')} recovered correctly, ${sum(same, 'incorrect')} incorrect — ${same.every(r => r.pass === 'PASS') ? 'PASS' : 'FAIL'}`);
console.log(`HEADLINE gate (cross-form): ${sum(cross, 'correct') + sum(cross, 'acceptable')}/${sum(cross, 'questions')} usefully pre-filled (${Math.round(((sum(cross, 'correct') + sum(cross, 'acceptable')) / sum(cross, 'questions')) * 100)}%), ${sum(cross, 'incorrect')} incorrect of ${sum(cross, 'recovered')} recovered (${sum(cross, 'recovered') ? Math.round((sum(cross, 'incorrect') / sum(cross, 'recovered')) * 100) : 0}%), traps hit ${sum(cross, 'traps_hit')} — ${cross.every(r => r.pass === 'PASS') ? 'PASS' : 'FAIL'}`);

if (process.argv.includes('--print')) {
  for (const r of rows) {
    console.log(`\n${r.kind}  ${r.prior} → ${r.new}   ${r.pass}`);
    console.log(`  questions ${r.questions} · priors ${r.priors} · recovered ${r.recovered} · correct ${r.correct} · acceptable ${r.acceptable} · incorrect ${r.incorrect} (traps ${r.traps_hit}) · useful ${r.useful_pct}% · need-you ${r.need_you_before}→${r.need_you_after}`);
    if (r.wrong) for (const w of r.wrong.split(' || ')) console.log(`  ✗ ${w}`);
  }
}
