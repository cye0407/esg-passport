import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  Leaf,
  ArrowRight,
  ArrowLeft,
  Award,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Lightbulb,
  RotateCcw,
  TrendingUp,
} from 'lucide-react';

const QUESTIONS = [
  // Environment (3 questions)
  {
    id: 'env_energy',
    theme: 'Environment',
    question: 'Do you track energy consumption?',
    options: [
      { value: '0', label: 'No', points: 0 },
      { value: '1', label: 'Informally', points: 1 },
      { value: '2', label: 'Formally with records', points: 2 },
    ],
    gapText: 'No formal energy consumption tracking',
    recommendation: 'Start tracking monthly electricity and fuel usage with utility bills or meter readings.',
  },
  {
    id: 'env_policy',
    theme: 'Environment',
    question: 'Do you have an environmental policy?',
    options: [
      { value: '0', label: 'No', points: 0 },
      { value: '1', label: 'Draft', points: 1 },
      { value: '2', label: 'Published', points: 2 },
    ],
    gapText: 'No environmental policy in place',
    recommendation: 'Create and publish an environmental policy covering energy, waste, and emissions commitments.',
  },
  {
    id: 'env_ghg',
    theme: 'Environment',
    question: 'Do you measure GHG emissions?',
    options: [
      { value: '0', label: 'No', points: 0 },
      { value: '1', label: 'Scope 1+2 only', points: 1 },
      { value: '2', label: 'All scopes', points: 2 },
    ],
    gapText: 'No GHG emissions measurement',
    recommendation: 'Calculate your carbon footprint starting with Scope 1 (direct) and Scope 2 (electricity) emissions.',
  },
  // Labor & Human Rights (3 questions)
  {
    id: 'labor_hs_policy',
    theme: 'Labor & Human Rights',
    question: 'Do you have a health & safety policy?',
    options: [
      { value: '0', label: 'No', points: 0 },
      { value: '1', label: 'Draft', points: 1 },
      { value: '2', label: 'Published', points: 2 },
    ],
    gapText: 'No health & safety policy',
    recommendation: 'Develop and publish a comprehensive health & safety policy aligned with ISO 45001 principles.',
  },
  {
    id: 'labor_accidents',
    theme: 'Labor & Human Rights',
    question: 'Do you track workplace accidents?',
    options: [
      { value: '0', label: 'No', points: 0 },
      { value: '1', label: 'Informally', points: 1 },
      { value: '2', label: 'Formally', points: 2 },
    ],
    gapText: 'No workplace accident tracking',
    recommendation: 'Implement a formal incident reporting system to track accidents, near-misses, and lost time injuries.',
  },
  {
    id: 'labor_training',
    theme: 'Labor & Human Rights',
    question: 'Do you provide employee training?',
    options: [
      { value: '0', label: 'No', points: 0 },
      { value: '1', label: 'Ad-hoc', points: 1 },
      { value: '2', label: 'Documented program', points: 2 },
    ],
    gapText: 'No structured employee training program',
    recommendation: 'Establish a documented training program with tracked hours covering safety, skills, and ESG awareness.',
  },
  // Ethics (2 questions)
  {
    id: 'ethics_coc',
    theme: 'Ethics',
    question: 'Do you have a code of conduct?',
    options: [
      { value: '0', label: 'No', points: 0 },
      { value: '1', label: 'Internal only', points: 1 },
      { value: '2', label: 'Published', points: 2 },
    ],
    gapText: 'No code of conduct',
    recommendation: 'Create and publish a code of conduct covering ethical business practices, anti-corruption, and compliance.',
  },
  {
    id: 'ethics_anticorruption',
    theme: 'Ethics',
    question: 'Do you have anti-corruption training?',
    options: [
      { value: '0', label: 'No', points: 0 },
      { value: '1', label: 'Some employees', points: 1 },
      { value: '2', label: 'All employees', points: 2 },
    ],
    gapText: 'No anti-corruption training',
    recommendation: 'Implement mandatory anti-corruption and ethics training for all employees, especially those in high-risk roles.',
  },
  // Sustainable Procurement (2 questions)
  {
    id: 'proc_assessment',
    theme: 'Sustainable Procurement',
    question: 'Do you assess supplier sustainability?',
    options: [
      { value: '0', label: 'No', points: 0 },
      { value: '1', label: 'Informally', points: 1 },
      { value: '2', label: 'Formal process', points: 2 },
    ],
    gapText: 'No supplier sustainability assessment',
    recommendation: 'Implement a formal supplier evaluation process including ESG criteria in procurement decisions.',
  },
  {
    id: 'proc_supplier_coc',
    theme: 'Sustainable Procurement',
    question: 'Do you have a supplier code of conduct?',
    options: [
      { value: '0', label: 'No', points: 0 },
      { value: '1', label: 'Draft', points: 1 },
      { value: '2', label: 'Published', points: 2 },
    ],
    gapText: 'No supplier code of conduct',
    recommendation: 'Create and distribute a supplier code of conduct covering environmental, labor, and ethics requirements.',
  },
];

