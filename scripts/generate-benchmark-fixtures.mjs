// Builds the hand-designed hostile fixtures in testing/benchmark/fixtures and merges their
// ground truth into testing/benchmark/manifest.json.
//
// No real buyer forms are available (2026-09-13), so these are built to the SHAPES real
// formats are known to use — rating-platform offline sheets, automotive SAQs, multi-sheet
// Q/A forms, bank forms, retailer forms with buyer-side formulas — with original question
// text. Each generator returns the truth (row, answer cell, text) alongside the workbook,
// so the manifest never drifts from the file.
//
// Fixture 01 (the retailer form) and 02 (the July stress table) are not generated; 01's
// completed twin is produced by loading it and filling its shaded cells.
//
// Usage: node scripts/generate-benchmark-fixtures.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ExcelJS from 'exceljs';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const BENCH_DIR = path.resolve(SCRIPT_DIR, '..', 'testing', 'benchmark');
const FIX_DIR = path.join(BENCH_DIR, 'fixtures');
const MANIFEST = path.join(BENCH_DIR, 'manifest.json');

const SHADE = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } };
const BAND = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } };
const bold = { bold: true };

function shade(cell) { cell.fill = SHADE; }
function list(cell, options) {
  cell.dataValidation = { type: 'list', allowBlank: true, formulae: [`"${options.join(',')}"`] };
}

