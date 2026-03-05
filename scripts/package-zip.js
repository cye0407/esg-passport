/**
 * Package the built ESG Passport app into a downloadable zip.
 * Copies dist/ contents + README.txt + demo-data.csv into esg-passport.zip
 */

import { execSync } from 'child_process';
import { cpSync, existsSync, mkdirSync, rmSync, copyFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const distDir = path.join(root, 'dist');
const stagingDir = path.join(root, 'package-staging');
const outputZip = path.join(root, 'esg-passport.zip');

// Verify dist exists
if (!existsSync(distDir)) {
  console.error('Error: dist/ not found. Run "npm run build" first.');
  process.exit(1);
}

// Clean staging
if (existsSync(stagingDir)) rmSync(stagingDir, { recursive: true });
mkdirSync(stagingDir, { recursive: true });

// Copy dist contents into staging
cpSync(distDir, stagingDir, { recursive: true });

// Copy README.txt
const readmeSrc = path.join(root, 'README.txt');
if (existsSync(readmeSrc)) {
  copyFileSync(readmeSrc, path.join(stagingDir, 'README.txt'));
}

// Copy demo-data.csv
const demoSrc = path.join(root, 'demo-data.csv');
if (existsSync(demoSrc)) {
  copyFileSync(demoSrc, path.join(stagingDir, 'demo-data.csv'));
}

// Remove old zip
if (existsSync(outputZip)) rmSync(outputZip);

// Create zip using PowerShell (Windows) or zip (Unix)
try {
  if (process.platform === 'win32') {
    execSync(
      `powershell -Command "Compress-Archive -Path '${stagingDir}\\*' -DestinationPath '${outputZip}'"`,
      { stdio: 'inherit' }
    );
  } else {
    execSync(`cd "${stagingDir}" && zip -r "${outputZip}" .`, { stdio: 'inherit' });
  }
  console.log(`\nPackaged: esg-passport.zip`);
} catch (err) {
  console.error('Failed to create zip:', err.message);
  process.exit(1);
} finally {
  // Clean staging
  rmSync(stagingDir, { recursive: true, force: true });
}
