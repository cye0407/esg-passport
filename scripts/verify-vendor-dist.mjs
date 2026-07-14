#!/usr/bin/env node
// Vendor-dist drift guard.
//
// Production (Vercel) checks out ONLY this repo and builds against the committed
// vendored engine at `vendor/response-ready/dist`. If someone edits the engine source in
// the sibling `../response-ready` repo but forgets to re-run `scripts/release-passport.mjs`,
// the committed vendor dist silently goes stale and ships worse behavior than source.
//
// This script rebuilds the engine from the sibling source and asserts the committed vendor
// dist is byte-identical. Run it in CI (see .github/workflows/verify-vendor.yml) and/or
// locally (`npm run verify:vendor`).
//
// If the sibling `../response-ready` source is not present (e.g. a Vercel build that only
// checked out this repo), it SKIPS with exit 0 — there is nothing to compare against, and we
// must not break that build. The check only enforces where both repos are available.

import { spawnSync } from 'child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const passportRoot = path.resolve(__dirname, '..');
const engineRoot = path.resolve(passportRoot, '../response-ready');
const engineSrc = path.join(engineRoot, 'src', 'index.ts');
const engineDist = path.join(engineRoot, 'dist');
const vendorDist = path.join(passportRoot, 'vendor', 'response-ready', 'dist');

function log(msg) { console.log(`verify-vendor-dist: ${msg}`); }
function fail(msg) { console.error(`verify-vendor-dist: ${msg}`); process.exit(1); }

if (!existsSync(engineSrc)) {
  log('sibling ../response-ready source not present — skipping drift check (exit 0).');
  process.exit(0);
}

// Rebuild the engine dist from source (tsc).
log('building engine from ../response-ready source...');
const build = spawnSync('npm', ['run', 'build'], {
  cwd: engineRoot,
  encoding: 'utf8',
  shell: process.platform === 'win32',
  stdio: 'inherit',
});
if (build.status !== 0) fail('engine build (npm run build in ../response-ready) failed.');

if (!existsSync(engineDist)) fail(`engine dist missing after build: ${engineDist}`);
if (!existsSync(vendorDist)) fail(`committed vendor dist missing: ${vendorDist}`);

// Recursively collect relative file paths under a dir. Test files and fixtures under
// __tests__ are excluded — the vendored dist intentionally ships only the runtime engine
// (release-passport.mjs omits __tests__), so they are not part of the drift surface.
function listFiles(dir, base = dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === '__tests__') continue;
      listFiles(full, base, acc);
    } else {
      acc.push(path.relative(base, full).split(path.sep).join('/'));
    }
  }
  return acc;
}

const freshFiles = new Set(listFiles(engineDist));
const vendoredFiles = new Set(listFiles(vendorDist));

const drift = [];
for (const rel of freshFiles) {
  if (!vendoredFiles.has(rel)) { drift.push(`missing from vendor: ${rel}`); continue; }
  const a = readFileSync(path.join(engineDist, rel));
  const b = readFileSync(path.join(vendorDist, rel));
  if (!a.equals(b)) drift.push(`content differs: ${rel}`);
}
for (const rel of vendoredFiles) {
  if (!freshFiles.has(rel)) drift.push(`stale in vendor (not produced by build): ${rel}`);
}

if (drift.length > 0) {
  console.error('verify-vendor-dist: VENDORED ENGINE DIST IS OUT OF SYNC WITH SOURCE.');
  console.error('Run `npm run release` (or scripts/release-passport.mjs) to re-vendor, then commit.');
  console.error('Drift:');
  for (const d of drift.slice(0, 40)) console.error(`  - ${d}`);
  if (drift.length > 40) console.error(`  ...and ${drift.length - 40} more`);
  process.exit(1);
}

log(`OK — vendored engine dist matches source (${freshFiles.size} files).`);
process.exit(0);