// ---------------------------------------------------------------------------
// 03 — rating-platform style offline sheet: instructions sheet, themed questionnaire with
// ID / question / options / YOUR ANSWER / comments / documents columns, merged theme bands,
// dropdown answers, and a hidden scoring sheet with formulas over the answer cells.
function build03(completed) {
  const wb = new ExcelJS.Workbook();
  const intro = wb.addWorksheet('Read me first');
  intro.getCell('A1').value = 'Supplier Sustainability Assessment — offline working copy';
  intro.getCell('A1').font = { bold: true, size: 14 };
  intro.getCell('A3').value = 'Use this sheet to prepare your answers offline. Transfer them to the online platform before the deadline. Answers typed here are not submitted.';
  intro.getCell('A4').value = 'Do not change the structure of the "Questionnaire" sheet. Cells in column E accept Yes / No / Partially only.';

  const ws = wb.addWorksheet('Questionnaire');
  ws.columns = [{ width: 22 }, { width: 10 }, { width: 70 }, { width: 22 }, { width: 16 }, { width: 40 }, { width: 30 }];
  ws.getRow(1).values = ['Theme', 'ID', 'Question', 'Answer options', 'Your answer', 'Comments', 'Supporting documents'];
  ws.getRow(1).font = bold;
  ws.views = [{ state: 'frozen', ySplit: 1 }];

  const themes = {
    Environment: [
      ['ENV1.1', 'Does your company have a formal environmental policy covering its own operations?', 'Yes / No / Partially', 'Yes', 'Policy adopted 2024, reviewed annually.'],
      ['ENV1.2', 'Is the environmental policy communicated to all employees?', 'Yes / No / Partially', 'Partially', 'Included in onboarding; annual refresher planned.'],
      ['ENV2.1', 'Do you measure your total energy consumption?', 'Yes / No / Partially', 'Yes', 'From utility invoices, monthly.'],
      ['ENV2.2', 'What was your total energy consumption in the last reporting year (MWh)?', 'Numeric', '2363', '2025, electricity and gas combined.'],
      ['ENV2.3', 'What share of your electricity came from renewable sources?', 'Percentage', '60', 'Green tariff certificate on file.'],
      ['ENV3.1', 'Do you measure Scope 1 and Scope 2 GHG emissions?', 'Yes / No / Partially', 'Yes', 'Location-based method.'],
      ['ENV3.2', 'Have you set a quantified GHG reduction target?', 'Yes / No / Partially', 'No', ''],
      ['ENV4.1', 'Do you track the total weight of waste generated?', 'Yes / No / Partially', 'Yes', 'From disposal contractor statements.'],
      ['ENV4.2', 'What proportion of waste was diverted from landfill?', 'Percentage', '80', ''],
      ['ENV5.1', 'Have you received any environmental fines or sanctions in the last three years?', 'Yes / No', 'No', ''],
    ],
    'Labour & Human Rights': [
      ['LAB1.1', 'Do you have a written health and safety policy?', 'Yes / No / Partially', 'Yes', ''],
      ['LAB1.2', 'How many lost-time injuries occurred in the last reporting year?', 'Numeric', '2', 'Both minor, no permanent harm.'],
      ['LAB1.3', 'Total hours worked in the last reporting year', 'Numeric', '520400', ''],
      ['LAB2.1', 'Are working hours recorded for all employees, including temporary staff?', 'Yes / No / Partially', 'Yes', ''],
      ['LAB2.2', 'Is there a documented mechanism for employees to raise grievances confidentially?', 'Yes / No / Partially', 'Yes', 'Works council and external hotline.'],
      ['LAB3.1', 'Do you provide training on health and safety to all new employees?', 'Yes / No / Partially', 'Yes', ''],
      ['LAB3.2', 'Average training hours per employee in the last reporting year', 'Numeric', '11', ''],
      ['LAB4.1', 'Do you have a policy prohibiting child labour and forced labour?', 'Yes / No / Partially', 'Yes', 'Part of the code of conduct.'],
      ['LAB4.2', 'Is freedom of association respected at all sites?', 'Yes / No / Partially', 'Yes', ''],
    ],
    Ethics: [
      ['ETH1.1', 'Do you have an anti-corruption and anti-bribery policy?', 'Yes / No / Partially', 'Yes', ''],
      ['ETH1.2', 'Have employees in exposed roles received anti-corruption training in the last two years?', 'Yes / No / Partially', 'Partially', 'Sales team trained 2025; procurement scheduled.'],
      ['ETH2.1', 'Is there a whistleblowing channel available to employees and third parties?', 'Yes / No / Partially', 'Yes', ''],
      ['ETH3.1', 'Do you have a policy on the protection of personal data?', 'Yes / No / Partially', 'Yes', ''],
      ['ETH3.2', 'Have you experienced a reportable data breach in the last three years?', 'Yes / No', 'No', ''],
    ],
    'Sustainable Procurement': [
      ['SUP1.1', 'Do you have a supplier code of conduct?', 'Yes / No / Partially', 'Yes', ''],
      ['SUP1.2', 'What proportion of your direct suppliers (by spend) have signed it?', 'Percentage', '71', ''],
      ['SUP2.1', 'Do you assess the sustainability performance of your suppliers?', 'Yes / No / Partially', 'Partially', 'Self-assessment for top 20 suppliers.'],
      ['SUP2.2', 'Have you conducted on-site audits of any suppliers in the last two years?', 'Yes / No', 'No', ''],
      ['SUP3.1', 'Do you require your suppliers to cascade sustainability requirements to their own suppliers?', 'Yes / No / Partially', 'No', ''],
    ],
  };

  const expected = [];
  let r = 2;
  for (const [theme, qs] of Object.entries(themes)) {
    ws.mergeCells(`A${r}:G${r}`);
    ws.getCell(`A${r}`).value = theme.toUpperCase();
    ws.getCell(`A${r}`).fill = BAND;
    ws.getCell(`A${r}`).font = bold;
    r += 1;
    for (const [id, text, options, answer, comment] of qs) {
      ws.getCell(`A${r}`).value = theme;
      ws.getCell(`B${r}`).value = id;
      ws.getCell(`C${r}`).value = text;
      ws.getCell(`C${r}`).alignment = { wrapText: true, vertical: 'top' };
      ws.getCell(`D${r}`).value = options;
      shade(ws.getCell(`E${r}`));
      if (options.startsWith('Yes')) list(ws.getCell(`E${r}`), options.split(' / '));
      if (completed) {
        ws.getCell(`E${r}`).value = /^\d+$/.test(answer) ? Number(answer) : answer;
        ws.getCell(`F${r}`).value = comment;
      }
      expected.push({ row: r, answerCell: `E${r}`, text });
      r += 1;
    }
  }

  const score = wb.addWorksheet('Scoring', { state: 'hidden' });
  score.getCell('A1').value = 'Internal — do not edit';
  score.getCell('A2').value = 'Yes answers';
  score.getCell('B2').value = { formula: `COUNTIF(Questionnaire!E2:E${r},"Yes")` };
  score.getCell('A3').value = 'Answered';
  score.getCell('B3').value = { formula: `COUNTA(Questionnaire!E2:E${r})` };

  return { wb, sheet: 'Questionnaire', expected };
}

