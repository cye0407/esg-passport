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
// This module is framework-agnostic and pure: pass in { company, today, lang } —
// nothing is hardcoded to a demo company, and there is no Date.now() at load.
//
// LANGUAGE. What comes out of here is not UI chrome: it is the policy document a
// supplier signs and hands to their customer. So German is WRITTEN, not
// translated — every composed sentence carries an English and a German form and
// picks one at compose time, because German word order will not survive
// fragment-level substitution. Static labels follow the idiom already used in
// questionnaire-templates.js: a `*De` sibling field (nameDe, askDe, labelDe,
// hDe, pendingDe, coversDe, phDe), read through the accessors near the bottom of
// this file. A missing German field falls back to English rather than blanking.

export const isGerman = (lang) => lang === 'de';

// Pick a written form. `de` may be omitted while a builder is being translated.
export const L = (lang, en, de) => (isGerman(lang) && de ? de : en);

// Join a list into readable prose: ["a"] -> "a"; ["a","b"] -> "a and b";
// ["a","b","c"] -> "a, b and c". Falsy entries are dropped. German joins with
// "und".
export const joinList = (arr, lang) => {
  const a = (arr || []).filter(Boolean);
  if (a.length < 2) return a[0] || '';
  return a.slice(0, -1).join(', ') + (isGerman(lang) ? ' und ' : ' and ') + a.slice(-1);
};

// Readers for the static labels. Each takes the raw object and the language, so
// a component never has to know which fields carry German.
export const builderName = (b, lang) => L(lang, b?.name, b?.nameDe) || '';
export const builderCovers = (b, lang) => L(lang, b?.covers, b?.coversDe) || '';
export const sectionEyebrow = (sec, lang) => L(lang, sec?.eyebrow, sec?.eyebrowDe) || '';
export const questionAsk = (q, lang) => L(lang, q?.ask, q?.askDe) || '';
export const questionOpt = (q, lang) => L(lang, q?.opt, q?.optDe) || '';
export const questionPlaceholder = (q, lang) => L(lang, q?.ph, q?.phDe) || '';
export const optionLabel = (o, lang) => L(lang, o?.label, o?.labelDe) || '';

// Shared sign-off section appended to every builder.
export const SIGN_SECTION = {
  eyebrow: 'Sign-off',
  eyebrowDe: 'Freigabe',
  questions: [
    {
      type: 'twin',
      items: [
        { key: 'approver', ph: 'Name', phDe: 'Name' },
        { key: 'title', ph: 'Title — e.g. Managing Director', phDe: 'Funktion — z. B. Geschäftsführerin' },
      ],
      ask: 'Who approves this policy?',
      askDe: 'Wer gibt diese Richtlinie frei?',
      para: 'approval',
    },
    {
      type: 'single',
      key: 'cadence',
      ask: 'How often will you review it?',
      askDe: 'Wie oft überprüfen Sie sie?',
      para: 'approval',
      options: [
        { v: 'Annually', label: 'Annually', labelDe: 'Jährlich' },
        { v: 'Every two years', label: 'Every two years', labelDe: 'Alle zwei Jahre' },
      ],
    },
  ],
};

// German needs the grammatical gender of the policy's own name to write "Dieser
// Verhaltenskodex" against "Diese Umweltrichtlinie". Each builder declares
// genusDe once and every shared sentence reads the forms from here rather than
// guessing. Feminine is the default, because -richtlinie is.
const DE_FORMS = {
  m: { dieser: 'Dieser', einen: 'einen' },
  f: { dieser: 'Diese', einen: 'eine' },
  n: { dieser: 'Dieses', einen: 'ein' },
};
export const deForms = (builder) => DE_FORMS[builder?.genusDe] || DE_FORMS.f;

// Review cadence is STORED in English ('Annually') because the stored value is
// the stable one — only the reading changes.
const CADENCE_DE = {
  Annually: 'jährlich',
  'Every two years': 'alle zwei Jahre',
};

// The review & approval paragraph, shared across builders.
export const approvalParagraph = (builder, { today, lang }) => ({
  id: 'approval',
  h: L(lang, 'Review & approval', 'Überprüfung & Freigabe'),
  pending: L(lang, 'Who signs it off and how often it’s reviewed.', 'Wer sie freigibt und wie oft sie überprüft wird.'),
  fn: (s) => {
    if (!(s.approver && s.approver.trim())) return null;
    const who = s.approver.trim() + (s.title && s.title.trim() ? `, ${s.title.trim()}` : '');
    if (isGerman(lang)) {
      const cadence = CADENCE_DE[s.cadence] || 'jährlich';
      // A German appositive closes with a comma: "von Anna Hartmann, Geschäftsführerin, freigegeben".
      const hasTitle = !!(s.title && s.title.trim());
      return `${deForms(builder).dieser} ${builderName(builder, lang)} wird ${cadence} überprüft und wurde von ${who}${hasTitle ? ',' : ''} freigegeben; gültig ab ${today} (Version 1.0).`;
    }
    return `This ${builder.name} is reviewed ${(s.cadence || 'annually').toLowerCase()} and was approved by ${who}, effective ${today} (version 1.0).`;
  },
});

// The honesty-driven questionnaire answer this builder unlocks.
// gate(s) === false  -> "" (not enough answered yet)
// adopted === true   -> "Yes. <company> maintains a <policy> …"
// adopted === false  -> "In development. <company> is finalizing …"
export const composeUnlock = (policyId, answers, adopted, { company, today, lang }) => {
  const p = POLICY_BUILDERS[policyId];
  if (!p) return '';
  const s = answers || {};
  if (!p.gate(s)) return '';
  const name = builderName(p, lang);
  const covers = builderCovers(p, lang);
  const by = s.approver && s.approver.trim() ? s.approver.trim() : '';
  if (isGerman(lang)) {
    return adopted
      ? `Ja. ${company} unterhält ${deForms(p).einen} ${name} (v1.0, gültig ab ${today}) ${covers}${by ? `, freigegeben von ${by}` : ''}.`
      : `In Arbeit. ${company} stellt ${deForms(p).einen} ${name} ${covers} fertig; eine unterzeichnete Fassung folgt in Kürze. (Entwurf — setzen Sie den Haken bei „verabschiedet“, sobald sie unterzeichnet ist)`;
  }
  return adopted
    ? `Yes. ${company} maintains a ${name} (v1.0, effective ${today}) ${covers}${by ? `, approved by ${by}` : ''}.`
    : `In development. ${company} is finalizing a ${name} ${covers}; a signed version is expected shortly. (draft — tick “adopted” once it’s signed)`;
};

// Compose the full policy document as an ordered list of paragraphs.
// Returns [{ id, h, text, pending }] where text === null means "not answered
// yet" (render the `pending` hint). Includes the shared approval paragraph.
export const composeParagraphs = (policyId, answers, ctx) => {
  const p = POLICY_BUILDERS[policyId];
  if (!p) return [];
  const s = answers || {};
  const lang = ctx?.lang;
  const paras = p.paras.concat(approvalParagraph(p, ctx));
  return paras.map((pa) => {
    const text = pa.fn(s, ctx);
    return {
      id: pa.id,
      h: L(lang, pa.h, pa.hDe),
      text: text || null,
      pending: L(lang, pa.pending, pa.pendingDe) || '',
    };
  });
};

