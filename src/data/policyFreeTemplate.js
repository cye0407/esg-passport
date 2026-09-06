// ============================================
// Free-tier policy content
// ============================================
// The gate is at the FLOW level (see project_esg_passport_policy_builder):
//   Free  = one generic, editable template + one worked example (this file).
//   Paid  = the full guided builder (policyBuilders.js).
// We never wall content a free user has already built — free gets something
// real and usable; paid gets the higher-value guided experience.

// A generic, editable policy template — company/date auto-filled, the rest is
// bracketed guidance the user edits themselves. Mirrors the €347 Toolkit's
// BLANK_POLICY_TEMPLATE so free delivers a genuinely usable artifact.
//
// The German version is written, not translated: a supplier hands this to a
// German customer, so the bracketed prompts have to read like a German policy
// skeleton rather than an English one with German words in it.
export const genericTemplate = ({ company, today, lang }) => (lang === 'de'
  ? `[NAME DER RICHTLINIE — z. B. Richtlinie zum Wassermanagement]
${company} · Version 1.0 · Gültig ab ${today}

ZWECK & GELTUNGSBEREICH
[Welches Thema oder welche Auswirkung regelt diese Richtlinie, und für wen gilt sie?]

UNSERE ZUSAGEN
- [Zusage 1 — konkret und messbar]
- [Zusage 2 — konkret und messbar]
- [Zusage 3 — konkret und messbar]

UMSETZUNG & MASSNAHMEN
[Wie Sie das in die Praxis bringen — Schulung, Überwachung, Berichterstattung, Budget.]

VERANTWORTLICHKEITEN
- Geschäftsführung: [festlegen]
- Führungskräfte: [festlegen]
- Alle Beschäftigten: [festlegen]

ÜBERPRÜFUNG & FREIGABE
Diese Richtlinie wird [jährlich / alle zwei Jahre] überprüft.
Freigegeben von: [Name], [Funktion] — [JJJJ-MM-TT]
`
  : `[POLICY NAME — e.g. Water Management Policy]
${company} · Version 1.0 · Effective ${today}

PURPOSE & SCOPE
[What issue or impact does this policy address, and who does it apply to?]

OUR COMMITMENTS
- [Commitment 1 — a specific, measurable commitment]
- [Commitment 2 — a specific, measurable commitment]
- [Commitment 3 — a specific, measurable commitment]

IMPLEMENTATION & ACTIONS
[How you will put this into practice — training, monitoring, reporting, budget.]

RESPONSIBILITIES
- Senior leadership: [define]
- Managers: [define]
- All employees: [define]

REVIEW & APPROVAL
This policy is reviewed [annually / every two years].
Approved by: [Name], [Title] — [YYYY-MM-DD]
`);

// The single worked example shown to free users. It reuses the guided builder's
// own composers (see WORKED_EXAMPLE_ID/ANSWERS) so the example is exactly what
// the paid flow produces — an honest teaser, not marketing copy.
export const WORKED_EXAMPLE_ID = 'code_of_conduct';

// Two answer sets, because three of these fields are free text the user would
// have typed themselves: an English "their line manager or HR" dropped into the
// German composer would be the one visibly untranslated line in the example that
// is meant to sell the builder.
const WORKED_EXAMPLE_EN = {
  applies: ['all', 'contractors'],
  gifts: 'under50',
  report: 'compliance@example.com',
  coi: 'register',
  competition: true,
  harass: true,
  grievance: 'their line manager or HR',
  approver: 'A. Muster',
  title: 'Managing Director',
  cadence: 'Annually',
};

const WORKED_EXAMPLE_DE = {
  ...WORKED_EXAMPLE_EN,
  report: 'compliance@musterfirma.de',
  grievance: 'die Führungskraft oder die Personalabteilung',
  title: 'Geschäftsführerin',
};

export const workedExampleAnswers = (lang) => (lang === 'de' ? WORKED_EXAMPLE_DE : WORKED_EXAMPLE_EN);

// Kept for callers that don't know the language yet.
export const WORKED_EXAMPLE_ANSWERS = WORKED_EXAMPLE_EN;
