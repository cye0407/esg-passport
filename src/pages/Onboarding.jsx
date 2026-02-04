import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveCompanyProfile, saveSettings } from '@/lib/store';
import { INDUSTRIES, COUNTRIES, EMISSION_FACTORS } from '@/lib/constants';
import { getIndustryMetrics } from '@/data/industry-metrics';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Leaf,
  Building2,
  Globe,
  Users,
  BarChart3,
  ClipboardList,
  Rocket,
  ArrowRight,
  ArrowLeft,
  Check,
  Lightbulb,
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

const QUESTIONNAIRE_OPTIONS = [
  { id: 'ecovadis', label: 'EcoVadis' },
  { id: 'cdp', label: 'CDP' },
  { id: 'integritynext', label: 'IntegrityNext' },
  { id: 'sedex', label: 'SEDEX' },
  { id: 'rba', label: 'RBA' },
  { id: 'basic_supplier', label: 'Basic Supplier' },
  { id: 'csrd_vsme', label: 'CSRD / VSME' },
  { id: 'custom', label: 'Custom' },
];

const DATA_SOURCE_HINTS = {
  Electricity: 'Utility bills or energy management system',
  'Natural Gas': 'Gas utility bills',
  'Vehicle Fuel': 'Fuel cards or fleet management',
  Waste: 'Waste hauler invoices',
  Water: 'Water utility bills',
  Employees: 'Payroll or HR system',
  Training: 'HR/training records',
  Accidents: 'Safety incident log',
};

// Map metric labels to hint categories
function getHintForMetric(label) {
  const lower = label.toLowerCase();
  if (lower.includes('electric')) return DATA_SOURCE_HINTS['Electricity'];
  if (lower.includes('natural gas') || lower.includes('gas')) return DATA_SOURCE_HINTS['Natural Gas'];
  if (lower.includes('fuel') || lower.includes('vehicle') || lower.includes('fleet') || lower.includes('km driven'))
    return DATA_SOURCE_HINTS['Vehicle Fuel'];
  if (lower.includes('waste')) return DATA_SOURCE_HINTS['Waste'];
  if (lower.includes('water')) return DATA_SOURCE_HINTS['Water'];
  if (lower.includes('employee') || lower.includes('worker') || lower.includes('hire') || lower.includes('departure'))
    return DATA_SOURCE_HINTS['Employees'];
  if (lower.includes('training')) return DATA_SOURCE_HINTS['Training'];
  if (lower.includes('accident') || lower.includes('injur') || lower.includes('incident') || lower.includes('safety'))
    return DATA_SOURCE_HINTS['Accidents'];
  return null;
}

// Core metrics every company should track
const CORE_METRICS = [
  { label: 'Electricity Consumption (kWh)', hint: DATA_SOURCE_HINTS['Electricity'] },
  { label: 'Natural Gas (kWh)', hint: DATA_SOURCE_HINTS['Natural Gas'] },
  { label: 'Vehicle Fuel (litres)', hint: DATA_SOURCE_HINTS['Vehicle Fuel'] },
  { label: 'Total Waste (kg)', hint: DATA_SOURCE_HINTS['Waste'] },
  { label: 'Water Consumption (m\u00B3)', hint: DATA_SOURCE_HINTS['Water'] },
  { label: 'Total Employees (FTE)', hint: DATA_SOURCE_HINTS['Employees'] },
  { label: 'Training Hours', hint: DATA_SOURCE_HINTS['Training'] },
  { label: 'Work Accidents', hint: DATA_SOURCE_HINTS['Accidents'] },
];

const STEP_COUNT = 5;

