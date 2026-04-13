import { getExportStrings, localizeAnswerDrafts } from '@/lib/translations';

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function slugify(str) {
  return String(str || 'responses')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function formatStatus(draft, copy) {
  return draft.supportLevel === 'draft' ? copy.draft : copy.supported;
}

function formatCoverage(draft, copy) {
  switch (draft.dataCoverage) {
    case 'complete': return copy.dataBacked;
    case 'partial': return copy.partiallyBacked;
    case 'missing': return copy.notBacked;
    default: return draft.supportLevel === 'draft' ? copy.notBacked : copy.dataBacked;
  }
}

function buildRows(answerDrafts, copy) {
  return answerDrafts.map((draft, index) => {
    const mainText = draft.verifiedAnswer || draft.answer || '';
    const suggested = draft.draftAnswer && draft.draftAnswer !== draft.verifiedAnswer ? draft.draftAnswer : '';
    return `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(draft.questionText)}</td>
        <td>${escapeHtml(formatStatus(draft, copy))}</td>
        <td>${escapeHtml(formatCoverage(draft, copy))}</td>
        <td>${escapeHtml(mainText)}</td>
        <td>${suggested ? escapeHtml(suggested) : ''}</td>
      </tr>
    `;
  }).join('');
}

function buildHtmlDocument(answerDrafts, metadata, titleSuffix = 'Questionnaire Responses') {
  const copy = getExportStrings(metadata?.language);
  const drafts = localizeAnswerDrafts(answerDrafts, copy.lang);
  const company = metadata?.companyName || 'Company';
  const generatedAt = metadata?.generatedAt
    ? new Date(metadata.generatedAt).toLocaleString('en-GB')
    : new Date().toLocaleString('en-GB');
  const framework = metadata?.framework ? `<p><strong>${escapeHtml(copy.framework)}:</strong> ${escapeHtml(metadata.framework)}</p>` : '';
  const period = metadata?.reportingPeriod ? `<p><strong>${escapeHtml(copy.reportingPeriod)}:</strong> ${escapeHtml(metadata.reportingPeriod)}</p>` : '';

  return `<!DOCTYPE html>
<html lang="${escapeHtml(copy.lang)}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(company)} - ${escapeHtml(titleSuffix)}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #1f2937; margin: 32px; line-height: 1.5; }
    h1 { font-size: 28px; margin: 0 0 8px; }
    .meta { margin-bottom: 24px; color: #475569; font-size: 14px; }
    .pill { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 12px; font-weight: 600; margin-right: 6px; }
    .supported { background: #ecfdf5; color: #047857; }
    .draft { background: #f5f3ff; color: #6d28d9; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    th, td { border: 1px solid #e5e7eb; padding: 10px; vertical-align: top; font-size: 13px; text-align: left; }
    th { background: #f8fafc; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; color: #475569; }
    td:nth-child(1) { width: 40px; }
    td:nth-child(3), td:nth-child(4) { width: 140px; }
    .note { margin-top: 16px; font-size: 12px; color: #64748b; }
    @media print { body { margin: 16px; } }
  </style>
</head>
<body>
  <h1>${escapeHtml(company)}</h1>
  <div class="meta">
    <p><strong>${escapeHtml(titleSuffix)}</strong></p>
    ${framework}
    ${period}
    <p><strong>${escapeHtml(copy.generated)}:</strong> ${escapeHtml(generatedAt)}</p>
  </div>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>${escapeHtml(copy.question)}</th>
        <th>${escapeHtml(copy.status)}</th>
        <th>${escapeHtml(copy.coverage)}</th>
        <th>${escapeHtml(copy.answer)}</th>
        <th>${escapeHtml(copy.suggestedDraft)}</th>
      </tr>
    </thead>
    <tbody>
      ${buildRows(drafts, copy)}
    </tbody>
  </table>
  <p class="note">${escapeHtml(copy.note)}</p>
</body>
</html>`;
}

function triggerDownload(content, type, filename) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportAnswersAsHtml(answerDrafts, metadata) {
  const company = metadata?.companyName || 'company';
  const html = buildHtmlDocument(answerDrafts, metadata);
  triggerDownload(html, 'text/html;charset=utf-8', `${slugify(company)}-esg-responses.html`);
}

export function exportAnswersAsWord(answerDrafts, metadata) {
  const company = metadata?.companyName || 'company';
  const html = buildHtmlDocument(answerDrafts, metadata, 'Questionnaire Responses (Word)');
  triggerDownload(html, 'application/msword;charset=utf-8', `${slugify(company)}-esg-responses.doc`);
}

export function printAnswersAsPdf(answerDrafts, metadata) {
  const html = buildHtmlDocument(answerDrafts, metadata, 'Questionnaire Responses (Print/PDF)');
  const win = window.open('', '_blank', 'noopener,noreferrer');
  if (!win) {
    throw new Error('Popup blocked. Allow popups to open print preview.');
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
}
