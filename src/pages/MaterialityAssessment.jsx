import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import db from '@/api/db';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ArrowLeft, 
  ArrowRight, 
  Leaf,
  Loader2,
  CheckCircle2,
  Zap,
  Trash2,
  Users,
  Globe,
  Building,
  Shield,
  Database
} from 'lucide-react';

const questions = [
  {
    id: 1,
    question: "Does your company purchase or consume significant energy (electricity, gas, fuel)?",
    icon: Zap,
    hint: "Consider your electricity bills, heating, vehicle fuel, and manufacturing processes."
  },
  {
    id: 2,
    question: "Do you generate waste that requires special handling?",
    icon: Trash2,
    hint: "This includes hazardous materials, electronic waste, or large volumes of recyclable materials."
  },
  {
    id: 3,
    question: "Do you employ 10 or more people?",
    icon: Users,
    hint: "Include full-time, part-time, and contract workers."
  },
  {
    id: 4,
    question: "Do you purchase from suppliers outside your country?",
    icon: Globe,
    hint: "Consider raw materials, components, finished goods, or services from abroad."
  },
  {
    id: 5,
    question: "Does your business have environmental impacts (emissions, pollution, resource use)?",
    icon: Leaf,
    hint: "This could include manufacturing processes, transportation, or office operations."
  },
  {
    id: 6,
    question: "Do you interact directly with local communities or consumers?",
    icon: Building,
    hint: "Consider retail operations, community engagement, or direct customer relationships."
  },
  {
    id: 7,
    question: "Do you have formal employee safety and working policies?",
    icon: Shield,
    hint: "This includes HR policies, safety procedures, or employee handbooks."
  },
  {
    id: 8,
    question: "Does your business handle personal data?",
    icon: Database,
    hint: "Customer information, employee records, or any personally identifiable information."
  }
];

const topicMappings = [
  { 
    code: 'E1', 
    name: 'Climate & Energy', 
    description: 'Managing energy consumption and greenhouse gas emissions to reduce environmental impact and operational costs.',
    triggers: [1, 5] 
  },
  { 
    code: 'E5', 
    name: 'Circular Economy & Waste', 
    description: 'Implementing waste reduction strategies and circular economy principles to minimize environmental footprint.',
    triggers: [2] 
  },
  { 
    code: 'S1', 
    name: 'Your Employees', 
    description: 'Ensuring fair working conditions, employee wellbeing, and professional development opportunities.',
    triggers: [3, 7] 
  },
  { 
    code: 'S2', 
    name: 'Supply Chain Workers', 
    description: 'Monitoring and improving working conditions throughout your supply chain.',
    triggers: [4] 
  },
  { 
    code: 'S3', 
    name: 'Communities & Consumers', 
    description: 'Managing relationships with local communities and ensuring consumer protection and satisfaction.',
    triggers: [6] 
  },
  { 
    code: 'G1', 
    name: 'Business Conduct', 
    description: 'Upholding ethical business practices, data protection, and corporate governance standards.',
    triggers: [8] 
  }
];

