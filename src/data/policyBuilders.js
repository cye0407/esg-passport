// ============================================
// Guided Policy Builders (mad-libs, not boilerplate)
// ============================================
// Ported from the 2026-07-19 UX prototype (policy-library-prototype.html).
// These power the premium guided policy builder: the user answers plain
// questions about decisions the business has ALREADY made, and their own
// specific policy composes live. No blank templates.
//
// Honesty rule (see the Passport positioning): saving is always a DRAFT and
// the unlocked questionnaire answer says "in development"; only ticking
// "adopted — leadership signed it" flips the answer to "Yes, we maintain…".
// The composers here never claim a policy the SME has not adopted.
//
// This module is framework-agnostic and pure: pass in { company, today } —
// nothing is hardcoded to a demo company, and there is no Date.now() at load.

// Join a list into readable prose: ["a"] -> "a"; ["a","b"] -> "a and b";
// ["a","b","c"] -> "a, b and c". Falsy entries are dropped.
export const joinList = (arr) => {
  const a = (arr || []).filter(Boolean);
  if (a.length < 2) return a[0] || '';
  return a.slice(0, -1).join(', ') + ' and ' + a.slice(-1);
};

// Shared sign-off section appended to every builder.
export const SIGN_SECTION = {
  eyebrow: 'Sign-off',
  questions: [
    {
      type: 'twin',
      items: [
        { key: 'approver', ph: 'Name' },
        { key: 'title', ph: 'Title — e.g. Managing Director' },
      ],
      ask: 'Who approves this policy?',
      para: 'approval',
    },
    {
      type: 'single',
      key: 'cadence',
      ask: 'How often will you review it?',
      para: 'approval',
      options: [
        { v: 'Annually', label: 'Annually' },
        { v: 'Every two years', label: 'Every two years' },
      ],
    },
  ],
};

// The review & approval paragraph, shared across builders.
export const approvalParagraph = (policyName, { today }) => ({
  id: 'approval',
  h: 'Review & approval',
  pending: 'Who signs it off and how often it’s reviewed.',
  fn: (s) =>
    s.approver && s.approver.trim()
      ? `This ${policyName} is reviewed ${(s.cadence || 'annually').toLowerCase()} and was approved by ${s.approver.trim()}${
          s.title && s.title.trim() ? `, ${s.title.trim()}` : ''
        }, effective ${today} (version 1.0).`
      : null,
});

// The honesty-driven questionnaire answer this builder unlocks.
// gate(s) === false  -> "" (not enough answered yet)
// adopted === true   -> "Yes. <company> maintains a <policy> …"
// adopted === false  -> "In development. <company> is finalizing …"
export const composeUnlock = (policyId, answers, adopted, { company, today }) => {
  const p = POLICY_BUILDERS[policyId];
  if (!p) return '';
  const s = answers || {};
  if (!p.gate(s)) return '';
  if (adopted) {
    return `Yes. ${company} maintains a ${p.name} (v1.0, effective ${today}) ${p.covers}${
      s.approver && s.approver.trim() ? `, approved by ${s.approver.trim()}` : ''
    }.`;
  }
  return `In development. ${company} is finalizing a ${p.name} ${p.covers}; a signed version is expected shortly. (draft — tick “adopted” once it’s signed)`;
};

// Compose the full policy document as an ordered list of paragraphs.
// Returns [{ id, h, text, pending }] where text === null means "not answered
// yet" (render the `pending` hint). Includes the shared approval paragraph.
export const composeParagraphs = (policyId, answers, ctx) => {
  const p = POLICY_BUILDERS[policyId];
  if (!p) return [];
  const s = answers || {};
  const paras = p.paras.concat(approvalParagraph(p.name, ctx));
  return paras.map((pa) => {
    const text = pa.fn(s, ctx);
    return { id: pa.id, h: pa.h, text: text || null, pending: pa.pending || '' };
  });
};

// Plain-text export of the composed document (for Download).
export const composePlainText = (policyId, answers, ctx) => {
  const p = POLICY_BUILDERS[policyId];
  if (!p) return '';
  const { company, today } = ctx;
  let out = `${p.name.toUpperCase()}\n${company} · v1.0 · Effective ${today}\n\n`;
  composeParagraphs(policyId, answers, ctx).forEach((pa) => {
    out += `${pa.h.toUpperCase()}\n${pa.text || '[ ' + (pa.pending || 'to complete') + ' ]'}\n\n`;
  });
  return out;
};

// Completion 0–100 for the progress bar (based on `required` keys).
export const completionPct = (policyId, answers) => {
  const p = POLICY_BUILDERS[policyId];
  if (!p) return 0;
  const s = answers || {};
  const done = p.required.filter((k) => {
    const v = s[k];
    return Array.isArray(v) ? v.length > 0 : v === true || (typeof v === 'string' && v.trim());
  }).length;
  return Math.round((100 * done) / p.required.length);
};

