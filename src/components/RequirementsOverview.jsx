import React from 'react';
import { Award, ChevronDown, Download, Leaf, ShieldCheck, Upload, Users } from 'lucide-react';
import { documentHolds } from '@/lib/documentLabels';

// The first thing a reader sees after their questionnaire is read: the documents that
// answer it, the decisions only they can make, and one way forward. Built from
// lib/requirements.js; the questionnaire-level counts it shows sum to the questionnaire.
//
// Layout decided with Cat on 2026-11-06 (design canvas "Passport flow — needs first"):
// headline with the counts, the documents open at the top in four outlined groups, the
// decisions as plain bullets (no box, not in any group's colour), a compact Pass call to
// action beside the headline, the document-to-question map folded below, and the next
// steps with the full upload action at the bottom.

// Literal t() calls, for the i18nCoverage guard (see documentLabels.js).
function requirementName(t, key) {
  switch (key) {
    case 'electricityBill': return t('needs.doc.electricityBill');
    case 'fuelInvoice': return t('needs.doc.fuelInvoice');
    case 'waterBill': return t('needs.doc.waterBill');
    case 'wasteManifest': return t('needs.doc.wasteManifest');
    case 'hrReport': return t('needs.doc.hrReport');
    case 'safetyLog': return t('needs.doc.safetyLog');
    case 'trainingRecord': return t('needs.doc.trainingRecord');
    case 'policy.environmental': return t('needs.doc.policyEnvironmental');
    case 'policy.healthSafety': return t('needs.doc.policyHealthSafety');
    case 'policy.humanRights': return t('needs.doc.policyHumanRights');
    case 'policy.codeOfConduct': return t('needs.doc.policyCodeOfConduct');
    case 'policy.antiBribery': return t('needs.doc.policyAntiBribery');
    case 'policy.whistleblowing': return t('needs.doc.policyWhistleblowing');
    case 'policy.supplierCode': return t('needs.doc.policySupplierCode');
    case 'policy.other': return t('needs.doc.policyOther');
    case 'policy.iso14001': return t('needs.doc.iso14001');
    case 'companyDetails': return t('needs.doc.companyDetails');
    default: return null;
  }
}

function requirementHolds(t, key) {
  if (key === 'policy.iso14001') return t('needs.holds.iso14001');
  if (key === 'companyDetails') return t('needs.holds.companyDetails');
  if (key.startsWith('policy.')) return t('needs.holds.policy');
  return documentHolds(t, key);
}

function groupName(t, group) {
  switch (group) {
    case 'environment': return t('needs.group.environment');
    case 'workforce': return t('needs.group.workforce');
    case 'policies': return t('needs.group.policies');
    case 'company': return t('needs.group.company');
    default: return null;
  }
}