// ---------------------------------------------------------------------------
// 04 — automotive-style SAQ: one sheet, hierarchical numbering (1.1, 1.1.1), question in A,
// Yes/No dropdown in B, comment in C, "evidence" column D, italic guidance rows between
// questions, section rows merged across A:D, a "Not applicable" checkbox row.
function build04(completed) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('SAQ');
  ws.columns = [{ width: 80 }, { width: 14 }, { width: 40 }, { width: 26 }];
  ws.mergeCells('A1:D1');
  ws.getCell('A1').value = 'Supplier Self-Assessment Questionnaire — Sustainability (v4.2)';
  ws.getCell('A1').font = { bold: true, size: 13 };
  ws.mergeCells('A2:D2');
  ws.getCell('A2').value = 'Answer every numbered item. Sub-items apply only when the parent item is answered "Yes". Guidance in italics is not a question.';
  ws.getCell('A2').font = { italic: true };
  ws.getRow(4).values = ['Item', 'Answer', 'Comment / explanation', 'Evidence attached (file name)'];
  ws.getRow(4).font = bold;

  const items = [
    ['1', 'Company management', 'section'],
    ['1.1', 'Does your company have a sustainability strategy approved by senior management?', 'Yes', 'Approved by the owners in March 2025.'],
    ['1.1.1', 'Does the strategy include measurable targets with deadlines?', 'No', 'Targets under discussion.'],
    ['g', 'A target is measurable when it names a metric, a baseline year and a deadline.', 'guidance'],
    ['1.2', 'Is a named person responsible for sustainability at management level?', 'Yes', 'Head of Operations.'],
    ['1.3', 'Does your company publish a sustainability or CSR report?', 'No', ''],
    ['2', 'Business ethics', 'section'],
    ['2.1', 'Does your company have a code of conduct covering corruption, conflicts of interest and fair competition?', 'Yes', ''],
    ['2.1.1', 'Is the code of conduct communicated to all employees and acknowledged in writing?', 'Yes', 'Signed at hiring.'],
    ['2.2', 'Is there a confidential channel for reporting suspected violations?', 'Yes', 'External ombudsperson.'],
    ['g', 'A channel is confidential when the identity of the reporter is protected from the accused and from line management.', 'guidance'],
    ['2.3', 'Has your company been convicted of, or investigated for, corruption in the last five years?', 'No', ''],
    ['3', 'Human rights and working conditions', 'section'],
    ['3.1', 'Does your company have a written policy on human rights?', 'Yes', 'Part of code of conduct.'],
    ['3.2', 'Are all employees provided with a written contract in a language they understand?', 'Yes', ''],
    ['3.3', 'Are recruitment fees ever charged to workers, directly or through agencies?', 'No', ''],
    ['3.4', 'Does your company have a health and safety management system?', 'Yes', 'ISO 45001 certified.'],
    ['3.4.1', 'Is the system certified by an accredited third party?', 'Yes', 'Certificate valid to 2027-06.'],
    ['3.5', 'Number of work-related fatalities in the last reporting year', 'Numeric', '0'],
    ['4', 'Environment', 'section'],
    ['4.1', 'Does your company hold an ISO 14001 or equivalent environmental management certification?', 'Yes', 'Valid to 2027-06.'],
    ['4.2', 'Does your company record energy consumption per site?', 'Yes', ''],
    ['4.3', 'Does your company calculate its carbon footprint (Scope 1 and 2)?', 'Yes', 'Location-based, annually.'],
    ['4.3.1', 'Has the calculation been verified by a third party?', 'No', ''],
    ['4.4', 'Does your company have a water management plan?', 'No', 'Low water use; not material.'],
    ['4.5', 'Does your company use substances listed on the REACH candidate list in its products?', 'No', ''],
    ['5', 'Supply chain', 'section'],
    ['5.1', 'Do you require your suppliers to comply with a supplier code of conduct?', 'Yes', ''],
    ['5.2', 'Do you conduct risk assessments of your suppliers regarding sustainability?', 'Partially', 'Top 20 suppliers only.'],
    ['5.3', 'Are conflict minerals (3TG) contained in the products you supply?', 'No', ''],
    ['na', 'Tick here if section 5 is not applicable because you have no suppliers of goods:', 'checkbox'],
  ];

  const expected = [];
  let r = 5;
  for (const item of items) {
    const [num, text, kind, comment] = item;
    if (kind === 'section') {
      ws.mergeCells(`A${r}:D${r}`);
      ws.getCell(`A${r}`).value = `${num}  ${text}`;
      ws.getCell(`A${r}`).fill = BAND;
      ws.getCell(`A${r}`).font = bold;
    } else if (kind === 'guidance') {
      ws.getCell(`A${r}`).value = text;
      ws.getCell(`A${r}`).font = { italic: true, color: { argb: 'FF666666' } };
    } else if (kind === 'checkbox') {
      ws.getCell(`A${r}`).value = text;
      ws.getCell(`B${r}`).value = '☐';
    } else {
      ws.getCell(`A${r}`).value = `${num}  ${text}`;
      ws.getCell(`A${r}`).alignment = { wrapText: true };
      shade(ws.getCell(`B${r}`));
      if (kind !== 'Numeric') list(ws.getCell(`B${r}`), ['Yes', 'No', 'Partially']);
      if (completed) {
        ws.getCell(`B${r}`).value = kind === 'Numeric' ? Number(comment) : kind;
        if (kind !== 'Numeric') ws.getCell(`C${r}`).value = comment;
      }
      expected.push({ row: r, answerCell: `B${r}`, text: `${num}  ${text}` });
    }
    r += 1;
  }
  return { wb, sheet: 'SAQ', expected };
}

