import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockVercelTrack } = vi.hoisted(() => ({ mockVercelTrack: vi.fn() }));
vi.mock('@vercel/analytics', () => ({ track: mockVercelTrack }));

describe('Questionnaire Pass analytics privacy', () => {
  beforeEach(() => mockVercelTrack.mockClear());

  it.each([
    'questionnaire_pass_claim_started',
    'questionnaire_pass_claimed',
    'questionnaire_pass_second_questionnaire_blocked',
    'questionnaire_pass_upgrade_clicked',
  ])('allows only counts, tier names, and generic sources for %s', async event => {
    const { track } = await import('../track');
    track(event, {
      tier: 'questionnaire-pass',
      source: 'upload',
      question_count: 17,
      questionnaire_name: 'Identifying Buyer Questionnaire',
      filename: 'customer-secret.xlsx',
      license_key: 'SECRET-LICENSE-KEY',
      company: 'Private Company GmbH',
      question_text: 'Confidential question contents',
    });

    expect(mockVercelTrack).toHaveBeenLastCalledWith(event, {
      tier: 'questionnaire-pass',
      source: 'upload',
      question_count: 17,
    });
  });

  it('normalizes unsafe pass event values instead of forwarding them', async () => {
    const { sanitizeAnalyticsProperties } = await import('../track');
    expect(sanitizeAnalyticsProperties('questionnaire_pass_claimed', {
      tier: 'buyer@example.com',
      source: 'Secret Questionnaire.xlsx',
      question_count: Number.NaN,
    })).toEqual({});
  });
});
