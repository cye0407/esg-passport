import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveCompanyProfile, saveSettings } from '@/lib/store';
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
} from 'lucide-react';

const REVENUE_BANDS = [
  '<1M EUR',
  '1-10M EUR',
  '10-50M EUR',
  '50-250M EUR',
  '>250M EUR',
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [country, setCountry] = useState('');
  const [employeeCount, setEmployeeCount] = useState('');
  const [revenueBand, setRevenueBand] = useState('');

  const canProceed = () => {
    if (step === 1) return companyName.trim().length > 0 && industry && country;
    return true;
  };

  const handleComplete = (destination) => {
    saveCompanyProfile({
      legalName: companyName.trim(),
      tradingName: companyName.trim(),
      industrySector: industry,
      countryOfIncorporation: country,
      totalEmployees: employeeCount || '',
      annualRevenue: revenueBand || '',
      numberOfFacilities: '1',
    });

    saveSettings({
      setupCompleted: true,
      onboardingStep: 2,
      selectedQuestionnaires: [],
      gridCountry: EMISSION_FACTORS.electricity[country] ? country : 'EU_AVERAGE',
    });

    navigate(destination);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${step >= 1 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>1</div>
          <div className={`w-8 h-0.5 ${step >= 2 ? 'bg-indigo-600' : 'bg-slate-200'}`} />
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${step >= 2 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>2</div>
        </div>

        <div className="glass-card rounded-2xl p-8 shadow-xl">
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center space-y-3">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-800 mb-2">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Welcome to ESG Passport</h2>
                <p className="text-slate-500 max-w-md mx-auto">
                  Set up your profile to start responding to questionnaires.
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
                  <BarChart3 className="w-4 h-4" /> Industry
                </Label>
                <Select value={industry} onValueChange={setIndustry}>
                  <SelectTrigger className="h-12"><SelectValue placeholder="Select your industry" /></SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map((ind) => <SelectItem key={ind} value={ind}>{ind}</SelectItem>)}
                  </SelectContent>
                </Select>
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
                onClick={() => setStep(2)}
                disabled={!canProceed()}
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl"
              >
                Continue
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center space-y-3">
                <h2 className="text-2xl font-bold text-slate-900">Ready to go!</h2>
                <p className="text-slate-500 max-w-md mx-auto">
                  Choose how to get started. You can always switch later.
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-200 divide-y divide-slate-200">
                <div className="flex items-center justify-between p-3">
                  <span className="text-sm text-slate-500">Company</span>
                  <span className="text-sm font-medium text-slate-900">{companyName}</span>
                </div>
                <div className="flex items-center justify-between p-3">
                  <span className="text-sm text-slate-500">Industry</span>
                  <span className="text-sm font-medium text-slate-900">{industry}</span>
                </div>
                <div className="flex items-center justify-between p-3">
                  <span className="text-sm text-slate-500">Country</span>
                  <span className="text-sm font-medium text-slate-900">{COUNTRIES.find(c => c.code === country)?.name || country}</span>
                </div>
                {employeeCount && (
                  <div className="flex items-center justify-between p-3">
                    <span className="text-sm text-slate-500">Employees</span>
                    <span className="text-sm font-medium text-slate-900">{employeeCount}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => handleComplete('/data')}
                  className="h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl"
                >
                  <Database className="w-4 h-4 mr-2" />
                  Enter Data
                </Button>
                <Button
                  onClick={() => handleComplete('/respond')}
                  variant="outline"
                  className="h-12 border-slate-300 text-slate-700 hover:bg-slate-50 font-medium rounded-xl"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Questionnaire
                </Button>
              </div>

              <button
                onClick={() => setStep(1)}
                className="w-full text-center text-sm text-slate-500 hover:text-slate-700"
              >
                Back to edit
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
