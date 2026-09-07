import { describe, expect, it } from 'vitest';
import {
  BUILDER_ORDER,
  POLICY_BUILDERS,
  builderCovers,
  builderName,
  composeParagraphs,
  composePlainText,
  composeUnlock,
  joinList,
  matchBuilderId,
  optionLabel,
  questionAsk,
  sectionEyebrow,
} from '../policyBuilders';

// A filled-in answer set per builder, using real option values. This is what a
// supplier who worked through the whole builder would have.
const ANSWERS = {
  code_of_conduct: { applies: ['all', 'contractors'], coi: 'register', competition: true, harass: true, grievance: 'die Personalabteilung' },
  anti_corruption: { applies: ['all', 'agents'], gifts: 'under50', facilitation: 'safety', duediligence: ['screening', 'clauses'], report: 'compliance@nordwerk.de', training: 'refresh' },
  whistleblowing: { channels: ['hotline', 'ombuds'], scope: ['fraud', 'safety'], anon: 'anon', retaliation: true, ack: '48h', investigator: 'die Compliance-Beauftragte' },
  data_privacy: { subjects: ['employees', 'customers'], regime: 'gdpr', security: ['access', 'encryption', 'vendors'], contact: 'datenschutz@nordwerk.de', retention: 'need', breach: ['authority', 'affected'] },
  supplier_coc: { who: 'all', labor: ['child', 'wages', 'safe'], env: 'reduce', ethics: ['anticorruption', 'records'], checks: ['saq', 'audit'], breach: 'capa' },
  health_safety: { who: ['employees', 'contractors'], risk: 'method', ppe: true, accidents: 'investigate', emergency: ['fire', 'firstaid'], training: 'refresh', wellbeing: 'eine externe Mitarbeiterberatung' },
  equal_opp: { areas: ['hiring', 'paypromo'], nondiscrim: 'beyond', hiring: 'structured', pay: true, culture: ['accom', 'harass'], grievance: 'die Personalabteilung' },
  environmental: { areas: ['carbon', 'waste'], climate: 'target', energy: ['efficiency', 'renewables'], waste: 'plastics', pollution: true, owner: 'die Betriebsleitung' },
  training: { hours: 'mindestens 16 Stunden', types: ['technical', 'safety'], budget: 'external', equal: true, dev: 'plans' },
  blank: { topic: 'Wassermanagement', applies: 'alle Beschäftigten', c1: 'Wir senken den Wasserverbrauch je Produkteinheit um 10 %', owner: 'die Betriebsleitung' },
};

const SIGN_OFF = { cadence: 'Annually', approver: 'Anna Hartmann', title: 'Geschäftsführerin' };
const answersFor = (id) => ({ ...ANSWERS[id], ...SIGN_OFF });
const ctxDe = { company: 'Nordwerk GmbH', today: '2026-09-06', lang: 'de' };
const ctxEn = { ...ctxDe, lang: 'en' };

// Words that would only appear if an English fragment survived into German
// output. Deliberately common connectives rather than ESG nouns: those are the
// ones that leak when a composer forgets its language branch.
const ENGLISH_LEAK = /\b(the|and|with|our|we|through|policy|employees|suppliers|training|reported|covering|effective|version 1\.0 is)\b/i;

describe('every guided policy composes in German', () => {
  it.each(BUILDER_ORDER)('%s writes a complete German document', (id) => {
    const doc = composePlainText(id, answersFor(id), ctxDe);

    // Nothing left to fill in: a bracketed pending hint means a paragraph had no
    // German (or no answer) to work with.
    expect(doc, id).not.toContain('[ ');
    expect(doc).toContain('Gültig ab 2026-09-06');
    expect(doc).toContain('ÜBERPRÜFUNG & FREIGABE');
    expect(doc).not.toMatch(/\bundefined\b/);

    // Ignore the lines carrying the user's own words and the company name.
    const machineWritten = doc
      .split('\n')
      .filter((line) => !line.includes('Nordwerk GmbH') && !line.includes('nordwerk.de'))
      .join('\n');
    expect(machineWritten, id).not.toMatch(ENGLISH_LEAK);
  });

  it.each(BUILDER_ORDER)('%s names itself and its cover text in German', (id) => {
    const p = POLICY_BUILDERS[id];
    expect(builderName(p, 'de'), id).not.toBe(p.name);
    expect(builderCovers(p, 'de'), id).not.toBe(p.covers);
    // genusDe drives "Dieser Kodex" vs "Diese Richtlinie" — a missing one silently
    // defaults to feminine, which is wrong for the two Kodex builders.
    expect(['m', 'f', 'n'], id).toContain(p.genusDe);
  });

  it.each(BUILDER_ORDER)('%s asks every question in German', (id) => {
    for (const section of POLICY_BUILDERS[id].sections) {
      expect(sectionEyebrow(section, 'de'), `${id} eyebrow`).not.toBe(section.eyebrow);
      for (const q of section.questions) {
        if (q.ask) expect(questionAsk(q, 'de'), `${id}.${q.key}`).not.toBe(q.ask);
        for (const o of q.options || []) {
          // Presence, not difference: 'Audits' and 'Compliance' are the same word
          // in both languages, and a missing labelDe is the real failure.
          expect(o, `${id}.${q.key}.${o.v}`).toHaveProperty('labelDe');
          expect(optionLabel(o, 'de')).toBeTruthy();
        }
      }
    }
  });

  it('still writes English when asked for English', () => {
    const doc = composePlainText('code_of_conduct', answersFor('code_of_conduct'), ctxEn);
    expect(doc).toContain('CODE OF CONDUCT');
    expect(doc).toContain('Effective 2026-09-06');
    expect(doc).not.toContain('Gültig ab');
  });
});

