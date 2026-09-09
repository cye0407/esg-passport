import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

// A lint run is only worth gating CI on if it is looking at code someone wrote.
// Before these ignores, `eslint .` reported 880 errors — 795 of them inside
// .vercel/output (Vercel's own build artifact), 35 in the vendored engine dist,
// 8 in a Codex cache. All generated, none of it ours to fix, and it buried the
// ~40 real findings so thoroughly that the number got quoted as evidence of a
// quality problem in the app. It was evidence of linting a build directory.
export default defineConfig([
  globalIgnores([
    'dist',
    'dist-download',
    // Vercel's build output. Gitignored, minified, not ours.
    '.vercel',
    // Committed third-party build output — the engine ships as vendored dist,
    // and its drift is guarded by scripts/verify-vendor-dist.mjs, not by lint.
    'vendor',
    // Tooling caches and generated export fixtures.
    '.codex-cache',
    'phase0testing',
    'coverage',
  ]),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        // Injected by vite.config.js `define` at build time.
        __APP_VERSION__: 'readonly',
        __PASSPORT_SHA__: 'readonly',
      },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // Without eslint-plugin-react, ESLint cannot see that a capitalised
      // identifier is used as a JSX tag, so every component would read as
      // unused. varsIgnorePattern already covers imports; args covers the
      // `{ icon: Icon }` render-prop pattern, which is the same blind spot.
      'no-unused-vars': ['error', {
        varsIgnorePattern: '^[A-Z_]',
        argsIgnorePattern: '^_|^[A-Z]',
      }],
      // HMR-only advice: a file exporting both a component and a constant
      // reloads less gracefully in dev. Never a production defect, and the
      // shadcn/ui components ship their variant objects this way by design,
      // so it should not be able to fail a release.
      'react-refresh/only-export-components': 'warn',
      // An empty catch is how this codebase says "best effort, carry on"
      // (localStorage in private mode, a malformed stored blob). Requiring a
      // comment keeps that deliberate without demanding a fake handler.
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
  {
    // Config, build scripts and serverless handlers run in Node, not a browser.
    files: [
      '*.config.js',
      'scripts/**/*.{js,mjs}',
      'api/**/*.js',
    ],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
])
