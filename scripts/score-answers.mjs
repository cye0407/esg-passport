// Answer-quality scoring harness.
//
// Runs a questionnaire through the engine exactly as the app does (parse → detect language →
// match → classify → retrieve → draft) against the full fixture record and writes one TSV row
// per question with the draft and an empty `verdict` column to fill by hand:
//
//   correct      the draft answers what the cell asks, with the record's facts
//   partial      right question, but a sub-part, exclusion or record fact is missed
//   wrong        answers a different question, or carries figures the cell did not ask for
//   unanswered   honest "not on record" — the right reply when the record has nothing
//   no-match     the engine found no domain at all
//
// The automated `flags` column marks what can be detected without reading: DUMP (a raw data
// listing), INSUFFICIENT (generic not-enough-information), NOT_ON_RECORD (a bare gap sentence),
// NO_MATCH. Wrong-template drafts cannot be flagged automatically — that is why the verdict
// column exists. Filled TSVs are the baseline in testing/benchmark/.
//
//   node scripts/score-answers.mjs --templates --out testing/benchmark/out/templates.tsv
//   node scripts/score-answers.mjs --file testing/benchmark/fixtures/08-drive-sustainability-saq-5.0.xlsx --out out.tsv
//   node scripts/score-answers.mjs --file a.xlsx --file b.xlsx --lang de --out out.tsv
//   node scripts/score-answers.mjs --text questions.txt --out out.tsv     (one question per line —
//        scores the answers alone, bypassing the parser, for forms the parser cannot yet read)
//
// --lang forces the questionnaire language (default: detected per file, as the app does).
// --answer-lang sets the language the drafts are written in (default en).

import fs from 'node:fs';
import path from 'node:path';
import { createEngine, loadFixture, templateToQuestions, templateEntries } from './export-harness-utils.mjs';
import { detectQuestionnaireLanguage } from '../src/lib/questionnaireLanguage.js';

const args = process.argv.slice(2);
function flag(name) { return args.includes(name); }
function opt(name, fallback) { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : fallback; }
function opts(name) { return args.flatMap((a, i) => (a === name ? [args[i + 1]] : [])); }

const files = opts('--file');
const textFiles = opts('--text');
const useTemplates = flag('--templates');
const forcedLang = opt('--lang', null);
const answerLang = opt('--answer-lang', 'en');
const out = opt('--out', null);

if (!files.length && !textFiles.length && !useTemplates) {
  console.error('nothing to score: pass --templates, --file <xlsx> and/or --text <txt>');
  process.exit(1);
}

const CONFIG = {
  useLLM: false, includeMethodology: false, includeAssumptions: false, includeLimitations: false,
  verbosity: 'standard', aggregateSites: true, language: answerLang,
};

const engine = await createEngine();
const { companyData, profile } = loadFixture();

function draftBatch(source, questions, lang) {
  const matches = engine.matchQuestions(questions, { language: lang });
  const cls = engine.classifyQuestions
    ? engine.classifyQuestions(questions.map(q => ({ id: q.id, text: q.text, category: q.category })))
    : [];
  const contexts = matches.map(m => engine.retrieveData(m, companyData));
  const drafts = engine.generateDrafts(questions, matches, contexts, CONFIG, profile, cls);
  return questions.map((q, i) => {
    const m = matches[i];
    const d = drafts[i];
    const answer = (d.answer || '').replace(/\s+/g, ' ').trim();
    const flags = [];
    if (!m.primaryDomain) flags.push('NO_MATCH');
    if (/In this area we track the following data|In diesem Bereich erfassen wir folgende Daten/.test(answer)) flags.push('DUMP');
    if (/not enough information here|nicht genügend Informationen vor/.test(answer)) flags.push('INSUFFICIENT');
    else if (/^(We do not have|Für diese Frage haben wir)[^.]*(on record|hinterlegt)[^.]*\.$/.test(answer)) flags.push('NOT_ON_RECORD');
    return {
      source, n: i + 1, ref: q.referenceId || '', category: q.category || '', question: q.text, lang,
      domain: m.primaryDomain || '', topics: (m.primaryTopics || m.topics || []).join('|'),
      type: cls[i]?.questionType || '', matchConf: m.confidence, answerConf: d.answerConfidence || '',
      drafted: d.isDrafted ? 'y' : '', flags: flags.join('|'), draft: answer, verdict: '', note: '',
    };
  });
}

const rows = [];

if (useTemplates) {
  for (const t of templateEntries()) {
    const { questions } = templateToQuestions(t.id);
    rows.push(...draftBatch(`template:${t.id}`, questions, forcedLang || 'en'));
  }
}

for (const file of files) {
  const buf = fs.readFileSync(file);
  const parsed = await engine.parseFile(new File([buf], path.basename(file)));
  const lang = forcedLang || detectQuestionnaireLanguage(parsed.questions) || 'en';
  if (parsed.warnings?.length) console.error(`${path.basename(file)}: ${parsed.warnings.length} parser warning(s)`);
  rows.push(...draftBatch(path.basename(file), parsed.questions, lang));
}

for (const file of textFiles) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const questions = lines.map((text, i) => {
    const m = text.match(/^(\d+[a-z]?(?:\.\d+)?)\.\s+(.*)$/);
    return { id: `t${i + 1}`, rowIndex: i + 1, text: m ? m[2] : text, referenceId: m ? m[1] : undefined, rawRow: {} };
  });
  const lang = forcedLang || detectQuestionnaireLanguage(questions) || 'en';
  rows.push(...draftBatch(path.basename(file), questions, lang));
}

const COLS = ['source', 'n', 'ref', 'category', 'question', 'lang', 'domain', 'topics', 'type', 'matchConf', 'answerConf', 'drafted', 'flags', 'draft', 'verdict', 'note'];
const tsv = [COLS.join('\t'), ...rows.map(r => COLS.map(c => String(r[c] ?? '').replace(/[\t\r\n]+/g, ' ')).join('\t'))].join('\n') + '\n';
if (out) {
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, tsv);
} else {
  process.stdout.write(tsv);
}

// Summary per source: how many questions, and what the automated flags caught.
const bySource = new Map();
for (const r of rows) {
  const s = bySource.get(r.source) || { questions: 0, NO_MATCH: 0, DUMP: 0, INSUFFICIENT: 0, NOT_ON_RECORD: 0 };
  s.questions += 1;
  for (const f of r.flags.split('|').filter(Boolean)) s[f] += 1;
  bySource.set(r.source, s);
}
console.error('source\tquestions\tno-match\tdump\tinsufficient\tnot-on-record');
for (const [source, s] of bySource) {
  console.error(`${source}\t${s.questions}\t${s.NO_MATCH}\t${s.DUMP}\t${s.INSUFFICIENT}\t${s.NOT_ON_RECORD}`);
}
if (out) console.error(`\n${rows.length} rows → ${out}. Fill the verdict column by hand.`);