export default function Onboarding() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1
  const [companyName, setCompanyName] = useState('');

  // Step 2
  const [industry, setIndustry] = useState('');
  const [country, setCountry] = useState('');
  const [employeeCount, setEmployeeCount] = useState('');
  const [revenueBand, setRevenueBand] = useState('');

  // Step 4
  const [selectedQuestionnaires, setSelectedQuestionnaires] = useState([]);

  // Derived industry metrics for Step 3
  const industryMetrics = useMemo(() => {
    if (!industry) return [];
    return getIndustryMetrics(industry);
  }, [industry]);

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return companyName.trim().length > 0;
      case 2:
        return industry && country;
      case 3:
        return true;
      case 4:
        return true;
      case 5:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < STEP_COUNT) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    // Save company profile using canonical field names (matching Setup + dataBridge)
    saveCompanyProfile({
      legalName: companyName.trim(),
      tradingName: companyName.trim(),
      industrySector: industry,
      countryOfIncorporation: country,
      totalEmployees: employeeCount || '',
      annualRevenue: revenueBand || '',
      numberOfFacilities: '1',
    });

    // Save settings (including gridCountry for correct emission factors)
    saveSettings({
      setupCompleted: true,
      onboardingStep: 5,
      selectedQuestionnaires,
      gridCountry: EMISSION_FACTORS.electricity[country] ? country : 'EU_AVERAGE',
    });

    navigate('/');
  };

  const toggleQuestionnaire = (id) => {
    setSelectedQuestionnaires((prev) =>
      prev.includes(id) ? prev.filter((q) => q !== id) : [...prev, id]
    );
  };

  // Progress indicator
  const ProgressBar = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: STEP_COUNT }, (_, i) => {
        const step = i + 1;
        const isActive = step === currentStep;
        const isComplete = step < currentStep;
        return (
          <div key={step} className="flex items-center gap-2">
            <div
              className={`
                w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold
                transition-all duration-300
                ${isComplete
                  ? 'bg-[#2D5016] text-white'
                  : isActive
                    ? 'bg-[#2D5016] text-white ring-4 ring-[#2D5016]/20'
                    : 'bg-[#2D5016]/10 text-[#2D5016]/50'
                }
              `}
            >
              {isComplete ? <Check className="w-5 h-5" /> : step}
            </div>
            {step < STEP_COUNT && (
              <div
                className={`w-8 h-0.5 transition-colors duration-300 ${
                  isComplete ? 'bg-[#2D5016]' : 'bg-[#2D5016]/15'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );

  // Step 1 - Welcome
  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2D5016] to-[#7CB342] mb-2">
          <Leaf className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-[#2D5016]">Welcome to ESG Passport</h2>
        <p className="text-[#2D5016]/70 max-w-md mx-auto leading-relaxed">
          Your living ESG data hub. Let's set up your profile so we can help you
          respond to customer questionnaires faster.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="companyName" className="text-[#2D5016] font-medium flex items-center gap-2">
          <Building2 className="w-4 h-4" />
          Company Name
        </Label>
        <Input
          id="companyName"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Enter your company name"
          className="h-12 border-[#2D5016]/20 focus:border-[#7CB342] focus:ring-[#7CB342]"
        />
      </div>

      <Button
        onClick={handleNext}
        disabled={!canProceed()}
        className="w-full h-12 bg-gradient-to-r from-[#2D5016] to-[#3d6b1e] hover:from-[#3d6b1e] hover:to-[#4d7b2e] text-white font-medium rounded-xl shadow-lg shadow-[#2D5016]/20 transition-all duration-200"
      >
        Get Started
        <ArrowRight className="w-5 h-5 ml-2" />
      </Button>
    </div>
  );

  // Step 2 - Company Profile
  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-[#2D5016]">Company Profile</h2>
        <p className="text-[#2D5016]/70 text-sm">
          Tell us about your company so we can tailor your experience.
        </p>
      </div>

      {/* Industry */}
      <div className="space-y-2">
        <Label className="text-[#2D5016] font-medium flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          Industry
        </Label>
        <Select value={industry} onValueChange={setIndustry}>
          <SelectTrigger className="h-12 border-[#2D5016]/20 focus:border-[#7CB342] focus:ring-[#7CB342]">
            <SelectValue placeholder="Select your industry" />
          </SelectTrigger>
          <SelectContent>
            {INDUSTRIES.map((ind) => (
              <SelectItem key={ind} value={ind}>
                {ind}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Country */}
      <div className="space-y-2">
        <Label className="text-[#2D5016] font-medium flex items-center gap-2">
          <Globe className="w-4 h-4" />
          Country
        </Label>
        <Select value={country} onValueChange={setCountry}>
          <SelectTrigger className="h-12 border-[#2D5016]/20 focus:border-[#7CB342] focus:ring-[#7CB342]">
            <SelectValue placeholder="Select your country" />
          </SelectTrigger>
          <SelectContent>
            {COUNTRIES.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Employee Count */}
      <div className="space-y-2">
        <Label htmlFor="employeeCount" className="text-[#2D5016] font-medium flex items-center gap-2">
          <Users className="w-4 h-4" />
          Number of Employees
        </Label>
        <Input
          id="employeeCount"
          type="number"
          min="1"
          value={employeeCount}
          onChange={(e) => setEmployeeCount(e.target.value)}
          placeholder="e.g. 150"
          className="h-12 border-[#2D5016]/20 focus:border-[#7CB342] focus:ring-[#7CB342]"
        />
      </div>

      {/* Revenue Band */}
      <div className="space-y-2">
        <Label className="text-[#2D5016] font-medium">Annual Revenue Band</Label>
        <Select value={revenueBand} onValueChange={setRevenueBand}>
          <SelectTrigger className="h-12 border-[#2D5016]/20 focus:border-[#7CB342] focus:ring-[#7CB342]">
            <SelectValue placeholder="Select revenue band" />
          </SelectTrigger>
          <SelectContent>
            {REVENUE_BANDS.map((band) => (
              <SelectItem key={band} value={band}>
                {band}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  // Step 3 - Key Metrics
  const renderStep3 = () => {
    const additionalMetrics = industryMetrics.map((m) => ({
      label: m.label,
      hint: getHintForMetric(m.label),
    }));

    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-[#2D5016]">Your Key Metrics</h2>
          <p className="text-[#2D5016]/70 text-sm">
            These are the core data points you'll need. Here's where to find them.
          </p>
        </div>

        {/* Core metrics */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-[#2D5016]/80 uppercase tracking-wide">
            Core Metrics
          </h3>
          <div className="space-y-2">
            {CORE_METRICS.map((metric) => (
              <div
                key={metric.label}
                className="flex items-start gap-3 p-3 rounded-xl bg-[#2D5016]/5 border border-[#2D5016]/10"
              >
                <div className="w-8 h-8 rounded-lg bg-[#2D5016]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-4 h-4 text-[#2D5016]" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#2D5016]">{metric.label}</p>
                  <p className="text-xs text-[#2D5016]/60 flex items-center gap-1 mt-0.5">
                    <Lightbulb className="w-3 h-3 flex-shrink-0" />
                    {metric.hint}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Industry-specific metrics */}
        {additionalMetrics.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[#2D5016]/80 uppercase tracking-wide">
              {industry} Metrics
            </h3>
            <div className="space-y-2">
              {additionalMetrics.map((metric) => (
                <div
                  key={metric.label}
                  className="flex items-start gap-3 p-3 rounded-xl bg-[#7CB342]/10 border border-[#7CB342]/20"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#7CB342]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <BarChart3 className="w-4 h-4 text-[#2D5016]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#2D5016]">{metric.label}</p>
                    {metric.hint && (
                      <p className="text-xs text-[#2D5016]/60 flex items-center gap-1 mt-0.5">
                        <Lightbulb className="w-3 h-3 flex-shrink-0" />
                        {metric.hint}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Step 4 - Questionnaires
  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-[#2D5016]">Your Questionnaires</h2>
        <p className="text-[#2D5016]/70 text-sm">
          Which questionnaires do you typically receive? Select all that apply.
        </p>
      </div>

      <div className="space-y-3">
        {QUESTIONNAIRE_OPTIONS.map((q) => {
          const isChecked = selectedQuestionnaires.includes(q.id);
          return (
            <label
              key={q.id}
              className={`
                flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-200
                ${isChecked
                  ? 'bg-[#2D5016]/10 border-[#2D5016]/30'
                  : 'bg-white/50 border-[#2D5016]/10 hover:border-[#2D5016]/20 hover:bg-[#2D5016]/5'
                }
              `}
            >
              <Checkbox
                checked={isChecked}
                onCheckedChange={() => toggleQuestionnaire(q.id)}
                className="border-[#2D5016]/30 data-[state=checked]:bg-[#2D5016] data-[state=checked]:border-[#2D5016]"
              />
              <span className="text-sm font-medium text-[#2D5016]">{q.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );

  // Step 5 - Ready
  const renderStep5 = () => {
    const countryName = COUNTRIES.find((c) => c.code === country)?.name || country;
    return (
      <div className="space-y-6">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2D5016] to-[#7CB342] mb-2">
            <Rocket className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-[#2D5016]">You're All Set!</h2>
          <p className="text-[#2D5016]/70 max-w-md mx-auto leading-relaxed">
            Start entering data or upload a questionnaire to begin generating responses.
          </p>
        </div>

        {/* Summary */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-[#2D5016]/80 uppercase tracking-wide">
            Setup Summary
          </h3>
          <div className="rounded-xl bg-[#2D5016]/5 border border-[#2D5016]/10 divide-y divide-[#2D5016]/10">
            <div className="flex items-center justify-between p-3">
              <span className="text-sm text-[#2D5016]/70">Company</span>
              <span className="text-sm font-medium text-[#2D5016]">{companyName}</span>
            </div>
            <div className="flex items-center justify-between p-3">
              <span className="text-sm text-[#2D5016]/70">Industry</span>
              <span className="text-sm font-medium text-[#2D5016]">{industry}</span>
            </div>
            <div className="flex items-center justify-between p-3">
              <span className="text-sm text-[#2D5016]/70">Country</span>
              <span className="text-sm font-medium text-[#2D5016]">{countryName}</span>
            </div>
            {employeeCount && (
              <div className="flex items-center justify-between p-3">
                <span className="text-sm text-[#2D5016]/70">Employees</span>
                <span className="text-sm font-medium text-[#2D5016]">{employeeCount}</span>
              </div>
            )}
            {revenueBand && (
              <div className="flex items-center justify-between p-3">
                <span className="text-sm text-[#2D5016]/70">Revenue</span>
                <span className="text-sm font-medium text-[#2D5016]">{revenueBand}</span>
              </div>
            )}
            <div className="flex items-center justify-between p-3">
              <span className="text-sm text-[#2D5016]/70">Metrics</span>
              <span className="text-sm font-medium text-[#2D5016]">
                {CORE_METRICS.length + industryMetrics.length} tracked
              </span>
            </div>
            {selectedQuestionnaires.length > 0 && (
              <div className="flex items-center justify-between p-3">
                <span className="text-sm text-[#2D5016]/70">Questionnaires</span>
                <span className="text-sm font-medium text-[#2D5016]">
                  {selectedQuestionnaires.length} selected
                </span>
              </div>
            )}
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => {
              handleComplete();
              navigate('/data');
            }}
            className="h-12 bg-gradient-to-r from-[#2D5016] to-[#3d6b1e] hover:from-[#3d6b1e] hover:to-[#4d7b2e] text-white font-medium rounded-xl shadow-lg shadow-[#2D5016]/20 transition-all duration-200"
          >
            <Database className="w-4 h-4 mr-2" />
            Enter Data
          </Button>
          <Button
            onClick={() => {
              handleComplete();
              navigate('/upload');
            }}
            variant="outline"
            className="h-12 border-[#2D5016]/30 text-[#2D5016] hover:bg-[#2D5016]/5 font-medium rounded-xl transition-all duration-200"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Questionnaire
          </Button>
        </div>
      </div>
    );
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      case 5:
        return renderStep5();
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8faf5] to-[#e8f0e0] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <ProgressBar />

        {/* Card */}
        <div className="glass-card rounded-2xl p-8 shadow-xl">
          {renderCurrentStep()}

          {/* Navigation buttons (Steps 2-4) */}
          {currentStep > 1 && currentStep < 5 && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-[#2D5016]/10">
              <Button
                variant="ghost"
                onClick={handleBack}
                className="text-[#2D5016]/70 hover:text-[#2D5016] hover:bg-[#2D5016]/5"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="bg-gradient-to-r from-[#2D5016] to-[#3d6b1e] hover:from-[#3d6b1e] hover:to-[#4d7b2e] text-white font-medium rounded-xl shadow-lg shadow-[#2D5016]/20 transition-all duration-200"
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