const TOTAL_QUESTIONS = QUESTIONS.length;
const MAX_POINTS = TOTAL_QUESTIONS * 2;

const getMedalEstimate = (totalPoints) => {
  if (totalPoints >= 21) {
    return {
      medal: 'Platinum',
      range: '75+',
      color: 'bg-gradient-to-r from-slate-300 to-slate-100',
      textColor: 'text-slate-700',
      borderColor: 'border-slate-300',
      description: 'Excellent! You appear well-prepared for a top EcoVadis score.',
    };
  } else if (totalPoints >= 17) {
    return {
      medal: 'Gold',
      range: '65-74',
      color: 'bg-gradient-to-r from-yellow-400 to-yellow-200',
      textColor: 'text-yellow-800',
      borderColor: 'border-yellow-400',
      description: 'Strong foundation. A few improvements could push you to Platinum.',
    };
  } else if (totalPoints >= 12) {
    return {
      medal: 'Silver',
      range: '55-64',
      color: 'bg-gradient-to-r from-gray-300 to-gray-100',
      textColor: 'text-gray-700',
      borderColor: 'border-gray-400',
      description: 'Good progress. Focus on key gaps to reach Gold level.',
    };
  } else if (totalPoints >= 7) {
    return {
      medal: 'Bronze',
      range: '45-54',
      color: 'bg-gradient-to-r from-orange-400 to-orange-200',
      textColor: 'text-orange-800',
      borderColor: 'border-orange-400',
      description: 'Early stage maturity. Address fundamental gaps to improve your rating.',
    };
  } else {
    return {
      medal: 'No Medal',
      range: 'Below 45',
      color: 'bg-gradient-to-r from-red-200 to-red-100',
      textColor: 'text-red-800',
      borderColor: 'border-red-300',
      description: 'Significant gaps exist. Start with foundational policies and tracking systems.',
    };
  }
};

const getThemeIcon = (theme) => {
  switch (theme) {
    case 'Environment':
      return Leaf;
    case 'Labor & Human Rights':
      return CheckCircle2;
    case 'Ethics':
      return Award;
    case 'Sustainable Procurement':
      return TrendingUp;
    default:
      return Leaf;
  }
};

const getThemeColor = (theme) => {
  switch (theme) {
    case 'Environment':
      return 'from-green-500 to-green-600';
    case 'Labor & Human Rights':
      return 'from-blue-500 to-blue-600';
    case 'Ethics':
      return 'from-purple-500 to-purple-600';
    case 'Sustainable Procurement':
      return 'from-amber-500 to-amber-600';
    default:
      return 'from-gray-500 to-gray-600';
  }
};