describe('the questionnaire answer a policy unlocks', () => {
  it('uses the right article for a masculine policy name', () => {
    // "einen Verhaltenskodex", not "eine Verhaltenskodex".
    const unlock = composeUnlock('code_of_conduct', answersFor('code_of_conduct'), true, ctxDe);
    expect(unlock).toContain('unterhält einen Verhaltenskodex');
    expect(unlock.startsWith('Ja.')).toBe(true);
  });

  it('uses the right article for a feminine policy name', () => {
    const unlock = composeUnlock('environmental', answersFor('environmental'), true, ctxDe);
    expect(unlock).toContain('unterhält eine Umweltrichtlinie');
  });

  it('says a draft is a draft, in German', () => {
    const unlock = composeUnlock('environmental', answersFor('environmental'), false, ctxDe);
    expect(unlock.startsWith('In Arbeit.')).toBe(true);
    expect(unlock).toContain('Entwurf');
    // The honesty rule: an unadopted policy must never read as maintained.
    expect(unlock).not.toContain('unterhält');
  });

  it('stays silent until the gate is passed', () => {
    expect(composeUnlock('code_of_conduct', { ...SIGN_OFF }, true, ctxDe)).toBe('');
  });
});

describe('German mechanics', () => {
  it('joins a list with und, not and', () => {
    expect(joinList(['a', 'b', 'c'], 'de')).toBe('a, b und c');
    expect(joinList(['a', 'b', 'c'], 'en')).toBe('a, b and c');
  });

  it('closes the appositive after a job title', () => {
    const paras = composeParagraphs('environmental', answersFor('environmental'), ctxDe);
    const approval = paras.find((p) => p.id === 'approval');
    expect(approval.text).toContain('von Anna Hartmann, Geschäftsführerin, freigegeben');
  });

  it('drops the comma when there is no job title', () => {
    const answers = { ...answersFor('environmental'), title: '' };
    const approval = composeParagraphs('environmental', answers, ctxDe).find((p) => p.id === 'approval');
    expect(approval.text).toContain('von Anna Hartmann freigegeben');
  });

  it('reads the review cadence from the stored English value', () => {
    const answers = { ...answersFor('environmental'), cadence: 'Every two years' };
    const approval = composeParagraphs('environmental', answers, ctxDe).find((p) => p.id === 'approval');
    expect(approval.text).toContain('wird alle zwei Jahre überprüft');
  });
});

describe('matchBuilderId reaches German questionnaires', () => {
  it.each([
    ['Verfügen Sie über einen Verhaltenskodex?', 'code_of_conduct'],
    ['Haben Sie eine Antikorruptionsrichtlinie?', 'anti_corruption'],
    ['Gibt es ein Hinweisgebersystem?', 'whistleblowing'],
    ['Wie ist der Datenschutz geregelt?', 'data_privacy'],
    ['Beschreiben Sie Ihren Arbeitsschutz.', 'health_safety'],
    ['Wie fördern Sie Chancengleichheit?', 'equal_opp'],
    ['Welche Schulungen bieten Sie an?', 'training'],
    ['Haben Sie eine Umweltrichtlinie?', 'environmental'],
    ['Verlangen Sie einen Lieferantenkodex?', 'supplier_coc'],
  ])('%s -> %s', (text, expected) => {
    expect(matchBuilderId(text)).toBe(expected);
  });

  it('still matches the English wording', () => {
    expect(matchBuilderId('Do you have a Supplier Code of Conduct?')).toBe('supplier_coc');
    expect(matchBuilderId('Describe your whistleblowing process')).toBe('whistleblowing');
  });

  it('returns null when nothing fits', () => {
    expect(matchBuilderId('Wie hoch war Ihr Stromverbrauch?')).toBe(null);
  });
});

// Widened for the coverage report, which quotes the match count back to the buyer.
describe('matchBuilderId covers the wording buyers actually use', () => {
  it.each([
    ['Do you have a business ethics policy?', 'code_of_conduct'],
    ['How are conflicts of interest handled?', 'code_of_conduct'],
    ['Do you have a responsible sourcing policy?', 'supplier_coc'],
    ['Describe your sustainable procurement requirements', 'supplier_coc'],
    ['Do you have an anti-money laundering policy?', 'anti_corruption'],
    ['Do you have a privacy notice?', 'data_privacy'],
    ['Do you have an anti-harassment policy?', 'equal_opp'],
    ['Do you have a workplace accident procedure?', 'health_safety'],
    ['Are you certified to ISO 14001?', 'environmental'],
    ['Haben Sie eine Einkaufsrichtlinie?', 'supplier_coc'],
    ['Wie gehen Sie mit Geldwäsche um?', 'anti_corruption'],
  ])('%s -> %s', (text, expected) => {
    expect(matchBuilderId(text)).toBe(expected);
  });

  // No builder writes these. Matching them would promise a document that never arrives.
  it.each([
    'Do you publish a modern slavery statement?',
    'Describe your human rights due diligence',
    'Do you have a conflict minerals policy?',
  ])('leaves %s unmatched rather than promising the wrong document', text => {
    expect(matchBuilderId(text)).toBeNull();
  });
});
