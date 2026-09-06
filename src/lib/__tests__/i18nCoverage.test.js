import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { UI_LANGUAGES, t } from '../i18n';

// import.meta.url rather than __dirname: the repo's eslint config has no node
// globals, and this file is the only test that reads the source tree.
const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === '__tests__' ? [] : walk(full);
    return /\.(jsx?|ts)$/.test(e.name) ? [full] : [];
  });
}

// A key looks like 'section.name' — the dot is what keeps `searchParams.get('build')`
// and other calls ending in `t(` out of the results.
const KEY = /\bt\(\s*'([a-z][A-Za-z0-9]*\.[A-Za-z0-9.]+)'/g;

// Comments are stripped first: several files document t() usage in a JSDoc
// example, and a key that only exists in prose is not a key the app asks for.
function stripComments(source) {
  // No `$` anchor: these files are checked out with CRLF endings, and `.` will
  // not cross the trailing \r, so an anchored match never fires.
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .map((line) => line.replace(/^\s*\/\/.*/, ''))
    .join('\n');
}

const usedKeys = new Map(); // key -> first file that uses it
for (const file of walk(SRC)) {
  const source = stripComments(fs.readFileSync(file, 'utf8'));
  for (const m of source.matchAll(KEY)) {
    if (!usedKeys.has(m[1])) usedKeys.set(m[1], path.relative(SRC, file));
  }
}

describe('i18n coverage', () => {
  it('finds the keys the app actually asks for', () => {
    // A sanity floor: if the scan silently matched nothing, every assertion below
    // would pass while proving nothing.
    expect(usedKeys.size).toBeGreaterThan(300);
  });

  it.each(UI_LANGUAGES.map((l) => l.code))('resolves every used key in %s', (lang) => {
    const missing = [];
    for (const [key, file] of usedKeys) {
      const value = t(key, lang);
      // t() returns the key itself when nothing resolves (and '[[key]]' in dev).
      if (value === key || value === `[[${key}]]`) missing.push(`${key} (${file})`);
    }
    expect(missing, `untranslated in ${lang}`).toEqual([]);
  });

  it('offers only languages it has strings for', () => {
    // Guards the decision to drop the 5%-translated blocks: adding a code back to
    // UI_LANGUAGES without its strings fails here rather than in front of a user.
    expect(UI_LANGUAGES.map((l) => l.code)).toEqual(['en', 'de']);
  });
});
