import { defineConfig } from 'vitest/config';
import path from 'path';
import { existsSync } from 'fs';

// Resolve the engine and extractor the same way vite.config.js does: sibling
// source when it is checked out, committed vendor copy otherwise.
//
// This file used to point at ../response-ready/src/index.ts unconditionally, so
// the suite could only run on a machine with the sibling repos beside it. In CI,
// which checks out this repo alone, respondEngineIntegration.test.js failed to
// load at all — and since nothing ran the tests in CI, nobody found out.
const localEngine = path.resolve(__dirname, '../response-ready');
const vendorEngine = path.resolve(__dirname, './vendor/response-ready/dist');
const localExtract = path.resolve(__dirname, '../esg-extract');
const vendorExtract = path.resolve(__dirname, './vendor/esg-extract/src');

const alias = {
  '@': path.resolve(__dirname, './src'),
};

if (existsSync(path.join(localEngine, 'src/index.ts'))) {
  alias['response-ready/domain-packs/esg'] = path.resolve(localEngine, 'domain-packs/esg/index.ts');
  alias['response-ready'] = path.resolve(localEngine, 'src/index.ts');
} else if (existsSync(path.join(vendorEngine, 'src/index.js'))) {
  alias['response-ready/domain-packs/esg'] = path.resolve(vendorEngine, 'domain-packs/esg/index.js');
  alias['response-ready'] = path.resolve(vendorEngine, 'src/index.js');
}

if (existsSync(path.join(localExtract, 'src/index.ts'))) {
  alias['esg-extract'] = path.resolve(localExtract, 'src/index.ts');
  alias['@extract'] = path.resolve(localExtract, 'src');
} else if (existsSync(path.join(vendorExtract, 'index.ts'))) {
  alias['esg-extract'] = path.resolve(vendorExtract, 'index.ts');
  alias['@extract'] = vendorExtract;
}

export default defineConfig({
  resolve: { alias },
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
