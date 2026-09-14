import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Building2, ChevronDown, Download, Leaf, Lock, ShieldCheck, Upload, Users } from 'lucide-react';
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
  QUESTIONNAIRE_PASS_CHECKOUT_URL,
  PASS_PRICE,
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

function isPreviewWorthy(answer) {
  const text = String(answer?.answer || '').trim();
  const negative = /\b(no data|not available|do not have|don't have|not tracked|unable to|cannot provide|not currently)\b/i;
  return answer?.confidence === 'high'
    && answer?.value !== undefined
    && answer?.value !== null
    && answer?.value !== ''
    && text.length >= 45
    && answerStatesFigure(text, answer.value)
    && Boolean(answer.document)
    && !negative.test(text);
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
function ReferencePanel({ t, fromRecords, questions, sample, remaining, hasOwnData }) {
  const [showQuestions, setShowQuestions] = React.useState(false);
  const navigate = useNavigate();

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

      {sample.length === 0 && (
        <div className="border-b border-slate-100 px-5 py-5">
          <p className="font-semibold text-slate-900">{t('coverage.noStrongPreviewTitle')}</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-500">{t('coverage.noStrongPreviewBody')}</p>
          <div className="mt-4">
            <button type="button" onClick={() => navigate('/evidence')} className="inline-flex h-10 items-center gap-2 bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800">
              <Upload className="h-4 w-4" />{t('coverage.noStrongPreviewCta')}
            </button>
          </div>
        </div>
      )}

      {questions.length > 0 && (
        <div>
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

export default function CoverageReport({ coverage, questionnaireName, questions = [], tier, onStartOver, onRefresh }) {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [companyOpen, setCompanyOpen] = React.useState(false);
  const [companyDraft, setCompanyDraft] = React.useState(() => getCompanyProfile() || {});
  const [policyBuilderId, setPolicyBuilderId] = React.useState(null);
  const [policyUploadOpen, setPolicyUploadOpen] = React.useState(false);
  const [policyUploadFile, setPolicyUploadFile] = React.useState(null);
  const [policyUploadBuilder, setPolicyUploadBuilder] = React.useState('');
  const {
    total, recovered = [], recoveredFlagged = 0, fromRecords, partial = [], written, unanswerable, missingDocuments, policyGaps, hasOwnData, topics,
  } = coverage;
  const { canGenerateAnswers } = getEntitlements(tier);

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

  // Answered-from-records first: those carry the reader's own numbers and are the only
  // part of this page no one else could have produced.
  // A free visitor has not bought generated answers, and the current engine can turn
  // absence into confident-sounding prose (or a partial-period bill into an annual
  // statement). Do not use that output as a sales preview. Paid workspaces retain the
  // answer panel because it is part of the product they already have access to.
  // Free visitors need proof of the paid outcome, but only when it is grounded in
  // their own records. Generic drafts and partial-period figures stay out; if only two
  // answers are genuinely supported, showing two is more trustworthy than padding five.
  const sample = canGenerateAnswers
    ? selectBestCoverageAnswers([...fromRecords, ...written], SAMPLE_ANSWERS)
    : selectBestCoverageAnswers(fromRecords.filter(isPreviewWorthy), SAMPLE_ANSWERS);
  const remaining = Math.max(0, total - sample.length);

  const documents = missingDocuments
    .map(entry => ({ ...entry, name: documentName(t, entry.document) }))
    .filter(entry => entry.name);
  const bestNextDocument = [...documents].sort((a, b) => b.unlocks - a.unlocks)[0];

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

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
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
        <div className="w-full border border-slate-200 bg-white p-4 sm:w-72 sm:shrink-0">
          <p className="text-sm font-semibold text-slate-900">{t('coverage.takeawayTitle')}</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">{t('coverage.takeawayBody')}</p>
          <button onClick={handleDownloadChecklist} className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 bg-slate-900 px-4 text-sm font-medium text-white transition-colors hover:bg-slate-800">
            <Download className="h-4 w-4" />{t('coverage.takeawayDownload')}
          </button>
        </div>
      </div>

      <dl className={`grid grid-cols-2 border border-slate-200 bg-white ${recovered.length > 0 ? 'sm:grid-cols-6' : 'sm:grid-cols-5'}`}>
        {[
          [t('checklist.total'), total, 'text-slate-900'],
          // First, when there is one: what the company already answered last time.
          ...(recovered.length > 0 ? [[t('coverage.topicRecovered'), recovered.length, 'text-emerald-700']] : []),
          [t('coverage.topicFromRecords'), fromRecords.length, 'text-emerald-700'],
          [t('coverage.topicPartial'), partial.length, 'text-amber-700'],
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

      {recovered.length > 0 && (
        <p className="text-sm leading-relaxed text-slate-600">
          {recoveredFlagged > 0
            ? t('coverage.recoveredLineFlagged', { count: recovered.length, flagged: recoveredFlagged })
            : t('coverage.recoveredLine', { count: recovered.length })}
        </p>
      )}

      {bestNextDocument && (
        <section className="border-2 border-slate-900 bg-white p-5 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">{t('coverage.nextActionEyebrow')}</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">{bestNextDocument.name}</h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              {documentHolds(t, bestNextDocument.document)} · {t('coverage.docUnlocks', { count: bestNextDocument.unlocks })}
            </p>
          </div>
          <button
            type="button"
            onClick={() => { track('coverage_primary_next_click', { document: bestNextDocument.document, unlocks: bestNextDocument.unlocks }); navigate('/evidence'); }}
            className="mt-4 inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800 sm:mt-0 sm:w-auto"
          >
            <Upload className="h-4 w-4" /> {t('coverage.nextActionCta')}
          </button>
        </section>
      )}

      {/* Desktop keeps supporting detail in a compact second column. Mobile gets the
          same panel inline after the actionable gaps and before the purchase choice.
          Both instances are mounted and one is display:none per breakpoint — the panel
          has to sit in a different COLUMN on desktop and mid-flow on mobile, which no
          amount of ordering can do from one node. Only the visible copy is in the
          accessibility tree, so the duplicate buttons are not announced twice. */}
      <div>
        <div className="flex flex-col gap-10">
          {/* Missing items are ordered first: outcome to action. Topic context follows. */}
          {topics.length > 0 && (
            <div className="order-3 space-y-4">
              <SectionHeading
                eyebrow={t('coverage.eyebrowAsks')}
                title={t('coverage.topicsTitle')}
                body={t('coverage.topicsBody', { count: total })}
              />

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {[...topics].sort((a, b) => PILLAR_ORDER.indexOf(a.topic) - PILLAR_ORDER.indexOf(b.topic)).map((bucket) => {
                  const name = topicName(t, bucket.topic);
                  if (!name) return null;
                  const commonDocuments = commonTopicDocuments(t, bucket.topic);
                  const recommendedDocument = (bucket.documents || [])
                    .map(documentId => ({ documentId, entry: documents.find(item => item.document === documentId) }))
                    .filter(item => item.entry)
                    .sort((a, b) => b.entry.unlocks - a.entry.unlocks)[0];
                  const showDocumentRecommendation = recommendedDocument?.entry?.unlocks >= 2;
                  return (
                    <div key={bucket.topic} className={`flex flex-col overflow-hidden border border-slate-200 bg-white shadow-sm ${bucket.topic === 'other' ? 'md:col-span-2 xl:col-span-3' : ''}`}>
                      <div className="flex flex-grow flex-col p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 gap-3">
                          <TopicIcon topic={bucket.topic} />
                          <div>
                          <h3 className="text-base font-semibold text-slate-900">{name}</h3>
                          <p className="mt-1 text-[13px] leading-relaxed text-slate-500">{topicSubtitle(t, bucket.topic)}</p>
                          </div>
                        </div>
                        <p className="shrink-0 bg-slate-100 px-2.5 py-1 text-xs font-semibold tabular-nums text-slate-700">
                          {bucket.total === 1
                            ? t('coverage.topicQuestion', { count: bucket.total })
                            : t('coverage.topicQuestions', { count: bucket.total })}
                        </p>
                      </div>
                      {/* Where this topic stands, then the questions themselves. A count alone
                          looked identical before and after a document answered half of them. */}
                      <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs tabular-nums">
                        <span className="font-semibold text-emerald-700">{t('coverage.topicAnswered', { count: (bucket.recovered || 0) + (bucket.fromRecords || 0) })}</span>
                        <span className="text-amber-700">{t('coverage.topicToCheck', { count: (bucket.partial || 0) + (bucket.written || 0) })}</span>
                        <span className="text-slate-600">{t('coverage.topicOpen', { count: bucket.open || 0 })}</span>
                      </p>

                      <div className="mt-4 flex flex-grow flex-col gap-3">
                        {/* Actions first: on a long form the bottom of the card is never seen. */}
                        {showDocumentRecommendation && (
                          <div className="bg-emerald-50 px-3.5 py-3">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">{t('coverage.startHere')}</p>
                            <p className="mt-1 text-sm font-semibold text-emerald-950">{recommendedDocument.entry.name}</p>
                            <p className="mt-0.5 text-xs leading-relaxed text-emerald-900/70">{documentHolds(t, recommendedDocument.documentId)} · {t('coverage.docUnlocks', { count: recommendedDocument.entry.unlocks })}</p>
                          </div>
                        )}
                        {!showDocumentRecommendation && bucket.needsPolicy > 0 && (
                          <div className="bg-violet-50 px-3.5 py-3">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-violet-700">{t('coverage.startHere')}</p>
                            <p className="mt-1 text-sm font-semibold text-violet-950">{t('coverage.policyStartTitle')}</p>
                            <p className="mt-0.5 text-xs leading-relaxed text-violet-900/70">{t('coverage.topicPolicyNeed', { count: bucket.needsPolicy })}</p>
                          </div>
                        )}
                        {((bucket.documents || []).length > 0 || bucket.topic === 'other' || bucket.needsPolicy > 0) && (
                          <div className="flex flex-wrap items-center gap-2">
                            {(bucket.documents || []).length > 0 && <><button onClick={() => { track('coverage_add_documents_click', { document: recommendedDocument?.documentId || bucket.documents[0] }); navigate('/evidence'); }} className="inline-flex h-10 items-center gap-1.5 bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"><Upload className="h-4 w-4" />{t('coverage.docUpload')}</button><button onClick={() => { track('coverage_enter_figures_click', { document: recommendedDocument?.documentId || bucket.documents[0] }); navigate('/data'); }} className="inline-flex h-10 items-center border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50">{t('coverage.docEnter')}</button></>}
                            {bucket.topic === 'other' && <button type="button" onClick={openCompany} className="inline-flex h-10 items-center border border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 hover:bg-slate-50">{t('coverage.addCompanyDetails')}</button>}
                            {bucket.needsPolicy > 0 && <><button type="button" onClick={() => { setPolicyUploadBuilder(policyGaps.builders[0] || ''); setPolicyUploadOpen(true); }} className="inline-flex h-10 items-center gap-1.5 border border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 hover:bg-slate-50"><Upload className="h-4 w-4" />{t('coverage.uploadPolicy')}</button><button type="button" onClick={() => setPolicyBuilderId(policyGaps.builders[0] || 'blank')} className="inline-flex h-10 items-center bg-violet-700 px-4 text-sm font-medium text-white hover:bg-violet-800">{t('coverage.createPolicy')}</button></>}
                          </div>
                        )}
                        {/* Bounded: a 200-question form must not make a card 200 rows tall. */}
                        {(bucket.questions || []).length > 0 && (
                        <ul className="mt-4 max-h-[30rem] divide-y divide-slate-100 overflow-y-auto border-t border-slate-100 pr-1">
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
                                  // A written draft with nothing missing needs reading, not a document;
                                  // "only you can answer this" is for a question with no draft at all.
                                  const hint = docName ? t('coverage.needsDocument', { document: docName, figure: doc.label })
                                    : policy ? t('coverage.needsPolicy', { policy })
                                      : q.needs.prompt ? q.needs.prompt
                                        : (q.state === 'written' || q.state === 'partial') ? t('coverage.needsReading')
                                          : t('coverage.needsYou');
                                  return <span className="text-slate-600"> · {hint}</span>;
                                })()}
                              </p>
                            </li>
                          ))}
                        </ul>
                      )}
                        {/* Generic for the topic, the same on every questionnaire — kept, but behind
                            a line; the per-question hints above are the specific version. */}
                        <details className="text-sm">
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
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {topics.length === 0 && documents.length > 0 && (
            <div className="order-2 space-y-4">
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

          {/* First, because it is the proof: an answer with the reader's own number in it.
              It sat third, under the document list and every topic card, and was missed. */}
          <div className="order-1">
            <ReferencePanel
              t={t}
              fromRecords={fromRecords}
              questions={questions}
              sample={sample}
              remaining={remaining}
              hasOwnData={hasOwnData}
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
          ) : sample.length > 0 ? (
            <div className="order-4 mx-auto w-full max-w-3xl space-y-4">
              <div className="text-center"><SectionHeading eyebrow={t('coverage.eyebrowCost')} title={t('coverage.costTitle')} body={t('coverage.costBody')} /></div>
              <div className="border border-slate-200 bg-slate-50 p-5">
                <p className="font-semibold text-slate-900">{t('coverage.buySummaryTitle')}</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">
                  {t('coverage.buySummaryBody', {
                    total,
                    supported: fromRecords.length,
                    drafted: written.length,
                    open: unanswerable.length + partial.length,
                  })}
                </p>
              </div>
              <p className="text-center text-xs leading-relaxed text-slate-400">{t('coverage.commonDocumentsNote')}</p>
              <div>
              <div className="flex flex-col gap-3 border-2 border-slate-900 bg-white p-6">
                <h2 className="text-lg font-semibold text-slate-900">{t('coverage.passTitle')}</h2>
                <ul className="hidden">
                  {[t('coverage.passF1'), t('coverage.passF2'), t('coverage.passF3'), t('coverage.passF4')].map(line => (
                    <li key={line} className="flex gap-2.5 text-sm leading-relaxed text-slate-600">
                      <span className="text-slate-400">•</span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
                <ul className="space-y-2.5">
                  {[
                    // The best line the product has, said only when it is true of THIS file.
                    (questions || []).some(q => q.location?.answerCell)
                      ? t('coverage.quoteDeliverableFile', { count: total })
                      : t('coverage.quoteDeliverable', { count: total }),
                    t('coverage.quoteFigures', { supported: fromRecords.length, review: Math.max(0, total - fromRecords.length) }),
                    t('coverage.quotePrivacy'),
                    t('coverage.quotePayment'),
                    t('coverage.quoteSupport'),
                  ].map(line => (
                    <li key={line} className="flex gap-2.5 text-sm leading-relaxed text-slate-600">
                      <span className="text-slate-400">•</span><span>{line}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => openCheckout(QUESTIONNAIRE_PASS_CHECKOUT_URL, 'coverage_report_pass', tier)}
                  className="inline-flex h-12 items-center justify-center gap-2 bg-slate-900 text-[15px] font-medium text-white transition-colors hover:bg-slate-800"
                >
                  {t('coverage.passCta', { count: total, price: PASS_PRICE })}
                  <ArrowRight className="h-4 w-4" />
                </button>
                <p className="text-center text-sm font-medium leading-relaxed text-emerald-800">{t('coverage.returnPromise')}</p>
              </div>

              {false && (
              <div className="hidden">
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
                <p className="text-center text-xs leading-relaxed text-slate-500">{t('coverage.passportTerms')}</p>
                </div>
              )}
              </div>
              <div className="hidden">
                {t('coverage.trustStrip')}
              </div>
            </div>
          ) : null}

          <div className="order-5 flex flex-wrap items-center gap-4">
            {!canGenerateAnswers && sample.length > 0 && (
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
  );
}
