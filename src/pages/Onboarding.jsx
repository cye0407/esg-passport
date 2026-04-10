import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveCompanyProfile, saveSettings } from '@/lib/store';
import { track, trackOnce } from '@/lib/track';
import { INDUSTRIES, COUNTRIES, EMISSION_FACTORS } from '@/lib/constants';
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
  Lock,
  Mail,
} from 'lucide-react';

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [industry, setIndustry] = useState('');
  const [customIndustry, setCustomIndustry] = useState('');
  const [country, setCountry] = useState('');
  const [employeeCount, setEmployeeCount] = useState('');

  useEffect(() => {
    trackOnce('onboarding_started');
  }, []);

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

  const valueProps = [
    { icon: Database, text: 'Track energy, water, waste, and workforce data year-round' },
    { icon: ClipboardCheck, text: 'Manage policies and compliance documents' },
    { icon: Upload, text: 'Upload questionnaires and get professional answers' },
    { icon: Globe, text: 'Export responses in multiple languages' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
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
                <h2 className="text-2xl font-bold text-slate-900">Welcome to ESG Passport</h2>
                <p className="text-slate-500 max-w-md mx-auto">
                  Track your sustainability data and respond to any ESG questionnaire — all from your browser.
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
                Everything runs in your browser. Your data never leaves your device.
              </p>

              <Button
                onClick={() => { track('onboarding_profile_started'); setStep(2); }}
                className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-none"
              >
                Get Started
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          )}

          {/* Step 2: Company Profile */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center space-y-3">
                <h2 className="text-2xl font-bold text-slate-900">Your company profile</h2>
                <p className="text-slate-500 max-w-md mx-auto">
                  This personalizes your emission calculations and answer templates.
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-900 font-medium flex items-center gap-2">
                  <Building2 className="w-4 h-4" /> Company Name
                </Label>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Enter your company name"
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-900 font-medium flex items-center gap-2">
                  <Mail className="w-4 h-4" /> Work Email
                </Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-900 font-medium flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" /> Industry
                </Label>
                <Select value={industry} onValueChange={(v) => { setIndustry(v); if (v !== 'Other') setCustomIndustry(''); }}>
                  <SelectTrigger className="h-12"><SelectValue placeholder="Select your industry" /></SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map((ind) => <SelectItem key={ind} value={ind}>{ind}</SelectItem>)}
                  </SelectContent>
                </Select>
                {industry === 'Other' && (
                  <Input
                    value={customIndustry}
                    onChange={(e) => setCustomIndustry(e.target.value)}
                    placeholder="Describe your industry, e.g. 'Digital Services'"
                    className="h-12 mt-2"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-900 font-medium flex items-center gap-2">
                    <Globe className="w-4 h-4" /> Country
                  </Label>
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger className="h-12"><SelectValue placeholder="Country" /></SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((c) => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-900 font-medium flex items-center gap-2">
                    <Users className="w-4 h-4" /> Employees
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    value={employeeCount}
                    onChange={(e) => setEmployeeCount(e.target.value)}
                    placeholder="e.g. 150"
                    className="h-12"
                  />
                </div>
              </div>

              <Button
                onClick={() => { track('onboarding_profile_completed'); setStep(3); }}
                disabled={!canProceed()}
                className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-none"
              >
                Continue
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>

              <button
                onClick={() => setStep(1)}
                className="w-full text-center text-sm text-slate-500 hover:text-slate-700"
              >
                Back
              </button>
            </div>
          )}

          {/* Step 3: Choose your path */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center space-y-3">
                <h2 className="text-2xl font-bold text-slate-900">You're all set!</h2>
                <p className="text-slate-500 max-w-md mx-auto">
                  Choose how to get started. You can always switch later.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => handleComplete('/data')}
                  className="p-6 border border-slate-200 rounded-none hover:border-slate-400 hover:bg-slate-50 transition-colors text-left"
                >
                  <Database className="w-8 h-8 text-slate-700 mb-3" />
                  <h3 className="text-base font-semibold text-slate-900 mb-1">Start Tracking Data</h3>
                  <p className="text-sm text-slate-500">Enter your first month of sustainability metrics</p>
                </button>

                <button
                  onClick={() => handleComplete('/respond')}
                  className="p-6 border border-slate-200 rounded-none hover:border-slate-400 hover:bg-slate-50 transition-colors text-left"
                >
                  <Upload className="w-8 h-8 text-slate-700 mb-3" />
                  <h3 className="text-base font-semibold text-slate-900 mb-1">See it in action</h3>
                  <p className="text-sm text-slate-500">Upload a questionnaire or try a sample</p>
                </button>
              </div>

              <button
                onClick={() => handleComplete('/')}
                className="w-full text-center text-sm text-slate-500 hover:text-slate-700"
              >
                Go to Dashboard
              </button>

              <button
                onClick={() => setStep(2)}
                className="w-full text-center text-sm text-slate-500 hover:text-slate-700"
              >
                Back to edit profile
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