// ---------- the 9 builders ----------
// Each: { name, cat, flag, defaults, sections[], paras[], gate, covers, required[] }
// - sections: question groups shown on the left. Question types:
//     text | twin | toggle | single | multi
// - paras: composer fns (s, ctx) => string|null that build the live doc.
// - gate: (s) => bool — enough answered to unlock the questionnaire answer.
// - required: keys that count toward the progress bar.
export const POLICY_BUILDERS = {
  code_of_conduct: {
    name: 'Code of Conduct',
    cat: 'governance',
    flag: 'EcoVadis ev-24',
    defaults: { applies: ['all'], competition: true, harass: true, cadence: 'Annually' },
    sections: [
      {
        eyebrow: 'Who it covers',
        questions: [
          {
            type: 'multi',
            key: 'applies',
            ask: 'Who does this code apply to?',
            para: 'scope',
            options: [
              { v: 'all', label: 'All employees' },
              { v: 'contractors', label: 'Contractors' },
              { v: 'board', label: 'Board & management' },
            ],
          },
        ],
      },
      {
        eyebrow: 'Conflicts & competition',
        questions: [
          {
            type: 'single',
            key: 'coi',
            ask: 'How are conflicts of interest handled?',
            para: 'coi',
            options: [
              { v: 'disclose', label: 'Disclosed to a manager' },
              { v: 'approval', label: 'Disclosed & approved first' },
              { v: 'register', label: 'Recorded in a register' },
            ],
          },
          {
            type: 'toggle',
            key: 'competition',
            ask: 'Commit to fair competition & anti-trust?',
            opt: '— recommended',
            para: 'coi',
          },
        ],
      },
      {
        eyebrow: 'Respect at work',
        questions: [
          { type: 'toggle', key: 'harass', ask: 'Prohibit harassment & discrimination?', para: 'respect' },
          {
            type: 'text',
            key: 'grievance',
            ask: 'Who can staff raise a concern with?',
            opt: '— optional',
            para: 'respect',
            ph: 'e.g. their line manager or HR',
          },
        ],
      },
    ],
    paras: [
      {
        id: 'scope',
        h: 'Purpose & scope',
        pending: 'How the code applies across your company.',
        fn: (s, { company }) => {
          const m = { all: 'all employees', contractors: 'contractors', board: 'board members and management' };
          const a = (s.applies || []).map((v) => m[v]);
          return a.length
            ? `This Code of Conduct sets out how ${company} does business. It applies to ${joinList(a)}, and reflects our commitment to acting lawfully, ethically, and with integrity.`
            : null;
        },
      },
      {
        id: 'legal',
        h: 'Legal compliance',
        pending: '',
        fn: () =>
          `We conduct our business in full compliance with all applicable laws and regulations in the markets where we operate.`,
      },
      {
        id: 'ethics',
        h: 'Anti-corruption & bribery',
        pending: '',
        // Principle only — the operational detail (gifts, facilitation payments,
        // due diligence, reporting) lives in the standalone Anti-Corruption builder.
        fn: () =>
          'We maintain zero tolerance for bribery and corruption in all forms and comply with all applicable anti-bribery and anti-corruption laws.',
      },
      {
        id: 'coi',
        h: 'Conflicts of interest & fair competition',
        pending: 'How conflicts are handled and your competition commitment.',
        fn: (s) => {
          const b = [];
          if (s.coi)
            b.push(
              {
                disclose: 'Employees disclose any actual or potential conflicts of interest to their manager.',
                approval: 'Employees disclose any conflict of interest and obtain approval before proceeding.',
                register: 'Conflicts of interest are disclosed and recorded in our conflicts-of-interest register.',
              }[s.coi]
            );
          if (s.competition)
            b.push(
              'We compete fairly and comply with all applicable competition and anti-trust laws, including no price-fixing or market allocation.'
            );
          return b.length ? b.join(' ') : null;
        },
      },
      {
        id: 'respect',
        h: 'Respect & dignity',
        pending: 'Your commitment on harassment and raising concerns.',
        fn: (s) => {
          if (!s.harass && !(s.grievance && s.grievance.trim())) return null;
          let t = s.harass
            ? 'We treat colleagues, customers, and partners with respect. Harassment, discrimination, and abuse are prohibited.'
            : '';
          if (s.grievance && s.grievance.trim())
            t += `${t ? ' ' : ''}Concerns can be raised with ${s.grievance.trim()} without fear of retaliation.`;
          return t.trim();
        },
      },
    ],
    gate: (s) => !!s.coi,
    covers: 'covering standards of conduct, conflicts of interest and respect at work',
    required: ['applies', 'coi', 'harass', 'approver'],
  },

  anti_corruption: {
    name: 'Anti-Corruption & Anti-Bribery Policy',
    cat: 'governance',
    flag: 'EcoVadis ev-25',
    defaults: { facilitation: 'prohibited', cadence: 'Annually' },
    sections: [
      {
        eyebrow: 'Who must follow it',
        questions: [
          {
            type: 'multi',
            key: 'applies',
            ask: 'Who does this policy apply to?',
            para: 'purpose',
            options: [
              { v: 'all', label: 'All employees' },
              { v: 'contractors', label: 'Contractors' },
              { v: 'agents', label: 'Agents & intermediaries' },
              { v: 'board', label: 'Board & management' },
            ],
          },
        ],
      },
      {
        eyebrow: 'Gifts, hospitality & facilitation — read hardest by assessors',
        questions: [
          {
            type: 'single',
            key: 'gifts',
            ask: 'Can staff accept gifts or hospitality?',
            para: 'gifts',
            options: [
              { v: 'never', label: 'Never' },
              { v: 'under50', label: 'Only small ones (under €50)' },
              { v: 'approval', label: 'Only with written approval' },
            ],
          },
          {
            type: 'single',
            key: 'facilitation',
            ask: 'Facilitation payments?',
            para: 'gifts',
            options: [
              { v: 'prohibited', label: 'Prohibited in all cases' },
              { v: 'safety', label: 'Prohibited unless safety is at risk' },
            ],
          },
        ],
      },
      {
        eyebrow: 'Third parties & due diligence',
        questions: [
          {
            type: 'multi',
            key: 'duediligence',
            ask: 'How do you manage bribery risk with third parties?',
            para: 'duediligence',
            options: [
              { v: 'screening', label: 'Risk-based screening' },
              { v: 'clauses', label: 'Anti-corruption contract clauses' },
              { v: 'audit', label: 'Right to audit' },
            ],
          },
        ],
      },
      {
        eyebrow: 'Reporting & training',
        questions: [
          {
            type: 'text',
            key: 'report',
            ask: 'Where should someone report a concern?',
            para: 'reporting',
            ph: 'e.g. compliance@yourcompany.com',
          },
          {
            type: 'single',
            key: 'training',
            ask: 'Anti-corruption training?',
            para: 'reporting',
            options: [
              { v: 'induction', label: 'At induction' },
              { v: 'refresh', label: 'Induction + refreshers' },
            ],
          },
        ],
      },
    ],
    paras: [
      {
        id: 'purpose',
        h: 'Purpose & scope',
        pending: 'Who the policy applies to.',
        fn: (s, { company }) => {
          const m = {
            all: 'all employees',
            contractors: 'contractors',
            agents: 'agents and intermediaries acting on our behalf',
            board: 'board members and management',
          };
          const a = (s.applies || []).map((v) => m[v]);
          return a.length
            ? `This Anti-Corruption & Anti-Bribery Policy sets out how ${company} prevents bribery and corruption. It applies to ${joinList(a)}.`
            : null;
        },
      },
      {
        id: 'principle',
        h: 'Our commitment',
        pending: '',
        fn: () =>
          'We maintain zero tolerance for bribery and corruption in all forms — direct or indirect, in the public or private sector — and comply with all applicable anti-bribery and anti-corruption laws.',
      },
      {
        id: 'gifts',
        h: 'Gifts, hospitality & facilitation payments',
        pending: 'Your rules on gifts and facilitation payments.',
        fn: (s) => {
          if (!s.gifts) return null;
          const g = {
            never: 'Employees may not accept gifts or hospitality of any value.',
            under50:
              'Employees may accept only modest gifts or hospitality up to €50 in value; anything above requires prior written approval.',
            approval: 'Gifts and hospitality may only be accepted with prior written approval.',
          }[s.gifts];
          const f = {
            prohibited: 'Facilitation payments are prohibited in all circumstances.',
            safety:
              'Facilitation payments are prohibited, except where an employee’s personal safety is at immediate risk, in which case the payment must be reported as soon as possible afterwards.',
          }[s.facilitation || 'prohibited'];
          return `${g} ${f}`;
        },
      },
      {
        id: 'duediligence',
        h: 'Third-party due diligence',
        pending: 'How you manage third-party bribery risk.',
        fn: (s) => {
          const m = {
            screening: 'risk-based screening of agents, intermediaries and suppliers',
            clauses: 'anti-corruption clauses in our contracts',
            audit: 'a contractual right to audit and monitor third parties',
          };
          const a = (s.duediligence || []).map((v) => m[v]);
          return a.length ? `We manage third-party bribery risk through ${joinList(a)}.` : null;
        },
      },
      {
        id: 'reporting',
        h: 'Reporting & training',
        pending: 'How concerns are reported and staff are trained.',
        fn: (s) => {
          if (!(s.report && s.report.trim()) && !s.training) return null;
          let t =
            s.report && s.report.trim()
              ? `Suspected bribery or corruption can be reported to ${s.report.trim()} without fear of retaliation.`
              : '';
          const tr = {
            induction: 'Anti-corruption training is provided at induction.',
            refresh: 'Anti-corruption training is provided at induction and refreshed regularly.',
          }[s.training];
          if (tr) t += `${t ? ' ' : ''}${tr}`;
          return t.trim() || null;
        },
      },
    ],
    gate: (s) => !!s.gifts,
    covers: 'covering gifts and hospitality, facilitation payments, third-party due diligence and reporting',
    required: ['applies', 'gifts', 'facilitation', 'report', 'approver'],
  },

  whistleblowing: {
    name: 'Whistleblowing Policy',
    cat: 'governance',
    flag: 'EcoVadis ev-26',
    defaults: { retaliation: true, cadence: 'Annually' },
    sections: [
      {
        eyebrow: 'How concerns are raised',
        questions: [
          {
            type: 'multi',
            key: 'channels',
            ask: 'How can someone raise a concern?',
            para: 'channels',
            options: [
              { v: 'hotline', label: 'Hotline / web form' },
              { v: 'manager', label: 'Their manager' },
              { v: 'email', label: 'Dedicated email' },
              { v: 'ombuds', label: 'External ombudsperson' },
            ],
          },
          {
            type: 'multi',
            key: 'scope',
            ask: 'What kinds of concern are covered?',
            opt: '— pick the relevant ones',
            para: 'scope',
            options: [
              { v: 'fraud', label: 'Fraud / theft' },
              { v: 'safety', label: 'Safety violations' },
              { v: 'discrim', label: 'Discrimination' },
              { v: 'env', label: 'Environmental harm' },
            ],
          },
        ],
      },
      {
        eyebrow: 'Protection — the part that builds trust',
        questions: [
          {
            type: 'single',
            key: 'anon',
            ask: 'Can reports be made anonymously?',
            para: 'protection',
            options: [
              { v: 'anon', label: 'Yes, fully anonymous' },
              { v: 'confidential', label: 'Confidential, not anonymous' },
            ],
          },
          {
            type: 'toggle',
            key: 'retaliation',
            ask: 'Include a zero-tolerance-for-retaliation commitment?',
            para: 'protection',
          },
        ],
      },
      {
        eyebrow: 'What happens next',
        questions: [
          {
            type: 'single',
            key: 'ack',
            ask: 'How quickly do you acknowledge a report?',
            para: 'process',
            options: [
              { v: '48h', label: 'Within 48 hours' },
              { v: 'week', label: 'Within a week' },
            ],
          },
          {
            type: 'text',
            key: 'investigator',
            ask: 'Who investigates concerns?',
            para: 'process',
            ph: 'e.g. the Compliance Officer',
          },
        ],
      },
    ],
    paras: [
      {
        id: 'purpose',
        h: 'Purpose & scope',
        pending: '',
        fn: (s, { company }) =>
          `This Whistleblowing Policy explains how anyone working with ${company} can safely raise concerns about misconduct or wrongdoing, and the protections they receive.`,
      },
      {
        id: 'channels',
        h: 'How to raise a concern',
        pending: 'The channels people can use.',
        fn: (s) => {
          const m = {
            hotline: 'a confidential hotline or web form',
            manager: 'their line manager',
            email: 'a dedicated reporting email address',
            ombuds: 'an independent external ombudsperson',
          };
          const a = (s.channels || []).map((v) => m[v]);
          return a.length ? `Concerns can be raised through ${joinList(a)}.` : null;
        },
      },
      {
        id: 'scope',
        h: 'What can be reported',
        pending: 'The kinds of concern covered.',
        fn: (s) => {
          const m = {
            fraud: 'fraud or theft',
            safety: 'health & safety violations',
            discrim: 'discrimination or harassment',
            env: 'environmental harm',
          };
          const a = (s.scope || []).map((v) => m[v]);
          return a.length
            ? `Reportable concerns include ${joinList(a)}, and any breach of law or of our Code of Conduct.`
            : null;
        },
      },
      {
        id: 'protection',
        h: 'Confidentiality & protection',
        pending: 'Anonymity and non-retaliation.',
        fn: (s) => {
          if (!s.anon && !s.retaliation) return null;
          let t = s.anon ? `Reports may be made ${s.anon === 'anon' ? 'fully anonymously' : 'in confidence'}.` : '';
          if (s.retaliation)
            t += `${t ? ' ' : ''}We do not tolerate retaliation of any kind against someone who raises a concern in good faith.`;
          return t.trim();
        },
      },
      {
        id: 'process',
        h: 'How reports are handled',
        pending: 'Acknowledgement time and who investigates.',
        fn: (s) => {
          if (!s.ack && !(s.investigator && s.investigator.trim())) return null;
          const ak = { '48h': 'within 48 hours', week: 'within one week' }[s.ack];
          let t = ak ? `We aim to acknowledge every report ${ak}` : 'Every report is acknowledged';
          if (s.investigator && s.investigator.trim())
            t += `, and ${s.investigator.trim()} investigates it fairly and promptly`;
          return t + '.';
        },
      },
    ],
    gate: (s) => (s.channels || []).length > 0,
    covers: 'covering reporting channels, whistleblower protection and investigation',
    required: ['channels', 'anon', 'retaliation', 'investigator', 'approver'],
  },

  data_privacy: {
    name: 'Data Privacy Policy',
    cat: 'governance',
    flag: 'EcoVadis ev-27',
    defaults: { regime: 'gdpr', cadence: 'Annually' },
    sections: [
      {
        eyebrow: 'Whose data & under which law',
        questions: [
          {
            type: 'multi',
            key: 'subjects',
            ask: 'Whose personal data do you handle?',
            para: 'data',
            options: [
              { v: 'employees', label: 'Employees' },
              { v: 'customers', label: 'Customers' },
              { v: 'suppliers', label: 'Suppliers' },
              { v: 'visitors', label: 'Website visitors' },
            ],
          },
          {
            type: 'single',
            key: 'regime',
            ask: 'Which data-protection law applies?',
            para: 'purpose',
            options: [
              { v: 'gdpr', label: 'EU GDPR' },
              { v: 'gdpruk', label: 'EU + UK GDPR' },
              { v: 'other', label: 'Other' },
            ],
          },
        ],
      },
      {
        eyebrow: 'How you protect it',
        questions: [
          {
            type: 'multi',
            key: 'security',
            ask: 'What safeguards are in place?',
            para: 'security',
            options: [
              { v: 'access', label: 'Access controls' },
              { v: 'encryption', label: 'Encryption' },
              { v: 'training', label: 'Staff training' },
              { v: 'vendors', label: 'Vendor agreements' },
            ],
          },
        ],
      },
      {
        eyebrow: 'Rights, retention & breaches',
        questions: [
          {
            type: 'text',
            key: 'contact',
            ask: 'How do people exercise their data rights?',
            para: 'rights',
            ph: 'e.g. email privacy@yourcompany.com',
          },
          {
            type: 'single',
            key: 'retention',
            ask: 'How long do you keep personal data?',
            para: 'rights',
            options: [
              { v: 'need', label: 'Only as long as needed' },
              { v: 'schedule', label: 'Set retention schedule' },
            ],
          },
          {
            type: 'multi',
            key: 'breach',
            ask: 'On a data breach, you will…',
            para: 'breach',
            options: [
              { v: 'authority', label: 'Notify the authority (72h)' },
              { v: 'affected', label: 'Inform affected people' },
            ],
          },
        ],
      },
    ],
    paras: [
      {
        id: 'purpose',
        h: 'Purpose & scope',
        pending: '',
        fn: (s, { company }) => {
          const r = {
            gdpr: 'the EU General Data Protection Regulation (GDPR)',
            gdpruk: 'the EU and UK GDPR',
            other: 'applicable data-protection law',
          }[s.regime || 'gdpr'];
          return `This Data Privacy Policy sets out how ${company} protects personal data and meets its obligations under ${r}.`;
        },
      },
      {
        id: 'data',
        h: 'Data we process',
        pending: 'Whose personal data you handle.',
        fn: (s) => {
          const m = { employees: 'employees', customers: 'customers', suppliers: 'suppliers', visitors: 'website visitors' };
          const a = (s.subjects || []).map((v) => m[v]);
          return a.length
            ? `We collect and process personal data belonging to ${joinList(a)}, only for legitimate business purposes.`
            : null;
        },
      },
      {
        id: 'security',
        h: 'How we protect it',
        pending: 'Your technical and organizational safeguards.',
        fn: (s) => {
          const m = {
            access: 'role-based access controls',
            encryption: 'encryption of sensitive data',
            training: 'regular staff data-protection training',
            vendors: 'data-processing agreements with our vendors',
          };
          const a = (s.security || []).map((v) => m[v]);
          return a.length ? `We safeguard this data through ${joinList(a)}.` : null;
        },
      },
      {
        id: 'rights',
        h: 'Your rights & retention',
        pending: 'How people access their data and how long you keep it.',
        fn: (s) => {
          if (!(s.contact && s.contact.trim()) && !s.retention) return null;
          let t =
            s.contact && s.contact.trim()
              ? `Individuals can access, correct, or delete their personal data by contacting ${s.contact.trim()}.`
              : '';
          if (s.retention)
            t += `${t ? ' ' : ''}We retain personal data ${
              s.retention === 'need'
                ? 'only as long as necessary for the purpose it was collected'
                : 'according to a defined retention schedule'
            }.`;
          return t.trim();
        },
      },
      {
        id: 'breach',
        h: 'Data breaches',
        pending: 'What you do if data is breached.',
        fn: (s) => {
          const m = {
            authority: 'notify the relevant supervisory authority within 72 hours',
            affected: 'inform affected individuals without undue delay',
          };
          const a = (s.breach || []).map((v) => m[v]);
          return a.length ? `If a personal-data breach occurs, we will ${joinList(a)}.` : null;
        },
      },
    ],
    gate: (s) => (s.subjects || []).length > 0,
    covers: 'covering data security, individual rights and breach response',
    required: ['subjects', 'security', 'contact', 'breach', 'approver'],
  },

  supplier_coc: {
    name: 'Supplier Code of Conduct',
    cat: 'governance',
    flag: 'EcoVadis ev-29',
    defaults: { cadence: 'Annually' },
    sections: [
      {
        eyebrow: 'Who it applies to',
        questions: [
          {
            type: 'single',
            key: 'who',
            ask: 'Which suppliers must follow it?',
            para: 'purpose',
            options: [
              { v: 'all', label: 'All suppliers' },
              { v: 'threshold', label: 'Above a spend threshold' },
              { v: 'critical', label: 'Critical suppliers' },
            ],
          },
        ],
      },
      {
        eyebrow: 'What you require',
        questions: [
          {
            type: 'multi',
            key: 'labor',
            ask: 'Labour standards required of suppliers?',
            para: 'labor',
            options: [
              { v: 'child', label: 'No child / forced labour' },
              { v: 'wages', label: 'Fair wages & hours' },
              { v: 'assoc', label: 'Freedom of association' },
              { v: 'safe', label: 'Safe conditions' },
            ],
          },
          {
            type: 'single',
            key: 'env',
            ask: 'Environmental expectation?',
            para: 'env',
            options: [
              { v: 'comply', label: 'Comply with the law' },
              { v: 'reduce', label: 'Comply + actively reduce impact' },
            ],
          },
          {
            type: 'multi',
            key: 'ethics',
            ask: 'Ethics requirements?',
            para: 'ethics',
            options: [
              { v: 'anticorruption', label: 'Anti-corruption' },
              { v: 'coi', label: 'No conflicts of interest' },
              { v: 'records', label: 'Accurate records' },
            ],
          },
        ],
      },
      {
        eyebrow: 'How you enforce it',
        questions: [
          {
            type: 'multi',
            key: 'checks',
            ask: 'How do you verify compliance?',
            para: 'enforcement',
            options: [
              { v: 'saq', label: 'Self-assessment' },
              { v: 'audit', label: 'Audits' },
              { v: 'certs', label: 'Certifications required' },
            ],
          },
          {
            type: 'single',
            key: 'breach',
            ask: 'If a supplier falls short?',
            para: 'enforcement',
            options: [
              { v: 'capa', label: 'Corrective action plan' },
              { v: 'terminate', label: 'Right to terminate' },
            ],
          },
        ],
      },
    ],
    paras: [
      {
        id: 'purpose',
        h: 'Purpose & scope',
        pending: '',
        fn: (s, { company }) => {
          const w =
            {
              all: 'all suppliers and their subcontractors',
              threshold: 'suppliers above a defined spend threshold',
              critical: 'critical and higher-risk suppliers',
            }[s.who] || 'its suppliers';
          return `This Supplier Code of Conduct sets out the standards ${company} expects from ${w}. It reflects our commitment to a responsible supply chain.`;
        },
      },
      {
        id: 'labor',
        h: 'Labour & human rights',
        pending: 'The labour standards you require.',
        fn: (s) => {
          const m = {
            child: 'no child or forced labour',
            wages: 'fair wages and reasonable working hours',
            assoc: 'freedom of association',
            safe: 'safe and healthy working conditions',
          };
          const a = (s.labor || []).map((v) => m[v]);
          return a.length ? `Suppliers must uphold ${joinList(a)}, consistent with core ILO labour standards.` : null;
        },
      },
      {
        id: 'env',
        h: 'Environmental standards',
        pending: 'Your environmental expectation.',
        fn: (s) => {
          if (!s.env) return null;
          return `Suppliers must ${
            s.env === 'comply'
              ? 'comply with all applicable environmental laws and regulations'
              : 'comply with all applicable environmental laws and take active steps to reduce their environmental impact'
          }.`;
        },
      },
      {
        id: 'ethics',
        h: 'Business ethics',
        pending: 'The ethics requirements.',
        fn: (s) => {
          const m = {
            anticorruption: 'anti-corruption and anti-bribery practices',
            coi: 'freedom from conflicts of interest',
            records: 'accurate and honest record-keeping',
          };
          const a = (s.ethics || []).map((v) => m[v]);
          return a.length ? `Suppliers must maintain ${joinList(a)}.` : null;
        },
      },
      {
        id: 'enforcement',
        h: 'Monitoring & remediation',
        pending: 'How you check and enforce compliance.',
        fn: (s) => {
          const m = {
            saq: 'a self-assessment questionnaire',
            audit: 'on-site or third-party audits',
            certs: 'recognised certifications',
          };
          const a = (s.checks || []).map((v) => m[v]);
          let t = a.length ? `We verify compliance through ${joinList(a)}` : '';
          if (s.breach) {
            const b =
              s.breach === 'capa'
                ? 'we agree a corrective action plan with the supplier'
                : 'we reserve the right to end the relationship';
            t += t ? `, and where standards are not met ${b}` : `Where standards are not met ${b}`;
          }
          return t ? t + '.' : null;
        },
      },
    ],
    gate: (s) => (s.labor || []).length > 0,
    covers: 'covering labour, environmental and ethics standards for suppliers',
    required: ['who', 'labor', 'env', 'ethics', 'checks', 'approver'],
  },

  health_safety: {
    name: 'Health & Safety Policy',
    cat: 'social',
    flag: 'EcoVadis ev-19',
    defaults: { ppe: true, cadence: 'Annually' },
    sections: [
      {
        eyebrow: 'Who it protects',
        questions: [
          {
            type: 'multi',
            key: 'who',
            ask: 'Who does this policy protect?',
            para: 'purpose',
            options: [
              { v: 'employees', label: 'Employees' },
              { v: 'contractors', label: 'Contractors' },
              { v: 'visitors', label: 'Visitors' },
            ],
          },
        ],
      },
      {
        eyebrow: 'Keeping people safe',
        questions: [
          {
            type: 'single',
            key: 'risk',
            ask: 'How do you manage workplace risks?',
            para: 'safe',
            options: [
              { v: 'assess', label: 'Regular risk assessments' },
              { v: 'method', label: 'Assessments + safe methods' },
              { v: 'iso', label: 'Certified system (ISO 45001)' },
            ],
          },
          { type: 'toggle', key: 'ppe', ask: 'Provide PPE and maintain equipment?', para: 'safe' },
        ],
      },
      {
        eyebrow: 'When something happens',
        questions: [
          {
            type: 'single',
            key: 'accidents',
            ask: 'How are accidents handled?',
            para: 'accidents',
            options: [
              { v: 'report', label: 'Reported & recorded' },
              { v: 'investigate', label: 'Reported, investigated & fixed' },
            ],
          },
          {
            type: 'multi',
            key: 'emergency',
            ask: 'Emergency readiness?',
            para: 'emergency',
            options: [
              { v: 'fire', label: 'Fire & evacuation' },
              { v: 'firstaid', label: 'First aid' },
              { v: 'wardens', label: 'Trained wardens' },
            ],
          },
        ],
      },
      {
        eyebrow: 'Training & wellbeing',
        questions: [
          {
            type: 'single',
            key: 'training',
            ask: 'Safety training?',
            para: 'training',
            options: [
              { v: 'induction', label: 'At induction' },
              { v: 'refresh', label: 'Induction + refreshers' },
            ],
          },
          {
            type: 'text',
            key: 'wellbeing',
            ask: 'Any wellbeing support?',
            opt: '— optional',
            para: 'wellbeing',
            ph: 'e.g. an employee assistance programme',
          },
        ],
      },
    ],
    paras: [
      {
        id: 'purpose',
        h: 'Purpose & scope',
        pending: 'Who the policy protects.',
        fn: (s, { company }) => {
          const m = { employees: 'employees', contractors: 'contractors', visitors: 'visitors' };
          const a = (s.who || []).map((v) => m[v]);
          return a.length
            ? `This Health & Safety Policy sets out how ${company} protects the health, safety, and wellbeing of ${joinList(a)} at work.`
            : null;
        },
      },
      {
        id: 'safe',
        h: 'Managing risk',
        pending: 'How you control hazards.',
        fn: (s) => {
          if (!s.risk && !s.ppe) return null;
          const r = {
            assess: 'regular risk assessments',
            method: 'regular risk assessments and documented safe methods of work',
            iso: 'a certified health & safety management system aligned with ISO 45001',
          }[s.risk];
          let t = r ? `We identify and control workplace hazards through ${r}.` : '';
          if (s.ppe)
            t += `${t ? ' ' : ''}We provide appropriate personal protective equipment and keep work equipment properly maintained.`;
          return t.trim();
        },
      },
      {
        id: 'accidents',
        h: 'Accidents & incidents',
        pending: 'How incidents are handled.',
        fn: (s) =>
          ({
            report: 'All accidents and near-misses are reported and recorded.',
            investigate:
              'All accidents and near-misses are reported, investigated, and their root causes addressed to prevent recurrence.',
          }[s.accidents] || null),
      },
      {
        id: 'emergency',
        h: 'Emergency preparedness',
        pending: 'Your emergency provisions.',
        fn: (s) => {
          const m = {
            fire: 'fire detection and evacuation procedures',
            firstaid: 'trained first-aiders and first-aid provision',
            wardens: 'trained fire wardens',
          };
          const a = (s.emergency || []).map((v) => m[v]);
          return a.length ? `We maintain ${joinList(a)}.` : null;
        },
      },
      {
        id: 'training',
        h: 'Training & awareness',
        pending: 'When safety training happens.',
        fn: (s) =>
          ({
            induction: 'Health & safety training is provided at induction.',
            refresh: 'Health & safety training is provided at induction and refreshed regularly.',
          }[s.training] || null),
      },
      {
        id: 'wellbeing',
        h: 'Worker wellbeing',
        pending: '',
        fn: (s) => (s.wellbeing && s.wellbeing.trim() ? `We support worker wellbeing through ${s.wellbeing.trim()}.` : null),
      },
    ],
    gate: (s) => !!s.risk,
    covers: 'covering risk control, incident response and emergency preparedness',
    required: ['who', 'risk', 'accidents', 'emergency', 'approver'],
  },

  equal_opp: {
    name: 'Equal Opportunity Policy',
    cat: 'social',
    flag: 'EcoVadis ev-22',
    defaults: { pay: true, cadence: 'Annually' },
    sections: [
      {
        eyebrow: 'Where it applies',
        questions: [
          {
            type: 'multi',
            key: 'areas',
            ask: 'Where does it apply?',
            para: 'purpose',
            options: [
              { v: 'hiring', label: 'Hiring' },
              { v: 'paypromo', label: 'Pay & promotion' },
              { v: 'training', label: 'Training' },
              { v: 'daily', label: 'Everyday treatment' },
            ],
          },
        ],
      },
      {
        eyebrow: 'Non-discrimination',
        questions: [
          {
            type: 'single',
            key: 'nondiscrim',
            ask: 'How far does your commitment go?',
            para: 'nondiscrim',
            options: [
              { v: 'legal', label: 'Legally protected grounds' },
              { v: 'beyond', label: 'Beyond legal minimums too' },
            ],
          },
        ],
      },
      {
        eyebrow: 'Fairness in practice',
        questions: [
          {
            type: 'single',
            key: 'hiring',
            ask: 'Fair hiring approach?',
            para: 'hiring',
            options: [
              { v: 'merit', label: 'Merit-based' },
              { v: 'structured', label: 'Merit + diverse pools & structured interviews' },
            ],
          },
          { type: 'toggle', key: 'pay', ask: 'Commit to equal pay & pay reviews?', para: 'pay' },
        ],
      },
      {
        eyebrow: 'Culture & concerns',
        questions: [
          {
            type: 'multi',
            key: 'culture',
            ask: 'Inclusive-culture actions?',
            para: 'culture',
            options: [
              { v: 'accom', label: 'Reasonable accommodations' },
              { v: 'harass', label: 'Anti-harassment' },
              { v: 'train', label: 'Inclusion training' },
            ],
          },
          {
            type: 'text',
            key: 'grievance',
            ask: 'How are discrimination concerns raised?',
            para: 'culture',
            ph: 'e.g. with HR or a line manager',
          },
        ],
      },
    ],
    paras: [
      {
        id: 'purpose',
        h: 'Purpose & scope',
        pending: 'Where the policy applies.',
        fn: (s, { company }) => {
          const m = {
            hiring: 'recruitment',
            paypromo: 'pay and promotion',
            training: 'training and development',
            daily: 'everyday treatment at work',
          };
          const a = (s.areas || []).map((v) => m[v]);
          return a.length
            ? `This Equal Opportunity Policy sets out ${company}'s commitment to fair, inclusive treatment across ${joinList(a)}.`
            : null;
        },
      },
      {
        id: 'nondiscrim',
        h: 'Non-discrimination',
        pending: 'How far your commitment goes.',
        fn: (s) =>
          ({
            legal:
              'We do not tolerate discrimination on any legally protected ground, including age, gender, race, religion, disability, or sexual orientation.',
            beyond:
              'We do not tolerate discrimination on any legally protected ground — age, gender, race, religion, disability, or sexual orientation — and extend the same fairness beyond legal minimums, including to social background and caring responsibilities.',
          }[s.nondiscrim] || null),
      },
      {
        id: 'hiring',
        h: 'Fair hiring & progression',
        pending: 'Your hiring approach.',
        fn: (s) =>
          ({
            merit: 'Recruitment and promotion decisions are based on merit and ability.',
            structured:
              'Recruitment and promotion decisions are based on merit and ability, supported by diverse candidate pools and structured, bias-aware interviews.',
          }[s.hiring] || null),
      },
      {
        id: 'pay',
        h: 'Equal pay',
        pending: '',
        fn: (s) =>
          s.pay
            ? 'We are committed to equal pay for equal work, and review pay periodically to identify and close unjustified gaps.'
            : null,
      },
      {
        id: 'culture',
        h: 'Inclusive culture',
        pending: 'Your culture actions.',
        fn: (s) => {
          const m = {
            accom: 'reasonable accommodations for disability and diverse needs',
            harass: 'a clear anti-harassment stance',
            train: 'inclusion and awareness training',
          };
          const a = (s.culture || []).map((v) => m[v]);
          let t = a.length ? `We foster an inclusive culture through ${joinList(a)}.` : '';
          if (s.grievance && s.grievance.trim())
            t += `${t ? ' ' : ''}Concerns about discrimination can be raised ${s.grievance.trim()}.`;
          return t.trim() || null;
        },
      },
    ],
    gate: (s) => !!s.nondiscrim,
    covers: 'covering non-discrimination, fair hiring and equal pay',
    required: ['areas', 'nondiscrim', 'hiring', 'pay', 'approver'],
  },

  environmental: {
    name: 'Environmental Policy',
    cat: 'environmental',
    flag: '',
    defaults: { pollution: true, cadence: 'Annually' },
    sections: [
      {
        eyebrow: 'What it covers',
        questions: [
          {
            type: 'multi',
            key: 'areas',
            ask: 'Which impacts does it cover?',
            para: 'purpose',
            options: [
              { v: 'carbon', label: 'Energy & carbon' },
              { v: 'waste', label: 'Waste' },
              { v: 'water', label: 'Water' },
              { v: 'pollution', label: 'Pollution' },
            ],
          },
        ],
      },
      {
        eyebrow: 'Climate & energy',
        questions: [
          {
            type: 'single',
            key: 'climate',
            ask: 'Carbon commitment?',
            para: 'climate',
            options: [
              { v: 'measure', label: 'Measure our footprint' },
              { v: 'target', label: 'Measure + reduction target' },
            ],
          },
          {
            type: 'multi',
            key: 'energy',
            ask: 'Energy approach?',
            para: 'energy',
            options: [
              { v: 'efficiency', label: 'Improve efficiency' },
              { v: 'renewables', label: 'Move to renewables' },
            ],
          },
        ],
      },
      {
        eyebrow: 'Resources & pollution',
        questions: [
          {
            type: 'single',
            key: 'waste',
            ask: 'Waste approach?',
            para: 'waste',
            options: [
              { v: 'reduce', label: 'Reduce & recycle' },
              { v: 'plastics', label: 'Reduce, recycle & cut plastics' },
            ],
          },
          {
            type: 'toggle',
            key: 'pollution',
            ask: 'Prevent pollution & handle hazardous materials responsibly?',
            para: 'pollution',
          },
        ],
      },
      {
        eyebrow: 'Responsibility',
        questions: [
          {
            type: 'text',
            key: 'owner',
            ask: 'Who owns environmental performance?',
            para: 'responsibility',
            ph: 'e.g. the Operations Manager',
          },
        ],
      },
    ],
    paras: [
      {
        id: 'purpose',
        h: 'Purpose & scope',
        pending: 'Which impacts it covers.',
        fn: (s, { company }) => {
          const m = { carbon: 'energy and carbon', waste: 'waste', water: 'water', pollution: 'pollution' };
          const a = (s.areas || []).map((v) => m[v]);
          return a.length
            ? `This Environmental Policy sets out how ${company} minimizes its environmental impact across ${joinList(a)}.`
            : null;
        },
      },
      {
        id: 'climate',
        h: 'Climate action',
        pending: 'Your carbon commitment.',
        fn: (s) =>
          ({
            measure: 'We measure our greenhouse-gas footprint and report on it annually.',
            target:
              'We measure our greenhouse-gas footprint, report annually, and have committed to a reduction target.',
          }[s.climate] || null),
      },
      {
        id: 'energy',
        h: 'Energy management',
        pending: 'Your energy approach.',
        fn: (s) => {
          const m = {
            efficiency: 'improving energy efficiency across our operations',
            renewables: 'increasing the share of renewable energy we use',
          };
          const a = (s.energy || []).map((v) => m[v]);
          return a.length ? `We are committed to ${joinList(a)}.` : null;
        },
      },
      {
        id: 'waste',
        h: 'Resource use & waste',
        pending: 'Your waste approach.',
        fn: (s) =>
          ({
            reduce: 'We reduce waste and recycle wherever practical.',
            plastics: 'We reduce waste, recycle wherever practical, and are phasing out single-use plastics.',
          }[s.waste] || null),
      },
      {
        id: 'pollution',
        h: 'Pollution prevention',
        pending: '',
        fn: (s) =>
          s.pollution
            ? 'We prevent pollution of air, water, and soil, and handle and dispose of hazardous materials responsibly and in line with regulations.'
            : null,
      },
      {
        id: 'responsibility',
        h: 'Responsibility',
        pending: '',
        fn: (s) =>
          s.owner && s.owner.trim()
            ? `Day-to-day responsibility for environmental performance sits with ${s.owner.trim()}.`
            : null,
      },
    ],
    gate: (s) => !!s.climate,
    covers: 'covering climate, energy, waste and pollution',
    required: ['areas', 'climate', 'energy', 'waste', 'approver'],
  },

  training: {
    name: 'Training & Development Policy',
    cat: 'social',
    flag: '',
    defaults: { equal: true, cadence: 'Annually' },
    sections: [
      {
        eyebrow: 'The commitment',
        questions: [
          {
            type: 'text',
            key: 'hours',
            ask: 'Minimum training per employee per year?',
            para: 'commit',
            ph: 'e.g. at least 16 hours',
          },
          {
            type: 'multi',
            key: 'types',
            ask: 'What kinds of training?',
            para: 'commit',
            options: [
              { v: 'technical', label: 'Technical / job skills' },
              { v: 'safety', label: 'Health & safety' },
              { v: 'soft', label: 'Soft skills' },
              { v: 'compliance', label: 'Compliance' },
            ],
          },
        ],
      },
      {
        eyebrow: 'Investment & access',
        questions: [
          {
            type: 'single',
            key: 'budget',
            ask: 'How is training funded?',
            para: 'budget',
            options: [
              { v: 'budget', label: 'Dedicated training budget' },
              { v: 'external', label: 'Budget + external courses funded' },
            ],
          },
          { type: 'toggle', key: 'equal', ask: 'Equal access for all roles & levels?', para: 'access' },
        ],
      },
      {
        eyebrow: 'Development',
        questions: [
          {
            type: 'single',
            key: 'dev',
            ask: 'How does training link to growth?',
            para: 'dev',
            options: [
              { v: 'reviews', label: 'Through performance reviews' },
              { v: 'plans', label: 'Reviews + development plans' },
            ],
          },
        ],
      },
    ],
    paras: [
      {
        id: 'commit',
        h: 'Our training commitment',
        pending: 'Training hours and types.',
        fn: (s) => {
          let t = s.hours && s.hours.trim() ? `We provide ${s.hours.trim()} of training per employee each year` : '';
          const m = { technical: 'technical and job skills', safety: 'health & safety', soft: 'soft skills', compliance: 'compliance' };
          const a = (s.types || []).map((v) => m[v]);
          if (a.length) t += `${t ? ', covering ' : 'We provide training covering '}${joinList(a)}`;
          return t ? t + '.' : null;
        },
      },
      {
        id: 'budget',
        h: 'Investment',
        pending: 'How training is funded.',
        fn: (s) =>
          ({
            budget: 'Training is supported by a dedicated annual budget.',
            external: 'Training is supported by a dedicated annual budget, including funding for relevant external courses.',
          }[s.budget] || null),
      },
      {
        id: 'access',
        h: 'Equal access',
        pending: '',
        fn: (s) =>
          s.equal ? 'All employees have equal access to development opportunities, regardless of role or level.' : null,
      },
      {
        id: 'dev',
        h: 'Development & performance',
        pending: 'How training connects to growth.',
        fn: (s) =>
          ({
            reviews: 'Training needs are identified through regular performance reviews.',
            plans:
              'Training needs are identified through regular performance reviews and captured in individual development plans.',
          }[s.dev] || null),
      },
    ],
    gate: (s) => !!(s.hours && s.hours.trim()) || (s.types || []).length > 0,
    covers: 'covering training hours, investment and development',
    required: ['types', 'budget', 'dev', 'equal', 'approver'],
  },

  blank: {
    name: 'Custom Policy',
    cat: 'governance',
    flag: 'any topic',
    defaults: { cadence: 'Annually' },
    sections: [
      {
        eyebrow: 'The basics',
        questions: [
          {
            type: 'text',
            key: 'topic',
            ask: 'What is this policy about?',
            para: 'purpose',
            ph: 'e.g. Water Management, Biodiversity, AI Use',
          },
          {
            type: 'text',
            key: 'applies',
            ask: 'Who does it apply to?',
            para: 'purpose',
            ph: 'e.g. all employees and contractors',
          },
        ],
      },
      {
        eyebrow: 'Your commitments',
        questions: [
          { type: 'text', key: 'c1', ask: 'Commitment 1', para: 'commit', ph: 'a specific, measurable commitment' },
          { type: 'text', key: 'c2', ask: 'Commitment 2', opt: '— optional', para: 'commit', ph: 'another commitment' },
          { type: 'text', key: 'c3', ask: 'Commitment 3', opt: '— optional', para: 'commit', ph: 'another commitment' },
        ],
      },
      {
        eyebrow: 'Ownership',
        questions: [
          { type: 'text', key: 'owner', ask: 'Who is responsible for it?', para: 'responsibility', ph: 'e.g. the Operations Manager' },
        ],
      },
    ],
    paras: [
      {
        id: 'purpose',
        h: 'Purpose & scope',
        pending: 'What the policy covers and who it applies to.',
        fn: (s, { company }) => {
          if (!(s.topic && s.topic.trim())) return null;
          const who = s.applies && s.applies.trim() ? s.applies.trim() : 'all employees';
          return `This ${s.topic.trim()} Policy sets out ${company}'s commitments on ${s.topic.trim().toLowerCase()}. It applies to ${who}.`;
        },
      },
      {
        id: 'commit',
        h: 'Our commitments',
        pending: 'Your specific commitments.',
        fn: (s) => {
          const a = [s.c1, s.c2, s.c3].map((x) => (x && x.trim() ? x.trim() : null)).filter(Boolean);
          if (!a.length) return null;
          return a.map((x) => x.replace(/\.$/, '') + '.').join(' ');
        },
      },
      {
        id: 'responsibility',
        h: 'Responsibility',
        pending: '',
        fn: (s) => (s.owner && s.owner.trim() ? `Day-to-day responsibility sits with ${s.owner.trim()}.` : null),
      },
    ],
    gate: (s) => !!(s.topic && s.topic.trim()),
    covers: 'covering your stated commitments on this topic',
    required: ['topic', 'c1', 'owner', 'approver'],
  },
};

