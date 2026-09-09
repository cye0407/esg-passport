import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronDown, Download, Lock, Upload } from 'lucide-react';
import { track } from '@/lib/track';
import { useLanguage } from '@/components/LanguageContext';
import { documentName, documentHolds } from '@/lib/documentLabels';
import { getEntitlements } from '@/lib/entitlements';
import { figureWithUnit, answerStatesFigure } from '@/lib/figures';
import {
  buildChecklistHtml,
  checklistFileName,
  downloadChecklist,
  workspaceUrl,
} from '@/lib/coverageChecklist';
import {
  PASSPORT_CHECKOUT_URL,
  QUESTIONNAIRE_PASS_CHECKOUT_URL,
  PASS_PRICE,
  PASSPORT_PRICE,
  openCheckout,
} from '@/lib/checkout';

// The free first action: what this questionnaire needs, measured against what the user
// actually has. See COVERAGE-REPORT-SPEC.md.
//
// Two panes, because the page answers two different kinds of question.
//
// LEFT is the work, in the order someone acts on it:
//   where does this questionnaire stand
//   what do I go and find next, per document, upload or type
//   what is it asking ABOUT - grouped the way the customer asking it groups things,
//     because "how confident is the engine" is our category, not theirs
//   what does finishing cost, and what do I take with me
//
// RIGHT is reference, and it sticks: the counts, then the question list and the
// sample answers behind tabs. Those were full-width sections stacked above the
// action, which put the least decision-relevant thing - a raw list of 34 questions -
// in the most valuable space on the page, and scrolled the counts away exactly when
// someone started needing them. Below lg there is no room for two panes, so the
// panel collapses behind one button and the page reads as a single column.
//
// Every tier sees this. It was built as the free tier's consolation for not getting
// answers, which was the wrong idea: it is the questionnaire's status view, and a
// paid buyer chasing a colleague for the waste manifest before a deadline needs it
// more than a free visitor does. Only the footer differs.
//   what do I take with me
//
// The page closes on the takeaway, not on the price. Someone who has just learned
// they are missing twelve figures is not deciding whether to buy - they are about to
// go and look for bills, and the deadline is a week out. The offer stays where it is;
// the last thing they read is what to go and find.
//
// It reports counts and provenance, never a readiness score, a pass likelihood or a
// predicted buyer outcome - we do not know how a customer will read a response, and
// saying otherwise would sell a promise we cannot keep.
const SAMPLE_ANSWERS = 5;

// Topic labels are literal t() calls for the same reason document labels are: the
// i18nCoverage guard reads the source, and a key reached through a variable can go
// missing in German without failing the build.
function topicName(t, topic) {
  switch (topic) {
    case 'environmental': return t('topic.environmental');
    case 'social': return t('topic.social');
    case 'governance': return t('topic.governance');
    case 'other': return t('topic.other');
    default: return null;
  }
}

function topicSubtitle(t, topic) {
  switch (topic) {
    case 'environmental': return t('topic.environmentalSub');
    case 'social': return t('topic.socialSub');
    case 'governance': return t('topic.governanceSub');
    case 'other': return t('topic.otherSub');
    default: return null;
  }
}

const TOPIC_RULE = {
  environmental: 'border-t-emerald-600',
  social: 'border-t-indigo-600',
  governance: 'border-t-slate-500',
  other: 'border-t-slate-300',
};

// The support badge, in the same colours Respond puts on a real answer - so the sample
// looks like the product rather than like a report about it.
function SupportBadge({ supported, t }) {
  return supported ? (
    <span className="inline-flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      {t('support.supported')}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">
      <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
      {t('support.draft')}
    </span>
  );
}


