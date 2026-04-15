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
        json: async () => ({ valid: true, instance: { id: 'resolved-instance' } }),
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

  it('preserves the original activation timestamp during revalidation', async () => {
    const { storeLicense, revalidateStoredLicense, getStoredLicense } = await import('../license');
    storeLicense('abcd-1234', 'existing-instance', {
      activated_at: '2026-01-01T00:00:00.000Z',
      last_validated: '2026-01-01T00:00:00.000Z',
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ valid: true, instance: { id: 'existing-instance' } }),
    });

    const result = await revalidateStoredLicense();

    expect(result).toBe(true);
    expect(getStoredLicense()).toMatchObject({
      activated_at: '2026-01-01T00:00:00.000Z',
      instance_id: 'existing-instance',
      instance_name: 'web-test-instance-id',
    });
  });
});
