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
import { POLICY_BUILDERS, builderName } from '@/data/policyBuilders';

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
  const { total, recovered = [], fromRecords, partial = [], written, unanswerable, missingDocuments, policyGaps = { builders: [] }, topics = [] } = coverage;

  const date = generatedAt.toISOString().split('T')[0];

  const documents = (missingDocuments || [])
    .map(entry => ({
      name: documentName(t, entry.document),
      holds: documentHolds(t, entry.document),
      unlocks: entry.unlocks,
    }))
    .filter(entry => entry.name);

  const supported = recovered.length + fromRecords.length;
  const review = partial.length + written.length;
  const open = unanswerable.length;
  const lang = t('checklist.lang');
  const companyTopic = topics.find(topic => topic.topic === 'other');
  const companyAnswered = companyTopic ? (companyTopic.recovered || 0) + (companyTopic.fromRecords || 0) : 0;
  const companyOpen = companyTopic ? Math.max(0, companyTopic.total - companyAnswered) : 0;
  const policies = (policyGaps.builders || []).map(id => builderName(POLICY_BUILDERS[id], lang)).filter(Boolean);

  const requirementPlan = documents.length > 0 || companyTopic || policies.length > 0
    ? `    <section class="requirements">
      <p class="eyebrow">${escapeHtml(t('checklist.requirementsTitle'))}</p>
      ${documents.length > 0 ? `<h2>${escapeHtml(t('checklist.recordsTitle'))}</h2>
      <ol class="docs">
${documents.map((entry, index) => `        <li>
          <span class="number">${String(index + 1).padStart(2, '0')}</span>
          <div><p class="doc-name">${escapeHtml(entry.name)}</p>
          <p class="doc-note">${escapeHtml(entry.holds)} · ${escapeHtml(t('checklist.docAnswers', { count: entry.unlocks }))}</p></div>
        </li>`).join('\n')}
      </ol>` : ''}
      ${companyTopic ? `<div class="requirement-block"><h2>${escapeHtml(t('checklist.companyTitle'))}</h2><p>${escapeHtml(t('checklist.companyBody', { answered: companyAnswered, open: companyOpen }))}</p></div>` : ''}
      ${policies.length > 0 ? `<div class="requirement-block"><h2>${escapeHtml(t('checklist.policiesTitle'))}</h2><ul class="policies">${policies.map(name => `<li>${escapeHtml(name)}</li>`).join('')}</ul><p>${escapeHtml(t('checklist.policiesBody'))}</p></div>` : ''}
    </section>`
    : `    <section class="clear"><h2>${escapeHtml(t('checklist.noDocsTitle'))}</h2><p>${escapeHtml(t('checklist.noDocs'))}</p></section>`;

  const heading = t('checklist.docTitle');
  const continueLine = url
    ? `    <section class="back"><p>${escapeHtml(t('checklist.continueAt'))}</p><a href="${escapeHtml(url)}">${escapeHtml(t('checklist.openWorkspace'))}</a><span>${escapeHtml(url)}</span></section>`
    : '';

  return `<!doctype html>
<html lang="${escapeHtml(t('checklist.lang'))}">
<head>
<meta charset="utf-8">
<title>${escapeHtml(heading)}</title>
<style>
  * { box-sizing: border-box; }
  body { font: 15px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
         color: #0f1a15; background: #f3f7f5; margin: 0; padding: 40px 24px; }
  main { max-width: 680px; margin: 0 auto; overflow: hidden; border: 1px solid #dce9e3;
         border-radius: 20px; background: #fff; box-shadow: 0 24px 60px -40px rgba(16,40,30,.55); }
  header { padding: 28px 32px 24px; border-bottom: 1px solid #e6ece8; background: #f7faf8; }
  .kicker, .eyebrow { margin: 0; color: #0b5f43; font-size: 11px; font-weight: 750; letter-spacing: .13em; text-transform: uppercase; }
  h1 { margin: 6px 0 0; font-size: 26px; line-height: 1.2; letter-spacing: -.02em; }
  h2 { margin: 0; font-size: 17px; line-height: 1.35; }
  .meta { color: #6b7a72; font-size: 12px; margin: 8px 0 0; }
  .standing { padding: 24px 32px; border-bottom: 1px solid #e6ece8; }
  .standing h2 { color: #6b7a72; font-size: 11px; letter-spacing: .1em; text-transform: uppercase; }
  .standing p { margin: 8px 0 0; color: #203129; font-size: 16px; line-height: 1.65; }
  .requirements { margin: 24px 32px 0; padding: 22px; border: 1px solid #dce9e3; border-radius: 16px; background: #f7faf8; }
  .requirements > h2 { margin-top: 8px; }
  ol.docs { list-style: none; margin: 12px 0 0; padding: 0; }
  ol.docs li { display: flex; gap: 12px; align-items: flex-start; padding: 14px 0; border-top: 1px solid #e6ece8; }
  .number { display: grid; place-items: center; min-width: 28px; height: 28px; border-radius: 999px; background: #e7f4ef; color: #0b5f43; font-size: 11px; font-weight: 750; }
  .doc-name { margin: 0; font-weight: 650; }
  .doc-note { margin: 2px 0 0; color: #6b7a72; font-size: 12px; }
  .requirement-block { margin-top: 18px; padding-top: 18px; border-top: 1px solid #dce9e3; }
  .requirement-block p { margin: 6px 0 0; color: #56645d; font-size: 13px; }
  ul.policies { margin: 8px 0 0; padding-left: 20px; color: #203129; }
  .clear { margin: 24px 32px 0; padding: 20px; border: 1px solid #dce9e3; border-radius: 14px; background: #f7faf8; }
  .clear p { margin: 6px 0 0; color: #56645d; }
  .back { margin-top: 28px; padding: 20px 32px; border-top: 1px solid #dce9e3; background: #eef8f3; }
  .back p { margin: 0 0 10px; color: #3f5049; font-weight: 600; }
  .back a { display: inline-block; border-radius: 10px; background: #0f7a55; color: #fff; padding: 9px 14px; font-size: 13px; font-weight: 700; text-decoration: none; }
  .back span { display: block; margin-top: 8px; color: #6b7a72; font-size: 11px; word-break: break-all; }
  .local-note { margin: 0; padding: 14px 32px 18px; color: #6b7a72; font-size: 11px; background: #eef8f3; }
  @media (max-width: 560px) { body { padding: 0; background: #fff; } main { border: 0; border-radius: 0; box-shadow: none; } header, .standing, .back, .local-note { padding-left: 20px; padding-right: 20px; } .requirements, .clear { margin-left: 20px; margin-right: 20px; } }
  @media print { body { padding: 0; background: #fff; } main { border: 0; box-shadow: none; } }
</style>
</head>
<body>
<main>
  <header>
    <p class="kicker">${escapeHtml(t('checklist.kicker'))}</p>
    <h1>${escapeHtml(questionnaireName || heading)}</h1>
    <p class="meta">${escapeHtml(t('checklist.generated', { date }))}</p>
  </header>
  <section class="standing">
    <h2>${escapeHtml(t('checklist.standingTitle'))}</h2>
    <p>${escapeHtml(review === 1
      ? t('checklist.summaryOneReview', { total, supported, open })
      : t('checklist.summary', { total, supported, review, open }))}</p>
  </section>

${requirementPlan}

${continueLine}
  <p class="local-note">${escapeHtml(t('checklist.localNote'))}</p>
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
