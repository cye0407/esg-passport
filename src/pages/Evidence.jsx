import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, FileText } from 'lucide-react';
import BillDrop from '@/components/BillDrop';
import JourneySpine from '@/components/JourneySpine';
import { useLanguage } from '@/components/LanguageContext';
import { track } from '@/lib/track';
import { setHandoff } from '@/lib/handoff';
import { getSettings } from '@/lib/store';
import { readCoverageStash } from '@/lib/coverageStash';
import { documentName, documentHolds } from '@/lib/documentLabels';

// Step two, with a page of its own.
//
// The coverage report's strongest line is "your HR report would answer 10 of these", and
// its button used to land on /data — the densest screen in the app — leaving the reader
// to find an uploader among a year of monthly rows. This page does one thing, says what
// the questionnaire actually asked for, takes the whole batch at once, and hands you
// back to the questionnaire when you are done.
export default function Evidence() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  // A ref, not state. BillDrop calls onDataExtracted and then onBatchComplete inside the
  // same event handler, so React has not re-rendered in between - reading batch state
  // there gives the value from BEFORE the document was accepted, which for a single file
  // is an empty array. The upload then appeared to do nothing at all.
  const batch = useRef([]);
  const stash = useMemo(() => readCoverageStash(), []);

  useEffect(() => {
    track('evidence_page_viewed', { wanted: stash?.missingDocuments?.length || 0 });
  }, [stash]);

  // Each figure records the document it came out of, so the distinct names ARE the
  // documents added so far.
  const added = useMemo(() => {
    const sources = getSettings()?.dataSources || {};
    return [...new Set(Object.values(sources).filter(Boolean))];
  }, []);

  // Applying extracted values needs the Data page's records state and its bare-year
  // confirmation, so the accepted fields are handed over rather than written here.
  const handOff = useCallback((items) => {
    if (items.length === 0) return;
    setHandoff({ kind: 'extraction', items });
    track('evidence_documents_extracted', {
      documents: items.length,
      fields: items.reduce((n, item) => n + item.fields.length, 0),
    });
    navigate('/data');
  }, [navigate]);

  const wanted = stash?.missingDocuments || [];

  return (
    <div className="space-y-6">
      <JourneySpine
        step={2}
        questionCount={stash?.questionCount || 0}
        documentCount={added.length}
      />

      <div className="max-w-3xl space-y-2">
        <h1 className="text-2xl font-bold text-slate-900">{t('evidence.title')}</h1>
        <p className="text-base leading-relaxed text-slate-500">{t('evidence.body')}</p>
      </div>

      {/* What the questionnaire actually asked for, so this is not a blank uploader.
          Only shown when a questionnaire has been read — inventing a wish list without
          one would be guessing at the reader's situation. */}
      {wanted.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {wanted.map((entry) => {
            const name = documentName(t, entry.document);
            if (!name) return null;
            return (
              <div key={entry.document} className="border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-900">{name}</p>
                <p className="mt-0.5 text-[13px] text-slate-500">
                  {t('evidence.answersCount', { count: entry.unlocks })}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">{documentHolds(t, entry.document)}</p>
              </div>
            );
          })}
        </div>
      )}

      <BillDrop
        onDataExtracted={(fields, period, fileName) => {
          batch.current.push({ fields, period, fileName });
        }}
        onBatchComplete={() => {
          const items = batch.current;
          batch.current = [];
          handOff(items);
        }}
      />

      {added.length > 0 && (
        <div className="border border-slate-200 bg-white">
          <p className="border-b border-slate-100 px-5 py-3.5 text-sm font-semibold text-slate-900">
            {t('evidence.addedTitle')}
          </p>
          {added.map(name => (
            <div key={name} className="flex items-center gap-3 border-b border-slate-100 px-5 py-3.5 last:border-b-0">
              <Check className="h-4 w-4 shrink-0 text-emerald-600" strokeWidth={2.5} />
              <span className="truncate text-sm font-medium text-slate-900">{name}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <Link
          to="/respond"
          className="inline-flex h-12 items-center gap-2 bg-slate-900 px-6 text-[15px] font-medium text-white transition-colors hover:bg-slate-800"
        >
          {t('evidence.back')}
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link to="/data" className="inline-flex items-center gap-2 text-sm text-slate-500 underline-offset-2 hover:text-slate-700 hover:underline">
          <FileText className="h-4 w-4" />
          {t('evidence.typeInstead')}
        </Link>
        <Link to="/" className="ml-auto inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft className="h-4 w-4" />
          {t('evidence.home')}
        </Link>
      </div>
    </div>
  );
}
