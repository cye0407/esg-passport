import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLicense } from '@/components/LicenseContext';
import { Button } from '@/components/ui/button';
import { track } from '@/lib/track';
import {
  getCompanyProfile,
  getPolicyBuilderState,
  savePolicyBuilderState,
  updatePolicyStatus,
  updatePolicyFileLocation,
} from '@/lib/store';
import {
  POLICY_BUILDERS,
  BUILDER_ORDER,
  builderMeta,
  SIGN_SECTION,
  composeParagraphs,
  composeUnlock,
  composePlainText,
  completionPct,
} from '@/data/policyBuilders';
import { genericTemplate, WORKED_EXAMPLE_ID, WORKED_EXAMPLE_ANSWERS } from '@/data/policyFreeTemplate';
import PoliciesSection from '@/components/settings/PoliciesSection';
import {
  ChevronLeft, Lock, Download, FileText, Sparkles, Info, ExternalLink,
} from 'lucide-react';

// €499 Passport checkout — same URL used by Home / UpgradeGate / Respond.
const CHECKOUT_URL = 'https://catyeldi.lemonsqueezy.com/checkout/buy/d5cb1011-fdd1-4936-afe8-819f53073970';

// Map a guided builder onto the tracked policy id so the adopted/draft status
// flows to the Respond answer composer (which reads policy status). null = no
// tracked equivalent (training / custom).
const BUILDER_TO_POLICY_ID = {
  code_of_conduct: 'code_of_conduct',
  anti_corruption: 'anti_corruption',
  whistleblowing: 'whistleblower',
  data_privacy: 'data_privacy',
  supplier_coc: 'supplier_code',
  health_safety: 'health_safety_policy',
  equal_opp: 'anti_discrimination',
  environmental: 'environmental_policy',
  training: null,
  blank: null,
};

// Tracked-policy ids that a guided builder already covers — used to filter the
// "other policies" tracker so the two lists don't overlap.
const COVERED_POLICY_IDS = Object.values(BUILDER_TO_POLICY_ID).filter(Boolean);

const STATUS_META = {
  ready: { label: 'Ready', cls: 'text-emerald-700 bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500' },
  drafting: { label: 'Drafting', cls: 'text-amber-700 bg-amber-50 border-amber-200', dot: 'bg-amber-500' },
  needed: { label: 'Needed', cls: 'text-rose-700 bg-rose-50 border-rose-200', dot: 'bg-rose-500' },
};
const CAT_CLS = {
  governance: 'text-violet-700 border-violet-300',
  social: 'text-sky-700 border-sky-300',
  environmental: 'text-emerald-700 border-emerald-300',
};

const todayStr = () => new Date().toISOString().slice(0, 10);

// --- small presentational helpers ---
function Chip({ on, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 text-[12.5px] rounded-sm border transition ${
        on
          ? 'bg-emerald-600 border-emerald-600 text-white'
          : 'bg-white border-slate-300 text-slate-700 hover:border-emerald-500'
      }`}
    >
      {children}
    </button>
  );
}

function StatusPill({ status }) {
  const m = STATUS_META[status];
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${m.cls}`}>{m.label}</span>
  );
}