export default function EcoVadisReadiness() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);

  const currentQ = QUESTIONS[currentQuestion];
  const isLastQuestion = currentQuestion === TOTAL_QUESTIONS - 1;
  const hasAnsweredCurrent = answers[currentQ?.id] !== undefined;

  const handleAnswer = (value) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: value,
    }));
  };

  const handleNext = () => {
    if (isLastQuestion) {
      setShowResults(true);
    } else {
      setCurrentQuestion((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  };

  const handleRestart = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setShowResults(false);
  };

  const results = useMemo(() => {
    if (!showResults) return null;

    let totalPoints = 0;
    const gaps = [];
    const themeScores = {};

    QUESTIONS.forEach((q) => {
      const answerValue = answers[q.id];
      const points = parseInt(answerValue, 10) || 0;
      totalPoints += points;

      if (!themeScores[q.theme]) {
        themeScores[q.theme] = { earned: 0, possible: 0 };
      }
      themeScores[q.theme].earned += points;
      themeScores[q.theme].possible += 2;

      if (answerValue === '0') {
        gaps.push({
          theme: q.theme,
          gapText: q.gapText,
          recommendation: q.recommendation,
        });
      }
    });

    const medalEstimate = getMedalEstimate(totalPoints);

    // Get top 3 recommendations (prioritize gaps, or give general advice)
    const topRecommendations = gaps.slice(0, 3).map((g) => g.recommendation);
    if (topRecommendations.length === 0) {
      topRecommendations.push(
        'Maintain your strong practices and consider third-party certifications.',
        'Document your processes to provide evidence during EcoVadis assessment.',
        'Set improvement targets to continuously enhance your ESG performance.'
      );
    }

    return {
      totalPoints,
      maxPoints: MAX_POINTS,
      percentage: Math.round((totalPoints / MAX_POINTS) * 100),
      medalEstimate,
      gaps,
      themeScores,
      topRecommendations,
    };
  }, [showResults, answers]);

  // Progress indicator
  const ProgressIndicator = () => (
    <div className="mb-6">
      <div className="flex items-center justify-between text-sm mb-2">
        <span className="font-medium text-[#2D5016]">
          Question {currentQuestion + 1} of {TOTAL_QUESTIONS}
        </span>
        <span className="text-[#2D5016]/60">
          {Math.round(((currentQuestion + 1) / TOTAL_QUESTIONS) * 100)}%
        </span>
      </div>
      <div className="h-2 bg-[#2D5016]/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#2D5016] to-[#7CB342] transition-all duration-300"
          style={{ width: `${((currentQuestion + 1) / TOTAL_QUESTIONS) * 100}%` }}
        />
      </div>
    </div>
  );

  // Quiz question view
  const renderQuestion = () => {
    const ThemeIcon = getThemeIcon(currentQ.theme);
    const themeGradient = getThemeColor(currentQ.theme);

    return (
      <div className="space-y-6">
        <ProgressIndicator />

        {/* Theme badge */}
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${themeGradient} flex items-center justify-center`}>
            <ThemeIcon className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-medium text-[#2D5016]/70">{currentQ.theme}</span>
        </div>

        {/* Question */}
        <h2 className="text-xl font-bold text-[#2D5016]">{currentQ.question}</h2>

        {/* Options */}
        <RadioGroup
          value={answers[currentQ.id] || ''}
          onValueChange={handleAnswer}
          className="space-y-3"
        >
          {currentQ.options.map((option) => (
            <label
              key={option.value}
              className={`
                flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                ${answers[currentQ.id] === option.value
                  ? 'bg-[#2D5016]/10 border-[#2D5016]'
                  : 'bg-white/50 border-[#2D5016]/10 hover:border-[#2D5016]/30 hover:bg-[#2D5016]/5'
                }
              `}
            >
              <RadioGroupItem
                value={option.value}
                className="border-[#2D5016]/30 text-[#2D5016]"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-[#2D5016]">{option.label}</span>
              </div>
              <span className={`
                text-xs font-semibold px-2 py-1 rounded-full
                ${option.points === 0 ? 'bg-red-100 text-red-700' :
                  option.points === 1 ? 'bg-amber-100 text-amber-700' :
                  'bg-green-100 text-green-700'}
              `}>
                {option.points} pts
              </span>
            </label>
          ))}
        </RadioGroup>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-[#2D5016]/10">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentQuestion === 0}
            className="text-[#2D5016]/70 hover:text-[#2D5016] hover:bg-[#2D5016]/5 disabled:opacity-30"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={!hasAnsweredCurrent}
            className="bg-gradient-to-r from-[#2D5016] to-[#3d6b1e] hover:from-[#3d6b1e] hover:to-[#4d7b2e] text-white font-medium rounded-xl shadow-lg shadow-[#2D5016]/20 transition-all duration-200 disabled:opacity-50"
          >
            {isLastQuestion ? 'See Results' : 'Next'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  };

  // Results view
  const renderResults = () => {
    const { totalPoints, maxPoints, percentage, medalEstimate, gaps, themeScores, topRecommendations } = results;

    return (
      <div className="space-y-8">
        {/* Medal Result */}
        <div className="text-center space-y-4">
          <div className={`
            inline-flex items-center justify-center w-24 h-24 rounded-full
            ${medalEstimate.color} border-4 ${medalEstimate.borderColor}
            shadow-lg
          `}>
            <Award className={`w-12 h-12 ${medalEstimate.textColor}`} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#2D5016]">
              Potential {medalEstimate.medal}
            </h2>
            <p className="text-[#2D5016]/60 mt-1">
              Estimated score range: {medalEstimate.range}
            </p>
          </div>
          <p className="text-[#2D5016]/80 max-w-md mx-auto">
            {medalEstimate.description}
          </p>
        </div>

        {/* Caveat */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            <strong>Note:</strong> This is an estimate based on self-assessment. Actual EcoVadis scores depend on evidence quality, implementation depth, and third-party verification.
          </p>
        </div>

        {/* Score Breakdown */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-semibold text-[#2D5016] mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Score Breakdown
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[#2D5016]/70">Total Score</span>
              <span className="text-lg font-bold text-[#2D5016]">
                {totalPoints} / {maxPoints} ({percentage}%)
              </span>
            </div>
            <div className="space-y-3">
              {Object.entries(themeScores).map(([theme, score]) => {
                const Icon = getThemeIcon(theme);
                const pct = Math.round((score.earned / score.possible) * 100);
                return (
                  <div key={theme} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-[#2D5016]/80">
                        <Icon className="w-4 h-4" />
                        {theme}
                      </span>
                      <span className="font-medium text-[#2D5016]">
                        {score.earned}/{score.possible}
                      </span>
                    </div>
                    <div className="h-2 bg-[#2D5016]/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          pct >= 75 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Gaps Identified */}
        {gaps.length > 0 && (
          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-semibold text-[#2D5016] mb-4 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              Gaps Identified ({gaps.length})
            </h3>
            <div className="space-y-2">
              {gaps.map((gap, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-100"
                >
                  <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-0.5 rounded">
                    {gap.theme}
                  </span>
                  <span className="text-sm text-red-800">{gap.gapText}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Recommendations */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-semibold text-[#2D5016] mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            Top Recommendations
          </h3>
          <div className="space-y-3">
            {topRecommendations.map((rec, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg bg-[#2D5016]/5"
              >
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#2D5016] text-white text-xs font-bold flex items-center justify-center">
                  {index + 1}
                </span>
                <span className="text-sm text-[#2D5016]/80">{rec}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="glass-card rounded-2xl p-6 bg-gradient-to-r from-[#2D5016]/5 to-[#7CB342]/10 border-[#2D5016]/20">
          <div className="text-center space-y-4">
            <Leaf className="w-10 h-10 text-[#2D5016] mx-auto" />
            <div>
              <h3 className="font-bold text-[#2D5016] text-lg">
                Prepare for EcoVadis with ESG Passport
              </h3>
              <p className="text-[#2D5016]/70 text-sm mt-1">
                Organize your ESG data, track policies, and generate questionnaire answers automatically.
              </p>
            </div>
            <Link to="/onboarding">
              <Button className="bg-gradient-to-r from-[#2D5016] to-[#3d6b1e] hover:from-[#3d6b1e] hover:to-[#4d7b2e] text-white font-medium rounded-xl shadow-lg shadow-[#2D5016]/20 transition-all duration-200">
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Restart button */}
        <div className="text-center">
          <Button
            variant="ghost"
            onClick={handleRestart}
            className="text-[#2D5016]/60 hover:text-[#2D5016] hover:bg-[#2D5016]/5"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Retake Assessment
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8faf5] to-[#e8f0e0] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#2D5016] to-[#7CB342] mb-4">
            <Award className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#2D5016]">
            EcoVadis Readiness Score
          </h1>
          <p className="text-[#2D5016]/70 mt-2 max-w-md mx-auto">
            Quick assessment to estimate your potential EcoVadis medal level and identify gaps.
          </p>
        </div>

        {/* Main Card */}
        <div className="glass-card rounded-2xl p-6 sm:p-8 shadow-xl">
          {showResults ? renderResults() : renderQuestion()}
        </div>

        {/* Footer note */}
        {!showResults && (
          <p className="text-center text-xs text-[#2D5016]/50 mt-6">
            This tool provides an estimate only. Actual EcoVadis scores may vary based on documentation and verification.
          </p>
        )}
      </div>
    </div>
  );
}
