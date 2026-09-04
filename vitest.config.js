import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      'response-ready/domain-packs/esg': path.resolve(__dirname, '../response-ready/domain-packs/esg/index.ts'),
      'response-ready': path.resolve(__dirname, '../response-ready/src/index.ts'),
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
