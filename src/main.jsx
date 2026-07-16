import React from 'react'
import ReactDOM from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import App from './App.jsx'
import './index.css'

// Dev-only console helper for capturing marketing screenshots of the German UI.
//
// SAFETY: Vite statically replaces `import.meta.env.DEV` with `false` in a
// production build, so this whole block is dead-code-eliminated and `devDE`
// does not exist in anything we ship. It is only reachable from `npm run dev`
// on localhost. Do not move the licence seed below into app code — the fact
// that it lives behind this guard is the only thing keeping it out of prod.
//
// Usage: run `npm run dev`, open the app, then in the console:  devDE()
if (import.meta.env.DEV) {
  window.devDE = async () => {
    const { loadDemoData } = await import('@/lib/demoData')
    const { loadData, saveData } = await import('@/lib/store')

    loadDemoData() // Hartmann Precision, 280 FTE, Düsseldorf + 12 months of data

    // loadDemoData() hardcodes settings.language = 'en' (the answer/export
    // language, separate from the UI language) — flip both to German.
    const data = loadData()
    data.settings = { ...data.settings, language: 'de', uiLanguage: 'de' }
    saveData(data)

    // Unlock Bericht (#/report) and Antworten (#/respond). revalidateStoredLicense()
    // early-returns while last_validated is < 7 days old and tier is set, so this
    // never calls the licence API.
    const now = new Date().toISOString()
    localStorage.setItem('esg_passport_license', JSON.stringify({
      key: 'LOCAL-DEV-SCREENSHOT-ONLY',
      instance_id: null,
      instance_name: 'web-local-dev',
      activated_at: now,
      last_validated: now,
      tier: 'pro',
    }))

    console.log('%c✓ Demo loaded, unlocked, German UI + German answers', 'color:#16a34a;font-weight:bold')
    window.location.hash = '#/'
    window.location.reload()
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Analytics />
  </React.StrictMode>,
)
