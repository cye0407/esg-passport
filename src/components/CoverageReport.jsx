import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileCheck2, Lock, Upload } from 'lucide-react';
import { track } from '@/lib/track';
import { useLanguage } from '@/components/LanguageContext';
import { documentName } from '@/lib/documentLabels';
import { getEntitlements } from '@/lib/entitlements';
import { figureWithUnit, answerStatesFigure } from '@/lib/figures';
import { selectBestCoverageAnswers } from '@/lib/coverage';
import { buildRequirements } from '@/lib/requirements';
import RequirementsOverview from '@/components/RequirementsOverview';
import { getCompanyProfile, getPolicies, saveCompanyProfile, saveDocument, updatePolicyFileLocation, updatePolicyStatus } from '@/lib/store';
import { POLICY_BUILDERS, builderName } from '@/data/policyBuilders';
import PolicyBuilder from '@/components/PolicyBuilder';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
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
// One verdict, then one move. The counts settle what the questionnaire needs and the
// primary button says what to do next. Reference material and alternate paths stay
// available without competing for the first decision. Topic cards then explain the
// work in the buyer's categories, not in our engine's confidence categories.
//
// Every tier sees this. It was built as the free tier's consolation for not getting
// answers, which was the wrong idea: it is the questionnaire's status view, and a
// paid buyer chasing a colleague for the waste manifest before a deadline needs it
// more than a free visitor does. Entitlements only change which actions can finish
// the work; they do not hide the diagnosis.
//
// It reports counts and provenance, never a readiness score, a pass likelihood or a
// predicted buyer outcome - we do not know how a customer will read a response, and
// saying otherwise would sell a promise we cannot keep.
// Three, as the needs-first screen promises: "See 3 drafted answers free first".
const SAMPLE_ANSWERS = 3;

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

const BUILDER_POLICY_IDS = {
  code_of_conduct: 'code_of_conduct', anti_corruption: 'anti_corruption', whistleblowing: 'whistleblower',
  data_privacy: 'data_privacy', supplier_coc: 'supplier_code', health_safety: 'health_safety_policy',
  equal_opp: 'anti_discrimination', environmental: 'environmental_policy',
};

