import React, { useRef, useState } from 'react';
import { Download, Upload, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/components/LanguageContext';
import { saveResponsePackFile, openResponsePackFile } from '@/lib/responsePack';
import { track } from '@/lib/track';

// "Save your response pack" / "Open your response pack". The record the company keeps
// instead of an account. A passphrase is optional and off by default — the file holds
// what they have already decided to send buyers, never their documents — and when it is
// set, the dialog says the one thing that matters: lose it and nobody can open the file.
export default function ResponsePackSection() {
  const { t } = useLanguage();
  const [protect, setProtect] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [strength, setStrength] = useState(null);
  const [openPassphrase, setOpenPassphrase] = useState('');
  const [pendingFile, setPendingFile] = useState(null);
  const [status, setStatus] = useState(null);   // { tone: 'ok' | 'error', text }
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);

  const withEngine = async (fn) => {
    setBusy(true);
    try { return await fn(await import('response-ready')); } finally { setBusy(false); }
  };

  const handleSave = () => withEngine(async (mod) => {
    if (protect) {
      const check = mod.passphraseStrength(passphrase);
      setStrength(check);
      if (!check.ok) return;
    }
    try {
      const result = await saveResponsePackFile(mod, { passphrase: protect ? passphrase : undefined });
      track('response_pack_saved', { answers: result.answers, facts: result.facts, claims: result.passClaims, encrypted: result.encrypted });
      setStatus({ tone: 'ok', text: t('pack.saved', { fileName: result.fileName, answers: result.answers }) });
    } catch (err) {
      console.error('Response pack save failed:', err);
      setStatus({ tone: 'error', text: t('pack.saveFailed') });
    }
  });

  const tryOpen = (file, pass) => withEngine(async (mod) => {
    try {
      const result = await openResponsePackFile(mod, file, { passphrase: pass || undefined });
      track('response_pack_opened', { answers: result.answersImported, claims: result.claimsAdded, policies: result.policiesUpdated });
      setPendingFile(null);
      setOpenPassphrase('');
      setStatus({ tone: 'ok', text: t('pack.opened', { answers: result.answersImported, claims: result.claimsAdded, policies: result.policiesUpdated }) });
    } catch (err) {
      const code = err?.code;
      if (code === 'encrypted') { setPendingFile(file); setStatus({ tone: 'ok', text: t('pack.needsPassphrase') }); return; }
      if (code === 'wrong-passphrase') { setStatus({ tone: 'error', text: t('pack.wrongPassphrase') }); return; }
      if (code === 'unsupported-version') { setStatus({ tone: 'error', text: t('pack.unsupportedVersion') }); return; }
      console.error('Response pack open failed:', err);
      setStatus({ tone: 'error', text: t('pack.notAPack') });
    }
  });

  const handleFile = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) tryOpen(file, '');
  };

  return (
    <div className="bg-white border border-slate-200 rounded-none p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-1">{t('pack.title')}</h2>
      <p className="text-sm text-slate-600 mb-4 leading-relaxed">{t('pack.body')}</p>

      <div className="space-y-4">
        <div className="space-y-3">
          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input id="pack-protect" type="checkbox" checked={protect} onChange={e => { setProtect(e.target.checked); setStrength(null); }} className="mt-1" />
            <span>
              <span className="font-medium text-slate-900">{t('pack.protect')}</span>
              <span className="block text-slate-500">{t('pack.protectWarning')}</span>
            </span>
          </label>
          {protect && (
            <div className="max-w-md space-y-1">
              <Input id="pack-passphrase" type="password" value={passphrase} onChange={e => { setPassphrase(e.target.value); setStrength(null); }} placeholder={t('pack.passphrase')} autoComplete="new-password" />
              {strength && !strength.ok && (
                <p className="text-sm text-amber-700">{strength.reason === 'too-short' ? t('pack.tooShort') : t('pack.oneKind')}</p>
              )}
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={handleSave} disabled={busy}>
              {protect ? <Lock className="w-4 h-4 mr-2" /> : <Download className="w-4 h-4 mr-2" />} {t('pack.save')}
            </Button>
            <Button variant="outline" onClick={() => inputRef.current?.click()} disabled={busy}>
              <Upload className="w-4 h-4 mr-2" /> {t('pack.open')}
            </Button>
            <input ref={inputRef} type="file" accept=".json,.enc" onChange={handleFile} className="hidden" />
          </div>
        </div>

        {pendingFile && (
          <div className="max-w-md space-y-2 border border-slate-200 p-4">
            <p className="text-sm text-slate-700">{t('pack.enterPassphraseFor', { fileName: pendingFile.name })}</p>
            <Input id="pack-open-passphrase" type="password" value={openPassphrase} onChange={e => setOpenPassphrase(e.target.value)} autoComplete="current-password" />
            <div className="flex gap-2">
              <Button onClick={() => tryOpen(pendingFile, openPassphrase)} disabled={busy || !openPassphrase} className="bg-slate-900 text-white hover:bg-slate-800">{t('pack.unlock')}</Button>
              <Button variant="ghost" onClick={() => { setPendingFile(null); setOpenPassphrase(''); }}>{t('respond.cancel')}</Button>
            </div>
          </div>
        )}

        {status && (
          <p className={`text-sm ${status.tone === 'error' ? 'text-red-700' : 'text-emerald-800'}`} role="status">{status.text}</p>
        )}
        <p className="text-sm text-slate-500">{t('pack.contents')}</p>
      </div>
    </div>
  );
}
