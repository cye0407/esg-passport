import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { handleDemoQueryParam } from '../demoData';

// The finding this guards against: `?demo=reset` in a URL hash ran the full
// wipe — workspace, licence, everything — before routing, with no confirmation
// and no server-side copy to restore from. A link was enough. It is now a
// development-build affordance and nothing else.

const KEY = 'esg_passport_data';
const LICENSE_KEY = 'esg_passport_license';

const seedWorkspace = () => {
  localStorage.setItem(KEY, JSON.stringify({ records: [{ period: '2025-03' }] }));
  localStorage.setItem(LICENSE_KEY, JSON.stringify({ key: 'PASSPORT-KEY', tier: 'pro' }));
};

const setHash = hash => {
  window.location.hash = hash;
};

describe('demo URL parameters in a production build', () => {
  beforeEach(() => {
    localStorage.clear();
    seedWorkspace();
    vi.stubEnv('DEV', false);
    vi.stubEnv('PROD', true);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    setHash('');
  });

  it.each(['#/?demo=reset', '#/?demo=load', '#/settings?demo=reset'])(
    'ignores %s entirely',
    hash => {
      setHash(hash);
      expect(handleDemoQueryParam()).toBeNull();
      expect(localStorage.getItem(KEY)).toContain('2025-03');
      expect(localStorage.getItem(LICENSE_KEY)).toContain('PASSPORT-KEY');
    },
  );

  it('does not even ask — there is no prompt to click through', () => {
    const confirmSpy = vi.fn(() => true);
    vi.stubGlobal('confirm', confirmSpy);
    setHash('#/?demo=reset');
    handleDemoQueryParam();
    expect(confirmSpy).not.toHaveBeenCalled();
  });
});

describe('demo URL parameters in a development build', () => {
  beforeEach(() => {
    localStorage.clear();
    seedWorkspace();
    vi.stubEnv('DEV', true);
    vi.stubEnv('PROD', false);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    setHash('');
  });

  it('asks before wiping, and keeps the workspace when the answer is no', () => {
    vi.stubGlobal('confirm', vi.fn(() => false));
    setHash('#/?demo=reset');
    expect(handleDemoQueryParam()).toBeNull();
    expect(localStorage.getItem(KEY)).toContain('2025-03');
    expect(localStorage.getItem(LICENSE_KEY)).toContain('PASSPORT-KEY');
  });

  it('asks before seeding demo data over a real workspace', () => {
    const confirmSpy = vi.fn(() => false);
    vi.stubGlobal('confirm', confirmSpy);
    setHash('#/?demo=load');
    expect(handleDemoQueryParam()).toBeNull();
    expect(confirmSpy).toHaveBeenCalledOnce();
    expect(localStorage.getItem(KEY)).toContain('2025-03');
  });

  it('leaves a hash with no demo parameter alone', () => {
    setHash('#/data');
    expect(handleDemoQueryParam()).toBeNull();
  });
});
