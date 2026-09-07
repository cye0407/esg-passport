import { describe, expect, it } from 'vitest';
import { esgDomainPack } from 'response-ready/domain-packs/esg';
import { TOPIC_ORDER, topicForDomain, mappedDomains } from '../coverageTopics';
import { summarizeCoverage } from '../coverage';

let seq = 0;
const draft = (domain, answerConfidence = 'medium', extra = {}) => ({
  questionId: `q${(seq += 1)}`,
  questionText: 'Question',
  answerConfidence,
  matchResult: { primaryDomain: domain, suggestedDataPoints: [] },
  ...extra,
});

describe('topic table', () => {
  // The table has to keep up with the pack: a domain added upstream would otherwise land
  // in "other" silently, and a whole group of questions would be quietly mis-filed.
  it('covers every domain the ESG pack can emit', () => {
    const packDomains = Object.keys(esgDomainPack.domainSuggestions);
    const missing = packDomains.filter(d => !mappedDomains().includes(d));
    expect(missing).toEqual([]);
  });

  it('puts every domain in a known topic', () => {
    for (const domain of mappedDomains()) {
      expect(TOPIC_ORDER).toContain(topicForDomain(domain));
    }
  });

  it.each([
    ['emissions', 'environmental'],
    ['waste', 'environmental'],
    ['energy_water', 'environmental'],
    ['workforce', 'social'],
    ['health_safety', 'social'],
    ['training', 'social'],
    ['buyer_requirements', 'governance'],
    ['regulatory', 'governance'],
    // Company profile is not governance. "How many sites do you have" is not an ethics
    // question, and filing it there would be a tidier lie.
    ['site', 'other'],
    ['financial_context', 'other'],
  ])('%s is %s', (domain, topic) => {
    expect(topicForDomain(domain)).toBe(topic);
  });

  it('does not guess at an unmatched question', () => {
    expect(topicForDomain(null)).toBe('other');
    expect(topicForDomain('something_new')).toBe('other');
  });
});

describe('summarizeCoverage topics', () => {
  it('accounts for every question exactly once', () => {
    const c = summarizeCoverage([
      draft('emissions'), draft('waste'), draft('workforce'),
      draft('health_safety'), draft('regulatory'), draft('site'),
    ]);
    expect(c.topics.reduce((n, t) => n + t.total, 0)).toBe(c.total);
  });

  it('leaves out a topic the questionnaire never asks about', () => {
    const c = summarizeCoverage([draft('emissions'), draft('waste')]);
    expect(c.topics.map(t => t.topic)).toEqual(['environmental']);
  });

  it('keeps topics in a stable reading order', () => {
    const c = summarizeCoverage([draft('site'), draft('workforce'), draft('emissions'), draft('regulatory')]);
    expect(c.topics.map(t => t.topic)).toEqual(['environmental', 'social', 'governance', 'other']);
  });

  it('names the documents that would answer a topic, and counts each question once', () => {
    const wants = labels => draft('waste', 'none', {
      matchResult: { primaryDomain: 'waste', suggestedDataPoints: labels },
    });
    const c = summarizeCoverage(
      [wants(['Total waste (kg)', 'Hazardous waste']), wants(['Water withdrawal (m3)'])],
      { companyData: {} },
    );
    const environmental = c.topics.find(t => t.topic === 'environmental');
    expect(environmental.needsDocument).toBe(2);
    expect(environmental.documents).toEqual(['wasteManifest', 'waterBill']);
  });

  it('does not ask for a document against a question it already answered', () => {
    const answered = draft('waste', 'high', {
      matchResult: { primaryDomain: 'waste', suggestedDataPoints: ['Total waste (kg)'] },
    });
    const environmental = summarizeCoverage([answered], { companyData: {} })
      .topics.find(t => t.topic === 'environmental');
    expect(environmental.fromRecords).toBe(1);
    expect(environmental.documents).toEqual([]);
  });

  it('counts a missing policy against the topic that asked for it', () => {
    const c = summarizeCoverage([
      draft('buyer_requirements', 'medium', {
        questionType: 'POLICY',
        confidenceSource: 'drafted',
        questionText: 'Do you have a supplier code of conduct?',
        matchResult: { primaryDomain: 'buyer_requirements', suggestedDataPoints: [] },
      }),
    ]);
    const governance = c.topics.find(t => t.topic === 'governance');
    expect(governance.needsPolicy).toBe(1);
    expect(governance.policies).toEqual(['supplier_coc']);
  });
});