// ---------------------------------------------------------------------------
// 05 — multi-sheet two-column Q/A form. Some sheets have a header row, some start with a
// question on row 1. Several answer cells are PRE-FILLED by the buyer ("N/A — not
// required for service suppliers", "see attached") and must not be overwritten.
function build05(completed) {
  const wb = new ExcelJS.Workbook();
  const sheets = {
    General: { header: true, qs: [
      ['Legal name of your company', 'Muster Technik GmbH'],
      ['Registered address', 'Industriestr. 4, 74564 Crailsheim'],
      ['Number of employees (headcount)', '142'],
      ['Annual turnover band', '€10–50M'],
      ['Main products or services supplied to us', 'Machined components'],
      ['Sites from which you supply us', 'Crailsheim (DE)'],
    ] },
    Environment: { header: false, qs: [
      ['Do you have an environmental management system? If certified, state the standard and expiry date.', 'Yes — ISO 14001, valid to 06/2027'],
      ['Total electricity consumption last year (kWh)', '2363000'],
      ['Total natural gas consumption last year (m³)', '92559'],
      ['Do you report Scope 1 and Scope 2 emissions? State the figures if available.', 'Yes — Scope 1: 268 tCO2e, Scope 2: 993 tCO2e (2025)'],
      ['Do you have a plan to reduce emissions? Summarise it.', 'Switch to green tariff completed; LED conversion 2026.'],
      ['Hazardous waste generated last year (kg)', '8030'],
    ] },
    Social: { header: true, prefilled: { 3: 'N/A — not required for service suppliers' }, qs: [
      ['Do you have a written health and safety policy?', 'Yes'],
      ['Lost-time injury rate (per 200,000 hours) last year', '0.77'],
      ['Do you employ agency or temporary workers? State the proportion.', 'Yes — approx. 6%'],
      ['Do you operate a grievance mechanism accessible to all workers?', 'Yes'],
      ['Percentage of women in management positions', '32'],
    ] },
    Governance: { header: false, prefilled: { 2: 'see attached buyer code of conduct' }, qs: [
      ['Do you have an anti-bribery policy? Who is responsible for it?', 'Yes — Managing Director'],
      ['Have you signed our supplier code of conduct?', ''],
      ['Do you carry out due diligence on your own suppliers regarding human rights?', 'Partially — questionnaire for top suppliers'],
      ['Do you hold cyber-security insurance or certification?', 'No'],
    ] },
  };
  const expected = [];
  let firstSheet = null;
  for (const [name, def] of Object.entries(sheets)) {
    const ws = wb.addWorksheet(name);
    ws.columns = [{ width: 70 }, { width: 50 }];
    let r = 1;
    if (def.header) { ws.getRow(1).values = ['Question', 'Answer']; ws.getRow(1).font = bold; r = 2; }
    def.qs.forEach(([text, answer], i) => {
      ws.getCell(`A${r}`).value = text;
      ws.getCell(`A${r}`).alignment = { wrapText: true };
      shade(ws.getCell(`B${r}`));
      const pre = def.prefilled?.[i];
      if (pre) ws.getCell(`B${r}`).value = pre;
      else if (completed && answer) ws.getCell(`B${r}`).value = /^\d+(\.\d+)?$/.test(answer) ? Number(answer) : answer;
      expected.push({ sheet: name, row: r, answerCell: `B${r}`, text, prefilled: pre || undefined });
      r += 1;
    });
    firstSheet ||= name;
  }
  return { wb, sheet: firstSheet, expected };
}

