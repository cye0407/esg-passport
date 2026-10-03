import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Building2, ChevronDown, Download, FileCheck2, Leaf, Lock, ShieldCheck, Upload, Users } from 'lucide-react';
import { track } from '@/lib/track';
import { useLanguage } from '@/components/LanguageContext';
import { documentName, documentHolds } from '@/lib/documentLabels';
import { getEntitlements } from '@/lib/entitlements';
import { figureWithUnit, answerStatesFigure } from '@/lib/figures';
import { selectBestCoverageAnswers } from '@/lib/coverage';
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
const SAMPLE_ANSWERS = 5;
const PILLAR_ORDER = ['environmental', 'social', 'governance', 'other'];

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

function commonTopicDocuments(t, topic) {
  switch (topic) {
    case 'environmental': return [
      t('coverage.commonEnvironmental1'),
      t('coverage.commonEnvironmental2'),
      t('coverage.commonEnvironmental3'),
      t('coverage.commonEnvironmental4'),
    ];
    case 'social': return [
      t('coverage.commonSocial1'),
      t('coverage.commonSocial2'),
      t('coverage.commonSocial3'),
      t('coverage.commonSocial4'),
    ];
    case 'governance': return [
      t('coverage.commonGovernance1'),
      t('coverage.commonGovernance2'),
      t('coverage.commonGovernance3'),
      t('coverage.commonGovernance4'),
    ];
    case 'other': return [
      t('coverage.commonCompany1'),
      t('coverage.commonCompany2'),
      t('coverage.commonCompany3'),
    ];
    default: return [];
  }
}

function TopicIcon({ topic }) {
  const styles = {
    environmental: { Icon: Leaf, box: 'bg-emerald-50 text-emerald-700' },
    social: { Icon: Users, box: 'bg-sky-50 text-sky-700' },
    governance: { Icon: ShieldCheck, box: 'bg-violet-50 text-violet-700' },
    other: { Icon: Building2, box: 'bg-amber-50 text-amber-700' },
  };
  const { Icon, box } = styles[topic] || styles.other;
  return <span className={`flex h-10 w-10 shrink-0 items-center justify-center ${box}`}><Icon className="h-5 w-5" /></span>;
}

const BUILDER_POLICY_IDS = {
  code_of_conduct: 'code_of_conduct', anti_corruption: 'anti_corruption', whistleblowing: 'whistleblower',
  data_privacy: 'data_privacy', supplier_coc: 'supplier_code', health_safety: 'health_safety_policy',
  equal_opp: 'anti_discrimination', environmental: 'environmental_policy',
};