export default function PolicyBuilder() {
  const { isPaid, isChecking } = useLicense();
  const profile = getCompanyProfile();
  const company = (profile && (profile.tradingName || profile.legalName)) || 'Your company';
  const today = todayStr();
  const ctx = useMemo(() => ({ company, today }), [company, today]);

  const [state, setState] = useState(() => getPolicyBuilderState());
  const [view, setView] = useState('library'); // 'library' | 'builder' | 'free'
  const [curId, setCurId] = useState(null);
  const [freeText, setFreeText] = useState(() => genericTemplate({ company, today }));
  const [toast, setToast] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();

  // Deep-link from a flagged gap in the Respond flow: /policies?build=<builderId>
  // opens that builder (paid) or the free template (free), then clears the param
  // so a refresh/back doesn't re-trigger it. Waits until the license check has
  // settled (isChecking) so a paid user on a hard load / bookmark isn't bounced
  // to the free view while isPaid is still resolving.
  useEffect(() => {
    if (isChecking) return;
    const b = searchParams.get('build');
    if (!b || !POLICY_BUILDERS[b]) return;
    openBuilder(b);
    const next = new URLSearchParams(searchParams);
    next.delete('build');
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isChecking]);

  function flash(msg) {
    setToast(msg);
    window.clearTimeout(flash._t);
    flash._t = window.setTimeout(() => setToast(''), 3600);
  }

  const answersOf = (id) => state[id]?.answers || { ...POLICY_BUILDERS[id].defaults };
  const statusOf = (id) => {
    const s = state[id];
    if (!s) return 'needed';
    if (s.adopted) return 'ready';
    if (s.saved) return 'drafting';
    return 'needed';
  };

  function openBuilder(id) {
    if (!isPaid) {
      track('policy_builder_locked_click', { builder: id });
      setView('free');
      window.scrollTo({ top: 0 });
      return;
    }
    if (!state[id]?.answers) {
      const seeded = { answers: { ...POLICY_BUILDERS[id].defaults }, adopted: false, saved: false };
      savePolicyBuilderState(id, seeded);
      setState((p) => ({ ...p, [id]: seeded }));
    }
    setCurId(id);
    setView('builder');
    window.scrollTo({ top: 0 });
  }

  function toLibrary() {
    setCurId(null);
    setView('library');
    window.scrollTo({ top: 0 });
  }

  function setAnswer(id, key, value) {
    // Honesty invariant: an "adopted" flag means leadership signed THIS content.
    // Editing after adoption means the signature no longer covers the text, so
    // the adoption is invalidated — the policy drops back to draft and the
    // questionnaire answer reverts to "in development" until it's re-signed.
    const wasAdopted = !!state[id]?.adopted;
    setState((prev) => {
      const cur = prev[id] || { answers: { ...POLICY_BUILDERS[id].defaults }, adopted: false, saved: false };
      const answers = { ...cur.answers, [key]: value };
      const patch = wasAdopted ? { answers, adopted: false } : { answers };
      savePolicyBuilderState(id, patch);
      return { ...prev, [id]: { ...cur, ...patch } };
    });
    if (wasAdopted) {
      mirrorStatus(id, false, true);
      track('policy_adoption_invalidated', { builder: id });
      flash('You edited an adopted policy — it’s back to draft. Re-tick “adopted” once the new version is signed.');
    }
  }

  function mirrorStatus(id, adopted, saved) {
    const pid = BUILDER_TO_POLICY_ID[id];
    if (!pid) return;
    updatePolicyStatus(pid, adopted ? 'available' : saved ? 'in_progress' : 'not_available');
  }

  function onSave(id) {
    const adopted = !!state[id]?.adopted;
    setState((prev) => {
      const cur = prev[id] || { answers: answersOf(id) };
      savePolicyBuilderState(id, { saved: true });
      return { ...prev, [id]: { ...cur, saved: true } };
    });
    mirrorStatus(id, adopted, true);
    track('policy_saved', { builder: id, adopted });
    flash(
      adopted
        ? 'Saved & adopted — your answer is now live in your record'
        : 'Saved as a draft — download it, get it signed, then tick “adopted”'
    );
  }

  function onAdopt(id, checked) {
    setState((prev) => {
      const cur = prev[id] || { answers: answersOf(id) };
      savePolicyBuilderState(id, { adopted: checked, saved: true });
      return { ...prev, [id]: { ...cur, adopted: checked, saved: true } };
    });
    mirrorStatus(id, checked, true);
  }

  function setDocLocation(id, url) {
    setState((prev) => {
      const cur = prev[id] || { answers: answersOf(id) };
      savePolicyBuilderState(id, { docLocation: url });
      return { ...prev, [id]: { ...cur, docLocation: url } };
    });
    const pid = BUILDER_TO_POLICY_ID[id];
    if (pid) updatePolicyFileLocation(pid, url);
  }

  function download(id) {
    const text = composePlainText(id, answersOf(id), ctx);
    const blob = new Blob([text], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${POLICY_BUILDERS[id].name.replace(/[^a-z0-9]+/gi, '-')}-${company.split(' ')[0]}.md`;
    a.click();
    track('policy_downloaded', { builder: id, adopted: !!state[id]?.adopted });
    flash('Downloaded — attach it to the questionnaire, or publish it');
  }

  function downloadFree() {
    const blob = new Blob([freeText], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Policy-Template-${company.split(' ')[0]}.md`;
    a.click();
    track('policy_free_template_download', {});
    flash('Downloaded — edit it, get it signed, and attach it');
  }

  // ---------- question renderer ----------
  function renderQuestion(q, id) {
    const a = answersOf(id);
    if (q.type === 'text') {
      return (
        <div className="mb-4" key={q.key}>
          <div className="text-[13.5px] font-semibold mb-2 text-slate-800">
            {q.ask} {q.opt && <span className="font-normal text-slate-400">{q.opt}</span>}
          </div>
          <input
            className="w-full border border-slate-300 rounded-sm px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder={q.ph || ''}
            value={a[q.key] || ''}
            onChange={(e) => setAnswer(id, q.key, e.target.value)}
          />
        </div>
      );
    }
    if (q.type === 'twin') {
      return (
        <div className="mb-4" key={q.items.map((i) => i.key).join('-')}>
          <div className="text-[13.5px] font-semibold mb-2 text-slate-800">{q.ask}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {q.items.map((i) => (
              <input
                key={i.key}
                className="w-full border border-slate-300 rounded-sm px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder={i.ph}
                value={a[i.key] || ''}
                onChange={(e) => setAnswer(id, i.key, e.target.value)}
              />
            ))}
          </div>
        </div>
      );
    }
    if (q.type === 'toggle') {
      return (
        <div className="mb-4" key={q.key}>
          <div className="text-[13.5px] font-semibold mb-2 text-slate-800">
            {q.ask} {q.opt && <span className="font-normal text-slate-400">{q.opt}</span>}
          </div>
          <Chip on={!!a[q.key]} onClick={() => setAnswer(id, q.key, !a[q.key])}>
            Yes, include it
          </Chip>
        </div>
      );
    }
    // single | multi
    const isMulti = q.type === 'multi';
    return (
      <div className="mb-4" key={q.key}>
        <div className="text-[13.5px] font-semibold mb-2 text-slate-800">
          {q.ask} {q.opt && <span className="font-normal text-slate-400">{q.opt}</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          {q.options.map((o) => {
            const on = isMulti ? (a[q.key] || []).includes(o.v) : a[q.key] === o.v;
            return (
              <Chip
                key={o.v}
                on={on}
                onClick={() => {
                  if (isMulti) {
                    const arr = Array.isArray(a[q.key]) ? [...a[q.key]] : [];
                    const i = arr.indexOf(o.v);
                    if (i >= 0) arr.splice(i, 1);
                    else arr.push(o.v);
                    setAnswer(id, q.key, arr);
                  } else {
                    setAnswer(id, q.key, o.v);
                  }
                }}
              >
                {o.label}
              </Chip>
            );
          })}
        </div>
      </div>
    );
  }

  // ---------- live document ----------
  function LiveDoc({ id, answers, adopted, showUnlock }) {
    const p = POLICY_BUILDERS[id];
    const paras = composeParagraphs(id, answers, ctx);
    const unlock = composeUnlock(id, answers, adopted, ctx);
    return (
      <>
        <h3 className="text-lg font-semibold text-slate-900" style={{ fontFamily: 'Georgia, serif' }}>
          {p.name}
        </h3>
        <div className="text-[11.5px] font-mono text-slate-500 mb-4">
          {company} · v1.0 · effective {today}
        </div>
        {paras.map((pa) => (
          <p key={pa.id} className="mb-3 text-[13.5px] leading-relaxed">
            <span className="block text-[10.5px] uppercase tracking-wider text-emerald-800 font-bold mb-0.5">
              {pa.h}
            </span>
            {pa.text ? (
              <span className="text-slate-800">{pa.text}</span>
            ) : (
              <span className="text-slate-400 italic">{pa.pending || '—'}</span>
            )}
          </p>
        ))}
        {showUnlock && (
          <div className="mt-2 bg-slate-50 border border-slate-200 rounded-sm p-3">
            <div className="text-[10.5px] uppercase tracking-wider text-slate-400 mb-1">
              What this unlocks in your questionnaire
            </div>
            {unlock ? (
              <div className="text-[13px] text-slate-700">{unlock}</div>
            ) : (
              <div className="text-[13px] text-slate-400 italic">
                Answer the core questions to see your drafted questionnaire answer.
              </div>
            )}
          </div>
        )}
      </>
    );
  }

  // ---------- views ----------
  function LibraryCard({ id }) {
    const m = builderMeta(id);
    const st = statusOf(id);
    const locked = !isPaid;
    return (
      <button
        type="button"
        onClick={() => openBuilder(id)}
        className="text-left bg-white border border-slate-200 rounded-sm p-4 flex flex-col gap-2.5 hover:border-emerald-500 transition shadow-sm"
      >
        <div className="flex items-start justify-between gap-2">
          <span className="font-semibold text-[15px] text-slate-900">{m.name}</span>
          {locked ? (
            <Lock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
          ) : (
            <StatusPill status={st} />
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm border ${CAT_CLS[m.cat]}`}>
            {m.cat}
          </span>
          {m.flag && <span className="text-[11px] font-mono text-rose-600">{m.flag}</span>}
        </div>
        <span className="text-[12px] text-emerald-700 font-semibold">
          {locked ? 'Included with ESG Passport →' : st === 'ready' ? 'Review / edit →' : st === 'drafting' ? 'Continue building →' : 'Start guided build →'}
        </span>
      </button>
    );
  }

  function Summary() {
    let ready = 0, drafting = 0, needed = 0;
    BUILDER_ORDER.forEach((id) => {
      const s = statusOf(id);
      if (s === 'ready') ready++;
      else if (s === 'drafting') drafting++;
      else needed++;
    });
    const chip = (dot, n, label) => (
      <span className="inline-flex items-center gap-1.5 text-[12.5px] text-slate-500 bg-white border border-slate-200 rounded-sm px-3 py-1.5">
        <span className={`w-2 h-2 rounded-full ${dot}`} />
        <b className="text-slate-900 tabular-nums">{n}</b> {label}
      </span>
    );
    return (
      <div className="flex gap-2.5 flex-wrap mb-4">
        <span className="inline-flex items-center gap-1.5 text-[12.5px] text-slate-500 bg-white border border-slate-200 rounded-sm px-3 py-1.5">
          <b className="text-slate-900 tabular-nums">{BUILDER_ORDER.length}</b> policies
        </span>
        {chip('bg-emerald-500', ready, 'ready')}
        {chip('bg-amber-500', drafting, 'drafting')}
        {chip('bg-rose-500', needed, 'flagged')}
      </div>
    );
  }

  function UpgradeBanner() {
    return (
      <div className="bg-slate-900 text-white rounded-sm p-5 mb-5 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-emerald-300 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-[15px]">The guided policy builder is a Passport feature</div>
            <div className="text-slate-300 text-[13px]">
              Answer a few plain questions and each policy writes itself in your own specifics — no blank templates. Below is a free editable template and a worked example so you can see exactly what it produces.
            </div>
          </div>
        </div>
        <a
          href={CHECKOUT_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track('upgrade_cta_click', { source: 'policy_builder' })}
          className="flex-shrink-0 inline-flex items-center justify-center gap-2 h-10 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold rounded-sm transition text-[13.5px]"
        >
          Unlock the builder <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    );
  }

  if (view === 'library') {
    return (
      <div>
        <div className="mb-4">
          <h2 className="text-xl font-bold text-slate-900 mb-1">Your policy library</h2>
          <p className="text-slate-500 text-[13.5px] max-w-2xl">
            The policies your customers’ ESG forms ask about. {isPaid
              ? 'Pick one — we walk you through plain questions and write the policy for you. No blank templates.'
              : 'Use the free template below to write your own, or unlock the guided builder to have each one written for you.'}
          </p>
        </div>

        {!isPaid && <UpgradeBanner />}
        {isPaid && <Summary />}

        {!isPaid && (
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => { setView('free'); window.scrollTo({ top: 0 }); }}
              className="text-left bg-white border border-slate-200 rounded-sm p-4 flex flex-col gap-2 hover:border-emerald-500 transition shadow-sm"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-700" />
                <span className="font-semibold text-[15px] text-slate-900">Generic policy template</span>
                <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm border text-emerald-700 border-emerald-300">Free</span>
              </div>
              <span className="text-[12.5px] text-slate-500">An editable template with a worked example — write your own policy and download it.</span>
              <span className="text-[12px] text-emerald-700 font-semibold">Open template →</span>
            </button>
          </div>
        )}

        <div className="text-[11px] uppercase tracking-wider text-slate-400 mb-2">
          {isPaid ? 'Guided builders' : 'Included with ESG Passport'}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {BUILDER_ORDER.map((id) => (
            <LibraryCard key={id} id={id} />
          ))}
        </div>

        {/* Other tracked policies — the ones the guided builder doesn't cover yet.
            Preserves the old tracker (status + document location + add custom). */}
        <div className="mt-8 border-t border-slate-200 pt-6">
          <div className="text-[11px] uppercase tracking-wider text-slate-400 mb-1">Other policies you track</div>
          <p className="text-[13px] text-slate-500 mb-3 max-w-2xl">
            Policies the guided builder doesn’t write yet — track their status and where the document lives.
          </p>
          <PoliciesSection excludeIds={COVERED_POLICY_IDS} />
        </div>

        {toast && <Toast msg={toast} />}
      </div>
    );
  }

  if (view === 'free') {
    return (
      <div>
        <button
          type="button"
          onClick={toLibrary}
          className="inline-flex items-center gap-1 text-[12.5px] text-slate-500 border border-slate-300 rounded-sm px-2.5 py-1.5 mb-4 hover:border-emerald-500 hover:text-emerald-700"
        >
          <ChevronLeft className="w-4 h-4" /> All policies
        </button>

        <h2 className="text-xl font-bold text-slate-900 mb-1">Generic policy template</h2>
        <p className="text-slate-500 text-[13.5px] mb-4 max-w-2xl">
          Edit this to create a policy for any topic. Your company name and date are filled in — replace the bracketed parts with your own specifics, then download it.
        </p>

        <textarea
          value={freeText}
          onChange={(e) => setFreeText(e.target.value)}
          spellCheck={false}
          className="w-full h-[360px] border border-slate-300 rounded-sm p-4 text-[13px] font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <div className="flex gap-2 mt-3">
          <Button onClick={downloadFree} className="gap-2">
            <Download className="w-4 h-4" /> Download template
          </Button>
        </div>

        <div className="mt-8 border-t border-slate-200 pt-6">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <h3 className="text-[15px] font-semibold text-slate-900">A worked example — what the guided builder writes for you</h3>
          </div>
          <p className="text-[13px] text-slate-500 mb-4 max-w-2xl">
            With the guided builder you answer plain questions and this composes automatically in your own specifics. Here’s a finished example.
          </p>
          <div className="bg-white border border-slate-200 rounded-sm p-5 max-w-2xl">
            <LiveDoc id={WORKED_EXAMPLE_ID} answers={WORKED_EXAMPLE_ANSWERS} adopted showUnlock />
          </div>
          <a
            href={CHECKOUT_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track('upgrade_cta_click', { source: 'policy_builder_example' })}
            className="mt-4 inline-flex items-center justify-center gap-2 h-10 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-sm transition text-[13.5px]"
          >
            Unlock the guided builder <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {toast && <Toast msg={toast} />}
      </div>
    );
  }

  // view === 'builder'
  const id = curId;
  const p = POLICY_BUILDERS[id];
  const a = answersOf(id);
  const adopted = !!state[id]?.adopted;
  const pct = completionPct(id, a);
  // Can't attest "adopted" until the policy actually says something (its gate).
  const gatePassed = POLICY_BUILDERS[id].gate(a);
  const docLocation = state[id]?.docLocation || '';

  return (
    <div>
      <div className="flex items-center gap-2.5 mb-4 flex-wrap">
        <button
          type="button"
          onClick={toLibrary}
          className="inline-flex items-center gap-1 text-[12.5px] text-slate-500 border border-slate-300 rounded-sm px-2.5 py-1.5 hover:border-emerald-500 hover:text-emerald-700"
        >
          <ChevronLeft className="w-4 h-4" /> All policies
        </button>
        <span className="text-[13px] text-slate-600 font-medium">{p.name}</span>
        {p.flag && <span className="text-[11px] font-mono text-rose-600 bg-rose-50 px-2 py-0.5 rounded-sm">flagged · {p.flag}</span>}
      </div>

      <div className="bg-emerald-50 border border-emerald-100 rounded-sm p-3 mb-4 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
        <p className="text-[13px] text-emerald-900">
          Answer a few plain questions — no legal drafting. The document assembles on the right in your own specifics. Save it to your record, then download it to send.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {/* questions */}
        <section className="bg-white border border-slate-200 rounded-sm shadow-sm">
          <div className="flex items-center gap-2.5 px-4 pt-4 pb-1">
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[12px] font-mono text-slate-500 tabular-nums">{pct}%</span>
          </div>
          <div className="p-4">
            {p.sections.map((sec, si) => (
              <div key={si} className={si > 0 ? 'border-t border-slate-100 pt-4 mt-2' : ''}>
                <div className="text-[10.5px] uppercase tracking-wider text-emerald-800 font-bold mb-3">{sec.eyebrow}</div>
                {sec.questions.map((q) => renderQuestion(q, id))}
              </div>
            ))}
            <div className="border-t border-slate-100 pt-4 mt-2">
              <div className="text-[10.5px] uppercase tracking-wider text-emerald-800 font-bold mb-3">{SIGN_SECTION.eyebrow}</div>
              {SIGN_SECTION.questions.map((q) => renderQuestion(q, id))}
            </div>
          </div>
        </section>

        {/* live document */}
        <section className="bg-white border border-slate-200 rounded-sm shadow-sm lg:sticky lg:top-4">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
            <span className="text-[10.5px] uppercase tracking-wider text-slate-400">Your policy, so far</span>
            <span className="text-[11px] font-mono text-emerald-700">writing live</span>
          </div>
          <div className="p-5 max-h-[54vh] overflow-auto">
            <LiveDoc id={id} answers={a} adopted={adopted} showUnlock />
          </div>
          <div className="border-t border-slate-200 p-4 space-y-3">
            <label className={`flex items-start gap-2.5 text-[12px] text-slate-600 ${gatePassed ? 'cursor-pointer' : 'opacity-60 cursor-not-allowed'}`}>
              <input
                type="checkbox"
                className="w-4 h-4 mt-0.5 accent-emerald-600 flex-shrink-0"
                checked={adopted}
                disabled={!gatePassed}
                onChange={(e) => onAdopt(id, e.target.checked)}
              />
              <span>
                It’s <b>adopted</b> — leadership has signed it. Until you tick this it saves as a draft, and your
                questionnaire answer honestly says “in development.”
                {!gatePassed && (
                  <span className="block mt-1 text-[11px] text-slate-400">Answer the core questions first.</span>
                )}
              </span>
            </label>
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">Link to the signed document (optional)</label>
              <input
                type="text"
                value={docLocation}
                onChange={(e) => setDocLocation(id, e.target.value)}
                placeholder="e.g. https://drive… or where the signed PDF lives"
                className="w-full border border-slate-300 rounded-sm px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 gap-2" onClick={() => download(id)}>
                <Download className="w-4 h-4" /> Download
              </Button>
              <Button className="flex-1" onClick={() => onSave(id)}>
                Save to my record
              </Button>
            </div>
          </div>
        </section>
      </div>

      {toast && <Toast msg={toast} />}
    </div>
  );
}

function Toast({ msg }) {
  return (
    <div className="fixed left-1/2 bottom-6 -translate-x-1/2 bg-slate-900 text-white px-4 py-2.5 rounded-sm text-[13.5px] shadow-lg z-40 max-w-[90vw] text-center">
      {msg}
    </div>
  );
}