// The reference pane: the counts, then the raw question list and the sample answers
// behind tabs. Sticky from lg up, so the numbers stay put while someone works down the
// left column. Below lg there is no room for two panes, so the counts stay and the rest
// hides behind one button - reference material should never cost a phone reader eight
// screens of scrolling before they reach the thing to do.
function ReferencePanel({
  t, total, fromRecords, written, unanswerable, questions, sample, remaining, hasOwnData,
  onDownloadChecklist,
}) {
  const [tab, setTab] = React.useState(sample.length > 0 ? 'answers' : 'questions');
  const [openOnSmall, setOpenOnSmall] = React.useState(false);

  const counts = [
    [t('coverage.topicFromRecords'), fromRecords.length, 'text-emerald-600'],
    [t('checklist.written'), written.length, 'text-slate-900'],
    [t('checklist.unanswerable'), unanswerable.length, 'text-slate-900'],
  ];

  const tabClass = active =>
    `flex-1 border-b-2 px-3 py-2.5 text-[13px] font-medium transition-colors ${
      active ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'
    }`;

  return (
    <div className="border border-slate-200 bg-white">
      <div className="border-b border-slate-100 p-5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          {t('coverage.panelTitle')}
        </p>
        <p className="mt-1 text-3xl font-bold leading-none text-slate-900">{total}</p>
        <dl className="mt-3.5 space-y-1.5 border-t border-slate-100 pt-3">
          {counts.map(([label, value, tone]) => (
            <div key={label} className="flex justify-between gap-3 text-[13px]">
              <dt className="text-slate-500">{label}</dt>
              <dd className={`font-semibold ${tone}`}>{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* The takeaway sits here rather than at the foot of the page, where it was the
          last thing under two checkout buttons and read as the consolation prize for
          not buying. It is the opposite: the only way back to this workspace, since
          there is no account and no email. Sticky, so it is reachable at the moment
          someone decides to leave — which is not a moment we get to choose. */}
      <div className="border-b border-slate-100 p-5">
        <p className="text-sm font-semibold text-slate-900">{t('coverage.takeawayTitle')}</p>
        <p className="mt-1 text-[13px] leading-relaxed text-slate-500">{t('coverage.takeawayBody')}</p>
        <button
          onClick={onDownloadChecklist}
          className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 bg-slate-900 px-4 text-sm font-medium text-white transition-colors hover:bg-slate-800"
        >
          <Download className="h-4 w-4" />
          {t('coverage.takeawayDownload')}
        </button>
        <p className="mt-2.5 text-xs leading-relaxed text-slate-400">{t('coverage.takeawaySaved')}</p>
      </div>

      <button
        onClick={() => setOpenOnSmall(v => !v)}
        className="flex w-full items-center justify-between px-5 py-3 text-left text-sm font-medium text-slate-700 lg:hidden"
      >
        {openOnSmall ? t('coverage.panelHide') : t('coverage.panelShow', { count: questions.length })}
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${openOnSmall ? 'rotate-180' : ''}`} />
      </button>

      <div className={`${openOnSmall ? 'block' : 'hidden'} lg:block`}>
        <div className="flex border-b border-slate-100">
          <button onClick={() => setTab('questions')} className={tabClass(tab === 'questions')}>
            {t('coverage.tabQuestions')}
          </button>
          {sample.length > 0 && (
            <button onClick={() => setTab('answers')} className={tabClass(tab === 'answers')}>
              {t('coverage.tabAnswers')}
            </button>
          )}
        </div>

        <div className="max-h-[24rem] overflow-y-auto">
          {tab === 'questions' ? (
            <ol className="divide-y divide-slate-100">
              {questions.map((question, index) => (
                <li key={question.id || index} className="flex gap-2.5 px-5 py-3">
                  <span className="w-5 shrink-0 text-[13px] text-slate-400">{index + 1}.</span>
                  <span className="text-[13px] leading-relaxed text-slate-700">{question.text}</span>
                </li>
              ))}
            </ol>
          ) : (
            <div className="divide-y divide-slate-100">
              <p className="px-5 pt-4 text-[13px] font-semibold text-slate-900">
                {t('coverage.sampleTitle', { count: sample.length })}
              </p>
              {/* Whose numbers these are. Without their own data the drafts rest on the
                  example workspace, and a sample that does not say so reads as a claim
                  about the reader's company. */}
              <p className="bg-slate-50 px-5 py-2.5 text-[12px] leading-relaxed text-slate-500">
                {hasOwnData ? t('coverage.sampleBody') : t('coverage.sampleBodyNoData')}
              </p>
              {sample.map(answer => {
                // The engine attaches a figure to a draft whether or not the answer it
                // chose rests on it - a Scope 3 "we do not have this on record" came back
                // carrying the Scope 1 number. Show it only when the answer says it.
                const figure = answerStatesFigure(answer.answer, answer.value)
                  ? figureWithUnit(answer.value, answer.unit)
                  : null;
                return (
                  <div key={answer.questionId} className="px-5 py-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-[13px] font-semibold text-slate-900">{answer.questionText}</p>
                      <SupportBadge supported={fromRecords.includes(answer)} t={t} />
                    </div>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-slate-600">{answer.answer}</p>
                    {(figure || answer.document) && (
                      <p className="mt-1.5 text-xs text-slate-400">
                        {figure && <span className="font-medium text-slate-600">{figure}</span>}
                        {/* Only claimed when extraction or the user actually recorded
                            where the figure came from. Silence is correct when nothing
                            is known. */}
                        {answer.document && <span>{figure ? ' · ' : ''}{t('coverage.fromSource', { document: answer.document })}</span>}
                      </p>
                    )}
                  </div>
                );
              })}
              {remaining > 0 && (
                <div className="flex items-center gap-2.5 bg-slate-50 px-5 py-3.5">
                  <Lock className="h-4 w-4 shrink-0 text-slate-500" />
                  <span className="text-[13px] text-slate-600">{t('coverage.sampleRemaining', { count: remaining })}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CoverageReport({ coverage, questionnaireName, questions = [], tier, onStartOver }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const {
    total, fromRecords, written, unanswerable, missingDocuments, policyGaps, hasOwnData, topics,
  } = coverage;
  const { canGenerateAnswers } = getEntitlements(tier);

  // The number that says this change worked. Over the previous year the funnel recorded
  // two paywall hits, because nobody could get far enough to see one.
  React.useEffect(() => {
    track('coverage_report_viewed', {
      questions: total,
      from_records: fromRecords.length,
      written: written.length,
      unanswerable: unanswerable.length,
      policy_gaps: policyGaps.builders.length,
    });
  }, [total, fromRecords.length, written.length, unanswerable.length, policyGaps.builders.length]);

  // Answered-from-records first: those carry the reader's own numbers and are the only
  // part of this page no one else could have produced.
  const sample = [...fromRecords, ...written].slice(0, SAMPLE_ANSWERS);
  const remaining = Math.max(0, total - sample.length);

  const documents = missingDocuments
    .map(entry => ({ ...entry, name: documentName(t, entry.document) }))
    .filter(entry => entry.name);

  const handleDownloadChecklist = () => {
    const generatedAt = new Date();
    const html = buildChecklistHtml({
      t,
      coverage,
      questionnaireName,
      url: workspaceUrl(),
      generatedAt,
    });
    if (downloadChecklist(html, checklistFileName(generatedAt))) {
      track('coverage_checklist_downloaded', { documents: documents.length });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          {t('coverage.title', { count: total })}
        </h1>
        <p className="mt-1.5 text-sm text-slate-400">
          {questionnaireName && <span>{questionnaireName} · </span>}
          {t('coverage.readOnDevice')}
        </p>
      </div>

      {/* The panel is FIRST in the DOM and placed into column two on lg. Source order is
          what a phone gets: status and the takeaway, then the work. Left in source order
          it read counts-last on mobile, which put two price cards ahead of the numbers
          they are meant to justify. */}
      <div className="space-y-8 lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-8 lg:space-y-0">
        {/* RIGHT - reference, and it sticks */}
        <aside className="lg:col-start-2 lg:row-start-1 lg:sticky lg:top-6">
          <ReferencePanel
            t={t}
            total={total}
            fromRecords={fromRecords}
            written={written}
            unanswerable={unanswerable}
            questions={questions}
            sample={sample}
            remaining={remaining}
            hasOwnData={hasOwnData}
            onDownloadChecklist={handleDownloadChecklist}
          />
        </aside>

        {/* LEFT - the work, in the order someone acts on it */}
        <div className="space-y-8 lg:col-start-1 lg:row-start-1">
          {documents.length > 0 && (
            <div className="border border-slate-900 bg-white p-6">
              <h2 className="text-lg font-semibold text-slate-900">{t('coverage.addDocsTitle')}</h2>
              <p className="mt-1 text-[15px] leading-relaxed text-slate-500">{t('coverage.addDocsBody')}</p>

              <div className="mt-4 border-t border-slate-100">
                {documents.map(entry => (
                  <div
                    key={entry.document}
                    className="flex flex-col gap-3 border-b border-slate-100 py-3.5 last:border-b-0 sm:flex-row sm:items-center sm:gap-4"
                  >
                    <div className="flex-grow">
                      <p className="text-[15px] font-medium text-slate-900">{entry.name}</p>
                      <p className="mt-0.5 text-[13px] text-slate-500">
                        {documentHolds(t, entry.document)} · {t('coverage.docUnlocks', { count: entry.unlocks })}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        onClick={() => { track('coverage_add_documents_click', { document: entry.document }); navigate('/evidence'); }}
                        className="inline-flex h-10 items-center gap-2 bg-slate-900 px-4 text-sm font-medium text-white transition-colors hover:bg-slate-800"
                      >
                        <Upload className="h-4 w-4" />
                        {t('coverage.docUpload')}
                      </button>
                      {/* Some of these documents are awkward, and typing four numbers beats
                          fighting a scanned PDF. Both routes end in the same place. */}
                      <button
                        onClick={() => { track('coverage_enter_figures_click', { document: entry.document }); navigate('/data'); }}
                        className="inline-flex h-10 items-center border border-slate-300 px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                      >
                        {t('coverage.docEnter')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {topics.length > 0 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">{t('coverage.topicsTitle')}</h2>
                <p className="mt-0.5 text-[15px] leading-relaxed text-slate-500">{t('coverage.topicsBody')}</p>
              </div>

              <div className="grid gap-3.5 sm:grid-cols-2">
                {topics.map((bucket) => {
                  const name = topicName(t, bucket.topic);
                  if (!name) return null;
                  const wants = bucket.documents.map(d => documentName(t, d)).filter(Boolean);
                  return (
                    <div
                      key={bucket.topic}
                      className={`flex flex-col gap-3.5 border border-t-[3px] border-slate-200 bg-white p-5 ${TOPIC_RULE[bucket.topic] || 'border-t-slate-300'}`}
                    >
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold leading-none text-slate-900">{bucket.total}</span>
                          <span className="text-base font-semibold text-slate-900">{name}</span>
                        </div>
                        <p className="mt-1.5 text-[13px] text-slate-500">{topicSubtitle(t, bucket.topic)}</p>
                      </div>

                      <div className="space-y-1.5 border-t border-slate-100 pt-3">
                        <div className="flex justify-between text-[13px]">
                          <span className="text-slate-500">{t('coverage.topicFromRecords')}</span>
                          <span className="font-semibold text-emerald-600">{bucket.fromRecords}</span>
                        </div>
                        {bucket.needsDocument > 0 && (
                          <div className="flex justify-between text-[13px]">
                            <span className="text-slate-500">{t('coverage.topicNeedsDocument')}</span>
                            <span className="font-semibold text-slate-900">{bucket.needsDocument}</span>
                          </div>
                        )}
                        {bucket.needsPolicy > 0 && (
                          <div className="flex justify-between text-[13px]">
                            <span className="text-slate-500">{t('coverage.topicNeedsPolicy')}</span>
                            <span className="font-semibold text-slate-900">{bucket.needsPolicy}</span>
                          </div>
                        )}
                      </div>

                      {wants.length > 0 && (
                        <div className="border-t border-slate-100 pt-3">
                          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                            {t('coverage.topicWouldAnswer')}
                          </p>
                          <p className="text-[13px] leading-relaxed text-slate-700">{wants.join(' · ')}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* A paid reader has already bought the answers; the open question is what is
              still missing before they send it. Only a free reader is shown a price. */}
          {canGenerateAnswers ? (
            <div className="border border-slate-900 bg-white p-6">
              <h2 className="text-lg font-semibold text-slate-900">
                {unanswerable.length > 0 ? t('coverage.paidOpenTitle', { count: unanswerable.length }) : t('coverage.paidDoneTitle')}
              </h2>
              <p className="mt-1 text-[15px] leading-relaxed text-slate-500">
                {unanswerable.length > 0 ? t('coverage.paidOpenBody') : t('coverage.paidDoneBody')}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-3 border-2 border-slate-900 bg-white p-6">
                <h2 className="text-lg font-semibold text-slate-900">{t('coverage.passTitle')}</h2>
                <ul className="flex-grow space-y-1.5">
                  {[t('coverage.passF1'), t('coverage.passF2'), t('coverage.passF3'), t('coverage.passF4')].map(line => (
                    <li key={line} className="flex gap-2.5 text-sm leading-relaxed text-slate-600">
                      <span className="text-slate-400">•</span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => openCheckout(QUESTIONNAIRE_PASS_CHECKOUT_URL, 'coverage_report_pass', tier)}
                  className="inline-flex h-12 items-center justify-center gap-2 bg-slate-900 text-[15px] font-medium text-white transition-colors hover:bg-slate-800"
                >
                  {t('coverage.passCta', { price: PASS_PRICE })}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              <div className="flex flex-col gap-3 border border-slate-200 bg-white p-6">
                <h2 className="text-lg font-semibold text-slate-900">{t('coverage.passportTitle')}</h2>
                <ul className="flex-grow space-y-1.5">
                  <li className="flex gap-2.5 text-sm leading-relaxed text-slate-600">
                    <span className="text-slate-400">•</span><span>{t('coverage.passportF1')}</span>
                  </li>
                  {/* The EUR 499 case argues itself only when the policy count is real, so
                      the line is omitted entirely when no guided builder covers what was
                      asked. */}
                  {policyGaps.builders.length > 0 && (
                    <li className="flex gap-2.5 text-sm font-medium leading-relaxed text-slate-900">
                      <span className="text-slate-400">•</span>
                      <span>{t('coverage.passportPolicies', { count: policyGaps.builders.length })}</span>
                    </li>
                  )}
                  <li className="flex gap-2.5 text-sm leading-relaxed text-slate-600">
                    <span className="text-slate-400">•</span><span>{t('coverage.passportF2')}</span>
                  </li>
                  <li className="flex gap-2.5 text-sm leading-relaxed text-slate-600">
                    <span className="text-slate-400">•</span><span>{t('coverage.passportF3')}</span>
                  </li>
                </ul>
                <button
                  onClick={() => openCheckout(PASSPORT_CHECKOUT_URL, 'coverage_report_passport', tier)}
                  className="inline-flex h-12 items-center justify-center border border-slate-900 text-[15px] font-medium text-slate-900 transition-colors hover:bg-slate-50"
                >
                  {t('coverage.passportCta', { price: PASSPORT_PRICE })}
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4">
            {!canGenerateAnswers && (
              <p className="text-xs leading-relaxed text-slate-400">{t('coverage.creditNote', { pass: PASS_PRICE })}</p>
            )}
            {onStartOver && (
              <button onClick={onStartOver} className="ml-auto shrink-0 text-sm text-slate-500 underline underline-offset-2 hover:text-slate-700">
                {t('coverage.startOver')}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