// ---------------------------------------------------------------------------
// 06 — German bank form: numbered questions, Ja/Nein/Teilweise dropdowns, numeric fields
// with units in a separate column, a visible score column with formulas per row, totals
// at the bottom, a signature block.
function build06(completed) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Fragebogen');
  ws.columns = [{ width: 6 }, { width: 78 }, { width: 18 }, { width: 10 }, { width: 10 }];
  ws.mergeCells('A1:E1');
  ws.getCell('A1').value = 'Nachhaltigkeitsfragebogen für Firmenkunden (KMU) — Stand 2026';
  ws.getCell('A1').font = { bold: true, size: 13 };
  ws.mergeCells('A2:E2');
  ws.getCell('A2').value = 'Bitte beantworten Sie alle Fragen. Angaben beziehen sich auf das letzte abgeschlossene Geschäftsjahr. Die Spalte "Punkte" wird automatisch berechnet.';
  ws.getRow(4).values = ['Nr.', 'Frage', 'Antwort', 'Einheit', 'Punkte'];
  ws.getRow(4).font = bold;

  const qs = [
    ['A', 'Allgemeine Angaben', 'section'],
    ['1', 'Wie viele Mitarbeitende beschäftigt Ihr Unternehmen (Vollzeitäquivalente)?', 'num', 'VZÄ', '289'],
    ['2', 'In welcher Branche ist Ihr Unternehmen hauptsächlich tätig?', 'text', '', 'Technische Textilien'],
    ['3', 'Verfügt Ihr Unternehmen über eine schriftliche Nachhaltigkeitsstrategie?', 'jn', '', 'Ja'],
    ['B', 'Umwelt', 'section'],
    ['4', 'Erfassen Sie Ihren Energieverbrauch systematisch?', 'jn', '', 'Ja'],
    ['5', 'Wie hoch war Ihr Stromverbrauch im letzten Geschäftsjahr?', 'num', 'kWh', '2363000'],
    ['6', 'Wie hoch war der Anteil erneuerbarer Energien am Stromverbrauch?', 'num', '%', '60'],
    ['7', 'Ermitteln Sie Ihre Treibhausgasemissionen (Scope 1 und 2)?', 'jn', '', 'Ja'],
    ['8', 'Wie hoch waren Ihre Scope-1- und Scope-2-Emissionen im letzten Geschäftsjahr?', 'num', 't CO₂e', '1261'],
    ['9', 'Haben Sie ein quantifiziertes Ziel zur Reduktion Ihrer Emissionen festgelegt?', 'jn', '', 'Nein'],
    ['10', 'Verfügt Ihr Unternehmen über ein zertifiziertes Umweltmanagementsystem (z. B. ISO 14001, EMAS)?', 'jn', '', 'Ja'],
    ['C', 'Soziales', 'section'],
    ['11', 'Wie hoch war die Fluktuationsrate im letzten Geschäftsjahr?', 'num', '%', '9.7'],
    ['12', 'Gab es im letzten Geschäftsjahr meldepflichtige Arbeitsunfälle? Wenn ja, wie viele?', 'num', 'Anzahl', '2'],
    ['13', 'Bestehen Regelungen zur Vereinbarkeit von Beruf und Familie?', 'jn', '', 'Teilweise'],
    ['14', 'Wie hoch ist der Frauenanteil in Führungspositionen?', 'num', '%', '32'],
    ['D', 'Unternehmensführung', 'section'],
    ['15', 'Verfügt Ihr Unternehmen über einen Verhaltenskodex (Code of Conduct)?', 'jn', '', 'Ja'],
    ['16', 'Bestehen Richtlinien zur Vermeidung von Korruption und Bestechung?', 'jn', '', 'Ja'],
    ['17', 'Gibt es ein Hinweisgebersystem für Mitarbeitende und Dritte?', 'jn', '', 'Ja'],
    ['18', 'Verlangen Sie von Ihren Lieferanten die Einhaltung von Sozial- und Umweltstandards?', 'jn', '', 'Teilweise'],
  ];
  const expected = [];
  let r = 5;
  const scoreRows = [];
  for (const [num, text, kind, unit, answer] of qs) {
    if (kind === 'section') {
      ws.mergeCells(`A${r}:E${r}`);
      ws.getCell(`A${r}`).value = `${num}. ${text}`;
      ws.getCell(`A${r}`).fill = BAND; ws.getCell(`A${r}`).font = bold;
    } else {
      ws.getCell(`A${r}`).value = Number(num);
      ws.getCell(`B${r}`).value = text;
      ws.getCell(`B${r}`).alignment = { wrapText: true };
      shade(ws.getCell(`C${r}`));
      ws.getCell(`D${r}`).value = unit;
      if (kind === 'jn') {
        list(ws.getCell(`C${r}`), ['Ja', 'Nein', 'Teilweise']);
        ws.getCell(`E${r}`).value = { formula: `IF(C${r}="Ja",2,IF(C${r}="Teilweise",1,0))` };
        scoreRows.push(r);
      }
      if (completed) ws.getCell(`C${r}`).value = kind === 'num' ? Number(answer) : answer;
      expected.push({ row: r, answerCell: `C${r}`, text });
    }
    r += 1;
  }
  r += 1;
  ws.getCell(`B${r}`).value = 'Gesamtpunktzahl';
  ws.getCell(`B${r}`).font = bold;
  ws.getCell(`E${r}`).value = { formula: `SUM(${scoreRows.map(x => `E${x}`).join(',')})` };
  r += 2;
  ws.getCell(`B${r}`).value = 'Ort, Datum: ____________________     Unterschrift: ____________________';
  return { wb, sheet: 'Fragebogen', expected };
}

