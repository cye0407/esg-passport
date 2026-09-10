import { describe, expect, it, vi } from 'vitest';
import {
  clearDynamicImportRecovery,
  isDynamicImportFailure,
  recoverFromDynamicImportFailure,
} from '../dynamicImportRecovery';

describe('dynamic import recovery', () => {
  it('recognizes stale deployment chunk failures', () => {
    expect(isDynamicImportFailure(new TypeError('Failed to fetch dynamically imported module: https://example.com/assets/index-old.js'))).toBe(true);
    expect(isDynamicImportFailure(new Error('The workbook is invalid'))).toBe(false);
  });

  it('reloads through a cache-busting URL once', () => {
    const replace = vi.fn();
    const browserWindow = {
      location: { href: 'https://example.com/respond?request=123', replace },
    };

    expect(recoverFromDynamicImportFailure(new TypeError('Failed to fetch dynamically imported module'), browserWindow)).toBe(true);
    expect(replace).toHaveBeenCalledOnce();
    const replacement = new URL(replace.mock.calls[0][0]);
    expect(replacement.searchParams.get('request')).toBe('123');
    expect(replacement.searchParams.has('app-recovery')).toBe(true);
  });

  it('does not loop when the recovered deployment also fails', () => {
    const replace = vi.fn();
    const browserWindow = {
      location: { href: 'https://example.com/respond?app-recovery=123', replace },
    };

    expect(recoverFromDynamicImportFailure(new TypeError('Failed to fetch dynamically imported module'), browserWindow)).toBe(false);
    expect(replace).not.toHaveBeenCalled();
  });

  it('removes the recovery marker after the engine loads', () => {
    const replaceState = vi.fn();
    const browserWindow = {
      location: { href: 'https://example.com/respond?request=123&app-recovery=456' },
      history: { state: { key: 'route' }, replaceState },
    };

    clearDynamicImportRecovery(browserWindow);
    expect(replaceState).toHaveBeenCalledWith(
      { key: 'route' },
      '',
      'https://example.com/respond?request=123',
    );
  });
});
