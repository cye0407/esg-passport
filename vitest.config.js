import { defineConfig } from 'vitest/config';
import path from 'path';
import { existsSync } from 'fs';

// Mirrors vite.config.js: prefer the sibling source, fall back to the vendored copy.
// Without these, anything importing BillDrop fails to resolve @extract and the test file
// cannot even load — which is why the pages that use it had no mount coverage at all.
const siblingExtract = path.resolve(__dirname, '../esg-extract/src');
const vendoredExtract = path.resolve(__dirname, './vendor/esg-extract/src');
const extractRoot = existsSync(path.join(siblingExtract, 'index.ts')) ? siblingExtract : vendoredExtract;

export default defineConfig({
  resolve: {
    alias: {
      'response-ready/domain-packs/esg': path.resolve(__dirname, '../response-ready/domain-packs/esg/index.ts'),
      'response-ready': path.resolve(__dirname, '../response-ready/src/index.ts'),
      '@extract': extractRoot,
      'esg-extract': path.join(extractRoot, 'index.ts'),
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    // jsdom defaults to http://localhost, which makes isLocalDev() true and
    // routes license validation through the local-dev fallback — so the suite
    // silently exercised a path no customer runs. Pin the deployed origin;
    // tests that specifically want dev behaviour must opt in.
    environmentOptions: { jsdom: { url: 'https://esgforsuppliers.com/app/' } },
    include: ['src/**/__tests__/**/*.test.{js,ts}'],
  },
});
