// The coverage report, as a file someone can take away.
//
// The report ends by telling a reader which documents would answer more of their
// questionnaire — and then they close the tab. Nothing is local-first about a
// workspace nobody can find again: there is no account, no email and no way to
// bring anyone back, so the only return address that exists is one they carry out
// with them. This is it.
//
// It is deliberately a standalone HTML file rather than a PDF or a CSV. It opens in
// any browser, prints to PDF if they want that, and forwards to the colleague who
// actually has the electricity bills — which is usually a different person from the
// one who was sent the questionnaire.
//
// Same honesty rule as the report it comes from: counts and provenance, never a
// readiness score, a percentage complete, or a guess at what the buyer will make of
// it. A file that outlives the session is exactly the wrong place to overclaim.

import { documentName, documentHolds } from '@/lib/documentLabels';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Where this workspace lives, so the file can point back at it. */
export function workspaceUrl() {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}${window.location.pathname}`;
}

/**
 * Build the takeaway checklist as a standalone HTML document.
 *
 * `t` is passed in rather than imported so the file comes out in the language the
 * reader is using, and so the i18n coverage guard sees the keys at their call sites.
 */
export function buildChecklistHtml({
  t,
  coverage,
  questionnaireName = '',
  url = '',
  generatedAt = new Date(),
}) {
  const { total, fromRecords, written, unanswerable, missingDocuments } = coverage;

  const date = generatedAt.toISOString().split('T')[0];

  const documents = (missingDocuments || [])
    .map(entry => ({
      name: documentName(t, entry.document),
      holds: documentHolds(t, entry.document),
      unlocks: entry.unlocks,
    }))
    .filter(entry => entry.name);

  const rows = [
    [t('checklist.total'), total],
    [t('checklist.fromRecords'), fromRecords.length],
    [t('checklist.written'), written.length],
    [t('checklist.unanswerable'), unanswerable.length],
  ];

  const summary = rows
    .map(([label, value]) => `      <tr><th scope="row">${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`)
    .join('\n');

  const documentList = documents.length > 0
    ? `    <h2>${escapeHtml(t('checklist.docsTitle'))}</h2>
    <ol class="docs">
${documents.map(entry => `      <li>
        <p class="doc-name">${escapeHtml(entry.name)}</p>
        <p class="doc-note">${escapeHtml(entry.holds)} — ${escapeHtml(t('checklist.docAnswers', { count: entry.unlocks }))}</p>
      </li>`).join('\n')}
    </ol>`
    : `    <h2>${escapeHtml(t('checklist.docsTitle'))}</h2>
    <p>${escapeHtml(t('checklist.noDocs'))}</p>`;

  const heading = t('checklist.docTitle');
  const continueLine = url
    ? `    <p class="back">${escapeHtml(t('checklist.continueAt'))}<br><a href="${escapeHtml(url)}">${escapeHtml(url)}</a></p>`
    : '';

  return `<!doctype html>
<html lang="${escapeHtml(t('checklist.lang'))}">
<head>
<meta charset="utf-8">
<title>${escapeHtml(heading)}</title>
<style>
  body { font: 15px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
         color: #0f172a; background: #fff; margin: 0; padding: 40px 24px; }
  main { max-width: 640px; margin: 0 auto; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  h2 { font-size: 16px; margin: 32px 0 8px; }
  .meta { color: #64748b; font-size: 13px; margin: 0 0 24px; }
  table { border-collapse: collapse; width: 100%; }
  th, td { text-align: left; padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 400; }
  td { text-align: right; font-variant-numeric: tabular-nums; font-weight: 600; width: 4em; }
  ol.docs { padding-left: 20px; }
  ol.docs li { margin-bottom: 12px; }
  .doc-name { margin: 0; font-weight: 600; }
  .doc-note { margin: 2px 0 0; color: #64748b; font-size: 13px; }
  .back { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 13px; }
  .privacy { color: #94a3b8; font-size: 12px; margin-top: 8px; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
<main>
  <h1>${escapeHtml(heading)}</h1>
  <p class="meta">${questionnaireName ? `${escapeHtml(questionnaireName)} · ` : ''}${escapeHtml(t('checklist.generated', { date }))}</p>

  <table>
    <tbody>
${summary}
    </tbody>
  </table>

${documentList}

${continueLine}
  <p class="privacy">${escapeHtml(t('checklist.privacy'))}</p>
</main>
</body>
</html>
`;
}

/** Filename for the downloaded checklist. */
export function checklistFileName(generatedAt = new Date()) {
  return `esg-questionnaire-checklist-${generatedAt.toISOString().split('T')[0]}.html`;
}

/**
 * Write the checklist to the reader's disk. Returns false when the browser gives us
 * nowhere to write it, so the caller can stay quiet rather than claim a saved file.
 */
export function downloadChecklist(html, fileName) {
  try {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(href);
    return true;
  } catch {
    return false;
  }
}
