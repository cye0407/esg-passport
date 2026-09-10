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

// One heading treatment for every section, so a reader can tell at a glance what each
// block is doing for them. The eyebrow names the JOB - what it asks, what is missing,
// what it costs - and the title says it in words. Before this, four boxes of near
// identical weight sat under headings of three different sizes, some inside the box and
// some above it, and nothing told you which was which.
function SectionHeading({ eyebrow, title, body }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{eyebrow}</p>
      <h2 className="mt-1 text-xl font-semibold text-slate-900">{title}</h2>
      {body && <p className="mt-1 text-[15px] leading-relaxed text-slate-500">{body}</p>}
    </div>
  );
}

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


// Supporting detail: the answer preview, portable checklist, and raw questions.
// Status sits above both columns so it is the first thing at every viewport.
//
// The raw question list is NOT up front any more. It is the buyer's own content — the
// reader wrote nothing of it but has read all of it — and PDF and Word uploads already
// confirm the parsed list in a step of its own before this screen, so for those formats
// it was the second showing of a list just approved. It stays reachable at the foot of
// the panel, because a spreadsheet skips that confirmation and a wrong denominator makes
// every number here false. Reachable, not resident.
// `fromRecords` is still needed — SupportBadge asks whether a given draft is in it. The
// other counts moved to the stat band above both columns and are no longer read here.
function ReferencePanel({
  t, fromRecords, questions, sample, remaining, hasOwnData, onDownloadChecklist,
}) {
  const [showQuestions, setShowQuestions] = React.useState(false);

  return (
    <div className="flex flex-col border border-slate-200 bg-white">
      {/* The takeaway sits inside the panel rather than at the foot of the page, where
          it was the last thing under two checkout buttons and read as the consolation
          prize for not buying. It is the opposite: with no account and no email, a file
          someone carries out is the only thing that can bring them back. It is NOT
          sticky — the panel stopped being sticky when the status band moved above both
          columns — so it scrolls away like everything else. If people turn out to leave
          without it, that is the first thing to change. */}
      <div className="order-2 border-b border-slate-100 p-5">
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

      {sample.length > 0 && (
        <div className="order-1 border-b border-slate-100">
          <p className="px-5 pt-4 text-[13px] font-semibold text-slate-900">
            {t('coverage.sampleTitle', { count: sample.length })}
          </p>
          {/* Whose numbers these are. Without their own data the drafts rest on the
              example workspace, and a sample that does not say so reads as a claim
              about the reader's company. */}
          <p className="px-5 pb-3 pt-1 text-[12px] leading-relaxed text-slate-500">
            {hasOwnData ? t('coverage.sampleBody') : t('coverage.sampleBodyNoData')}
          </p>
          <div className="divide-y divide-slate-100 border-t border-slate-100">
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
        </div>
      )}

      {questions.length > 0 && (
        <div className="order-3">
          <button
            onClick={() => setShowQuestions(v => !v)}
            className="flex w-full items-center justify-between px-5 py-3.5 text-left text-[13px] text-slate-500 transition-colors hover:text-slate-700"
          >
            {showQuestions ? t('coverage.panelHide') : t('coverage.seeQuestions', { count: questions.length })}
            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${showQuestions ? 'rotate-180' : ''}`} />
          </button>
          {showQuestions && (
            <ol className="divide-y divide-slate-100 overflow-hidden border-t border-slate-100">
              {questions.map((question, index) => (
                <li key={question.id || index} className="flex gap-2.5 px-5 py-3">
                  <span className="w-5 shrink-0 text-[13px] text-slate-400">{index + 1}.</span>
                  <span className="text-[13px] leading-relaxed text-slate-700">{question.text}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
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
  // A free visitor has not bought generated answers, and the current engine can turn
  // absence into confident-sounding prose (or a partial-period bill into an annual
  // statement). Do not use that output as a sales preview. Paid workspaces retain the
  // answer panel because it is part of the product they already have access to.
  const sample = canGenerateAnswers
    ? [...fromRecords, ...written].slice(0, SAMPLE_ANSWERS)
    : [];
  const remaining = canGenerateAnswers ? Math.max(0, total - sample.length) : 0;

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
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          {/* The count lives in the sticky panel, not here. This heading scrolls away;
              the panel does not, and a status number you cannot see is not a status. */}
          {t('coverage.title')}
        </h1>
        <p className="mt-1.5 text-sm text-slate-400">
          {questionnaireName && <span>{questionnaireName} · </span>}
          {t('coverage.readOnDevice')}
        </p>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-slate-600">
          {t('coverage.lead')}
        </p>
      </div>

      <dl className="grid grid-cols-2 border border-slate-200 bg-white sm:grid-cols-4">
        {[
          [t('checklist.total'), total, 'text-slate-900'],
          [t('coverage.topicFromRecords'), fromRecords.length, 'text-emerald-700'],
          [t('checklist.written'), written.length, 'text-slate-900'],
          [t('checklist.unanswerable'), unanswerable.length, 'text-slate-900'],
        ].map(([label, value, tone], index) => (
          <div
            key={label}
            className={`flex flex-col-reverse gap-1 p-4 sm:border-l sm:p-5 sm:first:border-l-0 ${index % 2 ? 'border-l' : ''} ${index > 1 ? 'border-t sm:border-t-0' : ''}`}
          >
            {/* Term before definition, as a description list requires; flex-col-reverse
                puts the number back on top visually. */}
            <dt className="text-xs leading-snug text-slate-500">{label}</dt>
            <dd className={`text-3xl font-bold tabular-nums ${tone}`}>{value}</dd>
          </div>
        ))}
      </dl>

      {/* Desktop keeps supporting detail in a compact second column. Mobile gets the
          same panel inline after the actionable gaps and before the purchase choice.
          Both instances are mounted and one is display:none per breakpoint — the panel
          has to sit in a different COLUMN on desktop and mid-flow on mobile, which no
          amount of ordering can do from one node. Only the visible copy is in the
          accessibility tree, so the duplicate buttons are not announced twice. */}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        {/* RIGHT - supporting detail */}
        <aside className="hidden lg:col-start-2 lg:row-start-1 lg:block">
          <ReferencePanel
            t={t}
            fromRecords={fromRecords}
            questions={questions}
            sample={sample}
            remaining={remaining}
            hasOwnData={hasOwnData}
            onDownloadChecklist={handleDownloadChecklist}
          />
        </aside>

        {/* LEFT - the work, in the order someone acts on it */}
        <div className="flex flex-col gap-10 lg:col-start-1 lg:row-start-1">
          {/* Missing items are ordered first: outcome to action. Topic context follows. */}
          {topics.length > 0 && (
            <div className="order-2 space-y-4">
              <SectionHeading
                eyebrow={t('coverage.eyebrowAsks')}
                title={t('coverage.topicsTitle')}
                body={t('coverage.topicsBody', { count: total })}
              />

              {/* One block of rows rather than four cards. Each card used to repeat the
                  same status breakdown the panel already gives - "answered from your
                  records" appeared three times on one screen - so the rows are gone and
                  these say what they are for: how much of each subject was asked, and
                  which documents speak to it. */}
              <div className="divide-y divide-slate-100 border border-slate-200 bg-white">
                {topics.map((bucket) => {
                  const name = topicName(t, bucket.topic);
                  if (!name) return null;
                  const share = total > 0 ? Math.max(4, Math.round((bucket.total / total) * 100)) : 0;
                  return (
                    <div key={bucket.topic} className="px-5 py-4">
                      <div className="flex items-baseline justify-between gap-4">
                        <div className="min-w-0">
                        <p className="text-[15px] font-semibold text-slate-900">{name}</p>
                        <p className="text-[13px] leading-relaxed text-slate-500">{topicSubtitle(t, bucket.topic)}</p>
                        </div>
                        <p className="shrink-0 text-sm font-semibold tabular-nums text-slate-700">
                          {bucket.total === 1
                            ? t('coverage.topicQuestion', { count: bucket.total })
                            : t('coverage.topicQuestions', { count: bucket.total })}
                        </p>
                      </div>
                      <div className="mt-3 h-1.5 overflow-hidden bg-slate-100" aria-hidden="true">
                        <div className="h-full bg-slate-700" style={{ width: `${share}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {documents.length > 0 && (
            <div className="order-1 space-y-4">
              <SectionHeading
                eyebrow={t('coverage.eyebrowMissing')}
                title={t('coverage.addDocsTitle')}
                body={t('coverage.addDocsBody')}
              />

              <div className="border border-slate-900 bg-white px-6 py-2">
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

          <div className="order-3 lg:hidden">
            <ReferencePanel
              t={t}
              fromRecords={fromRecords}
              questions={questions}
              sample={sample}
              remaining={remaining}
              hasOwnData={hasOwnData}
              onDownloadChecklist={handleDownloadChecklist}
            />
          </div>

          {/* A paid reader has already bought the answers; the open question is what is
              still missing before they send it. Only a free reader is shown a price. */}
          {canGenerateAnswers ? (
            <div className="order-4"><SectionHeading
              eyebrow={t('coverage.eyebrowBeforeSend')}
              title={unanswerable.length > 0
                ? t('coverage.paidOpenTitle', { count: unanswerable.length })
                : t('coverage.paidDoneTitle')}
              body={unanswerable.length > 0 ? t('coverage.paidOpenBody') : t('coverage.paidDoneBody')}
            /></div>
          ) : (
            <div className="order-4 space-y-4">
              <SectionHeading eyebrow={t('coverage.eyebrowCost')} title={t('coverage.costTitle')} />
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
                      <span>{t(
                        policyGaps.builders.length === 1
                          ? 'coverage.passportPolicyOne'
                          : 'coverage.passportPolicies',
                        { count: policyGaps.builders.length },
                      )}</span>
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
            </div>
          )}

          <div className="order-5 flex flex-wrap items-center gap-4">
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
