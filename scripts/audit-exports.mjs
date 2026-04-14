import fs from 'node:fs';
import path from 'node:path';
import {
  DEFAULT_FIXTURE_PATH,
  DEFAULT_PHASE0_DIR,
  confidenceLabelToSource,
  createEngine,
  generateDraftsForQuestions,
  loadFixture,
  normalizeText,
  readAnswerRows,
  readMetricsFromWorkbook,
  templateEntries,
  templateToQuestions,
} from './export-harness-utils.mjs';

const cliArgs = process.argv.slice(2);
const positionalArgs = cliArgs.filter((arg) => !arg.startsWith('--'));
const targetDir = path.resolve(positionalArgs[0] || DEFAULT_PHASE0_DIR);
const fixturePath = path.resolve(positionalArgs[1] || DEFAULT_FIXTURE_PATH);
const strictMode = cliArgs.includes('--strict') || targetDir.toLowerCase().includes(`${path.sep}harness${path.sep}latest`);

const engine = strictMode ? await createEngine() : null;
const fixture = strictMode ? loadFixture(fixturePath) : null;
const companyData = fixture?.companyData;
const profile = fixture?.profile;

const files = fs.readdirSync(targetDir)
  .filter((name) => name.toLowerCase().endsWith('.xlsx'))
  .map((name) => path.join(targetDir, name))
  .sort();

if (files.length === 0) {
  console.log(`No .xlsx files found in ${targetDir}`);
  process.exit(0);
}

function heuristicFindings(row, metrics) {
  const findings = [];
  const q = row.questionText.toLowerCase();
  const a = row.answer.toLowerCase();
  const policies = metrics.policies.map((p) => p.toLowerCase());
  const certs = metrics.certifications.toLowerCase();
  const isPolicyQuestion = /do you have|policy|mechanism|code of conduct/.test(q);

  const hasPolicy = (needle) => policies.some((p) => p.includes(needle));

  if (q.includes('supplier code of conduct') && hasPolicy('supplier code of conduct') && /not yet established|not separately recorded|developing a formal supplier code/.test(a)) {
    findings.push('Supplier Code contradiction: metrics sheet says it exists, answer weakens or denies it.');
  }
  if (isPolicyQuestion && (q.includes('code of conduct') || (q.includes('business ethics') && q.includes('policy'))) && hasPolicy('code of conduct') && !a.includes('code of conduct')) {
    findings.push('Code of Conduct mismatch: answer does not surface the policy listed in metrics.');
  }
  if (q.includes('anti-corruption') && hasPolicy('anti-corruption') && !a.includes('anti-corruption')) {
    findings.push('Anti-corruption mismatch: answer does not surface the anti-corruption policy listed in metrics.');
  }
  if ((q.includes('whistleblowing') || q.includes('grievance mechanism')) && hasPolicy('whistleblower') && /not yet been established|currently, issues can be raised through direct communication with management/.test(a)) {
    findings.push('Grievance mechanism contradiction: metrics sheet says it exists, answer says it does not.');
  }
  if (q.includes('water management policy') && /anti-corruption|code of business conduct|business ethics/.test(a)) {
    findings.push('Water policy misroute: answer contains ethics language.');
  }
  if ((q.includes('environmental management system') || q.includes('environmental policy')) && certs.includes('iso 9001') && !certs.includes('iso 14001') && a.includes('iso 9001')) {
    findings.push('Environmental policy/EMS mismatch: ISO 9001 is being used as environmental management evidence.');
  }
  if ((q.includes('certification') || q.includes('certifications')) && !q.includes('environmental management system') && certs && !a.toLowerCase().includes(certs.toLowerCase().split(',')[0].trim().toLowerCase())) {
    findings.push('Certification mismatch: answer does not list the certification shown in metrics.');
  }
  if ((q.includes('company name') || q.includes('registered address') || q.includes('number of employees') || q.includes('business model')) && metrics.values.Employees && !a.includes(String(metrics.values.Employees).toLowerCase())) {
    findings.push('Company profile mismatch: answer does not include employee count from metrics.');
  }
  if (q.includes('human rights') && a.includes('health & safety policy')) {
    findings.push('Human rights misroute: answer cites Health & Safety Policy as human-rights evidence.');
  }
  if ((q.includes('externally verified') || q.includes('externally assured')) && !/assur|verified|audit/.test(a)) {
    findings.push('External assurance misroute: answer does not discuss assurance or verification.');
  }

  return findings;
}