// ---------------------------------------------------------------------------
// 07 — retailer form, wide layout: eight rows of instructions, questions in column C,
// supplier response in column F, a hidden "Buyer use only" column G with formulas over F,
// frozen panes, a category column with merged cells spanning several rows.
function build07(completed) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Supplier questionnaire');
  ws.columns = [{ width: 4 }, { width: 18 }, { width: 72 }, { width: 22 }, { width: 14 }, { width: 46 }, { width: 14 }];
  ws.mergeCells('B1:F1');
  ws.getCell('B1').value = 'RESPONSIBLE SOURCING — SUPPLIER INFORMATION REQUEST';
  ws.getCell('B1').font = { bold: true, size: 14 };
  const instr = [
    'This request is issued annually to all suppliers of own-brand goods.',
    'Complete column F only. Do not insert or delete rows. Do not change column headings.',
    'Where a figure is requested, give the figure for your most recent completed financial year.',
    'Where you cannot answer, write "Not available" and explain in the same cell.',
    'Return the completed file by email with your vendor number in the subject line.',
    'Questions marked * are mandatory.',
  ];
  instr.forEach((t, i) => { ws.mergeCells(`B${i + 3}:F${i + 3}`); ws.getCell(`B${i + 3}`).value = t; });
  ws.getRow(10).values = ['', 'Category', 'Question', 'Guidance', 'Mandatory', 'Supplier response', 'Buyer use only'];
  ws.getRow(10).font = bold;
  ws.views = [{ state: 'frozen', ySplit: 10 }];
  ws.getColumn('G').hidden = true;

  const cats = {
    'Company profile': [
      ['Vendor number', '*', 'As shown on your purchase orders', 'NRG-004417'],
      ['Ultimate parent company (if any)', '', '', 'None — independent'],
      ['Number of production sites supplying us', '*', '', '1'],
      ['Countries of production', '*', 'ISO country codes', 'DE'],
    ],
    'Policies': [
      ['Do you have a code of conduct covering labour and human rights?', '*', 'Yes/No; attach if yes', 'Yes'],
      ['Date of last review of the code of conduct', '', 'DD/MM/YYYY', '15/03/2025'],
      ['Do you have an environmental policy?', '*', 'Yes/No; attach if yes', 'Yes'],
      ['Do you have an anti-bribery policy?', '*', 'Yes/No', 'Yes'],
    ],
    'Environment': [
      ['Total energy consumption (MWh)', '*', 'Electricity + fuels', '3230'],
      ['Scope 1 emissions (tCO2e)', '', '', '268'],
      ['Scope 2 emissions (tCO2e)', '', 'Location-based', '993'],
      ['Percentage of packaging supplied to us that is recyclable', '*', 'By weight', '92'],
      ['Do you have any environmental certifications? List them with expiry dates.', '', '', 'ISO 14001 (06/2027)'],
    ],
    'Labour': [
      ['Total number of workers at sites supplying us', '*', 'Headcount incl. agency', '142'],
      ['Percentage of agency or temporary workers', '', '', '6'],
      ['Have any sites supplying us been audited against a social standard in the last 24 months? Give the standard and date.', '*', 'e.g. SMETA 4-pillar', 'Yes — SMETA 4-pillar, 11/2024'],
      ['Number of open non-conformances from that audit', '', '', '1'],
      ['Are workers free to leave employment with reasonable notice and without penalty?', '*', 'Yes/No', 'Yes'],
    ],
    'Supply chain': [
      ['Do you know the country of origin of your main raw materials?', '*', 'Yes/No/Partially', 'Partially'],
      ['Do you require your own suppliers to sign a code of conduct?', '', 'Yes/No', 'Yes'],
      ['Any further information you wish to provide', '', '', ''],
    ],
  };
  const expected = [];
  let r = 11;
  for (const [cat, qs] of Object.entries(cats)) {
    const start = r;
    for (const [text, mand, guide, answer] of qs) {
      ws.getCell(`C${r}`).value = text;
      ws.getCell(`C${r}`).alignment = { wrapText: true };
      ws.getCell(`D${r}`).value = guide;
      ws.getCell(`E${r}`).value = mand;
      shade(ws.getCell(`F${r}`));
      ws.getCell(`G${r}`).value = { formula: `IF(F${r}="","OPEN","RECEIVED")` };
      if (completed && answer) ws.getCell(`F${r}`).value = /^\d+$/.test(answer) ? Number(answer) : answer;
      expected.push({ row: r, answerCell: `F${r}`, text });
      r += 1;
    }
    ws.mergeCells(`B${start}:B${r - 1}`);
    ws.getCell(`B${start}`).value = cat;
    ws.getCell(`B${start}`).alignment = { vertical: 'top' };
    ws.getCell(`B${start}`).font = bold;
  }
  return { wb, sheet: 'Supplier questionnaire', expected };
}

