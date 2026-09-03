import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockFetch = vi.fn();

vi.stubGlobal('fetch', mockFetch);

describe('license flow', () => {
  beforeEach(async () => {
    localStorage.clear();
    mockFetch.mockReset();
    vi.resetModules();
    Object.defineProperty(window, 'crypto', {
      value: {
        ...(window.crypto || {}),
        randomUUID: vi.fn(() => 'test-instance-id'),
      },
      configurable: true,
    });
  });

  it('resolves Questionnaire Pass only from its configured variant ID', async () => {
    const { tierFromResponse } = await import('../license');
    expect(tierFromResponse({
      meta: { product_name: 'Questionnaire Pass', variant_id: 98765 },
    }, '98765')).toBe('questionnaire-pass');
    expect(tierFromResponse({
      meta: { product_name: 'Questionnaire Pass', variant_id: 11111 },
    }, '98765')).toBeNull();
  });

  it.each([
    ['ESG Passport', 'pro'],
    ['ESG Passport Pro', 'pro'],
    ['ESG Passport Pro+', 'pro-plus'],
    ['ESG Passport Pro Plus', 'pro-plus'],
  ])('keeps the known paid product %s mapped to %s', async (productName, expectedTier) => {
    const { tierFromResponse } = await import('../license');
    expect(tierFromResponse({ meta: { product_name: productName } }, '98765')).toBe(expectedTier);
  });

  it('does not grant access to an unfamiliar Lemon Squeezy product', async () => {
    const { tierFromResponse, validateLicenseKey } = await import('../license');
    expect(tierFromResponse({ meta: { product_name: 'Unrelated Product', variant_id: 123 } }, '98765')).toBeNull();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({
        valid: true,
        meta: { product_name: 'Unrelated Product', variant_id: 123 },
        license_key: { id: 77 },
        instance: { id: 'unknown-instance' },
      }),
    });

    await expect(validateLicenseKey('abcd-1234')).resolves.toMatchObject({
      valid: false,
      code: 'unrecognized_product',
    });
  });

  it('keeps local license state when remote deactivation fails', async () => {
    const { storeLicense, deactivateLicense, getStoredLicense } = await import('../license');
    storeLicense('abcd-1234', 'remote-instance');

    mockFetch.mockResolvedValueOnce({
      ok: false,
      headers: { get: () => 'application/json' },
      json: async () => ({ error: 'limit_reached' }),
    });

    const result = await deactivateLicense();

    expect(result.ok).toBe(false);
    expect(getStoredLicense()).toMatchObject({
      key: 'abcd-1234',
      instance_id: 'remote-instance',
    });
  });

  it('re-resolves missing instance_id before deactivating', async () => {
    const { storeLicense, deactivateLicense, getStoredLicense } = await import('../license');
    storeLicense('abcd-1234', null);

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => ({
          valid: true,
          meta: { product_name: 'ESG Passport' },
          license_key: { id: 42 },
          instance: { id: 'resolved-instance' },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => ({ deactivated: true }),
      });

    const result = await deactivateLicense();

    expect(result.ok).toBe(true);
    expect(getStoredLicense()).toBeNull();
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('/api/deactivate-license'),
      expect.objectContaining({
        body: JSON.stringify({
          license_key: 'abcd-1234',
          instance_id: 'resolved-instance',
        }),
      }),
    );
  });

  it('clears the local license when the server says it was already deactivated', async () => {
    const { storeLicense, deactivateLicense, getStoredLicense } = await import('../license');
    storeLicense('abcd-1234', 'remote-instance');

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      headers: { get: () => 'application/json' },
      json: async () => ({ error: 'not_found' }),
    });

    const result = await deactivateLicense();

    expect(result).toEqual({ ok: true, reconciled: true });
    expect(getStoredLicense()).toBeNull();
  });

  it('reconciles local state when the license is disabled on the server', async () => {
    const { storeLicense, deactivateLicense, getStoredLicense } = await import('../license');
    storeLicense('abcd-1234', 'remote-instance');

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      headers: { get: () => 'application/json' },
      json: async () => ({ error: 'disabled' }),
    });

    const result = await deactivateLicense();

    expect(result).toEqual({ ok: true, reconciled: true });
    expect(getStoredLicense()).toBeNull();
  });

  it('reconciles local state when the license is expired on the server', async () => {
    const { storeLicense, deactivateLicense, getStoredLicense } = await import('../license');
    storeLicense('abcd-1234', 'remote-instance');

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      headers: { get: () => 'application/json' },
      json: async () => ({ error: 'expired' }),
    });

    const result = await deactivateLicense();

    expect(result).toEqual({ ok: true, reconciled: true });
    expect(getStoredLicense()).toBeNull();
  });

  it('reconciles local state when the recovery revalidation finds the license gone', async () => {
    const { storeLicense, deactivateLicense, getStoredLicense } = await import('../license');
    storeLicense('abcd-1234', null);

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      headers: { get: () => 'application/json' },
      json: async () => ({ error: 'not_found' }),
    });

    const result = await deactivateLicense();

    expect(result).toEqual({ ok: true, reconciled: true });
    expect(getStoredLicense()).toBeNull();
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('preserves the original activation timestamp during revalidation', async () => {
    const { storeLicense, revalidateStoredLicense, getStoredLicense } = await import('../license');
    storeLicense('abcd-1234', 'existing-instance', {
      activated_at: '2026-01-01T00:00:00.000Z',
      last_validated: '2026-01-01T00:00:00.000Z',
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({
        valid: true,
        meta: { product_name: 'ESG Passport' },
        license_key: { id: 42 },
        instance: { id: 'existing-instance' },
      }),
    });

    const result = await revalidateStoredLicense();

    expect(result).toBe(true);
    expect(getStoredLicense()).toMatchObject({
      activated_at: '2026-01-01T00:00:00.000Z',
      instance_id: 'existing-instance',
      instance_name: 'web-test-instance-id',
      license_key_id: 42,
    });
  });

  it('fails closed for an unfamiliar tier stored locally', async () => {
    localStorage.setItem('esg_passport_license', JSON.stringify({
      key: 'abcd-1234',
      activated_at: '2026-01-01T00:00:00.000Z',
      last_validated: new Date().toISOString(),
      tier: 'unknown-product',
    }));
    const { getLicenseTier, hasActiveLicense } = await import('../license');
    expect(getLicenseTier()).toBe('free');
    expect(hasActiveLicense()).toBe(false);
  });
});
