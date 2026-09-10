import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  getReadinessStats,
  getRequests,
  getDataRecords,
  getSettings,
} from '@/lib/store';
import { useLanguage } from '@/components/LanguageContext';
import { useLicense } from '@/components/LicenseContext';
import { track } from '@/lib/track';
import { ArrowRight, ExternalLink, Shield } from 'lucide-react';

import { PASSPORT_CHECKOUT_URL, QUESTIONNAIRE_PASS_CHECKOUT_URL, checkoutLinkProps, marketingUrl } from '@/lib/checkout';
import QuestionnaireDrop from '@/components/QuestionnaireDrop';
import DocumentDrop from '@/components/DocumentDrop';
import JourneySpine from '@/components/JourneySpine';
import { canActivateAnotherKey } from '@/lib/entitlements';
import { readCoverageStash } from '@/lib/coverageStash';
import { documentName } from '@/lib/documentLabels';
import { HOME_TABS, defaultHomeTab, readLastHomeTab, writeLastHomeTab } from '@/lib/homeTab';

// The dashboard asks one question: what are you holding?
//
// It used to ask six. A welcome card with a readiness donut, a hero headline, a
// questionnaire dropzone, an evidence card, an upgrade banner, a dismissible guide, four
// stat tiles and a Quick Actions list — ten blocks, six of them styled as "do this", two
// of them <h1>. And the one path the code did pick ranked "enter your September data"
// second and "upload a questionnaire" LAST, which is the old living-passport product
// arguing with the one we sell: a questionnaire lands on someone's desk, and that is the
// job.
//
// So: two doors, both of them a file you already have — the questionnaire, or the bills —
// one open at a time (see homeTab.js for which). Numbers are a line of text, not a row of
// tiles. The composite readiness score is gone: it averaged data quality with policy
// completion, so a free visitor was greeted by a low percentage for work the free tier
// cannot do, on a product whose coverage report is forbidden from showing scores.
export default function Home() {
  // Every hook runs before the redirect below. It used to sit between them, so a
  // render with setup incomplete called one hook and a render with it complete called
  // three — and React throws "rendered more hooks than during the previous render" the
  // moment that count changes under a mounted component.
  const { tier, entitlements } = useLicense();
  const isPassHolder = tier === 'questionnaire-pass';
  const settings = getSettings();
  const { lang, t } = useLanguage();
  const redirectToOnboarding = !settings.setupCompleted;

  const monthLabel = (mm) => t(`month.${mm}`);
  const pt = (count, base, vars = {}) => t(`${base}.${count === 1 ? 'one' : 'other'}`, { count, ...vars });

  const stats = getReadinessStats();
  const requests = getRequests();
  const dataRecords = getDataRecords();
  const stash = React.useMemo(() => readCoverageStash(), []);

  const currentYear = new Date().getFullYear();
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
  const currentPeriod = `${currentYear}-${currentMonth}`;

  const hasCurrentMonthData = dataRecords.some(r => r.period === currentPeriod);
  const hasAnyData = dataRecords.length > 0;
  const monthsTracked = dataRecords.length;

  // Each extracted figure records the document it came out of, so the distinct names
  // ARE the documents read so far.
  const documentsRead = React.useMemo(
    () => [...new Set(Object.values(settings?.dataSources || {}).filter(Boolean))].length,
    [settings],
  );

  const openRequests = requests.filter(r => r.status !== 'closed' && r.status !== 'sent');
  const nextDeadline = openRequests
    .filter(r => r.deadline)
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))[0] || null;
  const daysToDeadline = nextDeadline
    ? Math.ceil((new Date(nextDeadline.deadline) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  const wanted = (stash?.missingDocuments || []).filter(entry => documentName(t, entry.document));
  const unlockable = wanted.reduce((sum, entry) => sum + (entry.unlocks || 0), 0);

  const [tab, setTab] = React.useState(() => defaultHomeTab({
    hasAnyData,
    hasCurrentMonthData,
    missingDocumentCount: wanted.length,
    lastTab: readLastHomeTab(),
  }));

  const chooseTab = (next) => {
    if (next === tab) return;
    setTab(next);
    writeLastHomeTab(next);
    track('home_tab_switched', { tab: next });
  };

  if (redirectToOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  const tabClass = (name) => [
    'pb-2.5 text-sm transition-colors',
    tab === name
      ? 'font-medium text-slate-900 shadow-[inset_0_-1px_0_0_theme(colors.slate.900)]'
      : 'text-slate-400 hover:text-slate-600',
  ].join(' ');

  return (
    <>
      <JourneySpine
        step={stash ? 2 : 1}
        questionCount={stash?.questionCount || 0}
        documentCount={documentsRead}
      />

      <div className="mx-auto flex max-w-2xl flex-col gap-7 pb-6">

        {/* The numbers, as a line. Only what exists is said — four zeros in a row told a
            first-time visitor nothing except that they had not started. */}
        <div className="flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1.5 text-xs text-slate-400">
          {!hasAnyData && !stash && <span>{t('home.status.nothing')}</span>}
          {stash && (
            <span>{pt(stash.questionCount || 0, 'home.status.questions')}</span>
          )}
          {hasAnyData && (
            <>
              {stash && <span aria-hidden="true" className="text-slate-200">·</span>}
              <span>{pt(monthsTracked, 'home.status.months')}</span>
              <span aria-hidden="true" className="text-slate-200">·</span>
              <span>{t('home.status.safe', { safe: stats.safeToShareDataPoints, total: stats.totalDataPoints })}</span>
            </>
          )}
          {!hasCurrentMonthData && hasAnyData && (
            <>
              <span aria-hidden="true" className="text-slate-200">·</span>
              <Link to="/data" className="text-amber-700 underline-offset-2 hover:underline">
                {t('home.status.monthMissing', { month: monthLabel(currentMonth) })}
              </Link>
            </>
          )}
          {documentsRead > 0 && (
            <>
              <span aria-hidden="true" className="text-slate-200">·</span>
              <span>{pt(documentsRead, 'home.status.documents')}</span>
            </>
          )}
          {nextDeadline && daysToDeadline !== null && (
            <>
              <span aria-hidden="true" className="text-slate-200">·</span>
              <Link to={`/requests/${nextDeadline.id}`} className="text-amber-700 underline-offset-2 hover:underline">
                {daysToDeadline < 0
                  ? t('home.status.overdue', { customer: nextDeadline.customerName })
                  : t('home.status.due', { customer: nextDeadline.customerName, days: daysToDeadline })}
              </Link>
            </>
          )}
        </div>

        {/* What the report asked for. This is the strongest free moment in the product —
            the reader's own questionnaire has just named which document answers how many
            questions — so it outranks both doors when it exists. */}
        {wanted.length > 0 && (
          <div className="flex flex-col gap-3">
            <div>
              <h2 className="text-[17px] font-medium leading-snug tracking-tight text-slate-900">
                {t('home.docsTitle', { count: unlockable })}{' '}
                <span className="align-middle text-[10px] uppercase tracking-[0.1em] text-indigo-600">{t('home.free')}</span>
              </h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">{t('home.docsBody')}</p>
            </div>
            <div>
              {wanted.map((entry) => (
                <div
                  key={entry.document}
                  className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 border-t border-slate-100 py-2.5 last:border-b last:border-slate-100"
                >
                  <span className="min-w-[5.5rem] text-xs tabular-nums text-slate-400">
                    {t('evidence.answersCount', { count: entry.unlocks })}
                  </span>
                  <span className="text-[13px] text-slate-900">{documentName(t, entry.document)}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                to="/evidence"
                onClick={() => track('home_documents_cta', { documents: wanted.length })}
                className="inline-flex h-9 items-center gap-2 bg-slate-900 px-4 text-xs font-medium text-white transition-colors hover:bg-slate-800"
              >
                {t('home.docsCta')}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link to="/respond" className="text-xs font-medium text-slate-900 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-900">
                {t('home.backToReport')}
              </Link>
            </div>
          </div>
        )}

        {/* Something part-finished. The stash keeps the questionnaire, never the answers,
            so this says what was read — not a count of drafts nobody paid for. */}
        {stash && (
          <div className="flex flex-col gap-2 border-t border-slate-100 pt-5">
            <span className="text-[10px] uppercase tracking-[0.12em] text-slate-400">{t('home.inProgress')}</span>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[13px] font-medium text-slate-900">{stash.name}</p>
                <p className="mt-0.5 text-xs text-slate-400">{pt(stash.questionCount || 0, 'home.status.questions')}</p>
              </div>
              <Link to="/respond" className="text-xs font-medium text-slate-900 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-900">
                {t('home.resumeOpen')}
              </Link>
            </div>
          </div>
        )}

        {/* The two doors. Both are the same gesture — hand us a file you already have. */}
        <div className="flex flex-col gap-6">
          <div role="tablist" aria-label={t('home.tabsLabel')} className="flex justify-center gap-7 border-b border-slate-100">
            <button
              type="button"
              role="tab"
              id="home-tab-questionnaire"
              aria-selected={tab === HOME_TABS.questionnaire}
              aria-controls="home-panel-questionnaire"
              onClick={() => chooseTab(HOME_TABS.questionnaire)}
              className={tabClass(HOME_TABS.questionnaire)}
            >
              {t('home.tab.questionnaire')}
            </button>
            <button
              type="button"
              role="tab"
              id="home-tab-bills"
              aria-selected={tab === HOME_TABS.bills}
              aria-controls="home-panel-bills"
              onClick={() => chooseTab(HOME_TABS.bills)}
              className={tabClass(HOME_TABS.bills)}
            >
              {t('home.tab.bills')}
            </button>
          </div>

          {tab === HOME_TABS.questionnaire ? (
            <div
              role="tabpanel"
              id="home-panel-questionnaire"
              aria-labelledby="home-tab-questionnaire"
              className="flex flex-col gap-5"
            >
              <div className="text-center">
                <h1 className="text-[19px] font-medium leading-snug tracking-tight text-slate-900">{t('home.heroTitle')}</h1>
                <p className="mx-auto mt-1.5 max-w-lg text-[13px] leading-relaxed text-slate-500">
                  {entitlements.canGenerateAnswers ? t('home.heroBodyPaid') : t('home.heroBodyFree')}
                </p>
              </div>

              <QuestionnaireDrop />

              <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
                <span className="text-slate-500">{t('home.flowUpload')}</span>
                <ArrowRight className="h-3 w-3 text-slate-300" />
                <span className="text-slate-500">{t('home.flowSee')}</span>
                <ArrowRight className="h-3 w-3 text-slate-300" />
                <span className="text-slate-500">{t('home.flowReview')}</span>
              </div>
            </div>
          ) : (
            <div
              role="tabpanel"
              id="home-panel-bills"
              aria-labelledby="home-tab-bills"
              className="flex flex-col gap-5"
            >
              <div className="text-center">
                <h1 className="text-[19px] font-medium leading-snug tracking-tight text-slate-900">
                  {t('home.billsTitle')}{' '}
                  <span className="align-middle text-[10px] uppercase tracking-[0.1em] text-indigo-600">{t('home.free')}</span>
                </h1>
                <p className="mx-auto mt-1.5 max-w-lg text-[13px] leading-relaxed text-slate-500">{t('home.billsBody')}</p>
              </div>

              <DocumentDrop />

              <p className="text-center text-xs text-slate-400">
                {t('home.nothingToHand')}{' '}
                <Link to="/data" className="font-medium text-slate-900 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-900">
                  {t('evidence.typeInstead')}
                </Link>
              </p>
            </div>
          )}
        </div>

        {/* The one colour block on the screen, and the only thing on it that is asking
            for money. Keyed off the capability, not isPaid: isPaid is true for the €99
            Pass too, so the €499 upgrade was invisible to the people closest to it.
            Free is offered the €99 rung, a Pass holder the Passport. */}
        {canActivateAnotherKey(tier) && (
          <div className="flex flex-wrap items-center justify-between gap-4 bg-indigo-50 p-5">
            <div>
              <p className="text-[13px] font-semibold text-indigo-950">
                {isPassHolder ? t('home.upgradeTitle') : t('home.upgradeTitleFree')}
              </p>
              <p className="mt-1 max-w-lg text-xs leading-relaxed text-indigo-900/70">
                {isPassHolder ? t('home.upgradeBodyPass') : t('home.upgradeBodyFree')}
              </p>
              {isPassHolder && <p className="mt-1 text-[11px] text-indigo-900/60">{t('upgrade.credit')}</p>}
            </div>
            <a
              {...checkoutLinkProps(
                isPassHolder ? PASSPORT_CHECKOUT_URL : QUESTIONNAIRE_PASS_CHECKOUT_URL,
                'dashboard',
                tier,
              )}
              onClickCapture={() => track('upgrade_cta_click', { source: 'dashboard', from_tier: tier })}
              className="inline-flex h-9 shrink-0 items-center gap-2 bg-indigo-700 px-4 text-xs font-medium text-white transition-colors hover:bg-indigo-800"
            >
              {isPassHolder ? t('home.upgradeCta') : t('home.upgradeCtaFree')}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[11px] text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <Shield className="h-3 w-3" />
            {t('onboard.privacy')}
          </span>
          <a
            href={marketingUrl('/passport', lang)}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-slate-200 underline-offset-4 hover:decoration-slate-400"
          >
            {t('home.upgradeMore')}
          </a>
        </div>
      </div>
    </>
  );
}