// ---------------------------------------------------------------------------
// 01 completed twin: load the real retailer form and fill its shaded answer cells.
async function build01Completed() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path.join(FIX_DIR, '01-retailer-supplier-form.xlsx'));
  const ws = wb.getWorksheet('SUPPLIER FORM v3 FINAL ');
  const answers = {
    C8: 'NRG-004417', D9: 'A. Weber / Operations Manager',
    D13: 'Muster Technik GmbH', D14: 'Germany', C15: 142, C16: 'Yes', D18: '15/03/2025', C19: 'Yes',
    C21: 'X ISO 14001, X ISO 9001', D29: 'The Head of Operations holds formal accountability for sustainability and reports quarterly to the owners.',
    C33: 5, C34: 4, C35: 5, C36: 5, C39: 6, D40: 'One minor non-conformance (overtime records) raised in a 2024 customer audit; closed within 60 days by introducing electronic time recording.',
    C44: 'Yes', D45: 2025, C46: 1261, C47: 'No', C48: 3, C50: 'X Self-assessment questionnaire', D56: 'None.',
  };
  for (const [addr, v] of Object.entries(answers)) ws.getCell(addr).value = v;
  ws.getCell('B7').value = 'Return by: 30/09/2025';
  return wb;
}

// ---------------------------------------------------------------------------
const builders = [
  { id: '03-platform-offline-sheet', build: build03, source: 'Generated. Rating-platform style offline working copy: "Read me first" sheet, themed questionnaire with ID / question / options / YOUR ANSWER / comments / documents, merged theme bands, Yes/No/Partially dropdowns, hidden "Scoring" sheet with COUNTIF formulas over the answer cells, frozen header.', stresses: ['instructions sheet first', 'merged theme bands inside the table', 'dropdown answers', 'hidden sheet with formulas over answer cells', 'numeric and percentage questions', 'frozen panes'], twin: true },
  { id: '04-automotive-saq', build: build04, source: 'Generated. Automotive-style SAQ: hierarchical numbering (1.1, 1.1.1) prefixed inside the question cell, Yes/No/Partially dropdown in B, comment C, evidence D, italic guidance rows that are not questions, merged section rows, a "not applicable" checkbox row.', stresses: ['numbering inside the question text', 'sub-questions', 'guidance rows between questions', 'checkbox row', 'numeric question among Yes/No'], twin: true },
  { id: '05-multisheet-qa-form', build: build05, source: 'Generated. Four sheets (General / Environment / Social / Governance), two columns each; two sheets have a "Question | Answer" header, two start with a question on row 1; two answer cells are PRE-FILLED by the buyer and must not be overwritten; field-shaped and compound questions.', stresses: ['questions on multiple sheets', 'sheets without header row', 'pre-filled answer cells', 'field-shaped questions', 'compound questions'], twin: true },
  { id: '06-german-bank-form', build: build06, source: 'Generated. German bank SME form: Nr. / Frage / Antwort / Einheit / Punkte, Ja/Nein/Teilweise dropdowns, a visible score column with a formula per row and a SUM total, units in their own column, signature line.', stresses: ['German', 'formulas in a visible column next to answers', 'units column', 'numeric fields', 'total row and signature below the table'], twin: false },
  { id: '07-retailer-wide-layout', build: build07, source: 'Generated. Retailer information request: eight merged instruction rows above a header on row 10, category column with merged cells spanning several rows, question in C, guidance D, mandatory marker E, supplier response F, HIDDEN column G with IF formulas over F, frozen panes.', stresses: ['header far down the sheet', 'vertically merged category cells', 'answer column is not adjacent to the question column', 'hidden column with formulas over the answer cells', 'mandatory markers'], twin: true },
];