// "No grievance mechanism is in place" is the same sentence as "we do not have this", and
// today it is usually not even the reader's: the store starts every policy as
// 'not_available', which the data bridge passes on as "not in place".
const NEGATIVE_ANSWER = /\b(no data|not available|do not have|don't have|not tracked|unable to|cannot provide|not currently)\b|\bno\b[^.]*\b(?:is|are) in place\b/i;

/**
 * Whether a draft can stand in front of someone who has not paid yet.
 *
 * Free used to be shown only `fromRecords`, put through isPreviewWorthy below. Measured
 * end to end that group is 0-8 answers out of 17-81 (COVERAGE-REPORT-SPEC.md), and the
 * seven conditions below narrow it further — so the person deciding whether to buy saw
 * little or nothing, while the person who had already bought saw the whole pool. The
 * demo ran backwards.
 *
 * Free now sees the same pool paid does. The honesty is carried by SupportBadge, which
 * says of every line whether it rests on the reader's own document or on the answer
 * library, rather than by hiding the drafts from the people deciding whether to buy
 * them. What stays out is only what reads as the tool failing rather than as a draft to
 * edit: a fragment, or a sentence whose content is "we do not have this".
 *
 * A fragment is judged on what it says, not on its length. This used to be a 45-character
 * floor inherited from isPreviewWorthy, and it threw out the short figures a reader's own
 * records produce: "Water withdrawal (2026): 8,154 m³." is 34 characters. Across the
 * benchmark fixtures with the rich test company the floor rejected 41 drafts, every one a
 * real answer. Now a draft that states a figure is shown, even when it adds "a
 * market-based figure is not available" as a caveat. A reporting year is not a figure, and
 * neither is a zero on its own: that is what a missing value looks like after the data
 * bridge has defaulted it ("0 employees (FTE)" from a workspace with no headcount in it).
 * A draft without a figure must be a sentence of at least four words that does not say
 * the company has nothing on record.
 */
const REPORTING_YEAR = /\(?\b(?:19|20)\d{2}\b\)?/g;

export function isPresentableDraft(answer) {
  const text = String(answer?.answer || '').trim();
  if (!text) return false;
  if (/[1-9]/.test(text.replace(REPORTING_YEAR, ''))) return true;
  if (/\d/.test(text.replace(REPORTING_YEAR, ''))) return false;
  const words = text.split(/\s+/).length;
  return words >= 4 && /[.!?]$/.test(text) && !NEGATIVE_ANSWER.test(text);
}

/** A presentable draft that also carries the reader's own figure and names its source. */
export function isPreviewWorthy(answer) {
  const text = String(answer?.answer || '').trim();
  return isPresentableDraft(answer)
    && answer?.confidence === 'high'
    && answer?.value !== undefined
    && answer?.value !== null
    && answer?.value !== ''
    && answerStatesFigure(text, answer.value)
    && Boolean(answer.document);
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
function ReferencePanel({ t, fromRecords, sample, remaining, hasOwnData, isSample, draftedCount, canGenerateAnswers }) {
  // The headline counts every drafted answer; this panel shows a handful. Say both
  // numbers so the reader can reconcile them, and say what the rest are.
  const moreDrafted = Math.max(0, draftedCount - sample.length);
  const notDrafted = Math.max(0, remaining - moreDrafted);
  const titleKey = isSample ? 'coverage.sampleShownExample' : 'coverage.sampleShown';

  return (
    <div id="coverage-drafts" className="flex flex-col border border-slate-200 bg-white">
      {/* The takeaway sits inside the panel rather than at the foot of the page, where
          it was the last thing under two checkout buttons and read as the consolation
          prize for not buying. It is the opposite: with no account and no email, a file
          someone carries out is the only thing that can bring them back. It is NOT
          sticky — the panel stopped being sticky when the status band moved above both
          columns — so it scrolls away like everything else. If people turn out to leave
          without it, that is the first thing to change. */}
      {sample.length > 0 && (
        <div className="border-b border-slate-100">
          <p className="px-5 pt-4 text-[13px] font-semibold text-slate-900">
            {t(titleKey, { shown: sample.length, drafted: draftedCount })}
          </p>
          {/* Whose numbers these are. Without their own data the drafts rest on the
              example workspace, and a sample that does not say so reads as a claim
              about the reader's company. */}
          <p className="px-5 pb-3 pt-1 text-[12px] leading-relaxed text-slate-500">
            {isSample ? t('coverage.sampleBodyExample') : hasOwnData ? t('coverage.sampleBody') : t('coverage.sampleBodyNoData')}
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
                <span className="text-[13px] text-slate-600">
                  {[
                    moreDrafted > 0
                      ? t(canGenerateAnswers
                        ? (moreDrafted === 1 ? 'coverage.moreDraftedPaidOne' : 'coverage.moreDraftedPaid')
                        : (moreDrafted === 1 ? 'coverage.moreDraftedFreeOne' : 'coverage.moreDraftedFree'), { count: moreDrafted })
                      : null,
                    notDrafted > 0
                      ? t(notDrafted === 1 ? 'coverage.notDraftedOne' : 'coverage.notDrafted', { count: notDrafted })
                      : null,
                  ].filter(Boolean).join(' ')}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// The list the parser pulled out of the uploaded file, kept beside the report instead of
// behind two clicks inside "Other options". For a spreadsheet this is the only place the
// denominator can be checked -- PDF and Word confirm their parse in an earlier step, but
// xlsx skips that, and a wrong question count makes every number on the report false.
// Deliberately small: a fixed-height scroller, not 91 rows pushing the page down.
function QuestionsRail({ t, questions, questionnaireName, isSample }) {
  if (!questions.length) return null;
  return (
    <aside className="mt-6 shrink-0 xl:sticky xl:top-6 xl:mt-0 xl:w-72">
      <div className="rounded-[14px] border border-[#e6ece8] bg-white">
        <div className="border-b border-[#e6ece8] px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#55635c]">{t('coverage.railTitle')}</p>
          <p className="mt-1 text-[13px] font-semibold text-[#0f1a15]">{t(isSample ? 'coverage.railCountExample' : 'coverage.railCount', { count: questions.length })}</p>
          {questionnaireName && <p className="mt-0.5 truncate text-[11.5px] text-[#6b7a72]" title={questionnaireName}>{questionnaireName}</p>}
        </div>
        <ol className="max-h-[22rem] divide-y divide-[#f0f4f2] overflow-y-auto">
          {questions.map((question, index) => (
            <li key={question.id || index} className="flex gap-2.5 px-4 py-2.5">
              <span className="w-5 shrink-0 text-[11.5px] tabular-nums text-[#9aa8a1]">{index + 1}</span>
              <span className="text-[12.5px] leading-snug text-[#3f4a45]">{question.text}</span>
            </li>
          ))}
        </ol>
      </div>
    </aside>
  );
}

// isSample: the built-in example questionnaire, not the reader's file.
// sampleCompany: the figures come from the fictional example workspace, not theirs.
// Without these the example spoke in the second person throughout - "11 of YOUR 15
// answers", "figures from YOUR own records" - to someone who had uploaded nothing,
// which made every evidence claim on the page read as unreliable.
export default function CoverageReport({ coverage, questionnaireName, questions = [], tier, onStartOver, onRefresh, onShowAnswers, isSample = false, sampleCompany = false, onUploadOwn }) {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [companyOpen, setCompanyOpen] = React.useState(false);
  const [companyDraft, setCompanyDraft] = React.useState(() => getCompanyProfile() || {});
  const [policyBuilderId, setPolicyBuilderId] = React.useState(null);
  const [policyUploadOpen, setPolicyUploadOpen] = React.useState(false);
  const [policyUploadFile, setPolicyUploadFile] = React.useState(null);
  const [policyUploadBuilder, setPolicyUploadBuilder] = React.useState('');
  const {
    total, recovered = [], fromRecords, partial = [], written, unanswerable, missingDocuments, policyGaps, hasOwnData, topics,
  } = coverage;
  const { canGenerateAnswers, canBuildPolicies } = getEntitlements(tier);

  // The number that says this change worked. Over the previous year the funnel recorded
  // two paywall hits, because nobody could get far enough to see one.
  React.useEffect(() => {
    track('coverage_report_viewed', {
      questions: total,
      recovered: recovered.length,
      from_records: fromRecords.length,
      partial: partial.length,
      written: written.length,
      unanswerable: unanswerable.length,
      policy_gaps: policyGaps.builders.length,
    });
  }, [total, recovered.length, fromRecords.length, partial.length, written.length, unanswerable.length, policyGaps.builders.length]);

  // Free and paid draw from the same pool. selectBestCoverageAnswers already scores a
  // draft by confidence, then by whether it carries a figure, then by whether it names
  // a document — so the answers built on the reader's own records still lead, and the
  // badge on each line says which is which. Free additionally drops drafts that read as
  // a failure rather than as a starting point. See isPresentableDraft.
  const samplePool = [...fromRecords, ...written];
  const sample = selectBestCoverageAnswers(
    canGenerateAnswers ? samplePool : samplePool.filter(isPresentableDraft),
    SAMPLE_ANSWERS,
  );
  const remaining = Math.max(0, total - sample.length);

  const documents = missingDocuments
    .map(entry => ({ ...entry, name: documentName(t, entry.document) }))
    .filter(entry => entry.name);
  const openCompany = () => {
    setCompanyDraft(getCompanyProfile() || {});
    setCompanyOpen(true);
  };

  const saveCompany = () => {
    saveCompanyProfile(companyDraft);
    setCompanyOpen(false);
    onRefresh?.();
  };

  const saveUploadedPolicy = () => {
    if (!policyUploadFile || !policyUploadBuilder) return;
    const policyId = BUILDER_POLICY_IDS[policyUploadBuilder];
    saveDocument({ name: policyUploadFile.name, category: 'policy', notes: t('coverage.policyUploadedFromAnalysis') });
    getPolicies();
    if (policyId) {
      updatePolicyStatus(policyId, 'available');
      updatePolicyFileLocation(policyId, policyUploadFile.name);
    }
    setPolicyUploadOpen(false);
    setPolicyUploadFile(null);
    onRefresh?.();
  };

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

  // The research-assistant flow established a useful rule for result screens:
  // settle the state first, then offer one move that follows from it. The counts
  // are the verdict; this is the single recommended action. Everything else is
  // still available, but behind "Other options" instead of competing with it.
  const answeredCount = recovered.length + fromRecords.length;
  // "Read out of the documents you uploaded" is only true when every one of them was:
  // a figure typed into the workspace came from the user but not from a document.
  const allFromUploads = answeredCount > 0 && fromRecords.every(a => a.document);
  const reviewCount = partial.length + written.length;
  const openCount = unanswerable.length;
  // Everything the engine put words against, whether from the reader's records or the
  // answer library. This is what the heading leads with.
  const draftedCount = answeredCount + reviewCount;
  // Only promise the customer's exact file back when the parser found writable
  // answer cells in a workbook format that the original-file writer supports.
  // Other formats still keep the customer's order, but calling that the "same
  // format" would over-promise what the exporter can currently do.
  const returnsCustomerWorkbook = /\.(xlsx|xlsm)$/i.test(questionnaireName || '')
    && (questions || []).some(question => question.location?.answerCell);
  const requirements = React.useMemo(() => buildRequirements(topics), [topics]);
  const companyTopic = topics.find(topic => topic.topic === 'other');
  const bestNextPolicy = policyGaps.builders[0] || null;
  const completionAction = canGenerateAnswers && onShowAnswers
    ? {
        label: t('coverage.nextReviewCta'),
        run: () => {
          track('coverage_footer_review_click', { open: openCount, review: reviewCount });
          onShowAnswers();
        },
      }
    : {
        label: t('coverage.automationUpsellCta', { price: PASS_PRICE }),
        run: () => openCheckout(QUESTIONNAIRE_PASS_CHECKOUT_URL, 'coverage_automation_finish', tier),
      };

  return (
    <div className="mx-auto max-w-5xl xl:flex xl:max-w-7xl xl:items-start xl:gap-6">
      <div className="min-w-0 flex-1">
      {isSample && (
        <div data-testid="coverage-sample-banner" className="mb-5 flex flex-col gap-3 rounded-[14px] border border-[#d9dfe8] bg-[#f3f5f9] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#3d4a5c]">{t(sampleCompany ? 'coverage.sampleBannerEyebrow' : 'coverage.sampleBannerEyebrowOwnData')}</p>
            <p className="mt-1 text-[13px] leading-5 text-[#3d4a5c]">{t(sampleCompany ? 'coverage.sampleBannerBody' : 'coverage.sampleBannerBodyOwnData')}</p>
          </div>
          {onUploadOwn && (
            <button
              type="button"
              onClick={() => { track('sample_upload_own_click'); onUploadOwn(); }}
              className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-[10px] bg-[#0f1a15] px-4 text-[13px] font-semibold text-white hover:bg-[#203129]"
            >
              <Upload className="h-4 w-4" />{t('coverage.sampleBannerCta')}
            </button>
          )}
        </div>
      )}
      <section data-testid="coverage-verdict" className="border border-slate-200 bg-white p-5 sm:p-8">
        <RequirementsOverview
          t={t}
          requirements={requirements}
          questionnaireName={questionnaireName}
          canGenerateAnswers={canGenerateAnswers}
          returnsCustomerWorkbook={returnsCustomerWorkbook}
          sampleLimit={SAMPLE_ANSWERS}
          price={PASS_PRICE}
          onUpload={() => {
            track('coverage_add_documents_click', { document: requirements.groups[0]?.documents[0]?.key || 'none' });
            navigate('/evidence');
          }}
          onPrimary={completionAction.run}
          primaryLabel={completionAction.label}
          onDownload={handleDownloadChecklist}
          checkoutNote={canGenerateAnswers ? null : t('coverage.checkoutNote')}
          headerExtra={(draftedCount > 0 || partial.length > 0) && (
            <div className="mt-4 space-y-1.5 border-t border-slate-200 pt-3 text-[14px] leading-6 text-slate-600">
              {/* What is already drafted, and whose figures it rests on - never "your"
                  records on the example, never "documents you uploaded" for typed figures. */}
              {draftedCount > 0 && (
                <p>
                  <strong className="font-semibold text-slate-900">{t(isSample ? 'coverage.titleDraftedExample' : 'coverage.titleDrafted', { drafted: draftedCount, total })}</strong>{' '}
                  {answeredCount > 0
                    ? t(sampleCompany ? 'coverage.leadDraftedExample' : allFromUploads ? 'coverage.leadDrafted' : 'coverage.leadDraftedOwnRecords', { supported: answeredCount })
                    : t('coverage.leadDraftedNoRecords')}
                  {sample.length > 0 && (
                    <> <a href="#coverage-drafts" onClick={(event) => { event.preventDefault(); document.getElementById('coverage-drafts')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} className="font-semibold text-indigo-700 hover:underline">{t('coverage.seeDrafts', { shown: sample.length })}</a></>
                  )}
                </p>
              )}
              {partial.length > 0 && <p className="font-medium text-amber-800">{t(partial.length === 1 ? 'coverage.partialAttentionOne' : 'coverage.partialAttention', { count: partial.length })}</p>}
            </div>
          )}
          afterGroups={policyGaps.builders.length > 0 && (
            <div className="mt-4 border border-slate-200 bg-slate-50 px-4 py-3 text-[13.5px] leading-6 text-slate-700">
              {canBuildPolicies
                ? <p>{t('coverage.policyBuilderIncluded')}</p>
                : <p><strong className="text-slate-900">{t(policyGaps.builders.length === 1 ? 'coverage.policyBuilderUpsellTitleOne' : 'coverage.policyBuilderUpsellTitle', { count: policyGaps.builders.length })}</strong> {t('coverage.policyBuilderUpsellBody')}{' '}
                    <button type="button" onClick={() => openCheckout(PASSPORT_CHECKOUT_URL, 'coverage_policy_builder_upsell', tier)} className="font-semibold text-indigo-700 underline underline-offset-4">{t('coverage.nextPassportCta', { price: PASSPORT_PRICE })}</button></p>}
            </div>
          )}
        />

        <div data-testid="coverage-format-guarantee" className="mt-6 flex items-start gap-3 border border-slate-200 bg-slate-50 p-4 text-slate-800">
          <FileCheck2 className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
          <div>
            <p className="text-sm font-semibold">{t(returnsCustomerWorkbook ? 'coverage.formatGuaranteeTitle' : 'coverage.orderGuaranteeTitle')}</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">{t(returnsCustomerWorkbook ? 'coverage.formatGuaranteeWorkbook' : 'coverage.orderGuaranteeExport')}</p>
          </div>
        </div>

        <details className="mt-4 text-sm">
          <summary className="cursor-pointer select-none font-medium text-slate-500 hover:text-slate-800">{t('coverage.otherOptions')}</summary>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-3">
            {companyTopic && <button type="button" onClick={openCompany} className="text-sm text-slate-700 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-700">{t('coverage.addCompanyDetails')}</button>}
            <button type="button" onClick={() => { track('coverage_enter_figures_click', { document: 'other_options' }); navigate('/data'); }} className="text-sm text-slate-700 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-700">{t('coverage.docEnter')}</button>
            {bestNextPolicy && <button type="button" onClick={() => { setPolicyUploadBuilder(bestNextPolicy); setPolicyUploadOpen(true); }} className="text-sm text-slate-700 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-700">{t('coverage.uploadPolicy')}</button>}
            {canBuildPolicies && policyGaps.builders.length > 0 && <button type="button" onClick={() => setPolicyBuilderId(bestNextPolicy || 'blank')} className="text-sm text-slate-700 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-700">{t('coverage.createPolicy')}</button>}
            {onStartOver && <button type="button" onClick={onStartOver} className="text-sm text-slate-700 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-700">{t('coverage.startOver')}</button>}
          </div>
        </details>
      </section>


      {/* The proof, and the part of this page nobody else could produce: answers
          carrying the reader's own figures, each badged with where it came from.
          This and the cards below spent Sep 29 - Oct 3 inside a
          `<div className="hidden" aria-hidden="true">` left by the requirements-first
          refactor - mounted, display:none, read by nobody. The tests could not see it
          either: jsdom has no layout, so textContent includes display:none nodes and
          26 of them passed against UI that never reached a screen. */}
      {sample.length > 0 && (
        <div className="mt-6">
          <ReferencePanel
            t={t}
            fromRecords={fromRecords}
            sample={sample}
            remaining={remaining}
            hasOwnData={hasOwnData}
            isSample={sampleCompany}
            draftedCount={draftedCount}
            canGenerateAnswers={canGenerateAnswers}
          />
        </div>
      )}

      <Dialog open={companyOpen} onOpenChange={setCompanyOpen}>
        <DialogContent className="max-h-[calc(100vh-2rem)] max-w-xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('coverage.companyModalTitle')}</DialogTitle>
            <DialogDescription>{t('coverage.companyModalBody')}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <div className="space-y-2"><Label>{t('cps.legalName')}</Label><Input value={companyDraft.legalName || ''} onChange={event => setCompanyDraft(value => ({ ...value, legalName: event.target.value }))} /></div>
            <div className="space-y-2"><Label>{t('cps.tradingName')}</Label><Input value={companyDraft.tradingName || ''} onChange={event => setCompanyDraft(value => ({ ...value, tradingName: event.target.value }))} /></div>
            <div className="space-y-2"><Label>{t('onboard.employees')}</Label><Input type="number" min="0" value={companyDraft.totalEmployees || ''} onChange={event => setCompanyDraft(value => ({ ...value, totalEmployees: Number(event.target.value) || 0 }))} /></div>
            <div className="space-y-2"><Label>{t('settings.contactName')}</Label><Input value={companyDraft.esgContactName || ''} onChange={event => setCompanyDraft(value => ({ ...value, esgContactName: event.target.value }))} /></div>
            <div className="space-y-2 sm:col-span-2"><Label>{t('settings.contactEmail')}</Label><Input type="email" value={companyDraft.esgContactEmail || ''} onChange={event => setCompanyDraft(value => ({ ...value, esgContactEmail: event.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompanyOpen(false)}>{t('respond.cancel')}</Button>
            <Button onClick={saveCompany} className="bg-slate-900 text-white">{t('coverage.saveAndRefresh')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={policyUploadOpen} onOpenChange={setPolicyUploadOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('coverage.uploadPolicyTitle')}</DialogTitle>
            <DialogDescription>{t('coverage.uploadPolicyBody')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {policyGaps.builders.length > 1 && (
              <div className="space-y-2">
                <Label>{t('coverage.policyType')}</Label>
                <select value={policyUploadBuilder} onChange={event => setPolicyUploadBuilder(event.target.value)} className="h-10 w-full border border-slate-300 bg-white px-3 text-sm">
                  {policyGaps.builders.map(id => <option key={id} value={id}>{builderName(POLICY_BUILDERS[id], lang)}</option>)}
                </select>
              </div>
            )}
            <label className="block cursor-pointer border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center hover:border-slate-400">
              <input type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={event => setPolicyUploadFile(event.target.files?.[0] || null)} />
              <Upload className="mx-auto h-6 w-6 text-slate-400" />
              <span className="mt-2 block text-sm font-medium text-slate-800">{policyUploadFile?.name || t('coverage.choosePolicyFile')}</span>
              <span className="mt-1 block text-xs text-slate-500">PDF, Word or TXT</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPolicyUploadOpen(false)}>{t('respond.cancel')}</Button>
            <Button onClick={saveUploadedPolicy} disabled={!policyUploadFile || !policyUploadBuilder} className="bg-slate-900 text-white">{t('coverage.savePolicy')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(policyBuilderId)} onOpenChange={(open) => { if (!open) { setPolicyBuilderId(null); onRefresh?.(); } }}>
        <DialogContent className="max-h-[calc(100vh-1rem)] max-w-5xl overflow-y-auto p-0">
          <DialogHeader className="border-b border-slate-200 px-6 py-4">
            <DialogTitle>{policyBuilderId && POLICY_BUILDERS[policyBuilderId] ? builderName(POLICY_BUILDERS[policyBuilderId], lang) : t('coverage.policyModalTitle')}</DialogTitle>
            <DialogDescription>{t('coverage.policyModalBody')}</DialogDescription>
          </DialogHeader>
          <div className="p-6"><PolicyBuilder initialBuilderId={policyBuilderId} embedded /></div>
        </DialogContent>
      </Dialog>
      </div>

      <QuestionsRail t={t} questions={questions} questionnaireName={questionnaireName} isSample={isSample} />
    </div>
  );
}
