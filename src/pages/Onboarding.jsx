import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSettings, saveSettings } from '@/lib/store';
import { track, trackOnce } from '@/lib/track';
import { useLanguage } from '@/components/LanguageContext';
import { marketingUrl } from '@/lib/checkout';
import { Button } from '@/components/ui/button';
import { Upload, ArrowRight, ArrowLeft, Database, FileText, Shield } from 'lucide-react';

// First run. One screen, one obvious action: put the questionnaire in.
//
// It used to be three. Two of them had no inputs at all, and the middle one
// demanded a company name, industry and country before anything happened - after
// which the "see it in action" exit threw all three away and answered a sample
// questionnaire out of a fictional company's data. Eight interactions and three
// required fields bought exactly what the one-click skip link bought, and the skip
// link was the one that looked like giving up. 29 people started this; 5 finished.
//
// The profile is not gone, it is deferred: nothing needs it until there is data to
// attach it to, and /data collects it in context. Country only feeds the electricity
// emission factor, which already falls back to the EU average.
export default function Onboarding() {
  const navigate = useNavigate();
  const { lang, t } = useLanguage();
  // Cross-links to the marketing site stay in-language — see checkout.js, which
  // knows that the German pages have German slugs, not just a /de prefix.
  const passportUrl = marketingUrl('/passport', lang);
  const setupCompleted = getSettings()?.setupCompleted;

  useEffect(() => {
    trackOnce('onboarding_started');
  }, []);

  useEffect(() => {
    if (setupCompleted) navigate('/', { replace: true });
  }, [navigate, setupCompleted]);

  // No company profile is written here any more. saveCompanyProfile() sets
  // setupCompleted itself, so filling it in later on /data closes onboarding
  // properly without this screen having to guess at empty values first.
  const start = (destination, { skipped = false } = {}) => {
    saveSettings({ setupCompleted: true, setupSkipped: skipped, onboardingStep: 1 });
    track(skipped ? 'onboarding_skipped' : 'onboarding_completed', { destination });
    navigate(destination);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <a
          href={passportUrl}
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('onboard.back')}
        </a>

        <div className="bg-white border border-slate-200 rounded-none p-8 space-y-6">
          <div className="space-y-3">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-none bg-slate-900">
              <Upload className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{t('onboard.startTitle')}</h1>
            <p className="text-slate-600 leading-relaxed">{t('onboard.startBody')}</p>
          </div>

          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-start gap-2">
              <span className="text-slate-400 mt-0.5">1.</span>
              <span>{t('onboard.step.upload')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-400 mt-0.5">2.</span>
              <span>{t('onboard.step.check')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-400 mt-0.5">3.</span>
              <span>{t('onboard.step.report')}</span>
            </li>
          </ul>

          <Button
            onClick={() => start('/respond?focus=questionnaire')}
            className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-none"
          >
            {t('onboard.startCta')}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>

          <div className="flex items-start gap-2 text-xs text-slate-500">
            <Shield className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{t('onboard.privacy')}</span>
          </div>

          {/* Bills and certificates are free to read at every tier, and until now the
              first screen of the free flow offered no way to hand one over — the door
              only existed on the dashboard, which nobody sees until this screen is
              past. Someone who has a stack of bills but no questionnaire yet had
              nothing to do here. */}
          <div className="border-t border-slate-100 pt-5 space-y-3">
            <button
              onClick={() => start('/evidence')}
              className="w-full text-left text-sm font-medium text-slate-900 inline-flex items-center gap-2 hover:text-slate-700"
            >
              <FileText className="w-4 h-4" />
              {t('onboard.documentsCta')}
            </button>
            <button
              onClick={() => start('/demo', { skipped: true })}
              className="w-full text-left text-sm text-slate-600 hover:text-slate-900"
            >
              {t('onboard.sampleCta')}
            </button>
            <button
              onClick={() => start('/data')}
              className="w-full text-left text-sm text-slate-600 hover:text-slate-900 inline-flex items-center gap-2"
            >
              <Database className="w-4 h-4" />
              {t('onboard.manualCta')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