// Plain-text export of the composed document (for Download).
export const composePlainText = (policyId, answers, ctx) => {
  const p = POLICY_BUILDERS[policyId];
  if (!p) return '';
  const { company, today, lang } = ctx;
  const effective = L(lang, 'Effective', 'Gültig ab');
  const todo = L(lang, 'to complete', 'noch auszufüllen');
  let out = `${builderName(p, lang).toUpperCase()}\n${company} · v1.0 · ${effective} ${today}\n\n`;
  composeParagraphs(policyId, answers, ctx).forEach((pa) => {
    out += `${pa.h.toUpperCase()}\n${pa.text || '[ ' + (pa.pending || todo) + ' ]'}\n\n`;
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
    nameDe: 'Verhaltenskodex',
    genusDe: 'm',
    cat: 'governance',
    flag: 'EcoVadis ev-24',
    defaults: { applies: ['all'], competition: true, harass: true, cadence: 'Annually' },
    sections: [
      {
        eyebrow: 'Who it covers',
        eyebrowDe: 'Für wen er gilt',
        questions: [
          {
            type: 'multi',
            key: 'applies',
            ask: 'Who does this code apply to?',
            askDe: 'Für wen gilt dieser Kodex?',
            para: 'scope',
            options: [
              { v: 'all', label: 'All employees', labelDe: 'Alle Beschäftigten' },
              { v: 'contractors', label: 'Contractors', labelDe: 'Auftragnehmer' },
              { v: 'board', label: 'Board & management', labelDe: 'Geschäftsführung & Leitung' },
            ],
          },
        ],
      },
      {
        eyebrow: 'Conflicts & competition',
        eyebrowDe: 'Interessenkonflikte & Wettbewerb',
        questions: [
          {
            type: 'single',
            key: 'coi',
            ask: 'How are conflicts of interest handled?',
            askDe: 'Wie gehen Sie mit Interessenkonflikten um?',
            para: 'coi',
            options: [
              { v: 'disclose', label: 'Disclosed to a manager', labelDe: 'Offenlegung gegenüber der Führungskraft' },
              { v: 'approval', label: 'Disclosed & approved first', labelDe: 'Offenlegung und vorherige Genehmigung' },
              { v: 'register', label: 'Recorded in a register', labelDe: 'Eintrag in ein Register' },
            ],
          },
          {
            type: 'toggle',
            key: 'competition',
            ask: 'Commit to fair competition & anti-trust?',
            askDe: 'Bekenntnis zu fairem Wettbewerb und Kartellrecht?',
            opt: '— recommended',
            optDe: '— empfohlen',
            para: 'coi',
          },
        ],
      },
      {
        eyebrow: 'Respect at work',
        eyebrowDe: 'Respekt am Arbeitsplatz',
        questions: [
          {
            type: 'toggle',
            key: 'harass',
            ask: 'Prohibit harassment & discrimination?',
            askDe: 'Belästigung und Diskriminierung untersagen?',
            para: 'respect',
          },
          {
            type: 'text',
            key: 'grievance',
            ask: 'Who can staff raise a concern with?',
            askDe: 'An wen können sich Beschäftigte mit einem Anliegen wenden?',
            opt: '— optional',
            optDe: '— optional',
            para: 'respect',
            ph: 'e.g. their line manager or HR',
            phDe: 'z. B. die Führungskraft oder die Personalabteilung',
          },
        ],
      },
    ],
    paras: [
      {
        id: 'scope',
        h: 'Purpose & scope',
        hDe: 'Zweck & Geltungsbereich',
        pending: 'How the code applies across your company.',
        pendingDe: 'Für wen der Kodex in Ihrem Unternehmen gilt.',
        fn: (s, { company, lang }) => {
          const m = isGerman(lang)
            ? { all: 'alle Beschäftigten', contractors: 'Auftragnehmer', board: 'Mitglieder der Geschäftsführung und der Leitungsebene' }
            : { all: 'all employees', contractors: 'contractors', board: 'board members and management' };
          const a = (s.applies || []).map((v) => m[v]);
          if (!a.length) return null;
          return isGerman(lang)
            ? `Dieser Verhaltenskodex legt fest, wie ${company} Geschäfte führt. Er gilt für ${joinList(a, lang)} und steht für unser Bekenntnis zu rechtmäßigem, ethischem und integrem Handeln.`
            : `This Code of Conduct sets out how ${company} does business. It applies to ${joinList(a, lang)}, and reflects our commitment to acting lawfully, ethically, and with integrity.`;
        },
      },
      {
        id: 'legal',
        h: 'Legal compliance',
        hDe: 'Rechtskonformität',
        pending: '',
        fn: (s, { lang }) =>
          L(
            lang,
            'We conduct our business in full compliance with all applicable laws and regulations in the markets where we operate.',
            'Wir führen unsere Geschäfte in vollständiger Übereinstimmung mit allen anwendbaren Gesetzen und Vorschriften in den Märkten, in denen wir tätig sind.',
          ),
      },
      {
        id: 'ethics',
        h: 'Anti-corruption & bribery',
        hDe: 'Korruptions- & Bestechungsbekämpfung',
        pending: '',
        // Principle only — the operational detail (gifts, facilitation payments,
        // due diligence, reporting) lives in the standalone Anti-Corruption builder.
        fn: (s, { lang }) =>
          L(
            lang,
            'We maintain zero tolerance for bribery and corruption in all forms and comply with all applicable anti-bribery and anti-corruption laws.',
            'Wir dulden Bestechung und Korruption in keiner Form und halten alle anwendbaren Gesetze zur Bekämpfung von Bestechung und Korruption ein.',
          ),
      },
      {
        id: 'coi',
        h: 'Conflicts of interest & fair competition',
        hDe: 'Interessenkonflikte & fairer Wettbewerb',
        pending: 'How conflicts are handled and your competition commitment.',
        pendingDe: 'Wie mit Konflikten umgegangen wird und wie Ihr Wettbewerbsbekenntnis lautet.',
        fn: (s, { lang }) => {
          const b = [];
          const coi = isGerman(lang)
            ? {
              disclose: 'Beschäftigte legen tatsächliche oder mögliche Interessenkonflikte gegenüber ihrer Führungskraft offen.',
              approval: 'Beschäftigte legen Interessenkonflikte offen und holen vor dem weiteren Vorgehen eine Genehmigung ein.',
              register: 'Interessenkonflikte werden offengelegt und in unserem Interessenkonfliktregister erfasst.',
            }
            : {
              disclose: 'Employees disclose any actual or potential conflicts of interest to their manager.',
              approval: 'Employees disclose any conflict of interest and obtain approval before proceeding.',
              register: 'Conflicts of interest are disclosed and recorded in our conflicts-of-interest register.',
            };
          if (s.coi) b.push(coi[s.coi]);
          if (s.competition) {
            b.push(
              L(
                lang,
                'We compete fairly and comply with all applicable competition and anti-trust laws, including no price-fixing or market allocation.',
                'Wir treten fair im Wettbewerb auf und halten alle anwendbaren Wettbewerbs- und Kartellgesetze ein; Preisabsprachen und Marktaufteilungen sind ausgeschlossen.',
              ),
            );
          }
          return b.length ? b.join(' ') : null;
        },
      },
      {
        id: 'respect',
        h: 'Respect & dignity',
        hDe: 'Respekt & Würde',
        pending: 'Your commitment on harassment and raising concerns.',
        pendingDe: 'Ihr Bekenntnis zu Belästigungsfreiheit und zum Ansprechen von Anliegen.',
        fn: (s, { lang }) => {
          if (!s.harass && !(s.grievance && s.grievance.trim())) return null;
          let t = s.harass
            ? L(
              lang,
              'We treat colleagues, customers, and partners with respect. Harassment, discrimination, and abuse are prohibited.',
              'Wir begegnen Kolleginnen und Kollegen, Kundinnen und Kunden sowie Partnern mit Respekt. Belästigung, Diskriminierung und Missbrauch sind untersagt.',
            )
            : '';
          if (s.grievance && s.grievance.trim()) {
            const who = s.grievance.trim();
            t += `${t ? ' ' : ''}${isGerman(lang)
              ? `Anliegen können ohne Angst vor Repressalien an ${who} gerichtet werden.`
              : `Concerns can be raised with ${who} without fear of retaliation.`}`;
          }
          return t.trim();
        },
      },
    ],
    gate: (s) => !!s.coi,
    covers: 'covering standards of conduct, conflicts of interest and respect at work',
    coversDe: 'mit Verhaltensstandards, Interessenkonflikten und Respekt am Arbeitsplatz',
    required: ['applies', 'coi', 'harass', 'approver'],
  },

  anti_corruption: {
    name: 'Anti-Corruption & Anti-Bribery Policy',
    nameDe: 'Richtlinie gegen Korruption und Bestechung',
    genusDe: 'f',
    cat: 'governance',
    flag: 'EcoVadis ev-25',
    defaults: { facilitation: 'prohibited', cadence: 'Annually' },
    sections: [
      {
        eyebrow: 'Who must follow it',
        eyebrowDe: 'Für wen sie gilt',
        questions: [
          {
            type: 'multi',
            key: 'applies',
            ask: 'Who does this policy apply to?',
            askDe: 'Für wen gilt diese Richtlinie?',
            para: 'purpose',
            options: [
              { v: 'all', label: 'All employees', labelDe: 'Alle Beschäftigten' },
              { v: 'contractors', label: 'Contractors', labelDe: 'Auftragnehmer' },
              { v: 'agents', label: 'Agents & intermediaries', labelDe: 'Vertreter & Vermittler' },
              { v: 'board', label: 'Board & management', labelDe: 'Geschäftsführung & Leitung' },
            ],
          },
        ],
      },
      {
        eyebrow: 'Gifts, hospitality & facilitation — read hardest by assessors',
        eyebrowDe: 'Geschenke, Einladungen & Beschleunigungszahlungen — hier prüfen Bewerter am genauesten',
        questions: [
          {
            type: 'single',
            key: 'gifts',
            ask: 'Can staff accept gifts or hospitality?',
            askDe: 'Dürfen Beschäftigte Geschenke oder Einladungen annehmen?',
            para: 'gifts',
            options: [
              { v: 'never', label: 'Never', labelDe: 'Nie' },
              { v: 'under50', label: 'Only small ones (under €50)', labelDe: 'Nur geringwertige (unter 50 €)' },
              { v: 'approval', label: 'Only with written approval', labelDe: 'Nur mit schriftlicher Genehmigung' },
            ],
          },
          {
            type: 'single',
            key: 'facilitation',
            ask: 'Facilitation payments?',
            askDe: 'Beschleunigungszahlungen?',
            para: 'gifts',
            options: [
              { v: 'prohibited', label: 'Prohibited in all cases', labelDe: 'Ausnahmslos untersagt' },
              { v: 'safety', label: 'Prohibited unless safety is at risk', labelDe: 'Untersagt, außer bei Gefahr für die Sicherheit' },
            ],
          },
        ],
      },
      {
        eyebrow: 'Third parties & due diligence',
        eyebrowDe: 'Dritte & Sorgfaltsprüfung',
        questions: [
          {
            type: 'multi',
            key: 'duediligence',
            ask: 'How do you manage bribery risk with third parties?',
            askDe: 'Wie steuern Sie das Bestechungsrisiko bei Dritten?',
            para: 'duediligence',
            options: [
              { v: 'screening', label: 'Risk-based screening', labelDe: 'Risikobasierte Prüfung' },
              { v: 'clauses', label: 'Anti-corruption contract clauses', labelDe: 'Antikorruptionsklauseln in Verträgen' },
              { v: 'audit', label: 'Right to audit', labelDe: 'Auditrecht' },
            ],
          },
        ],
      },
      {
        eyebrow: 'Reporting & training',
        eyebrowDe: 'Meldung & Schulung',
        questions: [
          {
            type: 'text',
            key: 'report',
            ask: 'Where should someone report a concern?',
            askDe: 'Wo soll ein Verdacht gemeldet werden?',
            para: 'reporting',
            ph: 'e.g. compliance@yourcompany.com',
            phDe: 'z. B. compliance@ihrunternehmen.de',
          },
          {
            type: 'single',
            key: 'training',
            ask: 'Anti-corruption training?',
            askDe: 'Antikorruptionsschulung?',
            para: 'reporting',
            options: [
              { v: 'induction', label: 'At induction', labelDe: 'Bei der Einarbeitung' },
              { v: 'refresh', label: 'Induction + refreshers', labelDe: 'Einarbeitung + Auffrischungen' },
            ],
          },
        ],
      },
    ],
    paras: [
      {
        id: 'purpose',
        h: 'Purpose & scope',
        hDe: 'Zweck & Geltungsbereich',
        pending: 'Who the policy applies to.',
        pendingDe: 'Für wen die Richtlinie gilt.',
        fn: (s, { company, lang }) => {
          const m = isGerman(lang)
            ? {
              all: 'alle Beschäftigten',
              contractors: 'Auftragnehmer',
              agents: 'Vertreter und Vermittler, die in unserem Auftrag handeln',
              board: 'Mitglieder der Geschäftsführung und der Leitungsebene',
            }
            : {
              all: 'all employees',
              contractors: 'contractors',
              agents: 'agents and intermediaries acting on our behalf',
              board: 'board members and management',
            };
          const a = (s.applies || []).map((v) => m[v]);
          if (!a.length) return null;
          return isGerman(lang)
            ? `Diese Richtlinie gegen Korruption und Bestechung legt fest, wie ${company} Bestechung und Korruption verhindert. Sie gilt für ${joinList(a, lang)}.`
            : `This Anti-Corruption & Anti-Bribery Policy sets out how ${company} prevents bribery and corruption. It applies to ${joinList(a, lang)}.`;
        },
      },
      {
        id: 'principle',
        h: 'Our commitment',
        hDe: 'Unser Bekenntnis',
        pending: '',
        fn: (s, { lang }) =>
          L(
            lang,
            'We maintain zero tolerance for bribery and corruption in all forms — direct or indirect, in the public or private sector — and comply with all applicable anti-bribery and anti-corruption laws.',
            'Wir dulden Bestechung und Korruption in keiner Form — weder unmittelbar noch mittelbar, weder im öffentlichen noch im privaten Sektor — und halten alle anwendbaren Gesetze zur Bekämpfung von Bestechung und Korruption ein.',
          ),
      },
      {
        id: 'gifts',
        h: 'Gifts, hospitality & facilitation payments',
        hDe: 'Geschenke, Einladungen & Beschleunigungszahlungen',
        pending: 'Your rules on gifts and facilitation payments.',
        pendingDe: 'Ihre Regeln zu Geschenken und Beschleunigungszahlungen.',
        fn: (s, { lang }) => {
          if (!s.gifts) return null;
          const gifts = isGerman(lang)
            ? {
              never: 'Beschäftigte dürfen Geschenke oder Einladungen keinerlei Wertes annehmen.',
              under50: 'Beschäftigte dürfen nur geringwertige Geschenke oder Einladungen bis zu einem Wert von 50 € annehmen; darüber hinaus ist eine vorherige schriftliche Genehmigung erforderlich.',
              approval: 'Geschenke und Einladungen dürfen nur mit vorheriger schriftlicher Genehmigung angenommen werden.',
            }
            : {
              never: 'Employees may not accept gifts or hospitality of any value.',
              under50: 'Employees may accept only modest gifts or hospitality up to €50 in value; anything above requires prior written approval.',
              approval: 'Gifts and hospitality may only be accepted with prior written approval.',
            };
          const facilitation = isGerman(lang)
            ? {
              prohibited: 'Beschleunigungszahlungen sind ausnahmslos untersagt.',
              safety: 'Beschleunigungszahlungen sind untersagt, es sei denn, die persönliche Sicherheit einer beschäftigten Person ist unmittelbar gefährdet; in diesem Fall ist die Zahlung schnellstmöglich im Nachgang zu melden.',
            }
            : {
              prohibited: 'Facilitation payments are prohibited in all circumstances.',
              safety: 'Facilitation payments are prohibited, except where an employee’s personal safety is at immediate risk, in which case the payment must be reported as soon as possible afterwards.',
            };
          // An unrecognized stored value must not print "undefined" into a policy
          // document — better to leave the paragraph pending.
          const g = gifts[s.gifts];
          if (!g) return null;
          return `${g} ${facilitation[s.facilitation] || facilitation.prohibited}`;
        },
      },
      {
        id: 'duediligence',
        h: 'Third-party due diligence',
        hDe: 'Sorgfaltsprüfung bei Dritten',
        pending: 'How you manage third-party bribery risk.',
        pendingDe: 'Wie Sie das Bestechungsrisiko bei Dritten steuern.',
        fn: (s, { lang }) => {
          const m = isGerman(lang)
            ? {
              screening: 'eine risikobasierte Prüfung von Vertretern, Vermittlern und Lieferanten',
              clauses: 'Antikorruptionsklauseln in unseren Verträgen',
              audit: 'ein vertragliches Recht, Dritte zu auditieren und zu überwachen',
            }
            : {
              screening: 'risk-based screening of agents, intermediaries and suppliers',
              clauses: 'anti-corruption clauses in our contracts',
              audit: 'a contractual right to audit and monitor third parties',
            };
          const a = (s.duediligence || []).map((v) => m[v]);
          if (!a.length) return null;
          return isGerman(lang)
            ? `Wir steuern das Bestechungsrisiko bei Dritten durch ${joinList(a, lang)}.`
            : `We manage third-party bribery risk through ${joinList(a, lang)}.`;
        },
      },
      {
        id: 'reporting',
        h: 'Reporting & training',
        hDe: 'Meldung & Schulung',
        pending: 'How concerns are reported and staff are trained.',
        pendingDe: 'Wie Verdachtsfälle gemeldet werden und wie Sie schulen.',
        fn: (s, { lang }) => {
          if (!(s.report && s.report.trim()) && !s.training) return null;
          const where = s.report && s.report.trim();
          let t = where
            ? (isGerman(lang)
              ? `Der Verdacht auf Bestechung oder Korruption kann ohne Angst vor Repressalien an ${where} gemeldet werden.`
              : `Suspected bribery or corruption can be reported to ${where} without fear of retaliation.`)
            : '';
          const training = isGerman(lang)
            ? {
              induction: 'Eine Antikorruptionsschulung findet bei der Einarbeitung statt.',
              refresh: 'Eine Antikorruptionsschulung findet bei der Einarbeitung statt und wird regelmäßig aufgefrischt.',
            }
            : {
              induction: 'Anti-corruption training is provided at induction.',
              refresh: 'Anti-corruption training is provided at induction and refreshed regularly.',
            };
          const tr = training[s.training];
          if (tr) t += `${t ? ' ' : ''}${tr}`;
          return t.trim() || null;
        },
      },
    ],
    gate: (s) => !!s.gifts,
    covers: 'covering gifts and hospitality, facilitation payments, third-party due diligence and reporting',
    coversDe: 'mit Regeln zu Geschenken und Einladungen, Beschleunigungszahlungen, Sorgfaltsprüfung bei Dritten und Meldewegen',
    required: ['applies', 'gifts', 'facilitation', 'report', 'approver'],
  },

  whistleblowing: {
    name: 'Whistleblowing Policy',
    nameDe: 'Hinweisgeberrichtlinie',
    genusDe: 'f',
    cat: 'governance',
    flag: 'EcoVadis ev-26',
    defaults: { retaliation: true, cadence: 'Annually' },
    sections: [
      {
        eyebrow: 'How concerns are raised',
        eyebrowDe: 'Wie Hinweise gegeben werden',
        questions: [
          {
            type: 'multi',
            key: 'channels',
            ask: 'How can someone raise a concern?',
            askDe: 'Über welche Wege kann ein Hinweis gegeben werden?',
            para: 'channels',
            options: [
              { v: 'hotline', label: 'Hotline / web form', labelDe: 'Hotline / Webformular' },
              { v: 'manager', label: 'Their manager', labelDe: 'Die eigene Führungskraft' },
              { v: 'email', label: 'Dedicated email', labelDe: 'Eigene E-Mail-Adresse' },
              { v: 'ombuds', label: 'External ombudsperson', labelDe: 'Externe Ombudsperson' },
            ],
          },
          {
            type: 'multi',
            key: 'scope',
            ask: 'What kinds of concern are covered?',
            askDe: 'Welche Arten von Hinweisen sind erfasst?',
            opt: '— pick the relevant ones',
            optDe: '— wählen Sie die zutreffenden aus',
            para: 'scope',
            options: [
              { v: 'fraud', label: 'Fraud / theft', labelDe: 'Betrug / Diebstahl' },
              { v: 'safety', label: 'Safety violations', labelDe: 'Verstöße gegen den Arbeitsschutz' },
              { v: 'discrim', label: 'Discrimination', labelDe: 'Diskriminierung' },
              { v: 'env', label: 'Environmental harm', labelDe: 'Umweltschäden' },
            ],
          },
        ],
      },
      {
        eyebrow: 'Protection — the part that builds trust',
        eyebrowDe: 'Schutz — der Teil, der Vertrauen schafft',
        questions: [
          {
            type: 'single',
            key: 'anon',
            ask: 'Can reports be made anonymously?',
            askDe: 'Können Hinweise anonym gegeben werden?',
            para: 'protection',
            options: [
              { v: 'anon', label: 'Yes, fully anonymous', labelDe: 'Ja, vollständig anonym' },
              { v: 'confidential', label: 'Confidential, not anonymous', labelDe: 'Vertraulich, aber nicht anonym' },
            ],
          },
          {
            type: 'toggle',
            key: 'retaliation',
            ask: 'Include a zero-tolerance-for-retaliation commitment?',
            askDe: 'Zusage aufnehmen, dass Repressalien nicht geduldet werden?',
            para: 'protection',
          },
        ],
      },
      {
        eyebrow: 'What happens next',
        eyebrowDe: 'Was danach passiert',
        questions: [
          {
            type: 'single',
            key: 'ack',
            ask: 'How quickly do you acknowledge a report?',
            askDe: 'Wie schnell bestätigen Sie den Eingang eines Hinweises?',
            para: 'process',
            options: [
              { v: '48h', label: 'Within 48 hours', labelDe: 'Innerhalb von 48 Stunden' },
              { v: 'week', label: 'Within a week', labelDe: 'Innerhalb einer Woche' },
            ],
          },
          {
            type: 'text',
            key: 'investigator',
            ask: 'Who investigates concerns?',
            askDe: 'Wer geht den Hinweisen nach?',
            para: 'process',
            ph: 'e.g. the Compliance Officer',
            phDe: 'z. B. die Compliance-Beauftragte',
          },
        ],
      },
    ],
    paras: [
      {
        id: 'purpose',
        h: 'Purpose & scope',
        hDe: 'Zweck & Geltungsbereich',
        pending: '',
        fn: (s, { company, lang }) =>
          isGerman(lang)
            ? `Diese Hinweisgeberrichtlinie beschreibt, wie alle, die mit ${company} arbeiten, Hinweise auf Fehlverhalten oder Missstände gefahrlos geben können und welchen Schutz sie dabei genießen.`
            : `This Whistleblowing Policy explains how anyone working with ${company} can safely raise concerns about misconduct or wrongdoing, and the protections they receive.`,
      },
      {
        id: 'channels',
        h: 'How to raise a concern',
        hDe: 'Wie ein Hinweis gegeben wird',
        pending: 'The channels people can use.',
        pendingDe: 'Die Wege, die zur Verfügung stehen.',
        fn: (s, { lang }) => {
          const m = isGerman(lang)
            ? {
              hotline: 'eine vertrauliche Hotline oder ein Webformular',
              manager: 'die eigene Führungskraft',
              email: 'eine eigens eingerichtete Melde-E-Mail-Adresse',
              ombuds: 'eine unabhängige externe Ombudsperson',
            }
            : {
              hotline: 'a confidential hotline or web form',
              manager: 'their line manager',
              email: 'a dedicated reporting email address',
              ombuds: 'an independent external ombudsperson',
            };
          const a = (s.channels || []).map((v) => m[v]).filter(Boolean);
          if (!a.length) return null;
          return isGerman(lang)
            ? `Hinweise können über ${joinList(a, lang)} gegeben werden.`
            : `Concerns can be raised through ${joinList(a, lang)}.`;
        },
      },
      {
        id: 'scope',
        h: 'What can be reported',
        hDe: 'Was gemeldet werden kann',
        pending: 'The kinds of concern covered.',
        pendingDe: 'Die erfassten Arten von Hinweisen.',
        fn: (s, { lang }) => {
          const m = isGerman(lang)
            ? {
              fraud: 'Betrug oder Diebstahl',
              safety: 'Verstöße gegen den Arbeits- und Gesundheitsschutz',
              discrim: 'Diskriminierung oder Belästigung',
              env: 'Umweltschäden',
            }
            : {
              fraud: 'fraud or theft',
              safety: 'health & safety violations',
              discrim: 'discrimination or harassment',
              env: 'environmental harm',
            };
          const a = (s.scope || []).map((v) => m[v]).filter(Boolean);
          if (!a.length) return null;
          return isGerman(lang)
            ? `Meldefähig sind unter anderem ${joinList(a, lang)} sowie jeder Verstoß gegen Gesetze oder gegen unseren Verhaltenskodex.`
            : `Reportable concerns include ${joinList(a, lang)}, and any breach of law or of our Code of Conduct.`;
        },
      },
      {
        id: 'protection',
        h: 'Confidentiality & protection',
        hDe: 'Vertraulichkeit & Schutz',
        pending: 'Anonymity and non-retaliation.',
        pendingDe: 'Anonymität und Schutz vor Repressalien.',
        fn: (s, { lang }) => {
          if (!s.anon && !s.retaliation) return null;
          const how = isGerman(lang)
            ? { anon: 'vollständig anonym', confidential: 'vertraulich' }
            : { anon: 'fully anonymously', confidential: 'in confidence' };
          const mode = how[s.anon];
          let t = mode
            ? (isGerman(lang)
              ? `Hinweise können ${mode} gegeben werden.`
              : `Reports may be made ${mode}.`)
            : '';
          if (s.retaliation) {
            t += `${t ? ' ' : ''}${L(
              lang,
              'We do not tolerate retaliation of any kind against someone who raises a concern in good faith.',
              'Repressalien jeder Art gegen Personen, die in gutem Glauben einen Hinweis geben, dulden wir nicht.',
            )}`;
          }
          return t.trim() || null;
        },
      },
      {
        id: 'process',
        h: 'How reports are handled',
        hDe: 'Wie Hinweise bearbeitet werden',
        pending: 'Acknowledgement time and who investigates.',
        pendingDe: 'Bestätigungsfrist und wer den Hinweisen nachgeht.',
        fn: (s, { lang }) => {
          if (!s.ack && !(s.investigator && s.investigator.trim())) return null;
          const who = s.investigator && s.investigator.trim();
          if (isGerman(lang)) {
            const ak = { '48h': 'innerhalb von 48 Stunden', week: 'innerhalb einer Woche' }[s.ack];
            let t = ak
              ? `Wir bestätigen den Eingang jedes Hinweises ${ak}`
              : 'Der Eingang jedes Hinweises wird bestätigt';
            if (who) t += `, und ${who} geht ihm fair und zügig nach`;
            return t + '.';
          }
          const ak = { '48h': 'within 48 hours', week: 'within one week' }[s.ack];
          let t = ak ? `We aim to acknowledge every report ${ak}` : 'Every report is acknowledged';
          if (who) t += `, and ${who} investigates it fairly and promptly`;
          return t + '.';
        },
      },
    ],
    gate: (s) => (s.channels || []).length > 0,
    covers: 'covering reporting channels, whistleblower protection and investigation',
    coversDe: 'mit Meldewegen, dem Schutz hinweisgebender Personen und der Bearbeitung von Hinweisen',
    required: ['channels', 'anon', 'retaliation', 'investigator', 'approver'],
  },

  data_privacy: {
    name: 'Data Privacy Policy',
    nameDe: 'Datenschutzrichtlinie',
    genusDe: 'f',
    cat: 'governance',
    flag: 'EcoVadis ev-27',
    defaults: { regime: 'gdpr', cadence: 'Annually' },
    sections: [
      {
        eyebrow: 'Whose data & under which law',
        eyebrowDe: 'Wessen Daten & nach welchem Recht',
        questions: [
          {
            type: 'multi',
            key: 'subjects',
            ask: 'Whose personal data do you handle?',
            askDe: 'Personenbezogene Daten von wem verarbeiten Sie?',
            para: 'data',
            options: [
              { v: 'employees', label: 'Employees', labelDe: 'Beschäftigte' },
              { v: 'customers', label: 'Customers', labelDe: 'Kundinnen und Kunden' },
              { v: 'suppliers', label: 'Suppliers', labelDe: 'Lieferanten' },
              { v: 'visitors', label: 'Website visitors', labelDe: 'Website-Besucher' },
            ],
          },
          {
            type: 'single',
            key: 'regime',
            ask: 'Which data-protection law applies?',
            askDe: 'Welches Datenschutzrecht gilt?',
            para: 'purpose',
            options: [
              { v: 'gdpr', label: 'EU GDPR', labelDe: 'EU-DSGVO' },
              { v: 'gdpruk', label: 'EU + UK GDPR', labelDe: 'EU-DSGVO + UK-GDPR' },
              { v: 'other', label: 'Other', labelDe: 'Anderes' },
            ],
          },
        ],
      },
      {
        eyebrow: 'How you protect it',
        eyebrowDe: 'Wie Sie sie schützen',
        questions: [
          {
            type: 'multi',
            key: 'security',
            ask: 'What safeguards are in place?',
            askDe: 'Welche Schutzmaßnahmen gibt es?',
            para: 'security',
            options: [
              { v: 'access', label: 'Access controls', labelDe: 'Zugriffskontrollen' },
              { v: 'encryption', label: 'Encryption', labelDe: 'Verschlüsselung' },
              { v: 'training', label: 'Staff training', labelDe: 'Schulung der Beschäftigten' },
              { v: 'vendors', label: 'Vendor agreements', labelDe: 'Auftragsverarbeitungsverträge' },
            ],
          },
        ],
      },
      {
        eyebrow: 'Rights, retention & breaches',
        eyebrowDe: 'Rechte, Aufbewahrung & Datenpannen',
        questions: [
          {
            type: 'text',
            key: 'contact',
            ask: 'How do people exercise their data rights?',
            askDe: 'Wie machen Betroffene ihre Rechte geltend?',
            para: 'rights',
            ph: 'e.g. email privacy@yourcompany.com',
            phDe: 'z. B. datenschutz@ihrunternehmen.de',
          },
          {
            type: 'single',
            key: 'retention',
            ask: 'How long do you keep personal data?',
            askDe: 'Wie lange bewahren Sie personenbezogene Daten auf?',
            para: 'rights',
            options: [
              { v: 'need', label: 'Only as long as needed', labelDe: 'Nur so lange wie erforderlich' },
              { v: 'schedule', label: 'Set retention schedule', labelDe: 'Nach festem Löschkonzept' },
            ],
          },
          {
            type: 'multi',
            key: 'breach',
            ask: 'On a data breach, you will…',
            askDe: 'Bei einer Datenpanne werden Sie …',
            para: 'breach',
            options: [
              { v: 'authority', label: 'Notify the authority (72h)', labelDe: 'Die Aufsichtsbehörde benachrichtigen (72 Std.)' },
              { v: 'affected', label: 'Inform affected people', labelDe: 'Betroffene informieren' },
            ],
          },
        ],
      },
    ],
    paras: [
      {
        id: 'purpose',
        h: 'Purpose & scope',
        hDe: 'Zweck & Geltungsbereich',
        pending: '',
        fn: (s, { company, lang }) => {
          const regimes = isGerman(lang)
            ? {
              gdpr: 'der EU-Datenschutz-Grundverordnung (DSGVO)',
              gdpruk: 'der EU-DSGVO und der UK-GDPR',
              other: 'dem anwendbaren Datenschutzrecht',
            }
            : {
              gdpr: 'the EU General Data Protection Regulation (GDPR)',
              gdpruk: 'the EU and UK GDPR',
              other: 'applicable data-protection law',
            };
          const r = regimes[s.regime] || regimes.gdpr;
          return isGerman(lang)
            ? `Diese Datenschutzrichtlinie legt fest, wie ${company} personenbezogene Daten schützt und seine Pflichten nach ${r} erfüllt.`
            : `This Data Privacy Policy sets out how ${company} protects personal data and meets its obligations under ${r}.`;
        },
      },
      {
        id: 'data',
        h: 'Data we process',
        hDe: 'Welche Daten wir verarbeiten',
        pending: 'Whose personal data you handle.',
        pendingDe: 'Von wem Sie personenbezogene Daten verarbeiten.',
        fn: (s, { lang }) => {
          const m = isGerman(lang)
            ? { employees: 'Beschäftigten', customers: 'Kundinnen und Kunden', suppliers: 'Lieferanten', visitors: 'Website-Besuchern' }
            : { employees: 'employees', customers: 'customers', suppliers: 'suppliers', visitors: 'website visitors' };
          const a = (s.subjects || []).map((v) => m[v]).filter(Boolean);
          if (!a.length) return null;
          return isGerman(lang)
            ? `Wir erheben und verarbeiten personenbezogene Daten von ${joinList(a, lang)} ausschließlich für berechtigte geschäftliche Zwecke.`
            : `We collect and process personal data belonging to ${joinList(a, lang)}, only for legitimate business purposes.`;
        },
      },
      {
        id: 'security',
        h: 'How we protect it',
        hDe: 'Wie wir sie schützen',
        pending: 'Your technical and organizational safeguards.',
        pendingDe: 'Ihre technischen und organisatorischen Maßnahmen.',
        fn: (s, { lang }) => {
          const m = isGerman(lang)
            ? {
              access: 'rollenbasierte Zugriffskontrollen',
              encryption: 'die Verschlüsselung sensibler Daten',
              training: 'regelmäßige Datenschutzschulungen für Beschäftigte',
              vendors: 'Auftragsverarbeitungsverträge mit unseren Dienstleistern',
            }
            : {
              access: 'role-based access controls',
              encryption: 'encryption of sensitive data',
              training: 'regular staff data-protection training',
              vendors: 'data-processing agreements with our vendors',
            };
          const a = (s.security || []).map((v) => m[v]).filter(Boolean);
          if (!a.length) return null;
          return isGerman(lang)
            ? `Wir schützen diese Daten durch ${joinList(a, lang)}.`
            : `We safeguard this data through ${joinList(a, lang)}.`;
        },
      },
      {
        id: 'rights',
        h: 'Your rights & retention',
        hDe: 'Betroffenenrechte & Aufbewahrung',
        pending: 'How people access their data and how long you keep it.',
        pendingDe: 'Wie Betroffene an ihre Daten kommen und wie lange Sie sie aufbewahren.',
        fn: (s, { lang }) => {
          if (!(s.contact && s.contact.trim()) && !s.retention) return null;
          const where = s.contact && s.contact.trim();
          let t = where
            ? (isGerman(lang)
              ? `Betroffene können ihre personenbezogenen Daten einsehen, berichtigen oder löschen lassen, indem sie sich an ${where} wenden.`
              : `Individuals can access, correct, or delete their personal data by contacting ${where}.`)
            : '';
          // Whole sentences in German: "aufbewahren" is separable, so its prefix has
          // to land before the subordinate clause, not after it.
          const retention = isGerman(lang)
            ? {
              need: 'Wir bewahren personenbezogene Daten nur so lange auf, wie es für den Erhebungszweck erforderlich ist.',
              schedule: 'Wir bewahren personenbezogene Daten nach einem festgelegten Löschkonzept auf.',
            }
            : {
              need: 'We retain personal data only as long as necessary for the purpose it was collected.',
              schedule: 'We retain personal data according to a defined retention schedule.',
            };
          const r = retention[s.retention];
          if (r) t += `${t ? ' ' : ''}${r}`;
          return t.trim() || null;
        },
      },
      {
        id: 'breach',
        h: 'Data breaches',
        hDe: 'Datenpannen',
        pending: 'What you do if data is breached.',
        pendingDe: 'Was Sie bei einer Datenpanne tun.',
        fn: (s, { lang }) => {
          const m = isGerman(lang)
            ? {
              authority: 'die zuständige Aufsichtsbehörde innerhalb von 72 Stunden benachrichtigen',
              affected: 'die betroffenen Personen unverzüglich informieren',
            }
            : {
              authority: 'notify the relevant supervisory authority within 72 hours',
              affected: 'inform affected individuals without undue delay',
            };
          const a = (s.breach || []).map((v) => m[v]).filter(Boolean);
          if (!a.length) return null;
          return isGerman(lang)
            ? `Kommt es zu einer Verletzung des Schutzes personenbezogener Daten, werden wir ${joinList(a, lang)}.`
            : `If a personal-data breach occurs, we will ${joinList(a, lang)}.`;
        },
      },
    ],
    gate: (s) => (s.subjects || []).length > 0,
    covers: 'covering data security, individual rights and breach response',
    coversDe: 'mit Datensicherheit, Betroffenenrechten und dem Vorgehen bei Datenpannen',
    required: ['subjects', 'security', 'contact', 'breach', 'approver'],
  },

  supplier_coc: {
    name: 'Supplier Code of Conduct',
    nameDe: 'Lieferantenkodex',
    genusDe: 'm',
    cat: 'governance',
    flag: 'EcoVadis ev-29',
    defaults: { cadence: 'Annually' },
    sections: [
      {
        eyebrow: 'Who it applies to',
        eyebrowDe: 'Für wen er gilt',
        questions: [
          {
            type: 'single',
            key: 'who',
            ask: 'Which suppliers must follow it?',
            askDe: 'Welche Lieferanten müssen ihn einhalten?',
            para: 'purpose',
            options: [
              { v: 'all', label: 'All suppliers', labelDe: 'Alle Lieferanten' },
              { v: 'threshold', label: 'Above a spend threshold', labelDe: 'Ab einem bestimmten Einkaufsvolumen' },
              { v: 'critical', label: 'Critical suppliers', labelDe: 'Kritische Lieferanten' },
            ],
          },
        ],
      },
      {
        eyebrow: 'What you require',
        eyebrowDe: 'Was Sie verlangen',
        questions: [
          {
            type: 'multi',
            key: 'labor',
            ask: 'Labour standards required of suppliers?',
            askDe: 'Welche Arbeitsstandards verlangen Sie von Lieferanten?',
            para: 'labor',
            options: [
              { v: 'child', label: 'No child / forced labour', labelDe: 'Keine Kinder- oder Zwangsarbeit' },
              { v: 'wages', label: 'Fair wages & hours', labelDe: 'Faire Löhne & Arbeitszeiten' },
              { v: 'assoc', label: 'Freedom of association', labelDe: 'Vereinigungsfreiheit' },
              { v: 'safe', label: 'Safe conditions', labelDe: 'Sichere Arbeitsbedingungen' },
            ],
          },
          {
            type: 'single',
            key: 'env',
            ask: 'Environmental expectation?',
            askDe: 'Welche Umwelterwartung stellen Sie?',
            para: 'env',
            options: [
              { v: 'comply', label: 'Comply with the law', labelDe: 'Gesetze einhalten' },
              { v: 'reduce', label: 'Comply + actively reduce impact', labelDe: 'Einhalten + Auswirkungen aktiv verringern' },
            ],
          },
          {
            type: 'multi',
            key: 'ethics',
            ask: 'Ethics requirements?',
            askDe: 'Welche Anforderungen an die Geschäftsethik?',
            para: 'ethics',
            options: [
              { v: 'anticorruption', label: 'Anti-corruption', labelDe: 'Korruptionsbekämpfung' },
              { v: 'coi', label: 'No conflicts of interest', labelDe: 'Keine Interessenkonflikte' },
              { v: 'records', label: 'Accurate records', labelDe: 'Korrekte Aufzeichnungen' },
            ],
          },
        ],
      },
      {
        eyebrow: 'How you enforce it',
        eyebrowDe: 'Wie Sie ihn durchsetzen',
        questions: [
          {
            type: 'multi',
            key: 'checks',
            ask: 'How do you verify compliance?',
            askDe: 'Wie prüfen Sie die Einhaltung?',
            para: 'enforcement',
            options: [
              { v: 'saq', label: 'Self-assessment', labelDe: 'Selbstauskunft' },
              { v: 'audit', label: 'Audits', labelDe: 'Audits' },
              { v: 'certs', label: 'Certifications required', labelDe: 'Zertifikate verpflichtend' },
            ],
          },
          {
            type: 'single',
            key: 'breach',
            ask: 'If a supplier falls short?',
            askDe: 'Wenn ein Lieferant die Anforderungen nicht erfüllt?',
            para: 'enforcement',
            options: [
              { v: 'capa', label: 'Corrective action plan', labelDe: 'Maßnahmenplan zur Abstellung' },
              { v: 'terminate', label: 'Right to terminate', labelDe: 'Recht zur Beendigung' },
            ],
          },
        ],
      },
    ],
    paras: [
      {
        id: 'purpose',
        h: 'Purpose & scope',
        hDe: 'Zweck & Geltungsbereich',
        pending: '',
        fn: (s, { company, lang }) => {
          const who = isGerman(lang)
            ? {
              all: 'allen Lieferanten und deren Nachunternehmern',
              threshold: 'Lieferanten ab einem festgelegten Einkaufsvolumen',
              critical: 'kritischen Lieferanten und solchen mit erhöhtem Risiko',
            }
            : {
              all: 'all suppliers and their subcontractors',
              threshold: 'suppliers above a defined spend threshold',
              critical: 'critical and higher-risk suppliers',
            };
          if (isGerman(lang)) {
            const w = who[s.who] || 'seinen Lieferanten';
            return `Dieser Lieferantenkodex legt die Standards fest, die ${company} von ${w} erwartet. Er steht für unser Bekenntnis zu einer verantwortungsvollen Lieferkette.`;
          }
          const w = who[s.who] || 'its suppliers';
          return `This Supplier Code of Conduct sets out the standards ${company} expects from ${w}. It reflects our commitment to a responsible supply chain.`;
        },
      },
      {
        id: 'labor',
        h: 'Labour & human rights',
        hDe: 'Arbeitsbedingungen & Menschenrechte',
        pending: 'The labour standards you require.',
        pendingDe: 'Die Arbeitsstandards, die Sie verlangen.',
        fn: (s, { lang }) => {
          const m = isGerman(lang)
            ? {
              child: 'den Verzicht auf Kinder- und Zwangsarbeit',
              wages: 'faire Löhne und angemessene Arbeitszeiten',
              assoc: 'die Vereinigungsfreiheit',
              safe: 'sichere und gesunde Arbeitsbedingungen',
            }
            : {
              child: 'no child or forced labour',
              wages: 'fair wages and reasonable working hours',
              assoc: 'freedom of association',
              safe: 'safe and healthy working conditions',
            };
          const a = (s.labor || []).map((v) => m[v]).filter(Boolean);
          if (!a.length) return null;
          return isGerman(lang)
            ? `Lieferanten müssen ${joinList(a, lang)} gewährleisten, im Einklang mit den Kernarbeitsnormen der ILO.`
            : `Suppliers must uphold ${joinList(a, lang)}, consistent with core ILO labour standards.`;
        },
      },
      {
        id: 'env',
        h: 'Environmental standards',
        hDe: 'Umweltstandards',
        pending: 'Your environmental expectation.',
        pendingDe: 'Ihre Umwelterwartung.',
        fn: (s, { lang }) => {
          const m = isGerman(lang)
            ? {
              comply: 'Lieferanten müssen alle anwendbaren Umweltgesetze und -vorschriften einhalten.',
              reduce: 'Lieferanten müssen alle anwendbaren Umweltgesetze einhalten und aktiv daran arbeiten, ihre Umweltauswirkungen zu verringern.',
            }
            : {
              comply: 'Suppliers must comply with all applicable environmental laws and regulations.',
              reduce: 'Suppliers must comply with all applicable environmental laws and take active steps to reduce their environmental impact.',
            };
          return m[s.env] || null;
        },
      },
      {
        id: 'ethics',
        h: 'Business ethics',
        hDe: 'Geschäftsethik',
        pending: 'The ethics requirements.',
        pendingDe: 'Ihre Anforderungen an die Geschäftsethik.',
        fn: (s, { lang }) => {
          const m = isGerman(lang)
            ? {
              anticorruption: 'Maßnahmen gegen Korruption und Bestechung',
              coi: 'Freiheit von Interessenkonflikten',
              records: 'korrekte und wahrheitsgemäße Aufzeichnungen',
            }
            : {
              anticorruption: 'anti-corruption and anti-bribery practices',
              coi: 'freedom from conflicts of interest',
              records: 'accurate and honest record-keeping',
            };
          const a = (s.ethics || []).map((v) => m[v]).filter(Boolean);
          if (!a.length) return null;
          return isGerman(lang)
            ? `Lieferanten müssen ${joinList(a, lang)} sicherstellen.`
            : `Suppliers must maintain ${joinList(a, lang)}.`;
        },
      },
      {
        id: 'enforcement',
        h: 'Monitoring & remediation',
        hDe: 'Überwachung & Abhilfe',
        pending: 'How you check and enforce compliance.',
        pendingDe: 'Wie Sie die Einhaltung prüfen und durchsetzen.',
        fn: (s, { lang }) => {
          const m = isGerman(lang)
            ? {
              saq: 'eine Selbstauskunft',
              audit: 'Audits vor Ort oder durch Dritte',
              certs: 'anerkannte Zertifikate',
            }
            : {
              saq: 'a self-assessment questionnaire',
              audit: 'on-site or third-party audits',
              certs: 'recognised certifications',
            };
          const a = (s.checks || []).map((v) => m[v]).filter(Boolean);
          if (isGerman(lang)) {
            // German subordinate clauses do not chain onto a fragment the way the
            // English does, so this builds whole sentences and joins them.
            const parts = [];
            if (a.length) parts.push(`Wir prüfen die Einhaltung durch ${joinList(a, lang)}.`);
            const breach = {
              capa: 'Werden die Standards nicht erfüllt, vereinbaren wir mit dem Lieferanten einen Maßnahmenplan zur Abstellung.',
              terminate: 'Werden die Standards nicht erfüllt, behalten wir uns vor, die Geschäftsbeziehung zu beenden.',
            }[s.breach];
            if (breach) parts.push(breach);
            return parts.length ? parts.join(' ') : null;
          }
          let t = a.length ? `We verify compliance through ${joinList(a, lang)}` : '';
          const b = {
            capa: 'we agree a corrective action plan with the supplier',
            terminate: 'we reserve the right to end the relationship',
          }[s.breach];
          if (b) t += t ? `, and where standards are not met ${b}` : `Where standards are not met ${b}`;
          return t ? t + '.' : null;
        },
      },
    ],
    gate: (s) => (s.labor || []).length > 0,
    covers: 'covering labour, environmental and ethics standards for suppliers',
    coversDe: 'mit Arbeits-, Umwelt- und Ethikstandards für Lieferanten',
    required: ['who', 'labor', 'env', 'ethics', 'checks', 'approver'],
  },

  health_safety: {
    name: 'Health & Safety Policy',
    nameDe: 'Arbeitsschutzrichtlinie',
    genusDe: 'f',
    cat: 'social',
    flag: 'EcoVadis ev-19',
    defaults: { ppe: true, cadence: 'Annually' },
    sections: [
      {
        eyebrow: 'Who it protects',
        eyebrowDe: 'Wen sie schützt',
        questions: [
          {
            type: 'multi',
            key: 'who',
            ask: 'Who does this policy protect?',
            askDe: 'Wen schützt diese Richtlinie?',
            para: 'purpose',
            options: [
              { v: 'employees', label: 'Employees', labelDe: 'Beschäftigte' },
              { v: 'contractors', label: 'Contractors', labelDe: 'Auftragnehmer' },
              { v: 'visitors', label: 'Visitors', labelDe: 'Besucherinnen und Besucher' },
            ],
          },
        ],
      },
      {
        eyebrow: 'Keeping people safe',
        eyebrowDe: 'Wie Sie für Sicherheit sorgen',
        questions: [
          {
            type: 'single',
            key: 'risk',
            ask: 'How do you manage workplace risks?',
            askDe: 'Wie steuern Sie Gefährdungen am Arbeitsplatz?',
            para: 'safe',
            options: [
              { v: 'assess', label: 'Regular risk assessments', labelDe: 'Regelmäßige Gefährdungsbeurteilungen' },
              { v: 'method', label: 'Assessments + safe methods', labelDe: 'Beurteilungen + Betriebsanweisungen' },
              { v: 'iso', label: 'Certified system (ISO 45001)', labelDe: 'Zertifiziertes System (ISO 45001)' },
            ],
          },
          {
            type: 'toggle',
            key: 'ppe',
            ask: 'Provide PPE and maintain equipment?',
            askDe: 'PSA bereitstellen und Arbeitsmittel warten?',
            para: 'safe',
          },
        ],
      },
      {
        eyebrow: 'When something happens',
        eyebrowDe: 'Wenn etwas passiert',
        questions: [
          {
            type: 'single',
            key: 'accidents',
            ask: 'How are accidents handled?',
            askDe: 'Wie gehen Sie mit Unfällen um?',
            para: 'accidents',
            options: [
              { v: 'report', label: 'Reported & recorded', labelDe: 'Gemeldet & dokumentiert' },
              { v: 'investigate', label: 'Reported, investigated & fixed', labelDe: 'Gemeldet, untersucht & abgestellt' },
            ],
          },
          {
            type: 'multi',
            key: 'emergency',
            ask: 'Emergency readiness?',
            askDe: 'Wie sind Sie auf Notfälle vorbereitet?',
            para: 'emergency',
            options: [
              { v: 'fire', label: 'Fire & evacuation', labelDe: 'Brandschutz & Evakuierung' },
              { v: 'firstaid', label: 'First aid', labelDe: 'Erste Hilfe' },
              { v: 'wardens', label: 'Trained wardens', labelDe: 'Ausgebildete Brandschutzhelfer' },
            ],
          },
        ],
      },
      {
        eyebrow: 'Training & wellbeing',
        eyebrowDe: 'Unterweisung & Wohlbefinden',
        questions: [
          {
            type: 'single',
            key: 'training',
            ask: 'Safety training?',
            askDe: 'Sicherheitsunterweisung?',
            para: 'training',
            options: [
              { v: 'induction', label: 'At induction', labelDe: 'Bei der Einarbeitung' },
              { v: 'refresh', label: 'Induction + refreshers', labelDe: 'Einarbeitung + Auffrischungen' },
            ],
          },
          {
            type: 'text',
            key: 'wellbeing',
            ask: 'Any wellbeing support?',
            askDe: 'Gibt es Angebote zum Wohlbefinden?',
            opt: '— optional',
            optDe: '— optional',
            para: 'wellbeing',
            ph: 'e.g. an employee assistance programme',
            phDe: 'z. B. eine externe Mitarbeiterberatung',
          },
        ],
      },
    ],
    paras: [
      {
        id: 'purpose',
        h: 'Purpose & scope',
        hDe: 'Zweck & Geltungsbereich',
        pending: 'Who the policy protects.',
        pendingDe: 'Wen die Richtlinie schützt.',
        fn: (s, { company, lang }) => {
          const m = isGerman(lang)
            ? { employees: 'Beschäftigten', contractors: 'Auftragnehmern', visitors: 'Besucherinnen und Besuchern' }
            : { employees: 'employees', contractors: 'contractors', visitors: 'visitors' };
          const a = (s.who || []).map((v) => m[v]).filter(Boolean);
          if (!a.length) return null;
          return isGerman(lang)
            ? `Diese Arbeitsschutzrichtlinie legt fest, wie ${company} Gesundheit, Sicherheit und Wohlbefinden von ${joinList(a, lang)} bei der Arbeit schützt.`
            : `This Health & Safety Policy sets out how ${company} protects the health, safety, and wellbeing of ${joinList(a, lang)} at work.`;
        },
      },
      {
        id: 'safe',
        h: 'Managing risk',
        hDe: 'Gefährdungen steuern',
        pending: 'How you control hazards.',
        pendingDe: 'Wie Sie Gefährdungen beherrschen.',
        fn: (s, { lang }) => {
          if (!s.risk && !s.ppe) return null;
          const risks = isGerman(lang)
            ? {
              assess: 'regelmäßige Gefährdungsbeurteilungen',
              method: 'regelmäßige Gefährdungsbeurteilungen und dokumentierte Betriebsanweisungen',
              iso: 'ein zertifiziertes Arbeitsschutzmanagementsystem nach ISO 45001',
            }
            : {
              assess: 'regular risk assessments',
              method: 'regular risk assessments and documented safe methods of work',
              iso: 'a certified health & safety management system aligned with ISO 45001',
            };
          const r = risks[s.risk];
          let t = r
            ? (isGerman(lang)
              ? `Wir ermitteln und beherrschen Gefährdungen am Arbeitsplatz durch ${r}.`
              : `We identify and control workplace hazards through ${r}.`)
            : '';
          if (s.ppe) {
            t += `${t ? ' ' : ''}${L(
              lang,
              'We provide appropriate personal protective equipment and keep work equipment properly maintained.',
              'Wir stellen geeignete persönliche Schutzausrüstung bereit und halten die Arbeitsmittel ordnungsgemäß instand.',
            )}`;
          }
          return t.trim() || null;
        },
      },
      {
        id: 'accidents',
        h: 'Accidents & incidents',
        hDe: 'Unfälle & Ereignisse',
        pending: 'How incidents are handled.',
        pendingDe: 'Wie mit Ereignissen umgegangen wird.',
        fn: (s, { lang }) => {
          const m = isGerman(lang)
            ? {
              report: 'Alle Unfälle und Beinaheunfälle werden gemeldet und dokumentiert.',
              investigate: 'Alle Unfälle und Beinaheunfälle werden gemeldet und untersucht; ihre Ursachen werden abgestellt, damit sie sich nicht wiederholen.',
            }
            : {
              report: 'All accidents and near-misses are reported and recorded.',
              investigate: 'All accidents and near-misses are reported, investigated, and their root causes addressed to prevent recurrence.',
            };
          return m[s.accidents] || null;
        },
      },
      {
        id: 'emergency',
        h: 'Emergency preparedness',
        hDe: 'Notfallvorsorge',
        pending: 'Your emergency provisions.',
        pendingDe: 'Ihre Vorkehrungen für den Notfall.',
        fn: (s, { lang }) => {
          const m = isGerman(lang)
            ? {
              fire: 'Brandmelde- und Evakuierungsabläufe',
              firstaid: 'ausgebildete Ersthelfer und Erste-Hilfe-Ausstattung',
              wardens: 'ausgebildete Brandschutzhelfer',
            }
            : {
              fire: 'fire detection and evacuation procedures',
              firstaid: 'trained first-aiders and first-aid provision',
              wardens: 'trained fire wardens',
            };
          const a = (s.emergency || []).map((v) => m[v]).filter(Boolean);
          if (!a.length) return null;
          return isGerman(lang)
            ? `Wir halten ${joinList(a, lang)} vor.`
            : `We maintain ${joinList(a, lang)}.`;
        },
      },
      {
        id: 'training',
        h: 'Training & awareness',
        hDe: 'Unterweisung & Bewusstsein',
        pending: 'When safety training happens.',
        pendingDe: 'Wann Sicherheitsunterweisungen stattfinden.',
        fn: (s, { lang }) => {
          const m = isGerman(lang)
            ? {
              induction: 'Eine Sicherheitsunterweisung findet bei der Einarbeitung statt.',
              refresh: 'Eine Sicherheitsunterweisung findet bei der Einarbeitung statt und wird regelmäßig aufgefrischt.',
            }
            : {
              induction: 'Health & safety training is provided at induction.',
              refresh: 'Health & safety training is provided at induction and refreshed regularly.',
            };
          return m[s.training] || null;
        },
      },
      {
        id: 'wellbeing',
        h: 'Worker wellbeing',
        hDe: 'Wohlbefinden der Beschäftigten',
        pending: '',
        fn: (s, { lang }) => {
          const how = s.wellbeing && s.wellbeing.trim();
          if (!how) return null;
          return isGerman(lang)
            ? `Wir unterstützen das Wohlbefinden unserer Beschäftigten durch ${how}.`
            : `We support worker wellbeing through ${how}.`;
        },
      },
    ],
    gate: (s) => !!s.risk,
    covers: 'covering risk control, incident response and emergency preparedness',
    coversDe: 'mit Gefährdungssteuerung, dem Umgang mit Ereignissen und der Notfallvorsorge',
    required: ['who', 'risk', 'accidents', 'emergency', 'approver'],
  },

  equal_opp: {
    name: 'Equal Opportunity Policy',
    nameDe: 'Richtlinie zur Chancengleichheit',
    genusDe: 'f',
    cat: 'social',
    flag: 'EcoVadis ev-22',
    defaults: { pay: true, cadence: 'Annually' },
    sections: [
      {
        eyebrow: 'Where it applies',
        eyebrowDe: 'Wo sie gilt',
        questions: [
          {
            type: 'multi',
            key: 'areas',
            ask: 'Where does it apply?',
            askDe: 'Wo gilt sie?',
            para: 'purpose',
            options: [
              { v: 'hiring', label: 'Hiring', labelDe: 'Einstellung' },
              { v: 'paypromo', label: 'Pay & promotion', labelDe: 'Vergütung & Beförderung' },
              { v: 'training', label: 'Training', labelDe: 'Weiterbildung' },
              { v: 'daily', label: 'Everyday treatment', labelDe: 'Umgang im Arbeitsalltag' },
            ],
          },
        ],
      },
      {
        eyebrow: 'Non-discrimination',
        eyebrowDe: 'Diskriminierungsfreiheit',
        questions: [
          {
            type: 'single',
            key: 'nondiscrim',
            ask: 'How far does your commitment go?',
            askDe: 'Wie weit reicht Ihre Zusage?',
            para: 'nondiscrim',
            options: [
              { v: 'legal', label: 'Legally protected grounds', labelDe: 'Gesetzlich geschützte Merkmale' },
              { v: 'beyond', label: 'Beyond legal minimums too', labelDe: 'Auch über das gesetzliche Minimum hinaus' },
            ],
          },
        ],
      },
      {
        eyebrow: 'Fairness in practice',
        eyebrowDe: 'Fairness in der Praxis',
        questions: [
          {
            type: 'single',
            key: 'hiring',
            ask: 'Fair hiring approach?',
            askDe: 'Wie stellen Sie faire Einstellungen sicher?',
            para: 'hiring',
            options: [
              { v: 'merit', label: 'Merit-based', labelDe: 'Nach Eignung und Leistung' },
              { v: 'structured', label: 'Merit + diverse pools & structured interviews', labelDe: 'Eignung + vielfältige Bewerberfelder & strukturierte Interviews' },
            ],
          },
          {
            type: 'toggle',
            key: 'pay',
            ask: 'Commit to equal pay & pay reviews?',
            askDe: 'Zusage zu gleicher Bezahlung und regelmäßiger Entgeltprüfung?',
            para: 'pay',
          },
        ],
      },
      {
        eyebrow: 'Culture & concerns',
        eyebrowDe: 'Kultur & Anliegen',
        questions: [
          {
            type: 'multi',
            key: 'culture',
            ask: 'Inclusive-culture actions?',
            askDe: 'Welche Maßnahmen fördern eine inklusive Kultur?',
            para: 'culture',
            options: [
              { v: 'accom', label: 'Reasonable accommodations', labelDe: 'Angemessene Vorkehrungen' },
              { v: 'harass', label: 'Anti-harassment', labelDe: 'Schutz vor Belästigung' },
              { v: 'train', label: 'Inclusion training', labelDe: 'Schulungen zu Inklusion' },
            ],
          },
          {
            type: 'text',
            key: 'grievance',
            ask: 'How are discrimination concerns raised?',
            askDe: 'Wie werden Diskriminierungsfälle angesprochen?',
            para: 'culture',
            ph: 'e.g. with HR or a line manager',
            // German takes an addressee, not a place phrase — the sentence supplies
            // the preposition, so the hint asks for the object only.
            phDe: 'z. B. die Personalabteilung oder die Führungskraft',
          },
        ],
      },
    ],
    paras: [
      {
        id: 'purpose',
        h: 'Purpose & scope',
        hDe: 'Zweck & Geltungsbereich',
        pending: 'Where the policy applies.',
        pendingDe: 'Wo die Richtlinie gilt.',
        fn: (s, { company, lang }) => {
          const m = isGerman(lang)
            ? {
              hiring: 'Personalgewinnung',
              paypromo: 'Vergütung und Beförderung',
              training: 'Weiterbildung und Entwicklung',
              daily: 'Umgang im Arbeitsalltag',
            }
            : {
              hiring: 'recruitment',
              paypromo: 'pay and promotion',
              training: 'training and development',
              daily: 'everyday treatment at work',
            };
          const a = (s.areas || []).map((v) => m[v]).filter(Boolean);
          if (!a.length) return null;
          return isGerman(lang)
            ? `Diese Richtlinie zur Chancengleichheit beschreibt das Bekenntnis von ${company} zu fairem und inklusivem Umgang in den Bereichen ${joinList(a, lang)}.`
            : `This Equal Opportunity Policy sets out ${company}'s commitment to fair, inclusive treatment across ${joinList(a, lang)}.`;
        },
      },
      {
        id: 'nondiscrim',
        h: 'Non-discrimination',
        hDe: 'Diskriminierungsfreiheit',
        pending: 'How far your commitment goes.',
        pendingDe: 'Wie weit Ihre Zusage reicht.',
        fn: (s, { lang }) => {
          const m = isGerman(lang)
            ? {
              legal: 'Diskriminierung aufgrund eines gesetzlich geschützten Merkmals — darunter Alter, Geschlecht, ethnische Herkunft, Religion, Behinderung oder sexuelle Identität — dulden wir nicht.',
              beyond: 'Diskriminierung aufgrund eines gesetzlich geschützten Merkmals — Alter, Geschlecht, ethnische Herkunft, Religion, Behinderung oder sexuelle Identität — dulden wir nicht und wenden denselben Maßstab auch über das gesetzliche Minimum hinaus an, etwa auf soziale Herkunft und Sorgeverantwortung.',
            }
            : {
              legal: 'We do not tolerate discrimination on any legally protected ground, including age, gender, race, religion, disability, or sexual orientation.',
              beyond: 'We do not tolerate discrimination on any legally protected ground — age, gender, race, religion, disability, or sexual orientation — and extend the same fairness beyond legal minimums, including to social background and caring responsibilities.',
            };
          return m[s.nondiscrim] || null;
        },
      },
      {
        id: 'hiring',
        h: 'Fair hiring & progression',
        hDe: 'Faire Einstellung & Entwicklung',
        pending: 'Your hiring approach.',
        pendingDe: 'Ihr Vorgehen bei Einstellungen.',
        fn: (s, { lang }) => {
          const m = isGerman(lang)
            ? {
              merit: 'Entscheidungen über Einstellung und Beförderung richten sich nach Eignung und Leistung.',
              structured: 'Entscheidungen über Einstellung und Beförderung richten sich nach Eignung und Leistung, gestützt auf vielfältige Bewerberfelder und strukturierte, vorurteilsbewusste Interviews.',
            }
            : {
              merit: 'Recruitment and promotion decisions are based on merit and ability.',
              structured: 'Recruitment and promotion decisions are based on merit and ability, supported by diverse candidate pools and structured, bias-aware interviews.',
            };
          return m[s.hiring] || null;
        },
      },
      {
        id: 'pay',
        h: 'Equal pay',
        hDe: 'Entgeltgleichheit',
        pending: '',
        fn: (s, { lang }) =>
          s.pay
            ? L(
              lang,
              'We are committed to equal pay for equal work, and review pay periodically to identify and close unjustified gaps.',
              'Wir bekennen uns zu gleicher Bezahlung für gleiche Arbeit und überprüfen die Vergütung regelmäßig, um sachlich nicht gerechtfertigte Unterschiede zu erkennen und zu schließen.',
            )
            : null,
      },
      {
        id: 'culture',
        h: 'Inclusive culture',
        hDe: 'Inklusive Kultur',
        pending: 'Your culture actions.',
        pendingDe: 'Ihre Maßnahmen für die Unternehmenskultur.',
        fn: (s, { lang }) => {
          const m = isGerman(lang)
            ? {
              accom: 'angemessene Vorkehrungen bei Behinderung und unterschiedlichen Bedarfen',
              harass: 'eine klare Haltung gegen Belästigung',
              train: 'Schulungen zu Inklusion und Bewusstsein',
            }
            : {
              accom: 'reasonable accommodations for disability and diverse needs',
              harass: 'a clear anti-harassment stance',
              train: 'inclusion and awareness training',
            };
          const a = (s.culture || []).map((v) => m[v]).filter(Boolean);
          let t = a.length
            ? (isGerman(lang)
              ? `Wir fördern eine inklusive Kultur durch ${joinList(a, lang)}.`
              : `We foster an inclusive culture through ${joinList(a, lang)}.`)
            : '';
          const where = s.grievance && s.grievance.trim();
          if (where) {
            t += `${t ? ' ' : ''}${isGerman(lang)
              ? `Diskriminierungsfälle können an ${where} gerichtet werden.`
              : `Concerns about discrimination can be raised ${where}.`}`;
          }
          return t.trim() || null;
        },
      },
    ],
    gate: (s) => !!s.nondiscrim,
    covers: 'covering non-discrimination, fair hiring and equal pay',
    coversDe: 'mit Diskriminierungsfreiheit, fairen Einstellungen und Entgeltgleichheit',
    required: ['areas', 'nondiscrim', 'hiring', 'pay', 'approver'],
  },

  environmental: {
    name: 'Environmental Policy',
    nameDe: 'Umweltrichtlinie',
    genusDe: 'f',
    cat: 'environmental',
    flag: '',
    defaults: { pollution: true, cadence: 'Annually' },
    sections: [
      {
        eyebrow: 'What it covers',
        eyebrowDe: 'Was sie abdeckt',
        questions: [
          {
            type: 'multi',
            key: 'areas',
            ask: 'Which impacts does it cover?',
            askDe: 'Welche Auswirkungen deckt sie ab?',
            para: 'purpose',
            options: [
              { v: 'carbon', label: 'Energy & carbon', labelDe: 'Energie & Emissionen' },
              { v: 'waste', label: 'Waste', labelDe: 'Abfall' },
              { v: 'water', label: 'Water', labelDe: 'Wasser' },
              { v: 'pollution', label: 'Pollution', labelDe: 'Umweltverschmutzung' },
            ],
          },
        ],
      },
      {
        eyebrow: 'Climate & energy',
        eyebrowDe: 'Klima & Energie',
        questions: [
          {
            type: 'single',
            key: 'climate',
            ask: 'Carbon commitment?',
            askDe: 'Welche Zusage machen Sie zu Emissionen?',
            para: 'climate',
            options: [
              { v: 'measure', label: 'Measure our footprint', labelDe: 'Fußabdruck messen' },
              { v: 'target', label: 'Measure + reduction target', labelDe: 'Messen + Reduktionsziel' },
            ],
          },
          {
            type: 'multi',
            key: 'energy',
            ask: 'Energy approach?',
            askDe: 'Wie gehen Sie beim Thema Energie vor?',
            para: 'energy',
            options: [
              { v: 'efficiency', label: 'Improve efficiency', labelDe: 'Effizienz verbessern' },
              { v: 'renewables', label: 'Move to renewables', labelDe: 'Auf erneuerbare Energien umstellen' },
            ],
          },
        ],
      },
      {
        eyebrow: 'Resources & pollution',
        eyebrowDe: 'Ressourcen & Umweltverschmutzung',
        questions: [
          {
            type: 'single',
            key: 'waste',
            ask: 'Waste approach?',
            askDe: 'Wie gehen Sie beim Thema Abfall vor?',
            para: 'waste',
            options: [
              { v: 'reduce', label: 'Reduce & recycle', labelDe: 'Vermeiden & verwerten' },
              { v: 'plastics', label: 'Reduce, recycle & cut plastics', labelDe: 'Vermeiden, verwerten & Kunststoffe reduzieren' },
            ],
          },
          {
            type: 'toggle',
            key: 'pollution',
            ask: 'Prevent pollution & handle hazardous materials responsibly?',
            askDe: 'Umweltverschmutzung vermeiden und Gefahrstoffe verantwortungsvoll handhaben?',
            para: 'pollution',
          },
        ],
      },
      {
        eyebrow: 'Responsibility',
        eyebrowDe: 'Verantwortung',
        questions: [
          {
            type: 'text',
            key: 'owner',
            ask: 'Who owns environmental performance?',
            askDe: 'Wer verantwortet die Umweltleistung?',
            para: 'responsibility',
            ph: 'e.g. the Operations Manager',
            phDe: 'z. B. die Betriebsleitung',
          },
        ],
      },
    ],
    paras: [
      {
        id: 'purpose',
        h: 'Purpose & scope',
        hDe: 'Zweck & Geltungsbereich',
        pending: 'Which impacts it covers.',
        pendingDe: 'Welche Auswirkungen sie abdeckt.',
        fn: (s, { company, lang }) => {
          const m = isGerman(lang)
            ? { carbon: 'Energie und Emissionen', waste: 'Abfall', water: 'Wasser', pollution: 'Umweltverschmutzung' }
            : { carbon: 'energy and carbon', waste: 'waste', water: 'water', pollution: 'pollution' };
          const a = (s.areas || []).map((v) => m[v]).filter(Boolean);
          if (!a.length) return null;
          return isGerman(lang)
            ? `Diese Umweltrichtlinie legt fest, wie ${company} seine Umweltauswirkungen in den Bereichen ${joinList(a, lang)} so gering wie möglich hält.`
            : `This Environmental Policy sets out how ${company} minimizes its environmental impact across ${joinList(a, lang)}.`;
        },
      },
      {
        id: 'climate',
        h: 'Climate action',
        hDe: 'Klimaschutz',
        pending: 'Your carbon commitment.',
        pendingDe: 'Ihre Zusage zu Emissionen.',
        fn: (s, { lang }) => {
          const m = isGerman(lang)
            ? {
              measure: 'Wir erfassen unseren Treibhausgas-Fußabdruck und berichten jährlich darüber.',
              target: 'Wir erfassen unseren Treibhausgas-Fußabdruck, berichten jährlich darüber und haben uns ein Reduktionsziel gesetzt.',
            }
            : {
              measure: 'We measure our greenhouse-gas footprint and report on it annually.',
              target: 'We measure our greenhouse-gas footprint, report annually, and have committed to a reduction target.',
            };
          return m[s.climate] || null;
        },
      },
      {
        id: 'energy',
        h: 'Energy management',
        hDe: 'Energiemanagement',
        pending: 'Your energy approach.',
        pendingDe: 'Ihr Vorgehen beim Thema Energie.',
        fn: (s, { lang }) => {
          const m = isGerman(lang)
            ? {
              efficiency: 'die Energieeffizienz in unserem gesamten Betrieb zu verbessern',
              renewables: 'den Anteil erneuerbarer Energie an unserem Verbrauch zu erhöhen',
            }
            : {
              efficiency: 'improving energy efficiency across our operations',
              renewables: 'increasing the share of renewable energy we use',
            };
          const a = (s.energy || []).map((v) => m[v]).filter(Boolean);
          if (!a.length) return null;
          return isGerman(lang)
            ? `Wir haben uns verpflichtet, ${joinList(a, lang)}.`
            : `We are committed to ${joinList(a, lang)}.`;
        },
      },
      {
        id: 'waste',
        h: 'Resource use & waste',
        hDe: 'Ressourcennutzung & Abfall',
        pending: 'Your waste approach.',
        pendingDe: 'Ihr Vorgehen beim Thema Abfall.',
        fn: (s, { lang }) => {
          const m = isGerman(lang)
            ? {
              reduce: 'Wir vermeiden Abfall und führen ihn der Verwertung zu, wo immer das praktikabel ist.',
              plastics: 'Wir vermeiden Abfall, führen ihn der Verwertung zu, wo immer das praktikabel ist, und steigen schrittweise aus Einwegkunststoffen aus.',
            }
            : {
              reduce: 'We reduce waste and recycle wherever practical.',
              plastics: 'We reduce waste, recycle wherever practical, and are phasing out single-use plastics.',
            };
          return m[s.waste] || null;
        },
      },
      {
        id: 'pollution',
        h: 'Pollution prevention',
        hDe: 'Vermeidung von Umweltverschmutzung',
        pending: '',
        fn: (s, { lang }) =>
          s.pollution
            ? L(
              lang,
              'We prevent pollution of air, water, and soil, and handle and dispose of hazardous materials responsibly and in line with regulations.',
              'Wir vermeiden die Verunreinigung von Luft, Wasser und Boden und handhaben und entsorgen Gefahrstoffe verantwortungsvoll und vorschriftsgemäß.',
            )
            : null,
      },
      {
        id: 'responsibility',
        h: 'Responsibility',
        hDe: 'Verantwortung',
        pending: '',
        fn: (s, { lang }) => {
          const who = s.owner && s.owner.trim();
          if (!who) return null;
          return isGerman(lang)
            ? `Die operative Verantwortung für die Umweltleistung trägt ${who}.`
            : `Day-to-day responsibility for environmental performance sits with ${who}.`;
        },
      },
    ],
    gate: (s) => !!s.climate,
    covers: 'covering climate, energy, waste and pollution',
    coversDe: 'mit Klimaschutz, Energie, Abfall und Umweltverschmutzung',
    required: ['areas', 'climate', 'energy', 'waste', 'approver'],
  },

  training: {
    name: 'Training & Development Policy',
    nameDe: 'Richtlinie zu Weiterbildung und Entwicklung',
    genusDe: 'f',
    cat: 'social',
    flag: '',
    defaults: { equal: true, cadence: 'Annually' },
    sections: [
      {
        eyebrow: 'The commitment',
        eyebrowDe: 'Die Zusage',
        questions: [
          {
            type: 'text',
            key: 'hours',
            ask: 'Minimum training per employee per year?',
            askDe: 'Mindestumfang der Weiterbildung je beschäftigter Person und Jahr?',
            para: 'commit',
            ph: 'e.g. at least 16 hours',
            phDe: 'z. B. mindestens 16 Stunden',
          },
          {
            type: 'multi',
            key: 'types',
            ask: 'What kinds of training?',
            askDe: 'Welche Arten von Weiterbildung?',
            para: 'commit',
            options: [
              { v: 'technical', label: 'Technical / job skills', labelDe: 'Fachliche Qualifikation' },
              { v: 'safety', label: 'Health & safety', labelDe: 'Arbeits- und Gesundheitsschutz' },
              { v: 'soft', label: 'Soft skills', labelDe: 'Persönliche Kompetenzen' },
              { v: 'compliance', label: 'Compliance', labelDe: 'Compliance' },
            ],
          },
        ],
      },
      {
        eyebrow: 'Investment & access',
        eyebrowDe: 'Investition & Zugang',
        questions: [
          {
            type: 'single',
            key: 'budget',
            ask: 'How is training funded?',
            askDe: 'Wie wird Weiterbildung finanziert?',
            para: 'budget',
            options: [
              { v: 'budget', label: 'Dedicated training budget', labelDe: 'Eigenes Weiterbildungsbudget' },
              { v: 'external', label: 'Budget + external courses funded', labelDe: 'Budget + Förderung externer Kurse' },
            ],
          },
          {
            type: 'toggle',
            key: 'equal',
            ask: 'Equal access for all roles & levels?',
            askDe: 'Gleicher Zugang für alle Funktionen und Ebenen?',
            para: 'access',
          },
        ],
      },
      {
        eyebrow: 'Development',
        eyebrowDe: 'Entwicklung',
        questions: [
          {
            type: 'single',
            key: 'dev',
            ask: 'How does training link to growth?',
            askDe: 'Wie ist Weiterbildung mit der Entwicklung verknüpft?',
            para: 'dev',
            options: [
              { v: 'reviews', label: 'Through performance reviews', labelDe: 'Über Mitarbeitergespräche' },
              { v: 'plans', label: 'Reviews + development plans', labelDe: 'Mitarbeitergespräche + Entwicklungspläne' },
            ],
          },
        ],
      },
    ],
    paras: [
      {
        id: 'commit',
        h: 'Our training commitment',
        hDe: 'Unsere Weiterbildungszusage',
        pending: 'Training hours and types.',
        pendingDe: 'Umfang und Arten der Weiterbildung.',
        fn: (s, { lang }) => {
          const m = isGerman(lang)
            ? {
              technical: 'fachliche Qualifikation',
              safety: 'Arbeits- und Gesundheitsschutz',
              soft: 'persönliche Kompetenzen',
              compliance: 'Compliance',
            }
            : {
              technical: 'technical and job skills',
              safety: 'health & safety',
              soft: 'soft skills',
              compliance: 'compliance',
            };
          const a = (s.types || []).map((v) => m[v]).filter(Boolean);
          const hours = s.hours && s.hours.trim();
          if (isGerman(lang)) {
            // Built as whole sentences: German puts the verb where English can just
            // keep appending clauses.
            if (hours && a.length) {
              return `Wir bieten jeder beschäftigten Person ${hours} Weiterbildung pro Jahr, davon zu den Themen ${joinList(a, lang)}.`;
            }
            if (hours) return `Wir bieten jeder beschäftigten Person ${hours} Weiterbildung pro Jahr.`;
            if (a.length) return `Wir bieten Weiterbildung zu den Themen ${joinList(a, lang)}.`;
            return null;
          }
          let t = hours ? `We provide ${hours} of training per employee each year` : '';
          if (a.length) t += `${t ? ', covering ' : 'We provide training covering '}${joinList(a, lang)}`;
          return t ? t + '.' : null;
        },
      },
      {
        id: 'budget',
        h: 'Investment',
        hDe: 'Investition',
        pending: 'How training is funded.',
        pendingDe: 'Wie Weiterbildung finanziert wird.',
        fn: (s, { lang }) => {
          const m = isGerman(lang)
            ? {
              budget: 'Weiterbildung wird durch ein eigenes Jahresbudget getragen.',
              external: 'Weiterbildung wird durch ein eigenes Jahresbudget getragen, einschließlich der Förderung passender externer Kurse.',
            }
            : {
              budget: 'Training is supported by a dedicated annual budget.',
              external: 'Training is supported by a dedicated annual budget, including funding for relevant external courses.',
            };
          return m[s.budget] || null;
        },
      },
      {
        id: 'access',
        h: 'Equal access',
        hDe: 'Gleicher Zugang',
        pending: '',
        fn: (s, { lang }) =>
          s.equal
            ? L(
              lang,
              'All employees have equal access to development opportunities, regardless of role or level.',
              'Alle Beschäftigten haben unabhängig von Funktion und Ebene gleichen Zugang zu Entwicklungsmöglichkeiten.',
            )
            : null,
      },
      {
        id: 'dev',
        h: 'Development & performance',
        hDe: 'Entwicklung & Leistung',
        pending: 'How training connects to growth.',
        pendingDe: 'Wie Weiterbildung mit der Entwicklung zusammenhängt.',
        fn: (s, { lang }) => {
          const m = isGerman(lang)
            ? {
              reviews: 'Weiterbildungsbedarf wird in regelmäßigen Mitarbeitergesprächen ermittelt.',
              plans: 'Weiterbildungsbedarf wird in regelmäßigen Mitarbeitergesprächen ermittelt und in individuellen Entwicklungsplänen festgehalten.',
            }
            : {
              reviews: 'Training needs are identified through regular performance reviews.',
              plans: 'Training needs are identified through regular performance reviews and captured in individual development plans.',
            };
          return m[s.dev] || null;
        },
      },
    ],
    gate: (s) => !!(s.hours && s.hours.trim()) || (s.types || []).length > 0,
    covers: 'covering training hours, investment and development',
    coversDe: 'mit Weiterbildungsumfang, Investition und Entwicklung',
    required: ['types', 'budget', 'dev', 'equal', 'approver'],
  },

  blank: {
    name: 'Custom Policy',
    nameDe: 'Individuelle Richtlinie',
    genusDe: 'f',
    cat: 'governance',
    flag: 'any topic',
    flagDe: 'beliebiges Thema',
    defaults: { cadence: 'Annually' },
    sections: [
      {
        eyebrow: 'The basics',
        eyebrowDe: 'Die Eckpunkte',
        questions: [
          {
            type: 'text',
            key: 'topic',
            ask: 'What is this policy about?',
            askDe: 'Worum geht es in dieser Richtlinie?',
            para: 'purpose',
            ph: 'e.g. Water Management, Biodiversity, AI Use',
            phDe: 'z. B. Wassermanagement, Biodiversität, KI-Einsatz',
          },
          {
            type: 'text',
            key: 'applies',
            ask: 'Who does it apply to?',
            askDe: 'Für wen gilt sie?',
            para: 'purpose',
            ph: 'e.g. all employees and contractors',
            phDe: 'z. B. alle Beschäftigten und Auftragnehmer',
          },
        ],
      },
      {
        eyebrow: 'Your commitments',
        eyebrowDe: 'Ihre Zusagen',
        questions: [
          {
            type: 'text',
            key: 'c1',
            ask: 'Commitment 1',
            askDe: 'Zusage 1',
            para: 'commit',
            ph: 'a specific, measurable commitment',
            phDe: 'eine konkrete, messbare Zusage',
          },
          {
            type: 'text',
            key: 'c2',
            ask: 'Commitment 2',
            askDe: 'Zusage 2',
            opt: '— optional',
            optDe: '— optional',
            para: 'commit',
            ph: 'another commitment',
            phDe: 'eine weitere Zusage',
          },
          {
            type: 'text',
            key: 'c3',
            ask: 'Commitment 3',
            askDe: 'Zusage 3',
            opt: '— optional',
            optDe: '— optional',
            para: 'commit',
            ph: 'another commitment',
            phDe: 'eine weitere Zusage',
          },
        ],
      },
      {
        eyebrow: 'Ownership',
        eyebrowDe: 'Verantwortung',
        questions: [
          {
            type: 'text',
            key: 'owner',
            ask: 'Who is responsible for it?',
            askDe: 'Wer ist dafür verantwortlich?',
            para: 'responsibility',
            ph: 'e.g. the Operations Manager',
            phDe: 'z. B. die Betriebsleitung',
          },
        ],
      },
    ],
    paras: [
      {
        id: 'purpose',
        h: 'Purpose & scope',
        hDe: 'Zweck & Geltungsbereich',
        pending: 'What the policy covers and who it applies to.',
        pendingDe: 'Was die Richtlinie abdeckt und für wen sie gilt.',
        fn: (s, { company, lang }) => {
          const topic = s.topic && s.topic.trim();
          if (!topic) return null;
          if (isGerman(lang)) {
            // The user's own topic is a noun phrase, so German names the policy
            // "Richtlinie zu <Thema>" rather than gluing a word onto the front.
            const who = s.applies && s.applies.trim() ? s.applies.trim() : 'alle Beschäftigten';
            return `Diese Richtlinie zu ${topic} legt die Zusagen von ${company} zum Thema ${topic} fest. Sie gilt für ${who}.`;
          }
          const who = s.applies && s.applies.trim() ? s.applies.trim() : 'all employees';
          return `This ${topic} Policy sets out ${company}'s commitments on ${topic.toLowerCase()}. It applies to ${who}.`;
        },
      },
      {
        id: 'commit',
        h: 'Our commitments',
        hDe: 'Unsere Zusagen',
        pending: 'Your specific commitments.',
        pendingDe: 'Ihre konkreten Zusagen.',
        fn: (s) => {
          // The commitments are the user's own sentences, so there is nothing to
          // translate here — only the full stop to tidy.
          const a = [s.c1, s.c2, s.c3].map((x) => (x && x.trim() ? x.trim() : null)).filter(Boolean);
          if (!a.length) return null;
          return a.map((x) => x.replace(/\.$/, '') + '.').join(' ');
        },
      },
      {
        id: 'responsibility',
        h: 'Responsibility',
        hDe: 'Verantwortung',
        pending: '',
        fn: (s, { lang }) => {
          const who = s.owner && s.owner.trim();
          if (!who) return null;
          return isGerman(lang)
            ? `Die operative Verantwortung trägt ${who}.`
            : `Day-to-day responsibility sits with ${who}.`;
        },
      },
    ],
    gate: (s) => !!(s.topic && s.topic.trim()),
    covers: 'covering your stated commitments on this topic',
    coversDe: 'mit Ihren erklärten Zusagen zu diesem Thema',
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
// `cat` stays the stable English key — the card localizes it for display.
export const builderMeta = (id, lang) => {
  const p = POLICY_BUILDERS[id];
  return p ? { id, name: builderName(p, lang), cat: p.cat, flag: L(lang, p.flag, p.flagDe) } : null;
};

// Best-effort map from a questionnaire POLICY question (its text + category) to a
// guided builder id, for the Respond "Build this policy" deep-link. Returns null
// if nothing matches (caller falls back to the library). Order matters: more
// specific patterns first (supplier before generic conduct; environmental last).
export const matchBuilderId = (text) => {
  const s = (text || '').toLowerCase();
  // Matched in order, most specific first (supplier before generic conduct;
  // environmental last). Each line now carries the German wording alongside the
  // English: a German questionnaire matched nothing before, so the "build this
  // policy" link on a policy gap simply never appeared for a German supplier.
  // Widened for the coverage report, which counts these matches and quotes the number
  // back to the buyer as "N need policies you don't have yet". A question that matches
  // nothing is simply not counted; a question matched to a builder that does not
  // actually produce what was asked for would be a fake door with a price on it.
  //
  // Deliberately still unmatched: human rights, modern slavery, forced and child
  // labour, conflict minerals. None of the nine builders writes those documents, and
  // routing them to the Code of Conduct - which asks about conflicts of interest and
  // fair competition - would promise a supplier something they would not receive.
  const rules = [
    [/supplier.*(code|conduct)|supply.?chain.*(code|conduct|policy|standard|requirement)|subcontractor.*(code|conduct)|vendor code|responsible (sourcing|procurement)|sustainable (sourcing|procurement)|purchasing policy|lieferantenkodex|lieferantenverhaltenskodex|verhaltenskodex für lieferanten|nachhaltige beschaffung|einkaufsrichtlinie|lieferkette.*(richtlinie|standard)/, 'supplier_coc'],
    [/anti[-\s]?bribery|anti[-\s]?corruption|\bbribery\b|\bcorruption\b|facilitation payment|money laundering|kickback|gifts and hospitality|antikorruption|korruptionsbekämpfung|bestechung|\bkorruption\b|geldwäsche|geschenke und einladungen/, 'anti_corruption'],
    [/code of conduct|business ethics|ethics policy|\bintegrity\b|conflicts? of interest|fair competition|anti[-\s]?trust|verhaltenskodex|verhaltensrichtlinie|geschäftsethik|ethikrichtlinie|interessenkonflikt|kartellrecht/, 'code_of_conduct'],
    [/whistle\s?bl|grievance|raise.*concern|report.*(concern|misconduct)|speak.?up|hinweisgeber|beschwerdeverfahren|meldestelle|missstände/, 'whistleblowing'],
    [/data (privacy|protection)|gdpr|personal data|privacy (policy|notice)|datenschutz|dsgvo|personenbezogene daten/, 'data_privacy'],
    [/health.*safety|occupational|\bohs\b|iso ?45001|workplace (safety|accident|incident)|arbeitsschutz|arbeitssicherheit|gesundheitsschutz|arbeitsunfall/, 'health_safety'],
    [/equal opportunit|discriminat|diversity|inclusion|\bdei\b|equal pay|harassment|bullying|chancengleichheit|gleichbehandlung|diskriminierung|vielfalt|entgeltgleichheit|belästigung|mobbing/, 'equal_opp'],
    [/training|development|upskill|schulung|weiterbildung|fortbildung|qualifizierung|personalentwicklung/, 'training'],
    [/environment|umwelt|energy policy|climate policy|waste policy|iso ?14001|energierichtlinie|klimarichtlinie|abfallrichtlinie/, 'environmental'],
  ];
  for (const [re, id] of rules) if (re.test(s)) return id;
  return null;
};
