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
export const genericTemplate = ({ company, today }) => `[POLICY NAME — e.g. Water Management Policy]
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
`;

// The single worked example shown to free users. It reuses the guided builder's
// own composers (see WORKED_EXAMPLE_ID/ANSWERS) so the example is exactly what
// the paid flow produces — an honest teaser, not marketing copy.
export const WORKED_EXAMPLE_ID = 'code_of_conduct';
export const WORKED_EXAMPLE_ANSWERS = {
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
