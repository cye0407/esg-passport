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
    include: ['src/**/__tests__/**/*.test.{js,ts}'],
  },
});
