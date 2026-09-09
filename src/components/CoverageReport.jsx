import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Download, Lock, Upload } from 'lucide-react';
import { track } from '@/lib/track';
import { useLanguage } from '@/components/LanguageContext';
import { documentName, documentHolds } from '@/lib/documentLabels';
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
// It reads in the order someone asks the questions:
//   what did you read out of my file, and can I check it
//   what is it asking ABOUT - grouped the way the customer asking it groups things,
//     because "how confident is the engine" is our category, not theirs
//   what do I do next, per document, upload or type
//   what will the answers actually look like
//   what does finishing cost
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
const QUESTIONS_PREVIEWED = 5;
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

export default function CoverageReport({ coverage, questionnaireName, questions = [], tier, onStartOver }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const {
    total, fromRecords, written, unanswerable, missingDocuments, policyGaps, hasOwnData, topics,
  } = coverage;

  const [showAllQuestions, setShowAllQuestions] = React.useState(false);
  const questionPreview = showAllQuestions ? questions : questions.slice(0, QUESTIONS_PREVIEWED);

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
    <div className="space-y-8">
      {/* 1 — what we read */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            {t('coverage.title', { count: total })}
          </h1>
          <p className="mt-1.5 text-sm text-slate-400">
            {questionnaireName && <span>{questionnaireName} · </span>}
            {t('coverage.readOnDevice')}
          </p>
        </div>

        {questions.length > 0 && (
          <div className="border border-slate-200 bg-white">
            <ol className="divide-y divide-slate-100">
              {questionPreview.map((question, index) => (
                <li key={question.id || index} className="flex gap-2.5 px-5 py-3">
                  <span className="w-5 shrink-0 text-[13px] text-slate-400">{index + 1}.</span>
                  <span className="text-sm leading-relaxed text-slate-700">{question.text}</span>
                </li>
              ))}
            </ol>
            {questions.length > QUESTIONS_PREVIEWED && (
              <button
                onClick={() => setShowAllQuestions(v => !v)}
                className="w-full border-t border-slate-100 px-5 py-3 text-left text-sm text-indigo-600 hover:text-indigo-700"
              >
                {showAllQuestions ? t('coverage.readShowLess') : t('coverage.readShowAll', { count: questions.length })}
              </button>
            )}
          </div>
        )}
      </div>

      {/* 2 — what it is asking about */}
      {topics.length > 0 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{t('coverage.topicsTitle')}</h2>
            <p className="mt-0.5 text-[15px] leading-relaxed text-slate-500">{t('coverage.topicsBody')}</p>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
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

      {/* 3 — the action: add what is missing, by upload or by hand */}
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

      {/* 4 — the sample, in the shape Respond renders */}
      {sample.length > 0 && (
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-semibold text-slate-900">
                {t('coverage.sampleTitle', { count: sample.length })}
              </h2>
              <span className="bg-slate-200 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                {t('coverage.sampleBadge')}
              </span>
            </div>
            <p className="mt-1 text-[15px] leading-relaxed text-slate-500">
              {hasOwnData ? t('coverage.sampleBody') : t('coverage.sampleBodyNoData')}
            </p>
          </div>

          <div className="border border-slate-200 bg-white">
            <div className="grid grid-cols-[1fr_auto] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <span>{t('respond.colQA')}</span>
              <span className="w-28 text-center">{t('respond.colConfidence')}</span>
            </div>

            {sample.map((answer) => {
              // The engine attaches a figure to a draft whether or not the answer it
              // chose rests on it - a Scope 3 "we do not have this on record" came back
              // carrying the Scope 1 number. Show it only when the answer says it.
              const figure = answerStatesFigure(answer.answer, answer.value)
                ? figureWithUnit(answer.value, answer.unit)
                : null;
              return (
              <div key={answer.questionId} className="grid grid-cols-[1fr_auto] gap-4 border-b border-slate-100 px-5 py-4 last:border-b-0">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{answer.questionText}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{answer.answer}</p>
                  {(figure || answer.document) && (
                    <p className="mt-1.5 text-xs text-slate-400">
                      {figure && <span className="font-medium text-slate-600">{figure}</span>}
                      {/* Only claimed when extraction or the user actually recorded where
                          the figure came from. Silence is correct when nothing is known. */}
                      {answer.document && <span>{figure ? ' · ' : ''}{t('coverage.fromSource', { document: answer.document })}</span>}
                    </p>
                  )}
                </div>
                <div className="w-28 text-center">
                  <SupportBadge supported={fromRecords.includes(answer)} t={t} />
                </div>
              </div>
              );
            })}

            {remaining > 0 && (
              <div className="flex items-center gap-2.5 border-t border-slate-200 bg-slate-50 px-5 py-4">
                <Lock className="h-4 w-4 shrink-0 text-slate-500" />
                <span className="text-sm text-slate-600">{t('coverage.sampleRemaining', { count: remaining })}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5 — what finishing costs. Each names what it unlocks, not what tier it is. */}
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
            {/* The €499 case argues itself only when the policy count is real, so the
                line is omitted entirely when no guided builder covers what was asked. */}
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

      {/* 6 - what they take with them. There is no account and no email, so the file
          they carry out is the only way back to this workspace. */}
      <div className="border border-slate-200 bg-slate-50 p-6">
        <h2 className="text-lg font-semibold text-slate-900">{t('coverage.takeawayTitle')}</h2>
        <p className="mt-1 text-[15px] leading-relaxed text-slate-500">{t('coverage.takeawayBody')}</p>
        <button
          onClick={handleDownloadChecklist}
          className="mt-4 inline-flex h-11 items-center gap-2 border border-slate-900 bg-white px-5 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-100"
        >
          <Download className="h-4 w-4" />
          {t('coverage.takeawayDownload')}
        </button>
        <p className="mt-3 text-[13px] leading-relaxed text-slate-500">{t('coverage.takeawaySaved')}</p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <p className="text-xs leading-relaxed text-slate-400">{t('coverage.creditNote', { pass: PASS_PRICE })}</p>
        {onStartOver && (
          <button onClick={onStartOver} className="ml-auto shrink-0 text-sm text-slate-500 underline underline-offset-2 hover:text-slate-700">
            {t('coverage.startOver')}
          </button>
        )}
      </div>
    </div>
  );
}
