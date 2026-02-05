import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Clock,
  Building2,
  MapPin,
  Database,
  FileText,
  ClipboardList,
  ArrowRight,
  ArrowLeft,
  Check,
  Zap,
  Calendar,
  BarChart3,
  Sparkles,
} from 'lucide-react';

// Quiz options
const COMPANY_SIZES = [
  { value: 'small', label: 'Less than 50 employees', modifier: 0 },
  { value: 'medium', label: '50-250 employees', modifier: 0.1 },
  { value: 'large', label: '250-1,000 employees', modifier: 0.15 },
  { value: 'enterprise', label: '1,000+ employees', modifier: 0.2 },
];

const SITE_COUNTS = [
  { value: '1', label: '1 site/facility', modifier: 0 },
  { value: '2-5', label: '2-5 sites/facilities', modifier: 0.2 },
  { value: '5+', label: '5+ sites/facilities', modifier: 0.4 },
];

const DATA_READINESS = [
  { value: 'none', label: "We don't track ESG data", modifier: 0.5 },
  { value: 'some', label: 'We have some data in spreadsheets', modifier: 0.2 },
  { value: 'organized', label: 'We have organized, current data', modifier: 0 },
];

const POLICY_READINESS = [
  { value: 'none', label: 'No formal policies', modifier: 0.3 },
  { value: 'some', label: 'Some policies exist', modifier: 0.15 },
  { value: 'comprehensive', label: 'Comprehensive policies documented', modifier: 0 },
];

const EXPERIENCE_LEVELS = [
  { value: 'first', label: 'First time', isFirstTime: true },
  { value: 'some', label: 'Done 1-2 before', isFirstTime: false },
  { value: 'experienced', label: 'Experienced (3+)', isFirstTime: false },
];

const QUESTIONNAIRES = [
  {
    value: 'ecovadis',
    label: 'EcoVadis',
    baseHoursFirst: [20, 40],
    baseHoursRepeat: [8, 15],
    breakdown: { dataGathering: 0.4, policyReview: 0.25, answerWriting: 0.35 },
  },
  {
    value: 'cdp',
    label: 'CDP',
    baseHoursFirst: [40, 80],
    baseHoursRepeat: [15, 30],
    breakdown: { dataGathering: 0.5, policyReview: 0.2, answerWriting: 0.3 },
  },
  {
    value: 'sedex',
    label: 'SEDEX',
    baseHoursFirst: [10, 20],
    baseHoursRepeat: [5, 10],
    breakdown: { dataGathering: 0.35, policyReview: 0.35, answerWriting: 0.3 },
  },
  {
    value: 'integritynext',
    label: 'IntegrityNext',
    baseHoursFirst: [8, 15],
    baseHoursRepeat: [4, 8],
    breakdown: { dataGathering: 0.35, policyReview: 0.3, answerWriting: 0.35 },
  },
  {
    value: 'custom',
    label: 'Custom/Other',
    baseHoursFirst: [5, 15],
    baseHoursRepeat: [3, 8],
    breakdown: { dataGathering: 0.4, policyReview: 0.25, answerWriting: 0.35 },
  },
];

const STEPS = [
  { id: 1, title: 'Company Size', icon: Building2 },
  { id: 2, title: 'Sites', icon: MapPin },
  { id: 3, title: 'Data Readiness', icon: Database },
  { id: 4, title: 'Policies', icon: FileText },
  { id: 5, title: 'Experience', icon: ClipboardList },
  { id: 6, title: 'Questionnaire', icon: BarChart3 },
];

