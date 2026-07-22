#!/usr/bin/env node
// Vendor drift guard.
//
// Production (Vercel) checks out ONLY this repo and builds against the committed
// vendored dependencies:
//   - vendor/response-ready/dist  (the engine, vendored as BUILT dist)
//   - vendor/esg-extract/src      (the extractor, vendored as SOURCE)
//
// If someone edits a sibling source repo (../response-ready or ../esg-extract) but
// forgets to re-run `scripts/release-passport.mjs`, the committed vendor copy silently
// goes stale and ships worse behavior than source. (This is exactly how vendor/esg-extract
// drifted to an eager `pdf-parse` import while source had already moved it lazy — 2026-07.)
//
// This script asserts each committed vendor copy matches its sibling source. For the engine
// it rebuilds dist from source first; the extractor is vendored verbatim, so it compares src
// directly. Run in CI (.github/workflows/verify-vendor.yml) and/or locally (`npm run verify:vendor`).
//
// If a sibling source repo is not present (e.g. a Vercel build that only checked out this
// repo), that check SKIPS with no error — there is nothing to compare against, and we must
// not break that build. Each check only enforces where both repos are available.

import { spawnSync } from 'child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const passportRoot = path.resolve(__dirname, '..');
const engineRoot = path.resolve(passportRoot, '../response-ready');
const extractRoot = path.resolve(passportRoot, '../esg-extract');

function log(msg) { console.log(`verify-vendor-dist: ${msg}`); }
function fail(msg) { console.error(`verify-vendor-dist: ${msg}`); process.exit(1); }

// Recursively collect relative file paths under a dir. `includeTests: false` drops
// __tests__ dirs — the vendored engine dist intentionally ships only the runtime engine
// (release-passport.mjs omits __tests__ from dist), so they are not part of its drift surface.
// The extractor is vendored verbatim (src copied whole, tests included), so it uses includeTests.
function listFiles(dir, { includeTests }, base = dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (!includeTests && entry === '__tests__') continue;
      listFiles(full, { includeTests }, base, acc);
    } else {
      acc.push(path.relative(base, full).split(path.sep).join('/'));
    }
  }
  return acc;
}

// Compare a committed vendor tree against a source tree; return an array of drift descriptions.
function compareTrees(label, sourceDir, vendorDir, { includeTests }) {
  if (!existsSync(sourceDir)) {
    log(`sibling source for ${label} not present (${sourceDir}) — skipping.`);
    return [];
  }
  if (!existsSync(vendorDir)) return [`${label}: committed vendor copy missing: ${vendorDir}`];

  const source = new Set(listFiles(sourceDir, { includeTests }));
  const vendored = new Set(listFiles(vendorDir, { includeTests }));
  const drift = [];
  for (const rel of source) {
    if (!vendored.has(rel)) { drift.push(`${label}: missing from vendor: ${rel}`); continue; }
    const a = readFileSync(path.join(sourceDir, rel));
    const b = readFileSync(path.join(vendorDir, rel));
    if (!a.equals(b)) drift.push(`${label}: content differs: ${rel}`);
  }
  for (const rel of vendored) {
    if (!source.has(rel)) drift.push(`${label}: stale in vendor (not in source): ${rel}`);
  }
  return drift;
}

const drift = [];

// --- Engine: rebuild dist from source, then compare (dist, tests excluded) ---
if (existsSync(path.join(engineRoot, 'src', 'index.ts'))) {
  log('building engine from ../response-ready source...');
  const build = spawnSync('npm', ['run', 'build'], {
    cwd: engineRoot,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    stdio: 'inherit',
  });
  if (build.status !== 0) fail('engine build (npm run build in ../response-ready) failed.');
  drift.push(...compareTrees(
    'response-ready/dist',
    path.join(engineRoot, 'dist'),
    path.join(passportRoot, 'vendor', 'response-ready', 'dist'),
    { includeTests: false },
  ));
} else {
  log('sibling ../response-ready source not present — skipping engine drift check.');
}

// --- Extractor: vendored verbatim as source, compare src directly (tests included) ---
drift.push(...compareTrees(
  'esg-extract/src',
  path.join(extractRoot, 'src'),
  path.join(passportRoot, 'vendor', 'esg-extract', 'src'),
  { includeTests: true },
));

if (drift.length > 0) {
  console.error('verify-vendor-dist: VENDORED DEPENDENCIES ARE OUT OF SYNC WITH SOURCE.');
  console.error('Run `npm run release` (or scripts/release-passport.mjs) to re-vendor, then commit.');
  console.error('Drift:');
  for (const d of drift.slice(0, 40)) console.error(`  - ${d}`);
  if (drift.length > 40) console.error(`  ...and ${drift.length - 40} more`);
  process.exit(1);
}

log('OK — all vendored dependencies match source.');
process.exit(0);
