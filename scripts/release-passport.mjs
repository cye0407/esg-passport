import { cp, readFile, rm, stat, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const passportRoot = path.resolve(__dirname, '..');
const extractRoot = path.resolve(passportRoot, '../esg-extract');
const engineRoot = path.resolve(passportRoot, '../response-ready');
const releaseStart = Date.now();

function fail(message) {
  console.error(`release-passport: ${message}`);
  process.exit(1);
}

function run(command, args, cwd, options = {}) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    stdio: options.capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
  });

  if (result.status !== 0) {
    if (options.capture) {
      const stderr = (result.stderr || '').trim();
      const stdout = (result.stdout || '').trim();
      if (stderr) console.error(stderr);
      if (stdout) console.error(stdout);
    }
    fail(`${command} ${args.join(' ')} failed in ${cwd}`);
  }

  return options.capture ? (result.stdout || '').trim() : '';
}

function git(args, cwd, capture = true) {
  return run('git', args, cwd, { capture });
}

function npm(command, cwd) {
  const executable = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  run(executable, ['run', command], cwd);
}

function ensureCleanRepo(repoPath, label) {
  const status = git(['status', '--porcelain'], repoPath);
  if (status) fail(`${label} has uncommitted changes`);
}

function ensureBranch(repoPath, label, branchName) {
  const branch = git(['rev-parse', '--abbrev-ref', 'HEAD'], repoPath);
  if (branch !== branchName) fail(`${label} must be on ${branchName}, got ${branch}`);
}

function ensureUpToDate(repoPath, label) {
  const upstream = git(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}'], repoPath);
  if (!upstream) fail(`${label} has no upstream configured`);
  const ahead = git(['rev-list', 'HEAD..@{u}'], repoPath);
  if (ahead) fail(`${label} is behind ${upstream}`);
}

function getShortSha(repoPath) {
  return git(['rev-parse', '--short', 'HEAD'], repoPath);
}

async function syncDirectory(source, destination) {
  await rm(destination, { recursive: true, force: true });
  await cp(source, destination, { recursive: true, force: true });
}

async function fileIsNewerThan(filePath, timestamp) {
  const info = await stat(filePath);
  return info.mtimeMs >= timestamp;
}

async function writeBuildInfo({ extractSha, engineSha }) {
  const packageJsonPath = path.join(passportRoot, 'package.json');
  const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));
  const buildInfoPath = path.join(passportRoot, 'src', 'buildInfo.json');
  const existing = JSON.parse(await readFile(buildInfoPath, 'utf8'));
  const desired = {
    passportVersion: packageJson.version,
    passportSha: getShortSha(passportRoot),
    extractSha,
    engineSha,
    builtAt: new Date().toISOString(),
  };

  const needsRewrite =
    existing.passportVersion !== desired.passportVersion ||
    existing.extractSha !== desired.extractSha ||
    existing.engineSha !== desired.engineSha ||
    existing.passportSha !== desired.passportSha;

  if (!needsRewrite) return false;

  await writeFile(buildInfoPath, `${JSON.stringify(desired, null, 2)}\n`, 'utf8');
  return true;
}

function hasStagedChanges() {
  const result = spawnSync('git', ['diff', '--cached', '--quiet'], {
    cwd: passportRoot,
    stdio: 'ignore',
  });
  if (result.status === 0) return false;
  if (result.status === 1) return true;
  fail('Could not determine staged changes');
}

async function main() {
  ensureCleanRepo(passportRoot, 'esg-passport');
  ensureBranch(passportRoot, 'esg-passport', 'main');

  const upstreamRepos = [
    { name: 'esg-extract', root: extractRoot },
    { name: 'response-ready', root: engineRoot },
  ];

  for (const repo of upstreamRepos) {
    ensureCleanRepo(repo.root, repo.name);
    ensureBranch(repo.root, repo.name, 'main');
    ensureUpToDate(repo.root, repo.name);
    console.log(`${repo.name}: ${getShortSha(repo.root)}`);
  }

  for (const repo of upstreamRepos) {
    npm('test', repo.root);
  }

  npm('build', engineRoot);
  const engineEntry = path.join(engineRoot, 'dist', 'src', 'index.js');
  const engineFresh = await fileIsNewerThan(engineEntry, releaseStart);
  if (!engineFresh) fail('response-ready build output is missing or stale');

  const vendorExtractDest = path.join(passportRoot, 'vendor', 'esg-extract', 'src');
  const vendorEngineDest = path.join(passportRoot, 'vendor', 'response-ready', 'dist');
  await syncDirectory(path.join(extractRoot, 'src'), vendorExtractDest);
  await syncDirectory(path.join(engineRoot, 'dist'), vendorEngineDest);

  const extractSha = getShortSha(extractRoot);
  const engineSha = getShortSha(engineRoot);
  await writeBuildInfo({ extractSha, engineSha });

  npm('test', passportRoot);
  npm('build', passportRoot);

  git(['add', 'vendor/esg-extract', 'vendor/response-ready', 'src/buildInfo.json'], passportRoot, false);

  if (hasStagedChanges()) {
    const message = `chore(release): sync vendored deps

esg-extract: ${extractSha}
response-ready: ${engineSha}`;
    run('git', ['commit', '-m', message], passportRoot);
  } else {
    console.log('No vendor or build-info changes to commit.');
  }

  run('git', ['push', 'origin', 'main'], passportRoot);
  console.log('Vercel: check the latest production deployment for main.');
  console.log('vercel --prod  # auto-deploy is off, run this manually');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
