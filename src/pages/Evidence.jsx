import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, FileText, Shield, Upload } from 'lucide-react';
import BillDrop from '@/components/BillDrop';
import JourneySpine from '@/components/JourneySpine';
import { useLanguage } from '@/components/LanguageContext';
import { track } from '@/lib/track';
import { setHandoff, takeHandoff } from '@/lib/handoff';
import { getExtractionReceipts, getSettings } from '@/lib/store';
import { readCoverageStash } from '@/lib/coverageStash';
import { documentName, documentHolds } from '@/lib/documentLabels';

function topicName(t, topic) {
  const keys = { environmental: 'topic.environmental', social: 'topic.social', governance: 'topic.governance', other: 'topic.other' };
  return keys[topic] ? t(keys[topic]) : null;
}

function extractedFieldLabel(t, field) {
  const key = `bill.field.${field}`;
  const label = t(key);
  return label === key ? field.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase()) : label;
}

// Step two, with a page of its own.
//
// The coverage report's strongest line is "your HR report would answer 10 of these", and
// its button used to land on /data — the densest screen in the app — leaving the reader
// to find an uploader among a year of monthly rows. This page does one thing, says what
// the questionnaire actually asked for, takes the whole batch at once, and hands you
// back to the questionnaire when you are done.
export default function Evidence() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();
  // A ref, not state. BillDrop calls onDataExtracted and then onBatchComplete inside the
  // same event handler, so React has not re-rendered in between - reading batch state
  // there gives the value from BEFORE the document was accepted, which for a single file
  // is an empty array. The upload then appeared to do nothing at all.
  const batch = useRef([]);
  const stash = useMemo(() => readCoverageStash(), []);
  // Bills dropped on the dashboard. Consumed once, on mount, and handed straight to
  // BillDrop — the drop happens where the user is standing, the reading happens here,
  // where the review dialog and the /data hand-off already live.
  const dropped = useMemo(() => takeHandoff('documents')?.files || null, []);

  useEffect(() => {
    track('evidence_page_viewed', { wanted: stash?.missingDocuments?.length || 0 });
  }, [stash]);

  // Each figure records the document it came out of, so the distinct names ARE the
  // documents added so far.
  const added = useMemo(() => {
    const sources = getSettings()?.dataSources || {};
    return [...new Set(Object.values(sources).filter(Boolean))];
  }, []);
  const receipts = useMemo(() => getExtractionReceipts(), []);

  // Applying extracted values needs the Data page's records state and its bare-year
  // confirmation, so the accepted fields are handed over rather than written here.
  const handOff = useCallback((items) => {
    if (items.length === 0) return;
    setHandoff({
      kind: 'extraction',
      items,
      // Data owns validation and persistence, but it is not the destination when the
      // evidence belongs to an in-progress questionnaire.
      returnTo: stash ? '/evidence?added=1' : null,
    });
    track('evidence_documents_extracted', {
      documents: items.length,
      fields: items.reduce((n, item) => n + item.fields.length, 0),
    });
    navigate('/data');
  }, [navigate, stash]);

  const wanted = stash?.missingDocuments || [];
  const topics = stash?.topics || [];
  const documentAdded = stash && searchParams.get('added') === '1';

  return (
    <div className="space-y-6">
      <JourneySpine
        step={2}
        questionCount={stash?.questionCount || 0}
        documentCount={added.length}
      />

      <div className="max-w-3xl space-y-2">
        {/* Reachable from onboarding now, before any questionnaire exists — so the
            heading cannot assume one. Promising what "your questionnaire needs" to
            someone who has not uploaded one is a claim about a file we have not seen. */}
        <h1 className="text-2xl font-bold text-slate-900">
          {stash ? t('evidence.title') : t('evidence.titleStandalone')}
        </h1>
        <p className="text-base leading-relaxed text-slate-500">
          {stash ? t('evidence.body') : t('evidence.bodyStandalone')}
        </p>
      </div>

      {documentAdded && (
        <div className="border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-start gap-3">
            <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
            <div className="flex-1">
              <p className="font-semibold text-emerald-950">{t('evidence.successTitle')}</p>
              <p className="mt-1 text-sm text-emerald-900/70">{t('evidence.successBody')}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => document.getElementById('evidence-file-input')?.click()}
                  className="inline-flex h-10 items-center bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
                >
                  {t('evidence.addAnother')}
                </button>
                <Link
                  to="/respond"
                  className="inline-flex h-10 items-center border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  {t('evidence.toSummary')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* What the questionnaire actually asked for, so this is not a blank uploader.
          Only shown when a questionnaire has been read — inventing a wish list without
          one would be guessing at the reader's situation. */}
      {topics.length > 0 && (
        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{t('evidence.byTopicTitle')}</h2>
            <p className="mt-1 text-sm text-slate-500">{t('evidence.byTopicBody')}</p>
          </div>
          <div className="divide-y divide-slate-100 border border-slate-200 bg-white">
            {topics.map(bucket => (
              <div key={bucket.topic} className="grid gap-3 px-5 py-4 sm:grid-cols-[180px_1fr]">
                <div>
                  <p className="font-semibold text-slate-900">{topicName(t, bucket.topic)}</p>
                  <p className="mt-0.5 text-sm text-slate-500">{bucket.total === 1 ? t('coverage.topicQuestion', { count: bucket.total }) : t('coverage.topicQuestions', { count: bucket.total })}</p>
                </div>
                <div className="space-y-2">
                  {bucket.documents?.map(item => (
                    <div key={item} className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 px-3 py-2.5">
                      <div><p className="text-sm font-medium text-slate-900">{documentName(t, item)}</p><p className="text-xs text-slate-500">{documentHolds(t, item)}</p></div>
                      <button type="button" onClick={() => document.getElementById('evidence-file-input')?.click()} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-800 hover:underline"><Upload className="h-4 w-4" />{t('coverage.docUpload')}</button>
                    </div>
                  ))}
                  {bucket.needsPolicy > 0 && (
                    <Link to="/policies" className="flex items-center justify-between gap-3 border border-violet-200 bg-violet-50 px-3 py-2.5 text-sm font-medium text-violet-900 hover:bg-violet-100">
                      <span className="inline-flex items-center gap-2"><Shield className="h-4 w-4" />{t('evidence.policyNeeded', { count: bucket.needsPolicy })}</span><ArrowRight className="h-4 w-4" />
                    </Link>
                  )}
                  {!bucket.documents?.length && !bucket.needsPolicy && <p className="text-sm text-slate-400">{t('evidence.noUploadNeeded')}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {topics.length === 0 && wanted.length > 0 && (
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

      <div className="flex flex-wrap items-center justify-between gap-4 border border-slate-200 bg-slate-50 p-4">
        <div><p className="text-sm font-semibold text-slate-900">{t('evidence.policiesTitle')}</p><p className="mt-0.5 text-sm text-slate-500">{t('evidence.policiesBody')}</p></div>
        <div className="flex flex-wrap gap-2"><Link to="/documents" className="inline-flex h-10 items-center border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50">{t('evidence.registerPolicy')}</Link><Link to="/policies" className="inline-flex h-10 items-center bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800">{t('evidence.createPolicy')}</Link></div>
      </div>

      <BillDrop
        inputId="evidence-file-input"
        incoming={dropped}
        onDataExtracted={(fields, period, fileName) => {
          batch.current.push({ fields, period, fileName });
        }}
        onBatchComplete={() => {
          const items = batch.current;
          batch.current = [];
          handOff(items);
        }}
      />

      {receipts.length > 0 && (
        <section className="border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
            <p className="text-sm font-semibold text-slate-900">{t('evidence.receiptsTitle')}</p>
            <Link to="/data" className="text-sm font-medium text-slate-600 hover:underline">{t('evidence.viewData')}</Link>
          </div>
          {receipts.map(receipt => (
            <div key={receipt.id} className="border-b border-slate-100 px-5 py-4 last:border-b-0">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-semibold text-slate-900">{receipt.fileName || t('evidence.unnamedDocument')}</p>
                <p className="text-xs text-slate-400">{new Date(receipt.createdAt).toLocaleString()}</p>
              </div>
              <p className="mt-1 text-xs text-slate-500">{receipt.annual ? t('evidence.savedAnnual', { period: receipt.savedPeriod, count: receipt.allocationMonths || 12 }) : t('evidence.savedPeriod', { period: receipt.savedPeriod })}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {receipt.fields.map(field => <span key={field.field} className="bg-emerald-50 px-2.5 py-1 text-xs text-emerald-900">{extractedFieldLabel(t, field.field)}: {field.value.toLocaleString()} {field.unit}</span>)}
              </div>
            </div>
          ))}
        </section>
      )}

      {receipts.length === 0 && added.length > 0 && (
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