export default function TimeEstimator() {
  const [currentStep, setCurrentStep] = useState(1);
  const [answers, setAnswers] = useState({
    companySize: null,
    siteCount: null,
    dataReadiness: null,
    policyReadiness: null,
    experience: null,
    questionnaire: null,
  });
  const [showResults, setShowResults] = useState(false);

  const setAnswer = (key, value) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return answers.companySize !== null;
      case 2: return answers.siteCount !== null;
      case 3: return answers.dataReadiness !== null;
      case 4: return answers.policyReadiness !== null;
      case 5: return answers.experience !== null;
      case 6: return answers.questionnaire !== null;
      default: return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 6) {
      setCurrentStep(prev => prev + 1);
    } else if (currentStep === 6 && canProceed()) {
      setShowResults(true);
    }
  };

  const handleBack = () => {
    if (showResults) {
      setShowResults(false);
    } else if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleStartOver = () => {
    setCurrentStep(1);
    setAnswers({
      companySize: null,
      siteCount: null,
      dataReadiness: null,
      policyReadiness: null,
      experience: null,
      questionnaire: null,
    });
    setShowResults(false);
  };

  // Calculate time estimate
  const estimate = useMemo(() => {
    if (!answers.questionnaire || !answers.experience) return null;

    const questionnaire = QUESTIONNAIRES.find(q => q.value === answers.questionnaire);
    const experience = EXPERIENCE_LEVELS.find(e => e.value === answers.experience);
    const companySize = COMPANY_SIZES.find(c => c.value === answers.companySize);
    const siteCount = SITE_COUNTS.find(s => s.value === answers.siteCount);
    const dataReadiness = DATA_READINESS.find(d => d.value === answers.dataReadiness);
    const policyReadiness = POLICY_READINESS.find(p => p.value === answers.policyReadiness);

    if (!questionnaire || !experience || !companySize || !siteCount || !dataReadiness || !policyReadiness) {
      return null;
    }

    // Get base hours
    const [baseMin, baseMax] = experience.isFirstTime
      ? questionnaire.baseHoursFirst
      : questionnaire.baseHoursRepeat;

    // Calculate modifiers
    const totalModifier = 1 + companySize.modifier + siteCount.modifier + dataReadiness.modifier + policyReadiness.modifier;

    // Apply modifiers
    const minHours = Math.round(baseMin * totalModifier);
    const maxHours = Math.round(baseMax * totalModifier);

    // Calculate breakdown
    const avgHours = (minHours + maxHours) / 2;
    const breakdown = {
      dataGathering: Math.round(avgHours * questionnaire.breakdown.dataGathering),
      policyReview: Math.round(avgHours * questionnaire.breakdown.policyReview),
      answerWriting: Math.round(avgHours * questionnaire.breakdown.answerWriting),
    };

    // ESG Passport savings (60-70%)
    const passportMin = Math.round(minHours * 0.3);
    const passportMax = Math.round(maxHours * 0.4);

    // Timeline suggestion
    const weeksNeeded = Math.ceil(maxHours / 10); // Assuming ~10 hours/week capacity
    const timeline = weeksNeeded <= 1
      ? 'Start 1 week before deadline'
      : `Start ${weeksNeeded} weeks before deadline`;

    return {
      minHours,
      maxHours,
      breakdown,
      passportMin,
      passportMax,
      timeline,
      questionnaireName: questionnaire.label,
    };
  }, [answers]);

  // Option card component
  const OptionCard = ({ option, selected, onSelect }) => (
    <button
      onClick={() => onSelect(option.value)}
      className={cn(
        'w-full p-4 rounded-xl border text-left transition-all duration-200',
        selected === option.value
          ? 'bg-[#2D5016]/10 border-[#2D5016]/30 ring-2 ring-[#2D5016]/20'
          : 'bg-white/50 border-[#2D5016]/10 hover:border-[#2D5016]/20 hover:bg-[#2D5016]/5'
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
          selected === option.value
            ? 'border-[#2D5016] bg-[#2D5016]'
            : 'border-[#2D5016]/30'
        )}>
          {selected === option.value && (
            <Check className="w-3 h-3 text-white" />
          )}
        </div>
        <span className={cn(
          'text-sm font-medium',
          selected === option.value ? 'text-[#2D5016]' : 'text-[#2D5016]/80'
        )}>
          {option.label}
        </span>
      </div>
    </button>
  );

  // Progress indicator
  const ProgressBar = () => (
    <div className="flex items-center justify-center gap-1 sm:gap-2 mb-8 overflow-x-auto px-2">
      {STEPS.map((step, index) => {
        const isActive = step.id === currentStep;
        const isComplete = step.id < currentStep || showResults;
        const StepIcon = step.icon;
        return (
          <div key={step.id} className="flex items-center gap-1 sm:gap-2">
            <div
              className={cn(
                'w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300',
                isComplete
                  ? 'bg-[#2D5016] text-white'
                  : isActive
                    ? 'bg-[#2D5016] text-white ring-4 ring-[#2D5016]/20'
                    : 'bg-[#2D5016]/10 text-[#2D5016]/50'
              )}
            >
              {isComplete ? (
                <Check className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <StepIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={cn(
                  'w-4 sm:w-8 h-0.5 transition-colors duration-300',
                  isComplete ? 'bg-[#2D5016]' : 'bg-[#2D5016]/15'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );

  // Render step content
  const renderStep = () => {
    const stepContent = {
      1: {
        title: 'What is your company size?',
        subtitle: 'This helps us estimate data complexity',
        options: COMPANY_SIZES,
        answerKey: 'companySize',
      },
      2: {
        title: 'How many sites or facilities?',
        subtitle: 'Multiple locations increase data gathering time',
        options: SITE_COUNTS,
        answerKey: 'siteCount',
      },
      3: {
        title: 'How ready is your ESG data?',
        subtitle: 'Data availability significantly impacts completion time',
        options: DATA_READINESS,
        answerKey: 'dataReadiness',
      },
      4: {
        title: 'What is your policy readiness?',
        subtitle: 'Documented policies speed up questionnaire responses',
        options: POLICY_READINESS,
        answerKey: 'policyReadiness',
      },
      5: {
        title: 'ESG questionnaire experience?',
        subtitle: 'Previous experience reduces response time',
        options: EXPERIENCE_LEVELS,
        answerKey: 'experience',
      },
      6: {
        title: 'Which questionnaire?',
        subtitle: 'Select the questionnaire you need to complete',
        options: QUESTIONNAIRES,
        answerKey: 'questionnaire',
      },
    };

    const step = stepContent[currentStep];
    if (!step) return null;

    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-[#2D5016]">{step.title}</h2>
          <p className="text-[#2D5016]/70 text-sm">{step.subtitle}</p>
        </div>

        <div className="space-y-3">
          {step.options.map(option => (
            <OptionCard
              key={option.value}
              option={option}
              selected={answers[step.answerKey]}
              onSelect={(value) => setAnswer(step.answerKey, value)}
            />
          ))}
        </div>
      </div>
    );
  };

  // Render results
  const renderResults = () => {
    if (!estimate) return null;

    return (
      <div className="space-y-6">
        {/* Main estimate */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2D5016] to-[#7CB342] mb-2">
            <Clock className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-[#2D5016]">
            Your {estimate.questionnaireName} Estimate
          </h2>
          <div className="flex items-center justify-center gap-2">
            <span className="text-4xl sm:text-5xl font-bold text-[#2D5016]">
              {estimate.minHours}-{estimate.maxHours}
            </span>
            <span className="text-xl text-[#2D5016]/70">hours</span>
          </div>
        </div>

        {/* Breakdown */}
        <div className="rounded-xl bg-[#2D5016]/5 border border-[#2D5016]/10 p-4 space-y-4">
          <h3 className="text-sm font-semibold text-[#2D5016]/80 uppercase tracking-wide">
            Time Breakdown
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-[#2D5016]/80">Data Gathering</span>
              </div>
              <span className="text-sm font-semibold text-[#2D5016]">
                ~{estimate.breakdown.dataGathering} hrs
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-600" />
                <span className="text-sm text-[#2D5016]/80">Policy Review</span>
              </div>
              <span className="text-sm font-semibold text-[#2D5016]">
                ~{estimate.breakdown.policyReview} hrs
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-green-600" />
                <span className="text-sm text-[#2D5016]/80">Answer Writing</span>
              </div>
              <span className="text-sm font-semibold text-[#2D5016]">
                ~{estimate.breakdown.answerWriting} hrs
              </span>
            </div>
          </div>
        </div>

        {/* Timeline suggestion */}
        <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200">
          <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-900">Timeline Suggestion</p>
            <p className="text-sm text-blue-700">{estimate.timeline}</p>
          </div>
        </div>

        {/* ESG Passport comparison */}
        <div className="rounded-xl bg-gradient-to-br from-[#2D5016] to-[#3d6b1e] p-5 text-white">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">With ESG Passport</h3>
              <p className="text-white/80 text-sm mb-3">
                Reduce your questionnaire time by 60-70%
              </p>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold">
                    {estimate.passportMin}-{estimate.passportMax}
                  </span>
                  <span className="text-sm text-white/70">hours</span>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/20 text-xs font-medium">
                  <Zap className="w-3 h-3" />
                  Save {estimate.minHours - estimate.passportMax}+ hrs
                </div>
              </div>
              <Link to="/onboarding">
                <Button className="w-full bg-white/20 hover:bg-white/30 text-white border-0">
                  Cut your questionnaire time by 70%
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleStartOver}
            className="flex-1 border-[#2D5016]/30 text-[#2D5016] hover:bg-[#2D5016]/5"
          >
            Start Over
          </Button>
          <Link to="/onboarding" className="flex-1">
            <Button className="w-full bg-gradient-to-r from-[#2D5016] to-[#3d6b1e] hover:from-[#3d6b1e] hover:to-[#4d7b2e] text-white">
              Get Started Free
            </Button>
          </Link>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8faf5] to-[#e8f0e0] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#2D5016] mb-2">
            ESG Questionnaire Time Estimator
          </h1>
          <p className="text-[#2D5016]/70 text-sm sm:text-base">
            Estimate how long it will take to complete your next ESG questionnaire
          </p>
        </div>

        {/* Progress */}
        {!showResults && <ProgressBar />}

        {/* Card */}
        <div className="glass-card rounded-2xl p-6 sm:p-8 shadow-xl">
          {showResults ? renderResults() : renderStep()}

          {/* Navigation buttons */}
          {!showResults && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-[#2D5016]/10">
              {currentStep > 1 ? (
                <Button
                  variant="ghost"
                  onClick={handleBack}
                  className="text-[#2D5016]/70 hover:text-[#2D5016] hover:bg-[#2D5016]/5"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              ) : (
                <div />
              )}
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="bg-gradient-to-r from-[#2D5016] to-[#3d6b1e] hover:from-[#3d6b1e] hover:to-[#4d7b2e] text-white font-medium rounded-xl shadow-lg shadow-[#2D5016]/20 transition-all duration-200"
              >
                {currentStep === 6 ? 'Get Estimate' : 'Continue'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-[#2D5016]/50 mt-6">
          Estimates are based on typical completion times and may vary based on specific requirements.
        </p>
      </div>
    </div>
  );
}
