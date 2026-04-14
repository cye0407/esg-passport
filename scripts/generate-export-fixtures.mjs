import path from 'node:path';
import {
  DEFAULT_FIXTURE_PATH,
  DEFAULT_PHASE0_DIR,
  buildExportMetadata,
  createEngine,
  ensureDir,
  generateDraftsForQuestions,
  loadFixture,
  templateEntries,
  templateToQuestions,
  writeWorkbookBuffer,
} from './export-harness-utils.mjs';

const outputRoot = path.resolve(process.argv[2] || path.join(DEFAULT_PHASE0_DIR, 'harness', 'latest'));
const fixturePath = path.resolve(process.argv[3] || DEFAULT_FIXTURE_PATH);

ensureDir(outputRoot);

const engine = await createEngine();
const { companyData, profile } = loadFixture(fixturePath);
const generated = [];

for (const template of templateEntries()) {
  const parseResult = templateToQuestions(template.id);
  const drafts = generateDraftsForQuestions(engine, parseResult.questions, companyData, profile);
  const metadata = buildExportMetadata(companyData, template.framework, 'en');
  const buffer = await engine.exportToBuffer({ answerDrafts: drafts, metadata });
  const fileName = `${template.id}.xlsx`;
  const filePath = path.join(outputRoot, fileName);
  writeWorkbookBuffer(buffer, filePath);
  generated.push({ template: template.id, framework: template.framework, file: filePath, questions: drafts.length });
}

console.log(`Generated ${generated.length} workbook(s) in ${outputRoot}`);
for (const item of generated) {
  console.log(`- ${item.template} (${item.framework}): ${item.questions} questions -> ${item.file}`);
}