async function main() {
  fs.mkdirSync(FIX_DIR, { recursive: true });
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  const upsert = entry => {
    const i = manifest.fixtures.findIndex(f => f.id === entry.id);
    if (i >= 0) manifest.fixtures[i] = entry; else manifest.fixtures.push(entry);
  };

  for (const b of builders) {
    const { wb, sheet, expected } = b.build(false);
    const file = `fixtures/${b.id}.xlsx`;
    await wb.xlsx.writeFile(path.join(BENCH_DIR, file));
    upsert({ id: b.id, file, source: b.source, stresses: b.stresses, generated: true, sheet, answerCellsSignalledBy: 'fill FFF2CC + header where present', expected });
    console.log(`${b.id}: ${expected.length} questions`);

    if (b.twin) {
      const twin = b.build(true);
      const twinId = `${b.id}-completed-2025`;
      const twinFile = `fixtures/${twinId}.xlsx`;
      await twin.wb.xlsx.writeFile(path.join(BENCH_DIR, twinFile));
      upsert({ id: twinId, file: twinFile, completedTwinOf: b.id, source: `Completed twin of ${b.id}: same layout with the answer cells filled by plausible approved answers for reporting year 2025. Phase 3 input.`, stresses: ['answers present in the answer column'], generated: true, sheet, expected: twin.expected });
      console.log(`${twinId}: ${twin.expected.length} questions (answers filled)`);
    }
  }

  const twin01 = await build01Completed();
  await twin01.xlsx.writeFile(path.join(FIX_DIR, '01-retailer-supplier-form-completed-2025.xlsx'));
  const base01 = manifest.fixtures.find(f => f.id === '01-retailer-supplier-form');
  upsert({ id: '01-retailer-supplier-form-completed-2025', file: 'fixtures/01-retailer-supplier-form-completed-2025.xlsx', completedTwinOf: '01-retailer-supplier-form', source: 'Completed twin of the retailer form (loaded and filled with ExcelJS, so minor style normalisation is possible; it is an input fixture, not a round-trip fixture). Return date changed to 2025. Phase 3 input.', stresses: ['answers present in shaded cells that alternate C/D'], sheet: base01.sheet, mapping: base01.mapping, expected: base01.expected });
  console.log('01-retailer-supplier-form-completed-2025: filled');

  manifest.fixtures.sort((a, b) => a.id.localeCompare(b.id));
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`manifest: ${manifest.fixtures.length} fixtures`);
}

await main();
