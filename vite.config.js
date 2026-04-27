import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { existsSync, readFileSync } from 'fs'
import { execSync } from 'child_process'

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))
const localResponseReadyRoot = path.resolve(__dirname, '../response-ready')
const localEsgExtractRoot = path.resolve(__dirname, '../esg-extract')
const bundledResponseReadyRoot = path.resolve(__dirname, './vendor/response-ready/dist')
const bundledEsgExtractRoot = path.resolve(__dirname, './vendor/esg-extract/src')
const alias = {
  '@': path.resolve(__dirname, './src'),
}

function getPassportSha() {
  try {
    return execSync('git rev-parse --short HEAD', {
      cwd: __dirname,
      encoding: 'utf8',
    }).trim()
  } catch {
    return 'dev'
  }
}

if (existsSync(path.join(localResponseReadyRoot, 'src/index.ts'))) {
  alias['response-ready/domain-packs/esg'] = path.resolve(localResponseReadyRoot, 'domain-packs/esg/index.ts')
  alias['response-ready'] = path.resolve(localResponseReadyRoot, 'src/index.ts')
} else if (existsSync(path.join(bundledResponseReadyRoot, 'src/index.js'))) {
  alias['response-ready/domain-packs/esg'] = path.resolve(bundledResponseReadyRoot, 'domain-packs/esg/index.js')
  alias['response-ready'] = path.resolve(bundledResponseReadyRoot, 'src/index.js')
}

if (existsSync(path.join(localEsgExtractRoot, 'src/index.ts'))) {
  alias['esg-extract'] = path.resolve(localEsgExtractRoot, 'src/index.ts')
  alias['@extract'] = path.resolve(localEsgExtractRoot, 'src')
} else if (existsSync(path.join(bundledEsgExtractRoot, 'index.ts'))) {
  alias['esg-extract'] = path.resolve(bundledEsgExtractRoot, 'index.ts')
  alias['@extract'] = bundledEsgExtractRoot
}

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __PASSPORT_SHA__: JSON.stringify(getPassportSha()),
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias,
  },
})
