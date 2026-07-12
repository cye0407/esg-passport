import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSettings, saveCompanyProfile, saveSettings } from '@/lib/store';
import { track, trackOnce } from '@/lib/track';
import { INDUSTRIES, COUNTRIES, EMISSION_FACTORS } from '@/lib/constants';
import { useLanguage } from '@/components/LanguageContext';
import { localizeIndustry, localizeCountry } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Shield,
  Building2,
  Globe,
  Users,
  BarChart3,
  ArrowRight,
  Upload,
  Database,
  ClipboardCheck,
  Mail,
  ArrowLeft,
} from 'lucide-react';

export default function Onboarding() {
  const navigate = useNavigate();
  const { lang, t } = useLanguage();
  // Cross-links to the marketing site should stay in-language.
  const marketingBase = 'https://esgforsuppliers.com';
  const passportUrl = lang === 'de' ? `${marketingBase}/de/passport` : `${marketingBase}/passport`;
  const [step, setStep] = useState(1);
  const setupCompleted = getSettings()?.setupCompleted;

  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [industry, setIndustry] = useState('');
  const [customIndustry, setCustomIndustry] = useState('');
  const [country, setCountry] = useState('');
  const [employeeCount, setEmployeeCount] = useState('');

  useEffect(() => {
    trackOnce('onboarding_started');
  }, []);

  useEffect(() => {
    if (setupCompleted) navigate('/', { replace: true });
  }, [navigate, setupCompleted]);

  const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const canProceed = () => {
    if (step === 2) return companyName.trim().length > 0 && isValidEmail(email) && industry && country;
    return true;
  };

  const handleComplete = (destination) => {
    saveCompanyProfile({
      legalName: companyName.trim(),
      tradingName: companyName.trim(),
      esgContactEmail: email.trim(),
      industrySector: industry === 'Other' && customIndustry.trim() ? customIndustry.trim() : industry,
      countryOfIncorporation: country,
      totalEmployees: employeeCount || '',
      annualRevenue: '',
      revenueBand: '',
      numberOfFacilities: '1',
    });

    saveSettings({
      setupCompleted: true,
      setupSkipped: false,
      onboardingStep: 3,
      selectedQuestionnaires: [],
      gridCountry: EMISSION_FACTORS.electricity[country] ? country : 'EU_AVERAGE',
    });

    // Fire-and-forget lead capture — never blocks onboarding
    fetch('/api/register-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.trim(),
        company_name: companyName.trim(),
        industry,
        country,
        employees: employeeCount || null,
      }),
    }).catch(() => {});

    track('onboarding_completed', { destination });
    navigate(destination);
  };

  const skipToSample = () => {
    saveSettings({
      setupCompleted: true,
      setupSkipped: true,
      onboardingStep: 3,
    });
    // Free sample lives at /demo; /respond is the paid workflow.
    track('onboarding_skipped', { destination: '/demo' });
    navigate('/demo');
  };

  const valueProps = [
    { icon: Database, text: t('onboard.value1') },
    { icon: ClipboardCheck, text: t('onboard.value2') },
    { icon: Upload, text: t('onboard.value3') },
    { icon: Globe, text: t('onboard.value4') },
  ];

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

        {/* Progress */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${step >= 1 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>1</div>
          <div className={`w-8 h-0.5 ${step >= 2 ? 'bg-indigo-600' : 'bg-slate-200'}`} />
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${step >= 2 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>2</div>
          <div className={`w-8 h-0.5 ${step >= 3 ? 'bg-indigo-600' : 'bg-slate-200'}`} />
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${step >= 3 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>3</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-none p-8">
          {/* Step 1: Welcome */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center space-y-3">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-none bg-slate-800 mb-2">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">{t('onboard.welcome')}</h2>
                <p className="text-slate-500 max-w-md mx-auto">
                  {t('onboard.welcomeSub')}
                </p>
              </div>

              <div className="space-y-3">
                {valueProps.map((prop, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
                    <prop.icon className="w-5 h-5 text-slate-700 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-600">{prop.text}</span>
                  </div>
                ))}
              </div>

              <p className="text-xs text-slate-400 text-center">
                {t('onboard.privacy')}
              </p>

              <Button
                onClick={() => { track('onboarding_profile_started'); setStep(2); }}
                className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-none"
              >
                {t('onboard.startPreview')}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>

              <button
                onClick={skipToSample}
                className="w-full text-center text-sm text-slate-500 hover:text-slate-700"
              >
                {t('onboard.skip')}
              </button>

              {/* Excel Toolkit is English-only (out of scope for DE) — hide it from the German flow. */}
              {lang !== 'de' && (
                <a
                  href="https://esgforsuppliers.com/esg-response-toolkit"
                  className="block w-full text-center text-sm text-slate-500 hover:text-slate-700"
                >
                  {t('onboard.excel')}
                </a>
              )}
            </div>
          )}

          {/* Step 2: Company Profile */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center space-y-3">
                <h2 className="text-2xl font-bold text-slate-900">{t('onboard.profileTitle')}</h2>
                <p className="text-slate-500 max-w-md mx-auto">
                  {t('onboard.profileSub')}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-900 font-medium flex items-center gap-2">
                  <Building2 className="w-4 h-4" /> {t('onboard.companyName')}
                </Label>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder={t('onboard.companyNamePlaceholder')}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-900 font-medium flex items-center gap-2">
                  <Mail className="w-4 h-4" /> {t('onboard.email')}
                </Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('onboard.emailPlaceholder')}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-900 font-medium flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" /> {t('onboard.industry')}
                </Label>
                <Select value={industry} onValueChange={(v) => { setIndustry(v); if (v !== 'Other') setCustomIndustry(''); }}>
                  <SelectTrigger className="h-12"><SelectValue placeholder={t('onboard.industryPlaceholder')} /></SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map((ind) => <SelectItem key={ind} value={ind}>{localizeIndustry(ind, lang)}</SelectItem>)}
                  </SelectContent>
                </Select>
                {industry === 'Other' && (
                  <Input
                    value={customIndustry}
                    onChange={(e) => setCustomIndustry(e.target.value)}
                    placeholder={t('onboard.industryCustomPlaceholder')}
                    className="h-12 mt-2"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-900 font-medium flex items-center gap-2">
                    <Globe className="w-4 h-4" /> {t('onboard.country')}
                  </Label>
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger className="h-12"><SelectValue placeholder={t('onboard.countryPlaceholder')} /></SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((c) => <SelectItem key={c.code} value={c.code}>{localizeCountry(c.code, c.name, lang)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-900 font-medium flex items-center gap-2">
                    <Users className="w-4 h-4" /> {t('onboard.employees')}
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    value={employeeCount}
                    onChange={(e) => setEmployeeCount(e.target.value)}
                    placeholder={t('onboard.employeesPlaceholder')}
                    className="h-12"
                  />
                </div>
              </div>

              <Button
                onClick={() => { track('onboarding_profile_completed'); setStep(3); }}
                disabled={!canProceed()}
                className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-none"
              >
                {t('onboard.continue')}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>

              <button
                onClick={() => setStep(1)}
                className="w-full text-center text-sm text-slate-500 hover:text-slate-700"
              >
                {t('btn.back')}
              </button>
            </div>
          )}

          {/* Step 3: Choose your path */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center space-y-3">
                <h2 className="text-2xl font-bold text-slate-900">{t('onboard.allSet')}</h2>
                <p className="text-slate-500 max-w-md mx-auto">
                  {t('onboard.allSetSub')}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => handleComplete('/data')}
                  className="p-6 border border-slate-200 rounded-none hover:border-slate-400 hover:bg-slate-50 transition-colors text-left"
                >
                  <Database className="w-8 h-8 text-slate-700 mb-3" />
                  <h3 className="text-base font-semibold text-slate-900 mb-1">{t('onboard.startTracking')}</h3>
                  <p className="text-sm text-slate-500">{t('onboard.startTrackingSub')}</p>
                </button>

                <button
                  onClick={() => handleComplete('/demo')}
                  className="p-6 border border-slate-200 rounded-none hover:border-slate-400 hover:bg-slate-50 transition-colors text-left"
                >
                  <Upload className="w-8 h-8 text-slate-700 mb-3" />
                  <h3 className="text-base font-semibold text-slate-900 mb-1">{t('onboard.seeInAction')}</h3>
                  <p className="text-sm text-slate-500">{t('onboard.seeInActionSub')}</p>
                </button>
              </div>

              <button
                onClick={() => handleComplete('/')}
                className="w-full text-center text-sm text-slate-500 hover:text-slate-700"
              >
                {t('onboard.goDashboard')}
              </button>

              <button
                onClick={() => setStep(2)}
                className="w-full text-center text-sm text-slate-500 hover:text-slate-700"
              >
                {t('onboard.backToProfile')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