export default function MaterialityAssessment() {
  const navigate = useNavigate();
  const [step, setStep] = useState('welcome');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [materialTopics, setMaterialTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companyId, setCompanyId] = useState(null);
  const [existingTopics, setExistingTopics] = useState([]);

  useEffect(() => {
    loadExistingData();
  }, []);

  const loadExistingData = async () => {
    try {
      const user = await db.auth.me();
      
      if (!user?.company_id) {
        navigate('/setup');
        return;
      }

      setCompanyId(user.company_id);

      const assessments = await db.entities.MaterialityAssessment.filter({ 
        company_id: user.company_id 
      });
      
      if (assessments.length > 0) {
        const answersMap = {};
        assessments.forEach(a => {
          answersMap[a.question_number] = a.answer;
        });
        setAnswers(answersMap);
      }

      const topics = await db.entities.MaterialTopic.filter({ 
        company_id: user.company_id 
      });
      
      if (topics.length > 0) {
        setExistingTopics(topics);
        setMaterialTopics(topics.map(t => ({
          ...t,
          selected: t.is_material
        })));
        setStep('results');
      }

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (value) => {
    setAnswers({ ...answers, [currentQuestion + 1]: value });
  };

  const goNext = async () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      await calculateTopics();
    }
  };

  const goBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const calculateTopics = async () => {
    setSaving(true);
    try {
      // Save all answers
      for (const [qNum, answer] of Object.entries(answers)) {
        const existing = await db.entities.MaterialityAssessment.filter({
          company_id: companyId,
          question_number: parseInt(qNum)
        });

        if (existing.length > 0) {
          await db.entities.MaterialityAssessment.update(existing[0].id, {
            answer,
            completed_at: new Date().toISOString()
          });
        } else {
          await db.entities.MaterialityAssessment.create({
            company_id: companyId,
            question_number: parseInt(qNum),
            answer,
            completed_at: new Date().toISOString()
          });
        }
      }

      // Calculate relevant topics
      const relevantTopics = topicMappings.filter(topic => {
        return topic.triggers.some(triggerQ => answers[triggerQ] === 'yes');
      }).map(topic => ({
        code: topic.code,
        name: topic.name,
        description: topic.description,
        selected: true
      }));

      setMaterialTopics(relevantTopics);
      setStep('results');
    } catch (error) {
      console.error('Error saving assessments:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleTopic = (code) => {
    setMaterialTopics(materialTopics.map(t => 
      t.code === code ? { ...t, selected: !t.selected } : t
    ));
  };

  const saveTopics = async () => {
    setSaving(true);
    try {
      // Delete existing topics
      for (const topic of existingTopics) {
        await db.entities.MaterialTopic.delete(topic.id);
      }

      // Save selected topics
      for (const topic of materialTopics.filter(t => t.selected)) {
        await db.entities.MaterialTopic.create({
          company_id: companyId,
          topic_code: topic.code,
          topic_name: topic.name,
          description: topic.description,
          is_material: true
        });
      }

      navigate('/');
    } catch (error) {
      console.error('Error saving topics:', error);
    } finally {
      setSaving(false);
    }
  };

  const restartAssessment = () => {
    setAnswers({});
    setCurrentQuestion(0);
    setMaterialTopics([]);
    setStep('welcome');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse flex items-center gap-3">
          <Leaf className="w-8 h-8 text-[#2D5016]" />
          <span className="text-[#2D5016] font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Welcome Screen */}
      {step === 'welcome' && (
        <div className="glass-card rounded-2xl p-8 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#2D5016] to-[#7CB342] flex items-center justify-center mx-auto mb-6">
            <Leaf className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-[#2D5016] mb-4">
            Materiality Assessment
          </h1>
          <p className="text-lg text-[#2D5016]/70 mb-8 max-w-md mx-auto">
            Let's identify which sustainability topics are relevant for your business. This will take about 10 minutes.
          </p>
          <Button
            onClick={() => setStep('questions')}
            className="h-12 px-8 bg-gradient-to-r from-[#2D5016] to-[#3d6b1e] hover:from-[#3d6b1e] hover:to-[#4d7b2e] text-white font-medium rounded-xl shadow-lg shadow-[#2D5016]/20 transition-all duration-200"
          >
            Start Assessment
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      )}

      {/* Questions */}
      {step === 'questions' && (
        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-[#2D5016]">
                Question {currentQuestion + 1} of {questions.length}
              </span>
              <span className="text-sm text-[#2D5016]/60">
                {Math.round(((currentQuestion + 1) / questions.length) * 100)}% complete
              </span>
            </div>
            <div className="h-2 bg-[#2D5016]/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#2D5016] to-[#7CB342] transition-all duration-500"
                style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Question Card */}
          <div className="glass-card rounded-2xl p-8">
            {(() => {
              const q = questions[currentQuestion];
              const Icon = q.icon;
              return (
                <div>
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#2D5016] to-[#7CB342] flex items-center justify-center mb-6">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h2 className="text-2xl font-semibold text-[#2D5016] mb-3">
                    {q.question}
                  </h2>
                  <p className="text-[#2D5016]/60 mb-8">
                    {q.hint}
                  </p>

                  <RadioGroup
                    value={answers[currentQuestion + 1] || ''}
                    onValueChange={handleAnswer}
                    className="space-y-3"
                  >
                    {[
                      { value: 'yes', label: 'Yes' },
                      { value: 'no', label: 'No' },
                      { value: 'unsure', label: 'Unsure' }
                    ].map((option) => (
                      <Label
                        key={option.value}
                        className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          answers[currentQuestion + 1] === option.value
                            ? 'border-[#7CB342] bg-[#7CB342]/10'
                            : 'border-[#2D5016]/10 hover:border-[#2D5016]/30'
                        }`}
                      >
                        <RadioGroupItem value={option.value} className="text-[#7CB342]" />
                        <span className="text-lg text-[#2D5016]">{option.label}</span>
                      </Label>
                    ))}
                  </RadioGroup>
                </div>
              );
            })()}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={goBack}
              disabled={currentQuestion === 0}
              className="h-12 px-6 border-[#2D5016]/20 text-[#2D5016] hover:bg-[#2D5016]/10"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </Button>
            <Button
              onClick={goNext}
              disabled={!answers[currentQuestion + 1] || saving}
              className="h-12 px-6 bg-gradient-to-r from-[#2D5016] to-[#3d6b1e] hover:from-[#3d6b1e] hover:to-[#4d7b2e] text-white font-medium rounded-xl shadow-lg shadow-[#2D5016]/20 transition-all duration-200"
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : currentQuestion === questions.length - 1 ? (
                <>
                  See Results
                  <CheckCircle2 className="w-5 h-5 ml-2" />
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Results */}
      {step === 'results' && (
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-[#2D5016]">
                  Your Material Topics
                </h1>
                <p className="text-[#2D5016]/70 mt-2">
                  Based on your answers, these sustainability topics are relevant for your business.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={restartAssessment}
                className="border-[#2D5016]/20 text-[#2D5016] hover:bg-[#2D5016]/10"
              >
                Retake Assessment
              </Button>
            </div>

            {materialTopics.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-[#2D5016]/60">
                  No material topics identified based on your answers. You may want to retake the assessment.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {materialTopics.map((topic) => (
                  <div 
                    key={topic.code}
                    className={`p-6 rounded-xl border-2 transition-all ${
                      topic.selected
                        ? 'border-[#7CB342] bg-[#7CB342]/10'
                        : 'border-[#2D5016]/10 bg-white/50'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <Checkbox
                        checked={topic.selected}
                        onCheckedChange={() => toggleTopic(topic.code)}
                        className="mt-1 border-[#2D5016]/30 data-[state=checked]:bg-[#7CB342] data-[state=checked]:border-[#7CB342]"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="px-3 py-1 rounded-full bg-gradient-to-r from-[#2D5016] to-[#3d6b1e] text-white text-sm font-medium">
                            {topic.code}
                          </span>
                          <h3 className="text-lg font-semibold text-[#2D5016]">
                            {topic.name}
                          </h3>
                        </div>
                        <p className="text-[#2D5016]/70">
                          {topic.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button
              onClick={saveTopics}
              disabled={saving || materialTopics.filter(t => t.selected).length === 0}
              className="h-12 px-8 bg-gradient-to-r from-[#2D5016] to-[#3d6b1e] hover:from-[#3d6b1e] hover:to-[#4d7b2e] text-white font-medium rounded-xl shadow-lg shadow-[#2D5016]/20 transition-all duration-200"
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Save & Continue
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