// Ordered list of builder ids (governance → social → environmental → custom last).
export const BUILDER_ORDER = [
  'code_of_conduct',
  'anti_corruption',
  'whistleblowing',
  'data_privacy',
  'supplier_coc',
  'health_safety',
  'equal_opp',
  'environmental',
  'training',
  'blank',
];

// Metadata for a builder (name/category/flag) without pulling the whole def.
export const builderMeta = (id) => {
  const p = POLICY_BUILDERS[id];
  return p ? { id, name: p.name, cat: p.cat, flag: p.flag } : null;
};

// Best-effort map from a questionnaire POLICY question (its text + category) to a
// guided builder id, for the Respond "Build this policy" deep-link. Returns null
// if nothing matches (caller falls back to the library). Order matters: more
// specific patterns first (supplier before generic conduct; environmental last).
export const matchBuilderId = (text) => {
  const s = (text || '').toLowerCase();
  const rules = [
    [/supplier.*(code|conduct)|supply.?chain.*(code|conduct)/, 'supplier_coc'],
    [/anti[-\s]?bribery|anti[-\s]?corruption|\bbribery\b|\bcorruption\b|facilitation payment/, 'anti_corruption'],
    [/code of conduct|business ethics/, 'code_of_conduct'],
    [/whistle\s?bl|grievance|raise.*concern|report.*(concern|misconduct)|speak.?up/, 'whistleblowing'],
    [/data (privacy|protection)|gdpr|personal data/, 'data_privacy'],
    [/health.*safety|occupational|\bohs\b|iso ?45001/, 'health_safety'],
    [/equal opportunit|discriminat|diversity|inclusion|\bdei\b|equal pay/, 'equal_opp'],
    [/training|development|upskill/, 'training'],
    [/environment/, 'environmental'],
  ];
  for (const [re, id] of rules) if (re.test(s)) return id;
  return null;
};