// One colour per group, used only on its icon and dots. The decisions deliberately use
// none of them. No red anywhere.
const GROUP_STYLE = {
  environment: { Icon: Leaf, tile: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500', ink: 'text-emerald-700' },
  workforce: { Icon: Users, tile: 'bg-sky-50 text-sky-700', dot: 'bg-sky-500', ink: 'text-sky-700' },
  policies: { Icon: ShieldCheck, tile: 'bg-violet-50 text-violet-700', dot: 'bg-violet-500', ink: 'text-violet-700' },
  company: { Icon: Award, tile: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500', ink: 'text-amber-700' },
};

function headline(t, req) {
  const { documentCount, covered, total, decisions } = req;
  if (covered === 0) {
    if (decisions.length > 0) return t('needs.titleDecisionsOnly');
    if (req.drafted.length > 0) return t('needs.titleDraftedOnly', { count: req.drafted.length });
    return t('needs.titleDone');
  }
  if (documentCount === 0) return t('needs.titleCompanyOnly', { covered, total });
  if (documentCount === 1) return t('needs.titleOne', { covered, total });
  return t('needs.title', { docs: documentCount, covered, total });
}

export default function RequirementsOverview({
  t,
  requirements,
  canGenerateAnswers,
  returnsCustomerWorkbook,
  sampleLimit,
  price,
  onUpload,
  onPrimary,
  primaryLabel,
  onDownload,
  checkoutNote,
  questionnaireName = '',
  headerExtra = null,
  afterGroups = null,
}) {
  const [open, setOpen] = React.useState({});
  const req = requirements;
  const groups = req.groups;
  const lead = req.covered > 0 ? (req.hasCompanyDetails ? t('needs.leadCompany') : t('needs.lead')) : null;

  return (
    <div data-testid="needs-first" className="text-slate-900">
      {/* Headline left, the compact Pass call to action right */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
        <header className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-semibold uppercase tracking-[0.08em] text-indigo-600">{questionnaireName ? `${questionnaireName} · ` : ''}{t('needs.eyebrowCount', { count: req.total })}</p>
          <h1 className="mt-2 text-[28px] font-bold leading-tight tracking-tight sm:text-[34px]">{headline(t, req)}</h1>
          {lead && <p className="mt-2 text-[17px] leading-7 text-slate-600">{lead}</p>}
          {headerExtra}
        </header>
        <div className="flex shrink-0 flex-col items-center gap-2 text-center lg:w-[300px]">
          {!canGenerateAnswers && <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-indigo-600">{t('needs.passEyebrow', { price })}</p>}
          <button type="button" data-testid="needs-upload-top" onClick={onUpload} className="inline-flex min-h-12 w-full items-center justify-center gap-2 bg-indigo-600 px-6 text-[15px] font-semibold text-white hover:bg-indigo-700 sm:w-auto sm:min-w-[220px]">
            <Upload className="h-4 w-4" />{t('needs.uploadCta')}
          </button>
          {!canGenerateAnswers && <p className="text-[13px] leading-5 text-slate-500">{t(returnsCustomerWorkbook ? 'needs.passNoteWorkbook' : 'needs.passNoteOrder', { total: req.total, limit: sampleLimit })}</p>}
        </div>
      </div>

      {/* The documents, open */}
      {groups.length > 0 && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {groups.map(group => {
            const style = GROUP_STYLE[group.group];
            const Icon = style.Icon;
            return (
              <div key={group.group} className="border border-slate-200 bg-white p-5">
                <div className="mb-3 flex items-center gap-3">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center ${style.tile}`}><Icon className="h-5 w-5" /></span>
                  <div>
                    <h2 className="text-[16px] font-bold leading-snug">{groupName(t, group.group)}</h2>
                    <p className={`text-[12.5px] font-semibold ${style.ink}`}>{group.questionCount === 1 ? t('needs.groupQuestionsOne') : t('needs.groupQuestions', { count: group.questionCount })}</p>
                  </div>
                </div>
                <ul className="space-y-1.5">
                  {group.documents.map(doc => (
                    <li key={doc.key} className="flex items-baseline gap-2.5 text-[14.5px] leading-snug">
                      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${style.dot}`} aria-hidden="true" />
                      <span>{requirementName(t, doc.key)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      {afterGroups}

      {/* The decisions: plain, no box, no group colour */}
      {req.decisions.length > 0 && (
        <div className="mt-8">
          <h2 className="text-[17px] font-bold">{t('needs.decideTitle')}</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-[15.5px] leading-7 text-slate-800">
            {req.decisions.map(q => <li key={q.questionId}>{q.questionText}</li>)}
          </ul>
        </div>
      )}

      {/* The map, on demand */}
      {groups.length > 0 && (
        <div className="mt-10">
          <h2 className="text-[20px] font-bold">{t('needs.mapTitle')}</h2>
          <p className="mt-1 text-[14.5px] text-slate-600">{t('needs.mapBody')}</p>
          <div className="mt-4 border border-slate-200 bg-white">
            {groups.map(group => {
              const style = GROUP_STYLE[group.group];
              const Icon = style.Icon;
              const isOpen = Boolean(open[group.group]);
              return (
                <div key={group.group} className="border-b border-slate-200 last:border-b-0">
                  <button
                    type="button"
                    onClick={() => setOpen(prev => ({ ...prev, [group.group]: !isOpen }))}
                    aria-expanded={isOpen}
                    className="flex min-h-[72px] w-full items-center gap-4 px-5 py-4 text-left hover:bg-slate-50"
                  >
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center ${style.tile}`}><Icon className="h-5 w-5" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[16px] font-bold">{groupName(t, group.group)}</span>
                      <span className="block truncate text-[13.5px] text-slate-500">{group.documents.map(doc => requirementName(t, doc.key)).join(', ')}</span>
                    </span>
                    <span className={`hidden shrink-0 text-[13px] font-semibold sm:block ${style.ink}`}>{group.questionCount === 1 ? t('needs.groupQuestionsOne') : t('needs.groupQuestions', { count: group.questionCount })}</span>
                    <ChevronDown className={`h-5 w-5 shrink-0 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 sm:pl-[76px]">
                      <div className="hidden grid-cols-[1fr_1.3fr_1.1fr] gap-6 border-t border-slate-200 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500 md:grid">
                        <span>{t('needs.colDocument')}</span><span>{t('needs.colAnswers')}</span><span>{t('needs.colHolds')}</span>
                      </div>
                      {group.documents.map((doc, i) => (
                        <div key={doc.key} className={`grid gap-2 px-3 py-3 md:grid-cols-[1fr_1.3fr_1.1fr] md:gap-6 ${i % 2 === 0 ? 'bg-slate-50' : 'bg-white'}`}>
                          <p className="text-[14.5px] font-semibold leading-snug">{requirementName(t, doc.key)}</p>
                          <ul className="space-y-1">
                            {doc.questions.map(q => <li key={q.questionId} className="text-[13.5px] leading-snug text-slate-700">{q.questionText}</li>)}
                          </ul>
                          <p className="text-[13.5px] leading-snug text-slate-500">{requirementHolds(t, doc.key)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Next steps: the steps left, the full action right */}
      <section data-testid="needs-next-steps" className="mt-10 border border-indigo-200 bg-indigo-50 p-6 sm:p-8">
        <h2 className="text-[22px] font-bold text-indigo-950">{t('needs.nextTitle')}</h2>
        <div className="mt-5 flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-14">
          {!canGenerateAnswers ? (
            <ol className="flex flex-1 flex-col gap-4">
              {[
                [t('needs.step1Title'), t('needs.step1Body')],
                [t('needs.step2Title', { limit: sampleLimit }), t('needs.step2Body')],
                [t('needs.step3Title', { price }), t(returnsCustomerWorkbook ? 'needs.step3BodyWorkbook' : 'needs.step3BodyOrder', { total: req.total })],
              ].map(([title, body], i) => (
                <li key={title} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center bg-indigo-600 text-[13px] font-bold text-white">{i + 1}</span>
                  <span className="text-[14.5px] leading-6 text-slate-700"><strong className="block text-[15.5px] text-slate-900">{title}</strong>{body}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="flex-1 text-[14.5px] leading-6 text-slate-700">{t('needs.step1Body')}</p>
          )}
          <div className="flex flex-col items-center gap-2 text-center lg:w-[320px]">
            <button type="button" data-testid="needs-upload-bottom" onClick={onUpload} className="inline-flex min-h-14 w-full items-center justify-center gap-2 bg-slate-900 px-8 text-[16px] font-bold text-white hover:bg-slate-800 sm:w-auto sm:min-w-[240px]">
              <Upload className="h-4 w-4" />{t('needs.uploadCta')}
            </button>
            {onPrimary && (
              <button type="button" data-testid="coverage-primary-action" onClick={onPrimary} className="mt-1 text-[14px] font-semibold text-indigo-700 underline underline-offset-4 hover:text-indigo-900">{primaryLabel}</button>
            )}
            <p className="mt-1 text-[13px] text-slate-500">{t('needs.notReady')}</p>
            <button type="button" data-testid="needs-download-list" onClick={onDownload} className="inline-flex items-center gap-1.5 text-[13px] text-slate-500 underline underline-offset-4 hover:text-slate-800">
              <Download className="h-3.5 w-3.5" />{t('needs.downloadList')}
            </button>
          </div>
        </div>
        {checkoutNote && <p data-testid="coverage-checkout-note" className="mt-6 border-t border-indigo-200 pt-4 text-[12.5px] leading-5 text-slate-500">{checkoutNote}</p>}
      </section>
    </div>
  );
}