const NEGATIVE_ANSWER = /\b(no data|not available|do not have|don't have|not tracked|unable to|cannot provide|not currently)\b/i;

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
 */
export function isPresentableDraft(answer) {
  const text = String(answer?.answer || '').trim();
  return text.length >= 45 && !NEGATIVE_ANSWER.test(text);
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
function ReferencePanel({ t, fromRecords, sample, remaining, hasOwnData }) {

  return (
    <div className="flex flex-col border border-slate-200 bg-white">
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
            {t(sample.length === 1 ? 'coverage.sampleTitleOne' : 'coverage.sampleTitle', { count: sample.length })}
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
    </div>
  );
}

// The list the parser pulled out of the uploaded file, kept beside the report instead of
// behind two clicks inside "Other options". For a spreadsheet this is the only place the
// denominator can be checked -- PDF and Word confirm their parse in an earlier step, but
// xlsx skips that, and a wrong question count makes every number on the report false.
// Deliberately small: a fixed-height scroller, not 91 rows pushing the page down.
function QuestionsRail({ t, questions, questionnaireName }) {
  if (!questions.length) return null;
  return (
    <aside className="mt-6 shrink-0 xl:sticky xl:top-6 xl:mt-0 xl:w-72">
      <div className="rounded-[14px] border border-[#e6ece8] bg-white">
        <div className="border-b border-[#e6ece8] px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#55635c]">{t('coverage.railTitle')}</p>
          <p className="mt-1 text-[13px] font-semibold text-[#0f1a15]">{t('coverage.railCount', { count: questions.length })}</p>
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

export default function CoverageReport({ coverage, questionnaireName, questions = [], tier, onStartOver, onRefresh, onShowAnswers }) {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [openPillars, setOpenPillars] = React.useState({});
  const [companyOpen, setCompanyOpen] = React.useState(false);
  const [companyDraft, setCompanyDraft] = React.useState(() => getCompanyProfile() || {});
  const [policyBuilderId, setPolicyBuilderId] = React.useState(null);
  const [policyUploadOpen, setPolicyUploadOpen] = React.useState(false);
  const [policyUploadFile, setPolicyUploadFile] = React.useState(null);
  const [policyUploadBuilder, setPolicyUploadBuilder] = React.useState('');
  const {
    total, recovered = [], fromRecords, partial = [], written, unanswerable, missingDocuments, policyGaps, hasOwnData, topics, sections = null,
  } = coverage;
  // The cards are the questionnaire's own sections when it has usable ones, the four
  // canonical topics otherwise. `topics` stays canonical either way — the company
  // information card and the manual-answer list below are about company-profile
  // questions however the report happens to be grouped.
  const groups = sections ?? topics;
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
  const requiredDocuments = [...documents].sort((a, b) => b.unlocks - a.unlocks);
  const companyTopic = topics.find(topic => topic.topic === 'other');
  const companyAnsweredCount = companyTopic ? (companyTopic.recovered || 0) + (companyTopic.fromRecords || 0) : 0;
  const companyOpenCount = companyTopic ? Math.max(0, companyTopic.total - companyAnsweredCount) : 0;
  const manualQuestions = topics.flatMap(topic => topic.topic === 'other' ? [] : (topic.questions || []).filter(question => (
    question.state !== 'recovered'
    && question.state !== 'fromRecords'
    && !(question.needs?.documents || []).length
    && !question.needs?.policy
  )));
  const companyAnswerCount = companyOpenCount + manualQuestions.length;
  const outstandingRequirementCount = requiredDocuments.length + companyAnswerCount + policyGaps.builders.length;
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
      <section data-testid="coverage-verdict" className="overflow-hidden rounded-[20px] border border-[#e6ece8] bg-white shadow-[0_20px_55px_-34px_rgba(16,40,30,0.38)]">
        <header className="flex flex-col gap-5 border-b border-[#e6ece8] bg-[#f7faf8] px-5 py-5 sm:px-7 sm:py-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.13em] text-[#0b5f43]">{t('coverage.requestEyebrow')}</p>
            {/* Lead with what is already drafted. The requirements-first heading stays
                for the case it was written for — a questionnaire nothing could be
                drafted against — where "here they are" would be an empty promise. */}
            {draftedCount > 0 ? (
              <>
                <h1 className="mt-2 text-[24px] font-bold leading-tight tracking-tight text-[#0f1a15] sm:text-[28px]">{t('coverage.titleDrafted', { drafted: draftedCount, total })}</h1>
                <p className="mt-2 max-w-2xl text-[14px] leading-6 text-[#56645d]">{answeredCount > 0 ? t('coverage.leadDrafted', { supported: answeredCount }) : t('coverage.leadDraftedNoRecords')}</p>
              </>
            ) : (
              <>
                <h1 className="mt-2 text-[24px] font-bold leading-tight tracking-tight text-[#0f1a15] sm:text-[28px]">{t('coverage.title')}</h1>
                <p className="mt-2 max-w-2xl text-[14px] leading-6 text-[#56645d]">{t('coverage.lead', { count: total, supported: answeredCount, review: reviewCount, open: openCount })}</p>
              </>
            )}
          </div>
          {questionnaireName && (
            <div className="inline-flex max-w-full shrink-0 items-center gap-2 rounded-full border border-[#cfe3d8] bg-white px-3 py-1.5 text-xs font-semibold text-[#3f5049]">
              <FileCheck2 className="h-4 w-4 shrink-0 text-[#0f7a55]" />
              <span className="truncate">{questionnaireName}</span>
            </div>
          )}
        </header>

        <div className="space-y-7 p-5 sm:p-7">
          <section aria-label={t('coverage.statusTitle')}>
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#6b7a72]">{t('coverage.statusTitle')}</p>
            {/* The three numbers are where the reader stands, not what they still owe.
                Requirements follow on one line and in full in the section below — they
                are the work, but they are not the verdict, and three bold counts of
                what is missing read as a homework assignment. */}
            <dl className="mt-3 flex flex-wrap gap-4">
              <div className="min-w-[10rem] flex-1 border-l-2 border-[#0f7a55] pl-4"><dd className="text-[28px] font-bold tabular-nums text-[#0f1a15]">{answeredCount}</dd><dt className="mt-0.5 text-[12px] leading-5 text-[#56645d]">{t('coverage.progressSupported')}</dt></div>
              <div className="min-w-[10rem] flex-1 border-l-2 border-[#8aa79a] pl-4"><dd className="text-[28px] font-bold tabular-nums text-[#0f1a15]">{reviewCount}</dd><dt className="mt-0.5 text-[12px] leading-5 text-[#56645d]">{partial.length > 0 ? t('coverage.progressReviewPartial', { count: partial.length }) : t('coverage.progressReview')}</dt></div>
              <div className="min-w-[10rem] flex-1 border-l-2 border-[#b8c8c0] pl-4"><dd className="text-[28px] font-bold tabular-nums text-[#0f1a15]">{openCount}</dd><dt className="mt-0.5 text-[12px] leading-5 text-[#56645d]">{t('coverage.progressOpen')}</dt></div>
            </dl>
            {outstandingRequirementCount > 0
              ? <p className="mt-3 text-[12px] leading-5 text-[#56645d]"><span className="font-semibold text-[#0f1a15]">{t('coverage.outstandingLead')}</span>{' '}{[
                  requiredDocuments.length > 0 ? `${requiredDocuments.length} ${t('coverage.needRecords')}` : null,
                  companyAnswerCount > 0 ? `${companyAnswerCount} ${t('coverage.needCompanyAnswers')}` : null,
                  policyGaps.builders.length > 0 ? `${policyGaps.builders.length} ${t('coverage.needPolicies')}` : null,
                ].filter(Boolean).join(' · ')}</p>
              : <p className="mt-3 text-sm font-semibold text-[#203129]">{t('coverage.nothingToProvide')}</p>}
            {partial.length > 0 && <p className="mt-1 text-[12px] font-medium leading-5 text-[#56645d]">{t(partial.length === 1 ? 'coverage.partialAttentionOne' : 'coverage.partialAttention', { count: partial.length })}</p>}
          </section>

          <section className="border-t border-[#e6ece8] pt-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#6b7a72]">{t('coverage.requirementsTitle')}</p>
            <p className="mt-1 max-w-3xl text-[13px] leading-5 text-[#56645d]">{t('coverage.requirementsBody')}</p>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {requiredDocuments.length > 0 && <div className="rounded-[14px] border border-[#e6ece8] bg-[#f7faf8] p-4 lg:row-span-2">
                <div className="flex items-start justify-between gap-3">
                  <div><h2 className="text-[15px] font-bold text-[#0f1a15]">{t('coverage.recordsAndCalculations')}</h2><p className="mt-1 text-[12px] leading-5 text-[#6b7a72]">{t('coverage.recordsAndCalculationsBody')}</p></div>
                  <span className="rounded-full bg-[#e7f4ef] px-2.5 py-1 text-[11px] font-semibold text-[#0b5f43]">{requiredDocuments.length}</span>
                </div>
                <ul className="mt-3 divide-y divide-[#dce9e3] border-t border-[#dce9e3]">
                  {requiredDocuments.map(entry => <li key={entry.document} className="flex items-start justify-between gap-3 py-3"><div><p className="text-[13px] font-semibold text-[#203129]">{entry.name}</p><p className="mt-0.5 text-[11.5px] leading-4 text-[#6b7a72]">{documentHolds(t, entry.document)}</p></div><span className="shrink-0 text-[11px] font-semibold text-[#0b5f43]">{t(entry.unlocks === 1 ? 'coverage.usedByOne' : 'coverage.usedBy', { count: entry.unlocks })}</span></li>)}
                </ul>
                <button type="button" onClick={handleDownloadChecklist} className="mt-3 inline-flex items-center gap-2 text-[12.5px] font-semibold text-[#0b5f43] hover:underline"><Download className="h-4 w-4" />{t('coverage.takeawayDownload')}</button>
              </div>}

              {companyTopic && <div className="rounded-[14px] border border-[#e6ece8] bg-white p-4">
                <div className="flex items-start justify-between gap-3"><div><h2 className="text-[15px] font-bold text-[#0f1a15]">{t('coverage.companyInformationTitle')}</h2><p className="mt-1 text-[12px] leading-5 text-[#6b7a72]">{t('coverage.companyInformationBody', { answered: companyAnsweredCount, open: companyOpenCount })}</p></div><span className="rounded-full bg-[#f1f4f2] px-2.5 py-1 text-[11px] font-semibold text-[#56645d]">{companyTopic.total}</span></div>
                {companyOpenCount > 0 && <button type="button" onClick={openCompany} className="mt-3 text-[12.5px] font-semibold text-[#0b5f43] hover:underline">{t('coverage.addCompanyDetails')}</button>}
              </div>}

              {manualQuestions.length > 0 && <div className="rounded-[14px] border border-[#e6ece8] bg-white p-4">
                <div className="flex items-start justify-between gap-3"><div><h2 className="text-[15px] font-bold text-[#0f1a15]">{t('coverage.companyAnswersTitle')}</h2><p className="mt-1 text-[12px] leading-5 text-[#6b7a72]">{t('coverage.companyAnswersBody')}</p></div><span className="rounded-full bg-[#f1f4f2] px-2.5 py-1 text-[11px] font-semibold text-[#56645d]">{manualQuestions.length}</span></div>
                <details className="mt-3 text-[12px]"><summary className="cursor-pointer font-semibold text-[#0b5f43]">{t(manualQuestions.length === 1 ? 'coverage.seeCompanyQuestionOne' : 'coverage.seeCompanyQuestions', { count: manualQuestions.length })}</summary><ul className="mt-2 space-y-2 border-l-2 border-[#dce9e3] pl-3 text-[#56645d]">{manualQuestions.map(question => <li key={question.questionId}>{question.questionText}</li>)}</ul></details>
              </div>}

              {policyGaps.builders.length > 0 && <div className="rounded-[14px] border border-[#e6ece8] bg-white p-4">
                <div className="flex items-start justify-between gap-3"><div><h2 className="text-[15px] font-bold text-[#0f1a15]">{t('coverage.policiesRequiredTitle')}</h2><p className="mt-1 text-[12px] leading-5 text-[#6b7a72]">{t('coverage.policiesRequiredBody')}</p></div><span className="rounded-full bg-[#f1f4f2] px-2.5 py-1 text-[11px] font-semibold text-[#56645d]">{policyGaps.builders.length}</span></div>
                <ul className="mt-3 space-y-1.5">{policyGaps.builders.map(id => <li key={id} className="text-[12.5px] font-medium text-[#203129]">{builderName(POLICY_BUILDERS[id], lang)}</li>)}</ul>
                {canBuildPolicies && <button type="button" onClick={() => setPolicyBuilderId(bestNextPolicy || 'blank')} className="mt-3 text-[12.5px] font-semibold text-[#0b5f43] hover:underline">{t('coverage.createPolicy')}</button>}
              </div>}

              {requiredDocuments.length === 0 && !companyTopic && manualQuestions.length === 0 && policyGaps.builders.length === 0 && <div className="rounded-[14px] border border-[#e6ece8] bg-[#f7faf8] p-4 lg:col-span-2"><p className="text-sm font-semibold text-[#0f1a15]">{t('coverage.noRecordsTitle')}</p><p className="mt-1 text-xs leading-relaxed text-[#6b7a72]">{t('coverage.noRecordsBody')}</p></div>}
            </div>
          </section>

          <section data-testid="coverage-next-option" className="rounded-[16px] border border-[#bfe3d3] bg-[#f7fffb] p-5 shadow-[0_12px_30px_-24px_rgba(15,122,85,0.6)] sm:p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#0b5f43]">{canGenerateAnswers ? t('coverage.reviewUpsellEyebrow') : t('coverage.automationUpsellEyebrow', { price: PASS_PRICE })}</p>
            <h2 className="mt-1.5 text-[20px] font-bold leading-7 text-[#0f1a15]">{t(canGenerateAnswers ? 'coverage.reviewUpsellTitle' : 'coverage.automationUpsellTitle')}</h2>
            <p className="mt-2 max-w-3xl text-[13px] leading-5 text-[#3f5049]">{t(canGenerateAnswers ? 'coverage.reviewUpsellBody' : 'coverage.automationUpsellBody', { count: total })}</p>
            {!canGenerateAnswers && <ul className="mt-4 grid gap-2 text-[12.5px] text-[#203129] sm:grid-cols-3"><li>{t('coverage.automationF1')}</li><li>{t('coverage.automationF2')}</li><li>{t('coverage.automationF3')}</li></ul>}
            <button type="button" onClick={completionAction.run} data-testid="coverage-primary-action" className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-[#0f7a55] px-5 text-sm font-semibold text-white transition hover:bg-[#0b5f43] sm:w-auto">{completionAction.label}<ArrowRight className="h-4 w-4" /></button>
            {policyGaps.builders.length > 0 && !canBuildPolicies && <div className="mt-5 border-t border-[#bfe3d3] pt-4"><p className="text-[12.5px] leading-5 text-[#3f5049]"><strong className="text-[#0f1a15]">{t(policyGaps.builders.length === 1 ? 'coverage.policyBuilderUpsellTitleOne' : 'coverage.policyBuilderUpsellTitle', { count: policyGaps.builders.length })}</strong> {t('coverage.policyBuilderUpsellBody')}</p><button type="button" onClick={() => openCheckout(PASSPORT_CHECKOUT_URL, 'coverage_policy_builder_upsell', tier)} className="mt-2 text-[12.5px] font-semibold text-[#0b5f43] hover:underline">{t('coverage.nextPassportCta', { price: PASSPORT_PRICE })}</button></div>}
            {policyGaps.builders.length > 0 && canBuildPolicies && <p className="mt-4 border-t border-[#bfe3d3] pt-4 text-[12.5px] font-semibold text-[#0b5f43]">{t('coverage.policyBuilderIncluded')}</p>}
          </section>

          <div data-testid="coverage-format-guarantee" className="flex items-start gap-3 rounded-[12px] border border-[#e6ece8] bg-[#f7faf8] p-4 text-[#203129]">
            <FileCheck2 className="mt-0.5 h-5 w-5 shrink-0 text-[#0f7a55]" />
            <div>
              <p className="text-sm font-semibold">{t(returnsCustomerWorkbook ? 'coverage.formatGuaranteeTitle' : 'coverage.orderGuaranteeTitle')}</p>
              <p className="mt-1 text-sm leading-relaxed text-[#56645d]">{t(returnsCustomerWorkbook ? 'coverage.formatGuaranteeWorkbook' : 'coverage.orderGuaranteeExport')}</p>
            </div>
          </div>
        </div>

        <details className="border-t border-[#e6ece8] px-5 py-3.5 text-sm sm:px-7">
          <summary className="cursor-pointer select-none font-medium text-[#6b7a72] hover:text-[#0b5f43]">{t('coverage.otherOptions')}</summary>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-3">
            {bestNextPolicy && <button type="button" onClick={() => { setPolicyUploadBuilder(bestNextPolicy); setPolicyUploadOpen(true); }} className="text-sm text-slate-700 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-700">{t('coverage.uploadPolicy')}</button>}
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
          />
        </div>
      )}

      {groups.length > 0 && (
        <div className="mt-8 space-y-4">
          <SectionHeading
            eyebrow={t('coverage.eyebrowAsks')}
            title={t('coverage.topicsTitle')}
            body={t('coverage.topicsBody', { count: total })}
          />

          {/* Symmetric: three pillars sit three across, four make a 2×2, two make two.
              Subgrid rows keep every card's header, standing line, "Start here", buttons
              and questions on the same row as its neighbours'. */}
          <div className={`grid gap-4 ${groups.length >= 2 ? 'md:grid-cols-2' : ''} ${groups.length === 3 ? 'xl:grid-cols-3' : ''}`}>
            {/* Canonical topics read in pillar order. The questionnaire's own
                sections keep the order it asks them in, which is the order the
                reader will work through the file. */}
            {(sections ? groups : [...groups].sort((a, b) => PILLAR_ORDER.indexOf(a.topic) - PILLAR_ORDER.indexOf(b.topic))).map((bucket) => {
              const key = bucket.section || bucket.topic;
              const name = bucket.section || topicName(t, bucket.topic);
              if (!name) return null;
              const commonDocuments = commonTopicDocuments(t, bucket.topic);
              const recommendedDocument = (bucket.documents || [])
                .map(documentId => ({ documentId, entry: documents.find(item => item.document === documentId) }))
                .filter(item => item.entry)
                .sort((a, b) => b.entry.unlocks - a.entry.unlocks)[0];
              const showDocumentRecommendation = recommendedDocument?.entry?.unlocks >= 2;
              const pillarOpen = openPillars[key] ?? false;
              return (
                <div
                  key={key}
                  className="flex flex-col gap-4 border border-slate-200 bg-white p-5 shadow-sm md:grid md:row-span-6 md:grid-rows-subgrid"
                >
                  {/* 1 · header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 gap-3">
                      <TopicIcon topic={bucket.topic} />
                      <div>
                        <h3 className="text-base font-semibold text-slate-900">{name}</h3>
                        {!bucket.section && <p className="mt-1 text-[13px] leading-relaxed text-slate-500">{topicSubtitle(t, bucket.topic)}</p>}
                      </div>
                    </div>
                    <p className="shrink-0 bg-slate-100 px-2.5 py-1 text-xs font-semibold tabular-nums text-slate-700">
                      {bucket.total === 1
                        ? t('coverage.topicQuestion', { count: bucket.total })
                        : t('coverage.topicQuestions', { count: bucket.total })}
                    </p>
                  </div>

                  {/* 2 · where it stands; the toggle for the questions. A short pillar shows
                      them, a long one starts closed — the counts and "Start here" carry the card. */}
                  <button
                    type="button"
                    onClick={() => setOpenPillars(prev => ({ ...prev, [key]: !pillarOpen }))}
                    aria-expanded={pillarOpen}
                    className="flex flex-wrap items-center gap-x-3 gap-y-1 self-start text-left text-xs tabular-nums"
                  >
                    <span className="font-semibold text-emerald-700">{t('coverage.topicAnswered', { count: (bucket.recovered || 0) + (bucket.fromRecords || 0) })}</span>
                    <span className="text-amber-700">{t('coverage.topicToCheck', { count: (bucket.partial || 0) + (bucket.written || 0) })}</span>
                    <span className="text-slate-600">{t('coverage.topicOpen', { count: bucket.open || 0 })}</span>
                    <span className="text-slate-500 underline decoration-slate-300 underline-offset-4">{pillarOpen ? t('coverage.topicHideQuestions') : t('coverage.topicShowQuestions', { count: bucket.questions.length })}</span>
                  </button>

                  {/* 3 · start here — one box, the same height across the row, or an empty slot */}
                  {showDocumentRecommendation ? (
                    <div className="bg-emerald-50 px-3.5 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">{t('coverage.startHere')}</p>
                      <p className="mt-1 text-sm font-semibold text-emerald-950">{recommendedDocument.entry.name}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-emerald-900/70">{documentHolds(t, recommendedDocument.documentId)} · {t('coverage.docUnlocks', { count: recommendedDocument.entry.unlocks })}</p>
                    </div>
                  ) : bucket.needsPolicy > 0 ? (
                    <div className="bg-violet-50 px-3.5 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-violet-700">{t('coverage.startHere')}</p>
                      <p className="mt-1 text-sm font-semibold text-violet-950">{t('coverage.policyStartTitle')}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-violet-900/70">{t('coverage.topicPolicyNeed', { count: bucket.needsPolicy })}</p>
                    </div>
                  ) : (
                    // Nothing to recommend: say what the pillar needs instead of leaving the slot
                    // empty. Every question covered; or only the reader's own words and reading.
                    (() => {
                      const answered = (bucket.recovered || 0) + (bucket.fromRecords || 0);
                      const toCheck = (bucket.partial || 0) + (bucket.written || 0);
                      const open = bucket.open || 0;
                      const allCovered = answered === bucket.total && bucket.total > 0;
                      return (
                        <div className={`px-3.5 py-3 ${allCovered ? 'bg-emerald-50' : 'bg-slate-50'}`}>
                          <p className={`text-[10px] font-bold uppercase tracking-wider ${allCovered ? 'text-emerald-700' : 'text-slate-500'}`}>{allCovered ? t('coverage.slotAllCoveredEyebrow') : t('coverage.slotNeedsYouEyebrow')}</p>
                          <p className={`mt-1 text-sm font-semibold ${allCovered ? 'text-emerald-950' : 'text-slate-900'}`}>
                            {allCovered ? t('coverage.slotAllCoveredTitle') : open > 0 ? t('coverage.slotNeedsYouTitle', { count: open }) : t('coverage.slotReadTitle', { count: toCheck })}
                          </p>
                          <p className={`mt-0.5 text-xs leading-relaxed ${allCovered ? 'text-emerald-900/70' : 'text-slate-600'}`}>
                            {allCovered ? t('coverage.slotAllCoveredBody') : open > 0 && toCheck > 0 ? t('coverage.slotNeedsYouBody', { count: toCheck }) : t('coverage.slotNothingToUpload')}
                          </p>
                        </div>
                      );
                    })()
                  )}

                  {/* 4 · actions, on the same row across cards */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* A document can always be added from a pillar — a card with only policy
                        buttons read as "nothing you upload can help here", which was untrue. */}
                    <button onClick={() => { track('coverage_add_documents_click', { document: recommendedDocument?.documentId || bucket.documents?.[0] || bucket.topic }); navigate('/evidence'); }} className="inline-flex h-10 items-center gap-1.5 bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"><Upload className="h-4 w-4" />{t('coverage.docUpload')}</button>
                    {(bucket.documents || []).length > 0 && <button onClick={() => { track('coverage_enter_figures_click', { document: recommendedDocument?.documentId || bucket.documents[0] }); navigate('/data'); }} className="inline-flex h-10 items-center border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50">{t('coverage.docEnter')}</button>}
                    {bucket.topic === 'other' && <button type="button" onClick={openCompany} className="inline-flex h-10 items-center border border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 hover:bg-slate-50">{t('coverage.addCompanyDetails')}</button>}
                    {bucket.needsPolicy > 0 && <>{canBuildPolicies && <button type="button" onClick={() => setPolicyBuilderId(policyGaps.builders[0] || 'blank')} className="inline-flex h-10 items-center bg-violet-700 px-4 text-sm font-medium text-white hover:bg-violet-800">{t('coverage.createPolicy')}</button>}<button type="button" onClick={() => { setPolicyUploadBuilder(policyGaps.builders[0] || ''); setPolicyUploadOpen(true); }} className="inline-flex h-10 items-center gap-1.5 border border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 hover:bg-slate-50"><Upload className="h-4 w-4" />{t('coverage.uploadPolicy')}</button></>}
                  </div>

                  {/* 5 · the questions, bounded: two hundred of them make a card no taller than a screen */}
                  {pillarOpen && (bucket.questions || []).length > 0 ? (
                    <ul className="max-h-[30rem] divide-y divide-slate-100 overflow-y-auto border-t border-slate-100 pr-1">
                      {bucket.questions.map(q => (
                        <li key={q.questionId} className="py-2.5 text-[13px] leading-snug">
                          <div className="flex items-start gap-2">
                            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                              q.state === 'recovered' || q.state === 'fromRecords' ? 'bg-emerald-600'
                                : q.state === 'partial' || q.state === 'written' ? 'bg-amber-500'
                                  : 'border border-slate-400 bg-white'
                            }`} />
                            <span className="min-w-0 flex-1 text-slate-800">{q.questionText}</span>
                          </div>
                          <p className="mt-0.5 pl-4 text-[11px] text-slate-500">
                            {t(`coverage.state.${q.state}`)}
                            {q.needs && (() => {
                              const doc = q.needs.documents?.[0];
                              const docName = doc ? documentName(t, doc.document) : null;
                              const policy = q.needs.policy && POLICY_BUILDERS[q.needs.policy] ? builderName(POLICY_BUILDERS[q.needs.policy], lang) : null;
                              const localizedPrompt = q.needs.prompts?.[lang] || q.needs.prompt;
                              // A written draft with nothing missing needs reading, not a document;
                              // "only you can answer this" is for a question with no draft at all.
                              const hint = docName ? t('coverage.needsDocument', { document: docName, figure: (lang === 'de' && doc.labelDe) || doc.label })
                                : policy ? t('coverage.needsPolicy', { policy })
                                  : localizedPrompt ? localizedPrompt
                                    : (q.state === 'written' || q.state === 'partial') ? t('coverage.needsReading')
                                      : t('coverage.needsYou');
                              return <span className="text-slate-600"> · {hint}</span>;
                            })()}
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div />
                  )}

                  {/* 6 · generic for the topic, the same on every questionnaire — behind one line */}
                  <details className="self-end text-sm">
                    <summary className="cursor-pointer select-none text-[11px] font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-600">{t('coverage.topicDocuments')}</summary>
                    <ul className="mt-2 space-y-1.5">
                      {commonDocuments.map(item => (
                        <li key={item} className="flex gap-2.5 text-[13px] leading-relaxed text-slate-600">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </details>
                </div>
              );
            })}
          </div>
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

      <QuestionsRail t={t} questions={questions} questionnaireName={questionnaireName} />
    </div>
  );
}
