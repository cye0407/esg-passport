/**
 * Export the report as a self-contained HTML file.
 * Clones the report DOM, inlines critical styles, wraps in a full HTML document.
 */
export function exportAsHTML(reportElement, companyName) {
  const clone = reportElement.cloneNode(true);

  // Remove action buttons from export
  const actions = clone.querySelectorAll('[data-no-export]');
  actions.forEach(el => el.remove());

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ESG Passport — ${escapeHtml(companyName)}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; background: #fff; line-height: 1.6; }
  .report { max-width: 800px; margin: 0 auto; padding: 40px 32px; }
  .report-header { border-bottom: 3px solid #1e293b; padding-bottom: 24px; margin-bottom: 32px; }
  .report-header h1 { font-size: 28px; font-weight: 700; margin-bottom: 4px; }
  .report-header p { color: #64748b; font-size: 14px; }
  .company-meta { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 16px; }
  .company-meta dt { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; }
  .company-meta dd { font-size: 14px; font-weight: 600; }
  .section { margin-bottom: 32px; }
  .section-title { font-size: 16px; font-weight: 700; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 16px; display: flex; align-items: baseline; gap: 8px; }
  .vsme-badge { font-size: 11px; font-weight: 600; background: #f1f5f9; color: #475569; padding: 2px 8px; border-radius: 2px; }
  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  th { text-align: left; padding: 8px 12px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; }
  td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; }
  td.value { text-align: right; font-variant-numeric: tabular-nums; font-weight: 500; }
  .policy-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
  .policy-item { font-size: 13px; padding: 6px 10px; background: #f8fafc; display: flex; justify-content: space-between; }
  .policy-status { font-weight: 600; }
  .status-approved { color: #16a34a; }
  .status-in-progress { color: #d97706; }
  .status-not-available { color: #94a3b8; }
  .quality-bar { display: flex; gap: 4px; margin-top: 8px; }
  .quality-segment { height: 8px; border-radius: 1px; }
  .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; display: flex; justify-content: space-between; }
  @media print { body { font-size: 12px; } .report { padding: 0; } }
</style>
</head>
<body>
${clone.innerHTML}
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `esg-passport-${slugify(companyName)}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeHtml(str) {
  return str?.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') || '';
}

function slugify(str) {
  return (str || 'report').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
