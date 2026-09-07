import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileCheck, PenLine, HelpCircle, ArrowRight, Upload } from 'lucide-react';
import { track } from '@/lib/track';
import { useLanguage } from '@/components/LanguageContext';
import {
  PASSPORT_CHECKOUT_URL,
  QUESTIONNAIRE_PASS_CHECKOUT_URL,
  PASS_PRICE,
  PASSPORT_PRICE,
  openCheckout,
} from '@/lib/checkout';

// The free first action: what this questionnaire needs, measured against what the
// user actually has. See COVERAGE-REPORT-SPEC.md.
//
// It reports counts and provenance, never a readiness score, a pass likelihood or a
// predicted buyer outcome - we do not know how a customer will read a response, and
// saying otherwise would be selling a promise we cannot keep.
//
// Three answers are shown in full and the rest are counted. That is the line between
// proving the thing works on your own documents and doing the work for free.
const FULL_ANSWERS_SHOWN = 3;
// Enough to tell at a glance whether the file was read properly, without turning the
// report into a wall of text.
const QUESTIONS_PREVIEWED = 5;

// Document labels are literal t() calls, not a computed key: the i18n coverage guard
// only sees keys it can read in the source, and a key it cannot see is a key that can
// go missing in German without failing the build.
function documentLabel(t, document) {
  switch (document) {
    case 'electricityBill': return t('coverage.docElectricityBill');
    case 'fuelInvoice': return t('coverage.docFuelInvoice');
    case 'waterBill': return t('coverage.docWaterBill');
    case 'wasteManifest': return t('coverage.docWasteManifest');
    case 'hrReport': return t('coverage.docHrReport');
    case 'trainingRecord': return t('coverage.docTrainingRecord');
    case 'safetyLog': return t('coverage.docSafetyLog');
    // A document type with no label is not shown at all rather than shown raw.
    default: return null;
  }
}

// The icon arrives already rendered. Passing the component and calling it as <Icon />
// reads better but the repo's eslint has no jsx-uses-vars rule, so it reports the
// binding as unused; not worth a disable comment for one element.
function Group({ icon, heading, body, children }) {
  return (
    <div className="border border-slate-200 bg-white p-5">
      <div className="flex items-start gap-3">
        {icon}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-slate-900">{heading}</h3>
          <p className="text-sm text-slate-600 leading-relaxed mt-1">{body}</p>
          {children}
        </div>
      </div>
    </div>
  );
}

