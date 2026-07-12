import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { getSettings, saveSettings } from '@/lib/store';
import { t as translate, UI_LANGUAGES } from '@/lib/i18n';

const SUPPORTED = new Set(UI_LANGUAGES.map((l) => l.code));

// Read a ?lang= value from either the querystring or the HashRouter hash query
// (e.g. /app/?lang=de#/respond OR /app/#/respond?lang=de). Read-only.
function getLangParam() {
  if (typeof window === 'undefined') return null;
  const search = new URLSearchParams(window.location.search);
  if (search.get('lang')) return search.get('lang');
  const hash = window.location.hash || '';
  const q = hash.indexOf('?');
  if (q !== -1) {
    const params = new URLSearchParams(hash.slice(q + 1));
    if (params.get('lang')) return params.get('lang');
  }
  return null;
}

// Strip ?lang= from the URL after we've consumed it, so it doesn't linger in
// history or shared links (mirrors LicenseContext.readActivationKeyFromUrl).
function stripLangParam() {
  if (typeof window === 'undefined') return;
  let changed = false;

  const search = new URLSearchParams(window.location.search);
  if (search.has('lang')) { search.delete('lang'); changed = true; }

  let hash = window.location.hash || '';
  const q = hash.indexOf('?');
  if (q !== -1) {
    const params = new URLSearchParams(hash.slice(q + 1));
    if (params.has('lang')) {
      params.delete('lang');
      const rest = params.toString();
      hash = hash.slice(0, q) + (rest ? `?${rest}` : '');
      changed = true;
    }
  }

  if (changed) {
    const qs = search.toString();
    const url = `${window.location.pathname}${qs ? `?${qs}` : ''}${hash}`;
    window.history.replaceState({}, document.title, url);
  }
}

// Resolve the initial language: URL param → persisted setting → browser → 'en'.
function detectInitialLang() {
  const fromUrl = getLangParam();
  if (fromUrl && SUPPORTED.has(fromUrl)) return fromUrl;

  // NB: UI language is stored under `uiLanguage`, kept separate from `settings.language`
  // (which Respond uses for the answer/export language) so the two never clobber each other.
  const saved = getSettings()?.uiLanguage;
  if (saved && SUPPORTED.has(saved)) return saved;

  if (typeof navigator !== 'undefined' && navigator.language) {
    const base = navigator.language.slice(0, 2).toLowerCase();
    if (SUPPORTED.has(base)) return base;
  }
  return 'en';
}

// Default (no provider): translate in English so components rendered outside a
// LanguageProvider — e.g. in unit tests — still show real text, not raw keys.
const LanguageContext = createContext({
  lang: 'en',
  setLang: () => {},
  t: (key, vars) => translate(key, 'en', vars),
});

export function useLanguage() {
  return useContext(LanguageContext);
}

// Convenience hook returning a translator bound to the current language:
//   const t = useT(); t('nav.home'); t('home.stat', { count: 3 });
export function useT() {
  return useContext(LanguageContext).t;
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(detectInitialLang);

  // Consume the URL param once on mount.
  useEffect(() => { stripLangParam(); }, []);

  // Keep <html lang> and the persisted setting in sync with the active language.
  useEffect(() => {
    if (typeof document !== 'undefined') document.documentElement.lang = lang;
    if (getSettings()?.uiLanguage !== lang) saveSettings({ uiLanguage: lang });
  }, [lang]);

  const setLang = useCallback((next) => {
    if (SUPPORTED.has(next)) setLangState(next);
  }, []);

  const boundT = useCallback((key, vars) => translate(key, lang, vars), [lang]);

  const value = useMemo(() => ({ lang, setLang, t: boundT }), [lang, setLang, boundT]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
