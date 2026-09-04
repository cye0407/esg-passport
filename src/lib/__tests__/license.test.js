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

  // The real Lemon Squeezy product is named "ESG Passport Questionnaire Pass".
  // The name fallback must NOT resolve it to a full Passport tier: if the variant
  // ID is ever missing or wrong, a EUR 99 buyer must be blocked, never silently
  // handed the EUR 499 product.
  it('never maps the real Questionnaire Pass product name to a full Passport tier', async () => {
    const { tierFromResponse } = await import('../license');
    expect(tierFromResponse({ meta: { product_name: 'ESG Passport Questionnaire Pass' } }, '')).toBeNull();
    expect(tierFromResponse({
      meta: { product_name: 'ESG Passport Questionnaire Pass', variant_id: 2090065 },
    }, '2090065')).toBe('questionnaire-pass');
  });

  it('matches the full Passport by variant ID, ahead of the product-name fallback', async () => {
    const { tierFromResponse } = await import('../license');
    // Renamed product, but the immutable variant ID still resolves it.
    expect(tierFromResponse({
      meta: { product_name: 'ESG Passport 2026 Edition', variant_id: 1532536 },
    }, '2090065', '1532536')).toBe('pro');
    // Legacy products with no configured variant still fall back to the name map.
    expect(tierFromResponse({
      meta: { product_name: 'ESG Passport Pro Plus', variant_id: 999 },
    }, '2090065', '1532536')).toBe('pro-plus');
    // The Pass variant wins over the Passport variant, never the other way round.
    expect(tierFromResponse({
      meta: { product_name: 'ESG Passport Questionnaire Pass', variant_id: 2090065 },
    }, '2090065', '1532536')).toBe('questionnaire-pass');
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


  // --- Revocation must require a definitive verdict from Lemon Squeezy -------
  // A wrongly revoked license cannot always be reactivated: the remote instance
  // stays active, so an activation-limited key locks the customer out for good.
  const storedPro = () => JSON.stringify({
    key: 'abcd-1234',
    instance_id: 'existing-instance',
    activated_at: '2026-01-01T00:00:00.000Z',
    last_validated: '2026-01-01T00:00:00.000Z',
    tier: 'pro',
  });

  it.each([
    ['a 5xx from the license API', () => mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 502,
      headers: { get: () => 'application/json' },
      json: async () => ({ error: 'Could not reach license server' }),
    })],
    ['a non-JSON response (HTML error page)', () => mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      headers: { get: () => 'text/html' },
      json: async () => ({}),
    })],
    ['a network-level throw', () => mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))],
    ['a malformed JSON body', () => mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => { throw new SyntaxError('Unexpected token'); },
    })],
  ])('keeps a paid license when revalidation hits %s', async (_label, arrange) => {
    localStorage.setItem('esg_passport_license', storedPro());
    arrange();
    const { revalidateStoredLicense } = await import('../license');

    await revalidateStoredLicense();

    expect(localStorage.getItem('esg_passport_license')).not.toBeNull();
  });

  it('revokes only when Lemon Squeezy definitively rejects the key', async () => {
    localStorage.setItem('esg_passport_license', storedPro());
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      headers: { get: () => 'application/json' },
      json: async () => ({ error: 'expired' }),
    });
    const { revalidateStoredLicense } = await import('../license');

    expect(await revalidateStoredLicense()).toBe(false);
    expect(localStorage.getItem('esg_passport_license')).toBeNull();
  });

  // --- The name fallback must not be able to promote a Pass to full access ---
  it('refuses the product-name fallback when the Pass variant ID is unconfigured', async () => {
    const { tierFromResponse } = await import('../license');
    // The exact shape Lemon Squeezy returns if the Pass is sold as a variant of
    // the existing "ESG Passport" product and the build lost its Pass variant ID.
    const passSoldUnderPassportProduct = {
      meta: { product_name: 'ESG Passport', variant_id: 2090065 },
    };
    expect(tierFromResponse(passSoldUnderPassportProduct, '', '')).toBeNull();
    expect(tierFromResponse(passSoldUnderPassportProduct, '', '')).not.toBe('pro');
    // Configured build: the same response resolves to the Pass, never to pro.
    expect(tierFromResponse(passSoldUnderPassportProduct, '2090065', '1532536'))
      .toBe('questionnaire-pass');
  });

  it('does not upgrade a known tier when validation falls back offline', async () => {
    // A Questionnaire Pass holder opening the downloaded (file:) build must not
    // be silently promoted to the full Passport.
    localStorage.setItem('esg_passport_license', JSON.stringify({
      key: 'abcd-1234',
      instance_id: 'existing-instance',
      activated_at: '2026-01-01T00:00:00.000Z',
      last_validated: '2026-01-01T00:00:00.000Z',
      tier: 'questionnaire-pass',
    }));
    Object.defineProperty(window, 'location', {
      value: { hostname: '', protocol: 'file:', pathname: '/index.html', search: '', hash: '' },
      writable: true,
      configurable: true,
    });
    mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    const { validateLicenseKey } = await import('../license');

    const result = await validateLicenseKey('abcd-1234');

    expect(result.valid).toBe(true);
    expect(result.fallback).toBe(true);
    expect(result.tier).toBe('questionnaire-pass');
    expect(result.tier).not.toBe('pro');
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