export default function CoverageReport({ coverage, questionnaireName, questions = [], tier, onStartOver, onAddDocuments }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { total, fromRecords, written, unanswerable, missingDocuments, policyGaps, hasOwnData } = coverage;

  // The number that says this change worked. Over the previous year the funnel
  // recorded two paywall hits, because nobody could get far enough to see one.
  React.useEffect(() => {
    track('coverage_report_viewed', {
      questions: total,
      from_records: fromRecords.length,
      written: written.length,
      unanswerable: unanswerable.length,
      policy_gaps: policyGaps.builders.length,
    });
  }, [total, fromRecords.length, written.length, unanswerable.length, policyGaps.builders.length]);

  const [showAllQuestions, setShowAllQuestions] = React.useState(false);
  const questionPreview = showAllQuestions ? questions : questions.slice(0, QUESTIONS_PREVIEWED);

  const shown = fromRecords.slice(0, FULL_ANSWERS_SHOWN);
  const documents = missingDocuments
    .map(entry => ({ ...entry, label: documentLabel(t, entry.document) }))
    .filter(entry => entry.label);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t('coverage.title', { count: total })}</h1>
        {questionnaireName && <p className="text-slate-500 mt-1 truncate">{questionnaireName}</p>}
        <p className="text-slate-600 mt-3 leading-relaxed">{t('coverage.lead')}</p>
      </div>

      {/* What we actually read. Three counts about a file you cannot see is a number you
          have to take on faith, and reading a questionnaire out of a PDF is the step most
          likely to go wrong — so show the questions, and let anyone check them for free. */}
      {questions.length > 0 && (
        <div className="border border-slate-200 bg-white p-5">
          <h2 className="text-base font-semibold text-slate-900">{t('coverage.readTitle')}</h2>
          <p className="text-sm text-slate-500 mt-1">{t('coverage.readBody')}</p>
          <ol className="mt-3 space-y-2 text-sm text-slate-700">
            {questionPreview.map((question, index) => (
              <li key={question.id || index} className="flex gap-2">
                <span className="text-slate-400 shrink-0">{index + 1}.</span>
                <span>{question.text}</span>
              </li>
            ))}
          </ol>
          {questions.length > QUESTIONS_PREVIEWED && (
            <button
              onClick={() => setShowAllQuestions(v => !v)}
              className="mt-3 text-sm text-slate-600 underline hover:text-slate-900"
            >
              {showAllQuestions
                ? t('coverage.readShowLess')
                : t('coverage.readShowAll', { count: questions.length - QUESTIONS_PREVIEWED })}
            </button>
          )}
        </div>
      )}

      <div className="space-y-3">
        <Group
          icon={<FileCheck className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />}
          heading={t('coverage.fromRecords', { count: fromRecords.length })}
          body={fromRecords.length > 0 ? t('coverage.fromRecordsBody') : t('coverage.fromRecordsNone')}
        >
          {shown.length > 0 && (
            <ul className="mt-4 space-y-3">
              {shown.map(answer => (
                <li key={answer.questionId} className="border-l-2 border-emerald-200 pl-3">
                  <p className="text-sm font-medium text-slate-900">{answer.questionText}</p>
                  <p className="text-sm text-slate-600 mt-1 leading-relaxed">{answer.answer}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {answer.value != null && (
                      <span className="font-medium text-slate-700">
                        {answer.value}{answer.unit ? ' ' + answer.unit : ''}
                      </span>
                    )}
                    {/* Only claimed when extraction or the user actually recorded where
                        the figure came from. Silence is correct when nothing is known. */}
                    {answer.document && (
                      <span> · {t('coverage.fromSource', { document: answer.document })}</span>
                    )}
                  </p>
                </li>
              ))}
            </ul>
          )}
          {fromRecords.length > shown.length && (
            <p className="text-xs text-slate-500 mt-3">
              {t('coverage.showingSome', { shown: shown.length, count: fromRecords.length })}
            </p>
          )}
        </Group>

        <Group
          icon={<PenLine className="w-5 h-5 shrink-0 mt-0.5 text-indigo-600" />}
          heading={t('coverage.written', { count: written.length })}
          // With an empty workspace these come from the answer library and nothing else.
          // Saying they were "written from what you told us" would be a lie about a real
          // number, and the number is the first thing that makes someone distrust the page.
          body={hasOwnData ? t('coverage.writtenBody') : t('coverage.writtenBodyNoData')}
        />

        <Group
          icon={<HelpCircle className="w-5 h-5 shrink-0 mt-0.5 text-slate-400" />}
          heading={t('coverage.unanswerable', { count: unanswerable.length })}
          body={t('coverage.unanswerableBody')}
        />
      </div>

      {documents.length > 0 && (
        <div className="border border-slate-200 bg-slate-50 p-5">
          <h3 className="text-base font-semibold text-slate-900">{t('coverage.addDocsTitle')}</h3>
          <p className="text-sm text-slate-600 mt-1 leading-relaxed">{t('coverage.addDocsBody')}</p>
          <ul className="mt-4 space-y-2">
            {documents.map(entry => (
              <li key={entry.document} className="text-sm text-slate-700">
                <span className="font-medium">{entry.label}</span>{' '}
                <span className="text-slate-500">{t('coverage.docUnlocks', { count: entry.unlocks })}</span>
              </li>
            ))}
          </ul>
          <button
            onClick={() => {
              track('coverage_add_documents_click');
              // Stash the questionnaire before leaving, so coming back re-runs it against
              // whatever they just added instead of showing an empty upload screen.
              onAddDocuments?.();
              navigate('/data');
            }}
            className="mt-4 inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium px-4 py-2.5"
          >
            <Upload className="w-4 h-4" />
            {t('coverage.addDocsCta')}
          </button>
        </div>
      )}

      {/* Both offers, with the buyer's own numbers inside them. The 499 case argues
          itself only when the policy count is real, so the line is omitted entirely
          when no guided builder covers what this questionnaire actually asked for. */}
      <div className="border-t border-slate-200 pt-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">{t('coverage.offerTitle')}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="border border-slate-900 bg-white p-5 flex flex-col">
            <h3 className="text-base font-semibold text-slate-900">{t('coverage.passTitle')}</h3>
            <p className="text-sm text-slate-600 leading-relaxed mt-2 flex-1">{t('coverage.passBody')}</p>
            <button
              onClick={() => openCheckout(QUESTIONNAIRE_PASS_CHECKOUT_URL, 'coverage_report_pass', tier)}
              className="mt-4 inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium px-4 py-2.5"
            >
              {t('coverage.passCta', { price: PASS_PRICE })}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="border border-slate-200 bg-white p-5 flex flex-col">
            <h3 className="text-base font-semibold text-slate-900">{t('coverage.passportTitle')}</h3>
            <p className="text-sm text-slate-600 leading-relaxed mt-2">{t('coverage.passportBody')}</p>
            {policyGaps.builders.length > 0 && (
              <p className="text-sm text-slate-900 font-medium leading-relaxed mt-2 flex-1">
                {t('coverage.passportPolicies', { count: policyGaps.builders.length })}
              </p>
            )}
            <button
              onClick={() => openCheckout(PASSPORT_CHECKOUT_URL, 'coverage_report_passport', tier)}
              className="mt-4 inline-flex items-center justify-center gap-2 border border-slate-900 text-slate-900 hover:bg-slate-50 text-sm font-medium px-4 py-2.5"
            >
              {t('coverage.passportCta', { price: PASSPORT_PRICE })}
            </button>
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-4">{t('coverage.creditNote', { pass: PASS_PRICE })}</p>
      </div>

      {onStartOver && (
        <button onClick={onStartOver} className="text-sm text-slate-500 hover:text-slate-700 underline">
          {t('coverage.startOver')}
        </button>
      )}
    </div>
  );
}
