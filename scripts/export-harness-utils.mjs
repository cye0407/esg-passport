import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { build } from 'esbuild';
import XLSX from 'xlsx';
import { QUESTIONNAIRE_TEMPLATES, templateToParseResult } from '../src/data/questionnaire-templates.js';

const DEFAULT_CONFIG = {
  useLLM: false,
  includeMethodology: true,
  includeAssumptions: true,
  includeLimitations: true,
  verbosity: 'standard',
  aggregateSites: true,
};

export const DEFAULT_FIXTURE_PATH = path.resolve('testing/fixtures/esg-for-suppliers.json');
export const DEFAULT_PHASE0_DIR = path.resolve('phase0testing');
const HARNESS_CACHE_DIR = path.resolve('.codex-cache', 'response-ready-harness');
const RESPONSE_READY_ROOT = path.resolve('..', 'response-ready');
const RESPONSE_READY_BUNDLE = path.join(HARNESS_CACHE_DIR, 'response-ready-bundle.cjs');
const require = createRequire(import.meta.url);

export function loadFixture(fixturePath = DEFAULT_FIXTURE_PATH) {
  return JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
}

async function ensureResponseReadyBundle() {
  ensureDir(HARNESS_CACHE_DIR);

  await build({
    absWorkingDir: RESPONSE_READY_ROOT,
    bundle: true,
    entryPoints: [path.join(RESPONSE_READY_ROOT, 'scripts', 'harness-entry.ts')],
    format: 'cjs',
    outfile: RESPONSE_READY_BUNDLE,
    platform: 'node',
    sourcemap: false,
    target: ['node22'],
  });
}

export async function createEngine() {
  await ensureResponseReadyBundle();
  delete require.cache[RESPONSE_READY_BUNDLE];
  const { createResponseEngine, esgDomainPack } = require(RESPONSE_READY_BUNDLE);
  return createResponseEngine(esgDomainPack);
}

export function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

export function buildExportMetadata(companyData, framework, language = 'en') {
  const policyNames = (companyData?.policies || [])
    .filter((p) => p.status === 'available')
    .map((p) => p.name)
    .join('|');

  return {
    companyName: companyData?.companyName || '',
    framework: framework || undefined,
    reportingPeriod: companyData?.reportingPeriod || '',
    generatedAt: new Date().toISOString(),
    language,
    packName: 'esg',
    packVersion: '1.0.0',
    creator: 'ESG Passport Harness',
    extra: {
      industry: companyData?.industry,
      country: companyData?.country,
      employeeCount: companyData?.employeeCount,
      numberOfSites: companyData?.numberOfSites,
      revenueBand: companyData?.revenueBand,
      electricityKwh: companyData?.electricityKwh,
      renewablePercent: companyData?.renewablePercent,
      naturalGasM3: companyData?.naturalGasM3,
      dieselLiters: companyData?.dieselLiters,
      scope1Tco2e: companyData?.scope1Tco2e,
      scope2Tco2e: companyData?.scope2Tco2e,
      scope3Tco2e: companyData?.scope3Tco2e,
      waterM3: companyData?.waterM3,
      totalWasteKg: companyData?.totalWasteKg,
      recyclingPercent: companyData?.recyclingPercent,
      hazardousWasteKg: companyData?.hazardousWasteKg,
      femalePercent: companyData?.femalePercent,
      trainingHoursPerEmployee: companyData?.trainingHoursPerEmployee,
      trirRate: companyData?.trirRate,
      certifications: companyData?.certifications,
      policyNames,
    },
  };
}

export function generateDraftsForQuestions(engine, questions, companyData, profile) {
  const matchResults = engine.matchQuestions(questions);
  const classifications = engine.classifyQuestions
    ? engine.classifyQuestions(questions.map((q) => ({ id: q.id, text: q.text, category: q.category })))
    : [];
  const dataContexts = matchResults.map((mr) => engine.retrieveData(mr, companyData));
  return engine.generateDrafts(questions, matchResults, dataContexts, DEFAULT_CONFIG, profile, classifications);
}

export function templateEntries() {
  return Object.values(QUESTIONNAIRE_TEMPLATES);
}

export function templateToQuestions(templateId) {
  const parseResult = templateToParseResult(templateId);
  if (!parseResult) throw new Error(`Unknown template: ${templateId}`);
  return parseResult;
}

export function writeWorkbookBuffer(buffer, filePath) {
  fs.writeFileSync(filePath, Buffer.from(buffer));
}

export function readAnswerRows(xlsxPath) {
  const wb = XLSX.readFile(xlsxPath);
  const rows = XLSX.utils.sheet_to_json(wb.Sheets.Answers, { header: 1, defval: '' });
  return rows.slice(2).map((row) => ({
    questionId: String(row[0] || ''),
    questionText: String(row[1] || ''),
    questionType: String(row[2] || ''),
    category: String(row[3] || ''),
    answer: String(row[5] || ''),
    confidence: String(row[8] || ''),
  })).filter((row) => row.questionId && row.questionText);
}

export function readMetricsFromWorkbook(xlsxPath) {
  const wb = XLSX.readFile(xlsxPath);
  const rows = XLSX.utils.sheet_to_json(wb.Sheets['ESG Metrics'], { header: 1, defval: '' });
  const metrics = { values: {}, policies: [], certifications: '' };
  for (const row of rows) {
    const key = String(row[1] || '').trim();
    const value = String(row[2] || '').trim();
    if (!key || !value) continue;
    if (key === '✓') {
      metrics.policies.push(value);
      continue;
    }
    if (key === 'Certifications') {
      metrics.certifications = value;
      continue;
    }
    metrics.values[key] = value;
  }
  return metrics;
}

export function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

export function confidenceLabelToSource(label) {
  const normalized = String(label || '').toLowerCase();
  if (normalized === 'provided') return 'provided';
  if (normalized === 'estimated') return 'estimated';
  return 'unknown';
}