function detectTemplateId(rows) {
  const rowIds = rows.map((row) => row.questionId).filter(Boolean);
  const rowIdSet = new Set(rowIds);

  for (const template of templateEntries()) {
    const parseResult = templateToQuestions(template.id);
    const templateIds = parseResult.questions.map((question) => question.id);
    if (templateIds.length !== rowIds.length) continue;
    if (templateIds.every((id) => rowIdSet.has(id))) return template.id;
  }

  return null;
}

const report = [];

for (const file of files) {
  const rows = readAnswerRows(file);
  const metrics = readMetricsFromWorkbook(file);
  const templateId = detectTemplateId(rows);
  const expectedById = strictMode
    ? new Map(
        generateDraftsForQuestions(
          engine,
          templateId
            ? templateToQuestions(templateId).questions
            : rows.map((row, index) => ({
                id: row.questionId || `Q${index + 1}`,
                rowIndex: index,
                text: row.questionText,
                category: row.category || undefined,
                rawRow: {},
              })),
          companyData,
          profile,
        ).map((draft) => [draft.questionId, draft]),
      )
    : null;

  const findings = [];
  for (const row of rows) {
    if (strictMode) {
      const expected = expectedById.get(row.questionId);
      if (!expected) {
        findings.push({ severity: 'medium', questionId: row.questionId, issue: 'Question missing from regenerated draft set.' });
        continue;
      }

      const actualAnswer = normalizeText(row.answer);
      const expectedAnswer = normalizeText(expected.answer);
      const actualConfidence = confidenceLabelToSource(row.confidence);
      const expectedConfidence = expected.confidenceSource === 'drafted' ? 'unknown' : expected.confidenceSource;

      if (actualConfidence !== expectedConfidence) {
        findings.push({
          severity: 'high',
          questionId: row.questionId,
          issue: `Confidence mismatch: workbook=${actualConfidence}, engine=${expectedConfidence}`,
        });
      }

      if (actualAnswer !== expectedAnswer) {
        findings.push({
          severity: 'high',
          questionId: row.questionId,
          issue: 'Answer mismatch against current engine output.',
          actual: row.answer,
          expected: expected.answer,
        });
      }
    }

    for (const issue of heuristicFindings(row, metrics)) {
      findings.push({ severity: 'high', questionId: row.questionId, issue });
    }
  }

  report.push({
    file: path.basename(file),
    templateId,
    questions: rows.length,
    findings,
  });
}

const timestamp = new Date().toISOString();
const mdLines = [`# Export Audit Report`, ``, `Generated: ${timestamp}`, ``, `Mode: ${strictMode ? 'strict engine comparison + heuristics' : 'heuristics only'}`, ``];
for (const item of report) {
  mdLines.push(`## ${item.file}`);
  if (item.findings.length === 0) {
    mdLines.push(`No findings.`);
    mdLines.push(``);
    continue;
  }
  for (const finding of item.findings) {
    mdLines.push(`- [${finding.severity}] ${finding.questionId}: ${finding.issue}`);
  }
  mdLines.push(``);
}

const mdPath = path.join(targetDir, 'export-audit-report.md');
const jsonPath = path.join(targetDir, 'export-audit-report.json');
fs.writeFileSync(mdPath, mdLines.join('\n'));
fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

console.log(`Audited ${report.length} workbook(s) in ${targetDir}`);
console.log(`Markdown report: ${mdPath}`);
console.log(`JSON report: ${jsonPath}`);

const totalFindings = report.reduce((sum, item) => sum + item.findings.length, 0);
if (totalFindings > 0) {
  for (const item of report) {
    for (const finding of item.findings) {
      console.log(`- ${item.file} :: ${finding.questionId} :: ${finding.issue}`);
    }
  }
  process.exitCode = 1;
} else {
  console.log('No findings.');
}
