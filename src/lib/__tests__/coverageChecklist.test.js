import { describe, expect, it } from 'vitest';
import { buildChecklistHtml, checklistFileName } from '../coverageChecklist';
import { t as translate } from '../i18n';

// Same shape the component receives from LanguageContext: (key, vars).
const t = (key, vars) => translate(key, 'en', vars);
const tDe = (key, vars) => translate(key, 'de', vars);

const coverage = {
  total: 34,
  fromRecords: [{ questionId: 'a' }, { questionId: 'b' }],
  written: [{ questionId: 'c' }],
  unanswerable: [{ questionId: 'd' }, { questionId: 'e' }],
  missingDocuments: [
    { document: 'electricityBill', unlocks: 6 },
    { document: 'hrReport', unlocks: 3 },
    // Not a document type documentLabels knows: it must be dropped, not printed raw.
    { document: 'somethingUnmapped', unlocks: 9 },
  ],
  policyGaps: { builders: [] },
  hasOwnData: true,
  topics: [],
};

// What a reader actually sees: markup and the stylesheet stripped, so a `width: 100%`
// in the CSS cannot fail an assertion about the words on the page.
const visibleText = html =>
  html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .toLowerCase();

const build = (overrides = {}) =>
  buildChecklistHtml({
    t,
    coverage,
    questionnaireName: 'EcoVadis 2026',
    url: 'https://esgforsuppliers.com/app/',
    generatedAt: new Date('2026-09-09T10:00:00.000Z'),
    ...overrides,
  });

describe('the checklist someone takes away', () => {
  it('carries the counts the report showed', () => {
    const html = build();
    expect(html).toContain('34');
    expect(html).toContain('Answered from your records');
    expect(html).toContain('Still waiting on something');
  });

  it('names the documents to go and find, and what each would answer', () => {
    const html = build();
    expect(html).toContain('would answer 6 more');
    expect(html).toContain('would answer 3 more');
  });

  it('drops a document type it has no label for rather than printing the raw key', () => {
    const html = build();
    expect(html).not.toContain('somethingUnmapped');
    expect(html).not.toContain('would answer 9 more');
  });

  it('carries the way back to the workspace', () => {
    expect(build()).toContain('https://esgforsuppliers.com/app/');
  });

  it('says the work happened on their own device', () => {
    expect(build()).toContain('Nothing was uploaded');
  });

  it('is a standalone document that opens on its own', () => {
    const html = build();
    expect(html.startsWith('<!doctype html>')).toBe(true);
    expect(html).toContain('</html>');
    // No external stylesheet or script: it has to work from a downloads folder,
    // offline, months later.
    expect(html).not.toMatch(/<link[^>]+href=/i);
    expect(html).not.toMatch(/<script/i);
  });

  // The report refuses to publish a readiness score, a percentage complete or a guess
  // at what the buyer will make of it. A file that outlives the session is the worst
  // possible place to start.
  it.each(['score', 'readiness', 'complete', 'percent', 'guarantee', 'compliant', 'pass rate'])(
    'never says "%s"',
    word => {
      expect(visibleText(build())).not.toContain(word.toLowerCase());
    },
  );

  it('escapes a questionnaire name rather than letting it write markup', () => {
    const html = build({ questionnaireName: '<img src=x onerror=alert(1)>' });
    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&lt;img src=x');
  });

  it('says so plainly when nothing is outstanding', () => {
    const html = build({ coverage: { ...coverage, missingDocuments: [] } });
    expect(html).toContain('Nothing outstanding');
  });

  it('comes out in German when the reader is reading German', () => {
    const html = buildChecklistHtml({
      t: tDe,
      coverage,
      questionnaireName: 'EcoVadis 2026',
      url: 'https://esgforsuppliers.com/app/',
      generatedAt: new Date('2026-09-09T10:00:00.000Z'),
    });
    expect(html).toContain('lang="de"');
    expect(html).toContain('Was dieser Fragebogen braucht');
    expect(html).toContain('Zu suchende Dokumente');
  });

  it('names the file by the day it was made', () => {
    expect(checklistFileName(new Date('2026-09-09T10:00:00.000Z')))
      .toBe('esg-questionnaire-checklist-2026-09-09.html');
  });
});
