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

    const [, sent] = mockVercelTrack.mock.lastCall;
    expect(sent).toEqual(
      event === 'questionnaire_pass_upgrade_clicked'
        ? { tier: 'questionnaire-pass', source: 'upload' }
        : { tier: 'questionnaire-pass', source: 'upload', question_count: 17 },
    );
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

// The finding this guards against: `documentType: rawText.slice(0, 30)` sent
// the opening characters of the customer's bill to Vercel — supplier names,
// account references, whatever the page happened to start with. The sanitizer
// is now deny-by-default, so the test is: throw document text and identity at
// every event the app can fire, and prove none of it comes out the other side.
const CANARIES = [
  'Hartmann Präzisionstechnik GmbH',
  'Stadtwerke Düsseldorf Rechnung Nr. 4471-9920',
  'cat@example.com',
  'PASSPORT-LICENSE-4F2A-9931',
  'EcoVadis 2026 Buyer Questionnaire.xlsx',
  '/Users/cat/Documents/bills/march-electricity.pdf',
];

/** Every allowlisted property name, each carrying something it must not send. */
const hostileProps = () => {
  const props = {};
  for (const name of [
    'feature', 'source', 'from_tier', 'tier', 'fallback', 'destination', 'mode',
    'hasValue', 'year', 'fields', 'periodType', 'extractedPeriod', 'lead_field',
    'ext', 'questions', 'count', 'framework', 'error', 'language', 'templates',
    'builder', 'adopted', 'question_count', 'rows', 'thin', 'outcome',
    'confidence', 'manual_mapping', 'referrer_host', 'utm_source',
    'utm_medium', 'utm_campaign',
  ]) {
    props[name] = CANARIES[0];
  }
  // And a scattering of properties nobody allowlisted at all.
  props.filename = CANARIES[4];
  props.rawText = CANARIES[1];
  props.email = CANARIES[2];
  props.license_key = CANARIES[3];
  props.document_path = CANARIES[5];
  props.company_name = CANARIES[0];
  return props;
};

describe('analytics is deny-by-default', () => {
  beforeEach(() => mockVercelTrack.mockClear());

  it('lets no document text or identity through on any tracked event', async () => {
    const { track, TRACKED_EVENTS } = await import('../track');
    expect(TRACKED_EVENTS.length).toBeGreaterThan(20);

    for (const event of TRACKED_EVENTS) {
      mockVercelTrack.mockClear();
      track(event, hostileProps());
      const [, sent] = mockVercelTrack.mock.lastCall;
      const serialized = JSON.stringify(sent);
      for (const canary of CANARIES) {
        expect(serialized, `${event} leaked ${canary}`).not.toContain(canary);
      }
    }
  });

  it('sends an event with no schema entry bare rather than forwarding its props', async () => {
    const { track } = await import('../track');
    track('some_event_nobody_allowlisted', { filename: CANARIES[4], count: 3 });
    expect(mockVercelTrack).toHaveBeenLastCalledWith('some_event_nobody_allowlisted', {});
  });

  it('drops properties the event does not declare', async () => {
    const { sanitizeAnalyticsProperties } = await import('../track');
    expect(sanitizeAnalyticsProperties('data_saved', {
      mode: 'monthly',
      company: 'Hartmann GmbH',
    })).toEqual({ mode: 'monthly' });
  });

  it('keeps the legitimate extraction signal', async () => {
    const { sanitizeAnalyticsProperties } = await import('../track');
    expect(sanitizeAnalyticsProperties('bill_extracted', {
      fields: 3,
      periodType: 'monthly',
      extractedPeriod: '2025-03',
      lead_field: 'electricitykwh',
    })).toEqual({
      fields: 3,
      periodType: 'monthly',
      extractedPeriod: '2025-03',
      lead_field: 'electricitykwh',
    });
  });

  it('buckets a period the extractor guessed off an invoice number', async () => {
    const { sanitizeAnalyticsProperties } = await import('../track');
    expect(sanitizeAnalyticsProperties('bill_extracted', {
      extractedPeriod: '4471-9920-KUNDENNR',
    })).toEqual({ extractedPeriod: 'other' });
  });

  it('buckets an unsupported upload extension without echoing the file name', async () => {
    const { sanitizeAnalyticsProperties } = await import('../track');
    expect(sanitizeAnalyticsProperties('respond_upload_rejected', {
      ext: '.numbers',
    })).toEqual({ ext: 'other' });
    expect(sanitizeAnalyticsProperties('respond_upload_started', {
      ext: '.xlsx',
    })).toEqual({ ext: '.xlsx' });
  });

  it('keeps parse health signals and drops questionnaire identity', async () => {
    const { sanitizeAnalyticsProperties } = await import('../track');
    expect(sanitizeAnalyticsProperties('respond_parse_completed', {
      ext: '.xlsx',
      outcome: 'success',
      questions: 3,
      rows: 80,
      confidence: 'low',
      manual_mapping: false,
      thin: true,
      filename: 'Secret Buyer Questionnaire.xlsx',
      question_text: 'Describe confidential process details.',
    })).toEqual({
      ext: '.xlsx',
      outcome: 'success',
      questions: 3,
      rows: 80,
      confidence: 'low',
      manual_mapping: false,
      thin: true,
    });
  });
});
