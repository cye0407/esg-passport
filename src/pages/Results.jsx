import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { buildCompanyData, buildCompanyProfile, getDataQualitySummary, computeYoYTrends } from '@/lib/dataBridge';
import { loadData, saveData, saveMasterAnswer, getMasterAnswers, getDocuments } from '@/lib/store';
import { computeFrameworkScores } from '@/lib/frameworkScoring';
import { generateDataChecklist } from '@/lib/dataCollectionGuide';
import {
  ArrowLeft, Download, ChevronDown, ChevronUp,
  CheckCircle2, AlertTriangle, AlertCircle, HelpCircle,
  FileSpreadsheet, BarChart3, Shield, Target,
  Loader2, RefreshCw, Globe, Ban, BookmarkPlus, BookmarkCheck,
  TrendingUp, TrendingDown, ClipboardList, Paperclip, X as XIcon, Pencil, Sparkles,
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { LANGUAGES, translateAnswer } from '@/lib/translations';
import { enhanceAnswer, enhanceBatch } from '@/lib/aiEnhancer';

// Confidence badge styles
const CONFIDENCE_STYLES = {
  high: { bg: 'bg-green-100', text: 'text-green-800', label: 'High' },
  medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Medium' },
  low: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Low' },
  none: { bg: 'bg-red-100', text: 'text-red-800', label: 'Unknown' },
};

const CONFIDENCE_ICONS = {
  high: CheckCircle2,
  medium: AlertTriangle,
  low: AlertCircle,
  none: HelpCircle,
};

const TYPE_STYLES = {
  POLICY: { bg: 'bg-blue-100', text: 'text-blue-800' },
  MEASURE: { bg: 'bg-purple-100', text: 'text-purple-800' },
  KPI: { bg: 'bg-teal-100', text: 'text-teal-800' },
};

export default function Results() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [answerDrafts, setAnswerDrafts] = useState([]);
  const [companyData, setCompanyData] = useState(null);
  const [questionnaireName, setQuestionnaireName] = useState('');
  const [framework, setFramework] = useState(null);
  const [expandedCards, setExpandedCards] = useState(new Set());
  const [filterConfidence, setFilterConfidence] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [language, setLanguage] = useState('en');
  const [naJustifications, setNaJustifications] = useState({});
  const [naEditing, setNaEditing] = useState(null);
  const [savedMasterIds, setSavedMasterIds] = useState(new Set());
  const [showChecklist, setShowChecklist] = useState(false);
  const [linkedDocs, setLinkedDocs] = useState({}); // { questionId: [docId, ...] }
  const [docPickerOpen, setDocPickerOpen] = useState(null); // questionId or null
  const [parseResult, setParseResult] = useState(null);
  const [editingAnswerId, setEditingAnswerId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [enhancingId, setEnhancingId] = useState(null); // single enhance in progress
  const [enhancingAll, setEnhancingAll] = useState(false);
  const [enhanceProgress, setEnhanceProgress] = useState({ done: 0, total: 0 });
  const [enhanceError, setEnhanceError] = useState(null);

  useEffect(() => {
    runPipeline();
  }, []);

  // Save results to localStorage for history tab
  function saveResults(drafts, name, fw, parseResult) {
    const data = loadData();
    if (!data.savedResults) data.savedResults = [];
    const total = drafts.length;
    const answered = drafts.filter(d => d.answerConfidence !== 'none').length;
    const bySource = { provided: 0, estimated: 0, unknown: 0 };
    drafts.forEach(d => { const k = d.confidenceSource || 'unknown'; bySource[k] = (bySource[k] || 0) + 1; });
    const score = total > 0 ? Math.round(((bySource.provided * 1.0 + bySource.estimated * 0.5) / total) * 100) : 0;

    // Remove duplicates (same questionnaire name re-generated)
    data.savedResults = data.savedResults.filter(r => r.name !== name);

    data.savedResults.unshift({
      id: `res_${Date.now()}`,
      name,
      framework: fw,
      questionCount: total,
      answeredCount: answered,
      score,
      createdAt: new Date().toISOString(),
      parseResult,
      answers: drafts.map(d => ({
        questionId: d.questionId, questionText: d.questionText, category: d.category,
        questionType: d.questionType, answer: d.answer, answerConfidence: d.answerConfidence,
        confidenceSource: d.confidenceSource, dataValue: d.dataValue, dataUnit: d.dataUnit,
        dataPeriod: d.dataPeriod, dataSource: d.dataSource,
        assumptions: d.assumptions, limitations: d.limitations,
        matchedKeywords: d.matchResult?.matchedKeywords,
      })),
    });

    // Keep max 20 saved results
    if (data.savedResults.length > 20) data.savedResults = data.savedResults.slice(0, 20);
    saveData(data);
  }

  async function runPipeline() {
    setLoading(true);
    setError(null);

    try {
      // Check for saved answers first (from history tab)
      const savedAnswersJson = localStorage.getItem('esg_saved_answers');
      if (savedAnswersJson) {
        const saved = JSON.parse(savedAnswersJson);
        localStorage.removeItem('esg_saved_answers');
        const name = localStorage.getItem('esg_questionnaire_name') || 'Questionnaire';
        setQuestionnaireName(name);
        // Reconstruct minimal drafts from saved data
        setAnswerDrafts(saved.map(s => ({
          ...s,
          matchResult: { matchedKeywords: s.matchedKeywords || [] },
          dataContext: { company: [], operational: [], calculated: [], metadata: { dataGaps: s.limitations || [], sitesIncluded: [] } },
          evidence: '', metricKeysUsed: [], needsReview: s.answerConfidence !== 'high',
          isEstimate: s.confidenceSource === 'estimated', hasDataGaps: (s.limitations || []).length > 0,
        })));
        setCompanyData(buildCompanyData());
        setLoading(false);
        return;
      }

      // Load parse result from sessionStorage
      const parseResultJson = localStorage.getItem('esg_parse_result');
      const name = localStorage.getItem('esg_questionnaire_name') || 'Questionnaire';
      setQuestionnaireName(name);

      if (!parseResultJson) {
        setError('No questionnaire data found. Please upload a questionnaire first.');
        setLoading(false);
        return;
      }

      const pr = JSON.parse(parseResultJson);
      setParseResult(pr);
      const questions = pr.questions;
      const fw = pr.metadata?.detectedFramework || null;
      setFramework(fw);

      // Build company data from Passport
      const cd = buildCompanyData();
      setCompanyData(cd);

      // Import engine modules
      const { matchQuestions } = await import('@/lib/respond/keywordMatcher');
      const { classifyQuestions } = await import('@/lib/respond/questionClassifier');
      const { retrieveDataForCompany } = await import('@/lib/respond/dataRetrieval');
      const { generateAnswerDrafts } = await import('@/lib/respond/answerGenerator');

      // Run the pipeline
      const matchResults = matchQuestions(questions);
      const classifications = classifyQuestions(questions);
      const dataContexts = matchResults.map(mr => retrieveDataForCompany(mr, cd));

      const config = {
        useLLM: false,
        includeMethodology: true,
        includeAssumptions: true,
        includeLimitations: true,
        verbosity: 'standard',
        aggregateSites: true,
      };

      const profile = buildCompanyProfile();
      const drafts = generateAnswerDrafts(questions, matchResults, dataContexts, config, profile, classifications);
      setAnswerDrafts(drafts);

      // Save to history
      saveResults(drafts, name, fw, pr);
    } catch (err) {
      console.error('Pipeline error:', err);
      setError(`Failed to generate answers: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  // Computed stats
  const stats = useMemo(() => {
    if (answerDrafts.length === 0) return null;
    const total = answerDrafts.length;
    const byConfidence = { high: 0, medium: 0, low: 0, none: 0 };
    const byType = { POLICY: 0, MEASURE: 0, KPI: 0 };
    const bySource = { provided: 0, estimated: 0, unknown: 0 };

    answerDrafts.forEach(d => {
      const conf = d.answerConfidence || 'none';
      byConfidence[conf] = (byConfidence[conf] || 0) + 1;
      if (d.questionType) byType[d.questionType] = (byType[d.questionType] || 0) + 1;
      const src = d.confidenceSource || 'unknown';
      bySource[src] = (bySource[src] || 0) + 1;
    });

    const withData = bySource.provided + bySource.estimated;
    const needData = bySource.unknown;
    const answered = total - (byConfidence.none || 0);
    const readinessPercent = total > 0 ? Math.round((withData / total) * 100) : 0;
    const weightedScore = total > 0 ? Math.round(
      ((bySource.provided * 1.0 + bySource.estimated * 0.5) / total) * 100
    ) : 0;

    return { total, byConfidence, byType, bySource, withData, needData, answered, readinessPercent, weightedScore };
  }, [answerDrafts]);

  const dataQuality = useMemo(() => getDataQualitySummary(), []);

  // Framework-specific scoring
  const frameworkScores = useMemo(() => {
    if (answerDrafts.length === 0) return null;
    return computeFrameworkScores(answerDrafts, framework);
  }, [answerDrafts, framework]);

  // YoY trends
  const trends = useMemo(() => computeYoYTrends(), []);

  // Data collection checklist
  const checklist = useMemo(() => {
    if (!parseResult?.questions) return [];
    return generateDataChecklist(parseResult.questions);
  }, [parseResult]);

  // Available documents for linking
  const allDocuments = useMemo(() => getDocuments(), []);

  // Filtered answers
  const filtered = useMemo(() => {
    return answerDrafts.filter(d => {
      if (filterConfidence !== 'all' && d.answerConfidence !== filterConfidence) return false;
      if (filterType !== 'all' && d.questionType !== filterType) return false;
      return true;
    });
  }, [answerDrafts, filterConfidence, filterType]);

  const toggleCard = (id) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedCards(new Set(filtered.map(d => d.questionId)));
  };

  const collapseAll = () => {
    setExpandedCards(new Set());
  };

  const toggleNA = (questionId, justification) => {
    setAnswerDrafts(prev => prev.map(d => {
      if (d.questionId !== questionId) return d;
      const isNA = d._markedNA;
      if (isNA) {
        // Restore original
        return { ...d, _markedNA: false, answer: d._originalAnswer || d.answer, answerConfidence: d._originalConfidence || d.answerConfidence };
      } else {
        // Mark as N/A
        return { ...d, _markedNA: true, _originalAnswer: d.answer, _originalConfidence: d.answerConfidence, answer: `Not applicable. ${justification || ''}`.trim(), answerConfidence: 'high' };
      }
    }));
    setNaEditing(null);
  };

  const handleSaveAsMaster = (draft) => {
    const keywords = draft.matchResult?.matchedKeywords || [];
    saveMasterAnswer({
      topic: draft.category || draft.questionText.slice(0, 60),
      questionText: draft.questionText,
      answer: draft.answer,
      confidence: draft.answerConfidence,
      keywords,
      questionType: draft.questionType,
      framework: framework || '',
    });
    setSavedMasterIds(prev => new Set([...prev, draft.questionId]));
  };

  const startEditing = (draft) => {
    setEditingAnswerId(draft.questionId);
    setEditingText(draft.answer);
  };

  const saveEdit = (questionId) => {
    setAnswerDrafts(prev => prev.map(d =>
      d.questionId === questionId ? { ...d, answer: editingText, _edited: true } : d
    ));
    setEditingAnswerId(null);
    setEditingText('');
  };

  const cancelEdit = () => {
    setEditingAnswerId(null);
    setEditingText('');
  };

  const handleEnhanceSingle = async (draft) => {
    setEnhancingId(draft.questionId);
    setEnhanceError(null);
    const result = await enhanceAnswer({
      questionText: draft.questionText,
      templateAnswer: draft.answer,
      companyName: companyData?.companyName,
      industry: companyData?.industry,
      framework,
      questionType: draft.questionType,
      confidence: draft.answerConfidence,
    });
    if (result.error) {
      setEnhanceError(result.error);
    } else {
      setAnswerDrafts(prev => prev.map(d =>
        d.questionId === draft.questionId
          ? { ...d, answer: result.enhanced, _enhanced: true, _originalTemplate: d._originalTemplate || d.answer }
          : d
      ));
    }
    setEnhancingId(null);
  };

  const handleEnhanceAll = async () => {
    const eligible = filtered.filter(d => !d._markedNA && d.answerConfidence !== 'none' && !d._enhanced);
    if (eligible.length === 0) return;
    setEnhancingAll(true);
    setEnhanceProgress({ done: 0, total: eligible.length });
    setEnhanceError(null);

    const results = await enhanceBatch(eligible, companyData, framework, (done, total) => {
      setEnhanceProgress({ done, total });
    });

    setAnswerDrafts(prev => prev.map(d => {
      const enhanced = results.get(d.questionId);
      if (enhanced && enhanced !== d.answer) {
        return { ...d, answer: enhanced, _enhanced: true, _originalTemplate: d._originalTemplate || d.answer };
      }
      return d;
    }));

    setEnhancingAll(false);
  };

  const linkDocument = (questionId, docId) => {
    setLinkedDocs(prev => {
      const existing = prev[questionId] || [];
      if (existing.includes(docId)) return prev;
      return { ...prev, [questionId]: [...existing, docId] };
    });
    setDocPickerOpen(null);
  };

  const unlinkDocument = (questionId, docId) => {
    setLinkedDocs(prev => {
      const existing = prev[questionId] || [];
      return { ...prev, [questionId]: existing.filter(id => id !== docId) };
    });
  };

  const handleExport = async () => {
    try {
      const { exportToExcel } = await import('@/lib/respond/excelExporter');
      exportToExcel({
        answerDrafts,
        companyData,
        questionnaireName,
        framework,
      });
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-12 h-12 text-[#2D5016] animate-spin mb-4" />
        <p className="text-lg font-medium text-[#2D5016]">Generating answers...</p>
        <p className="text-sm text-[#2D5016]/60 mt-1">Matching questions to your Passport data</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-lg font-medium text-[#2D5016] mb-2">Something went wrong</p>
        <p className="text-sm text-red-600 mb-6">{error}</p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => navigate('/upload')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Upload
          </Button>
          <Button onClick={runPipeline} className="bg-[#2D5016] text-white">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/upload')} className="mb-2 -ml-2 text-[#2D5016]/60">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Upload
          </Button>
          <h1 className="text-2xl font-bold text-[#2D5016]">Generated Answers</h1>
          <p className="text-[#2D5016]/60 text-sm mt-1">{questionnaireName}{framework && ` · ${framework}`}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Language selector (keyword-level only, not full translation) */}
          <div className="flex items-center gap-1 bg-[#2D5016]/5 rounded-lg p-0.5" title="Keyword translation (beta) — translates key ESG terms, not full sentences. Review output carefully.">
            <Globe className="w-4 h-4 text-[#2D5016]/40 ml-2" />
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={cn(
                  'px-2 py-1.5 rounded-md text-xs font-medium transition-all',
                  language === lang.code
                    ? 'bg-white text-[#2D5016] shadow-sm'
                    : 'text-[#2D5016]/50 hover:text-[#2D5016]/70'
                )}
                title={lang.label}
              >
                {lang.code.toUpperCase()}
              </button>
            ))}
            <span className="text-[9px] text-[#2D5016]/40 mr-1">beta</span>
          </div>
          <Button
            onClick={handleEnhanceAll}
            disabled={enhancingAll}
            variant="outline"
            className="border-purple-300 text-purple-700 hover:bg-purple-50"
          >
            {enhancingAll ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enhancing {enhanceProgress.done}/{enhanceProgress.total}</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2" /> Enhance All</>
            )}
          </Button>
          <Button onClick={handleExport} className="bg-[#2D5016] hover:bg-[#2D5016]/90 text-white">
            <Download className="w-4 h-4 mr-2" />
            Download Excel
          </Button>
        </div>
      </div>

      {/* No Data Warning */}
      {stats && stats.needData > stats.withData && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">
              {stats.withData === 0
                ? 'No company data entered yet — all answers are generic templates.'
                : `Only ${stats.withData} of ${stats.total} answers are backed by your data.`}
            </p>
            <p className="text-xs text-amber-700 mt-1">
              Go to <Link to="/data" className="underline font-medium">Data</Link> to enter your metrics. Answers will improve automatically.
            </p>
          </div>
        </div>
      )}

      {/* AI Enhancement Error */}
      {enhanceError && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-700">{enhanceError}</p>
            {enhanceError.includes('Settings') && (
              <Link to="/settings" className="text-xs text-red-600 underline mt-1 block">Open Settings</Link>
            )}
          </div>
          <button onClick={() => setEnhanceError(null)} className="text-red-400 hover:text-red-600"><XIcon className="w-4 h-4" /></button>
        </div>
      )}

      {/* Dashboard Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Readiness Score */}
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-5 h-5 text-[#2D5016]" />
              <span className="text-sm text-[#2D5016]/60">Data Coverage</span>
            </div>
            <p className={cn('text-3xl font-bold', stats.readinessPercent > 50 ? 'text-[#2D5016]' : 'text-amber-600')}>{stats.readinessPercent}%</p>
            <p className="text-xs text-[#2D5016]/50">
              {stats.withData} with data · {stats.needData} need data
            </p>
          </div>

          {/* Data Quality */}
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-green-600" />
              <span className="text-sm text-[#2D5016]/60">Passport Data</span>
            </div>
            <p className="text-3xl font-bold text-[#2D5016]">{dataQuality.safePercent}%</p>
            <p className="text-xs text-[#2D5016]/50">{dataQuality.safeToShare}/{dataQuality.total} safe to share</p>
          </div>

          {/* Confidence Breakdown */}
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-purple-600" />
              <span className="text-sm text-[#2D5016]/60">Confidence</span>
            </div>
            <div className="flex gap-1 mt-1">
              {['high', 'medium', 'low', 'none'].map(level => (
                <div
                  key={level}
                  className={cn('flex-1 h-6 rounded-sm flex items-center justify-center text-xs font-medium', CONFIDENCE_STYLES[level].bg, CONFIDENCE_STYLES[level].text)}
                  title={`${CONFIDENCE_STYLES[level].label}: ${stats.byConfidence[level]}`}
                >
                  {stats.byConfidence[level]}
                </div>
              ))}
            </div>
            <div className="flex gap-1 mt-1 text-[9px] text-[#2D5016]/40">
              <span className="flex-1 text-center">High</span>
              <span className="flex-1 text-center">Med</span>
              <span className="flex-1 text-center">Low</span>
              <span className="flex-1 text-center">None</span>
            </div>
          </div>

          {/* Question Types */}
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileSpreadsheet className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-[#2D5016]/60">Question Types</span>
            </div>
            <div className="space-y-1 mt-1">
              {['POLICY', 'MEASURE', 'KPI'].map(type => (
                <div key={type} className="flex items-center justify-between">
                  <span className={cn('text-xs px-1.5 py-0.5 rounded', TYPE_STYLES[type].bg, TYPE_STYLES[type].text)}>{type}</span>
                  <span className="text-sm font-medium text-[#2D5016]">{stats.byType[type]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Data Improvement CTA */}
      {stats && stats.byConfidence.none > 0 && (
        <div className="glass-card rounded-xl p-4 border-l-4 border-yellow-500">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-[#2D5016]">
                {stats.byConfidence.none} question{stats.byConfidence.none > 1 ? 's' : ''} couldn't be answered
              </p>
              <p className="text-sm text-[#2D5016]/60 mt-1">
                Add more data in your Passport to improve coverage.
              </p>
              <div className="flex gap-2 mt-3">
                <Link to="/data">
                  <Button variant="outline" size="sm" className="text-[#2D5016] border-[#2D5016]/20">
                    Enter Data
                  </Button>
                </Link>
                <Link to="/confidence">
                  <Button variant="outline" size="sm" className="text-[#2D5016] border-[#2D5016]/20">
                    Review Quality
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Framework Scoring Dashboard */}
      {frameworkScores && (
        <div className="glass-card rounded-xl p-4">
          <h3 className="font-semibold text-[#2D5016] mb-3 flex items-center gap-2">
            <Target className="w-5 h-5" />
            {frameworkScores.frameworkLabel} — {frameworkScores.overall}% Readiness
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {frameworkScores.themes.map(theme => {
              const colorMap = { green: 'bg-green-500', blue: 'bg-blue-500', purple: 'bg-purple-500', amber: 'bg-amber-500', red: 'bg-red-500' };
              const bgMap = { green: 'bg-green-50', blue: 'bg-blue-50', purple: 'bg-purple-50', amber: 'bg-amber-50', red: 'bg-red-50' };
              const textMap = { green: 'text-green-700', blue: 'text-blue-700', purple: 'text-purple-700', amber: 'text-amber-700', red: 'text-red-700' };
              return (
                <div key={theme.id} className={cn('rounded-lg p-3', bgMap[theme.color] || 'bg-gray-50')}>
                  <p className={cn('text-xs font-medium mb-1', textMap[theme.color] || 'text-gray-700')}>{theme.label}</p>
                  <div className="flex items-end gap-2">
                    <span className={cn('text-2xl font-bold', textMap[theme.color] || 'text-gray-700')}>{theme.score}%</span>
                    <span className="text-[10px] text-[#2D5016]/40 mb-1">{theme.total}q</span>
                  </div>
                  <div className="w-full bg-white/50 rounded-full h-1.5 mt-1.5">
                    <div className={cn('h-1.5 rounded-full transition-all', colorMap[theme.color] || 'bg-gray-400')} style={{ width: `${theme.score}%` }} />
                  </div>
                  <div className="flex gap-1 mt-1 text-[9px]">
                    <span className="text-green-600">{theme.high}H</span>
                    <span className="text-yellow-600">{theme.medium}M</span>
                    <span className="text-orange-600">{theme.low}L</span>
                    <span className="text-red-600">{theme.none}N</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* YoY Trends */}
      {trends.length > 0 && (
        <div className="glass-card rounded-xl p-4">
          <h3 className="font-semibold text-[#2D5016] mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Year-over-Year Trends
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {trends.map(trend => (
              <div key={trend.metric} className={cn('rounded-lg p-2 text-xs', trend.improved ? 'bg-green-50' : 'bg-red-50')}>
                <div className="flex items-center gap-1 mb-0.5">
                  {trend.improved ? <TrendingDown className="w-3 h-3 text-green-600" /> : <TrendingUp className="w-3 h-3 text-red-600" />}
                  <span className={cn('font-medium', trend.improved ? 'text-green-700' : 'text-red-700')}>
                    {Math.abs(trend.change)}% {trend.change < 0 ? 'decrease' : 'increase'}
                  </span>
                </div>
                <p className="text-[#2D5016]/70 capitalize">{trend.label}</p>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-[#2D5016]/40 mt-2">These trends are automatically incorporated into relevant answers.</p>
        </div>
      )}

      {/* Data Collection Checklist */}
      {checklist.length > 0 && (
        <div className="glass-card rounded-xl p-4">
          <button onClick={() => setShowChecklist(!showChecklist)} className="w-full flex items-center justify-between">
            <h3 className="font-semibold text-[#2D5016] flex items-center gap-2">
              <ClipboardList className="w-5 h-5" />
              Data Collection Guide ({checklist.length} categories)
            </h3>
            {showChecklist ? <ChevronUp className="w-4 h-4 text-[#2D5016]/30" /> : <ChevronDown className="w-4 h-4 text-[#2D5016]/30" />}
          </button>
          {showChecklist && (
            <div className="mt-3 grid sm:grid-cols-2 gap-3">
              {checklist.map(cat => (
                <div key={cat.id} className="rounded-lg bg-[#2D5016]/5 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-[#2D5016]">{cat.label}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2D5016]/10 text-[#2D5016]/50">{cat.questionCount} questions</span>
                  </div>
                  <ul className="space-y-1">
                    {cat.items.map((item, i) => (
                      <li key={i} className="text-xs text-[#2D5016]/70 flex items-start gap-1.5">
                        <span className={cn('mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0', item.priority === 1 ? 'bg-red-400' : item.priority === 2 ? 'bg-yellow-400' : 'bg-gray-300')} />
                        {item.label}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Filters + Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1">
          {['all', 'high', 'medium', 'low', 'none'].map(level => (
            <button
              key={level}
              onClick={() => setFilterConfidence(level)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                filterConfidence === level
                  ? 'bg-[#2D5016] text-white'
                  : 'bg-[#2D5016]/5 text-[#2D5016]/70 hover:bg-[#2D5016]/10'
              )}
            >
              {level === 'all' ? 'All' : CONFIDENCE_STYLES[level].label}
              {level !== 'all' && ` (${stats?.byConfidence[level] || 0})`}
            </button>
          ))}
        </div>

        <div className="flex gap-1">
          {['all', 'POLICY', 'MEASURE', 'KPI'].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                filterType === type
                  ? 'bg-[#2D5016] text-white'
                  : 'bg-[#2D5016]/5 text-[#2D5016]/70 hover:bg-[#2D5016]/10'
              )}
            >
              {type === 'all' ? 'All Types' : type}
            </button>
          ))}
        </div>

        <div className="ml-auto flex gap-2">
          <button onClick={expandAll} className="text-xs text-[#2D5016]/60 hover:text-[#2D5016]">Expand all</button>
          <span className="text-[#2D5016]/20">|</span>
          <button onClick={collapseAll} className="text-xs text-[#2D5016]/60 hover:text-[#2D5016]">Collapse all</button>
        </div>
      </div>

      {/* Answer Cards */}
      <div className="space-y-3">
        {filtered.map((draft, i) => {
          const expanded = expandedCards.has(draft.questionId);
          const ConfIcon = CONFIDENCE_ICONS[draft.answerConfidence];
          const confStyle = CONFIDENCE_STYLES[draft.answerConfidence];
          const typeStyle = draft.questionType ? TYPE_STYLES[draft.questionType] : null;

          return (
            <div key={draft.questionId} className="glass-card rounded-xl overflow-hidden">
              {/* Card Header */}
              <button
                onClick={() => toggleCard(draft.questionId)}
                className="w-full p-4 flex items-start gap-3 text-left hover:bg-[#2D5016]/5 transition-all"
              >
                <span className="text-sm text-[#2D5016]/30 font-mono mt-0.5 w-6 flex-shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#2D5016] leading-snug">
                    {draft.questionText.length > 150 && !expanded
                      ? draft.questionText.slice(0, 150) + '...'
                      : draft.questionText}
                  </p>
                  {draft.category && (
                    <p className="text-xs text-[#2D5016]/40 mt-1">{draft.category}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {typeStyle && (
                    <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium', typeStyle.bg, typeStyle.text)}>
                      {draft.questionType}
                    </span>
                  )}
                  <span className={cn('flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium', confStyle.bg, confStyle.text)}>
                    <ConfIcon className="w-3 h-3" />
                    {confStyle.label}
                  </span>
                  {expanded ? <ChevronUp className="w-4 h-4 text-[#2D5016]/30" /> : <ChevronDown className="w-4 h-4 text-[#2D5016]/30" />}
                </div>
              </button>

              {/* Card Body */}
              {expanded && (
                <div className="px-4 pb-4 border-t border-[#2D5016]/10">
                  {/* Confidence Warning for low/estimated data */}
                  {(draft.answerConfidence === 'low' || (draft.confidenceSource === 'estimated' && draft.answerConfidence !== 'high')) && (
                    <div className="mt-3 flex items-start gap-2 p-2 rounded-lg bg-amber-50 border border-amber-200">
                      <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700">
                        {draft.answerConfidence === 'low'
                          ? 'This answer uses low-confidence or estimated data. Review carefully before sharing.'
                          : 'This answer includes estimated values. Consider verifying with primary data sources.'}
                      </p>
                    </div>
                  )}

                  {/* Answer */}
                  <div className={cn(
                    'mt-3 p-3 rounded-lg',
                    draft.answerConfidence === 'none' ? 'bg-red-50 border border-red-200' : 'bg-[#2D5016]/5'
                  )}>
                    {editingAnswerId === draft.questionId ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          rows={6}
                          className="text-sm w-full"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => saveEdit(draft.questionId)} className="bg-[#2D5016] text-white text-xs">Save</Button>
                          <Button size="sm" variant="ghost" onClick={cancelEdit} className="text-xs">Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="group relative">
                        <p className="text-sm text-[#2D5016] whitespace-pre-line">{translateAnswer(draft.answer, language)}</p>
                        {draft._edited && <span className="text-[10px] text-[#2D5016]/40 italic ml-1">(edited)</span>}
                        <button
                          onClick={() => startEditing(draft)}
                          className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-[#2D5016]/10"
                          title="Edit answer"
                        >
                          <Pencil className="w-3.5 h-3.5 text-[#2D5016]/50" />
                        </button>
                      </div>
                    )}
                    {/* Inject matching trend narrative */}
                    {(() => {
                      const matchedKeywords = draft.matchResult?.matchedKeywords || [];
                      const keywordStr = matchedKeywords.join(' ').toLowerCase();
                      const relevantTrend = trends.find(t => {
                        if (keywordStr.includes('energy') && t.metric === 'electricityKwh') return true;
                        if ((keywordStr.includes('emission') || keywordStr.includes('ghg') || keywordStr.includes('carbon')) && (t.metric === 'scope1Tco2e' || t.metric === 'scope2Tco2e')) return true;
                        if (keywordStr.includes('waste') && t.metric === 'totalWasteKg') return true;
                        if (keywordStr.includes('water') && t.metric === 'waterM3') return true;
                        if (keywordStr.includes('recycl') && t.metric === 'recyclingRate') return true;
                        if ((keywordStr.includes('accident') || keywordStr.includes('safety') || keywordStr.includes('incident')) && t.metric === 'workAccidents') return true;
                        if (keywordStr.includes('training') && t.metric === 'trainingHours') return true;
                        return false;
                      });
                      if (!relevantTrend) return null;
                      return (
                        <div className={cn('mt-2 p-2 rounded text-xs flex items-start gap-1.5', relevantTrend.improved ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700')}>
                          {relevantTrend.improved ? <TrendingDown className="w-3 h-3 flex-shrink-0 mt-0.5" /> : <TrendingUp className="w-3 h-3 flex-shrink-0 mt-0.5" />}
                          <span>{relevantTrend.narrative}</span>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Data Value */}
                  {draft.dataValue && (
                    <div className="mt-2 flex gap-4 text-xs text-[#2D5016]/60">
                      <span>Value: <strong className="text-[#2D5016]">{draft.dataValue}</strong>{draft.dataUnit && ` ${draft.dataUnit}`}</span>
                      {draft.dataPeriod && <span>Period: {draft.dataPeriod}</span>}
                      {draft.dataSource && <span>Source: {draft.dataSource}</span>}
                    </div>
                  )}

                  {/* Assumptions & Limitations */}
                  {draft.assumptions?.length > 0 && (
                    <div className="mt-2 text-xs text-yellow-700 bg-yellow-50 p-2 rounded">
                      <span className="font-medium">Assumptions: </span>
                      {draft.assumptions.join('. ')}
                    </div>
                  )}
                  {draft.limitations?.length > 0 && (
                    <div className="mt-2 text-xs text-orange-700 bg-orange-50 p-2 rounded">
                      <span className="font-medium">Data gaps: </span>
                      {draft.limitations.join('. ')}
                    </div>
                  )}

                  {/* Keywords matched */}
                  {draft.matchResult?.matchedKeywords?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {draft.matchResult.matchedKeywords.map(kw => (
                        <span key={kw} className="text-[10px] px-1.5 py-0.5 rounded bg-[#2D5016]/10 text-[#2D5016]/50">{kw}</span>
                      ))}
                    </div>
                  )}

                  {/* Action buttons: N/A + Save as Master */}
                  <div className="mt-3 pt-3 border-t border-[#2D5016]/10 flex flex-wrap items-center gap-2">
                    {/* N/A toggle */}
                    {naEditing === draft.questionId ? (
                      <div className="flex-1 space-y-2">
                        <Textarea
                          value={naJustifications[draft.questionId] || ''}
                          onChange={(e) => setNaJustifications(prev => ({ ...prev, [draft.questionId]: e.target.value }))}
                          placeholder="Justification: why is this not applicable?"
                          rows={2}
                          className="text-sm"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => toggleNA(draft.questionId, naJustifications[draft.questionId])} className="bg-[#2D5016] text-white text-xs">
                            Confirm N/A
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setNaEditing(null)} className="text-xs">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => draft._markedNA ? toggleNA(draft.questionId) : setNaEditing(draft.questionId)}
                        className={cn(
                          'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border',
                          draft._markedNA
                            ? 'bg-gray-200 text-gray-700 border-gray-300'
                            : 'text-[#2D5016]/60 border-[#2D5016]/15 hover:bg-[#2D5016]/5'
                        )}
                      >
                        <Ban className="w-3 h-3" />
                        {draft._markedNA ? 'Marked N/A — Undo' : 'Mark N/A'}
                      </button>
                    )}

                    {/* Save as Master Answer */}
                    {draft.answerConfidence !== 'none' && !draft._markedNA && (
                      <button
                        onClick={() => handleSaveAsMaster(draft)}
                        disabled={savedMasterIds.has(draft.questionId)}
                        className={cn(
                          'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border',
                          savedMasterIds.has(draft.questionId)
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'text-[#2D5016]/60 border-[#2D5016]/15 hover:bg-[#2D5016]/5'
                        )}
                      >
                        {savedMasterIds.has(draft.questionId)
                          ? <><BookmarkCheck className="w-3 h-3" /> Saved</>
                          : <><BookmarkPlus className="w-3 h-3" /> Save as Master</>
                        }
                      </button>
                    )}

                    {/* Enhance with AI */}
                    {draft.answerConfidence !== 'none' && !draft._markedNA && (
                      <button
                        onClick={() => handleEnhanceSingle(draft)}
                        disabled={enhancingId === draft.questionId || draft._enhanced}
                        className={cn(
                          'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border',
                          draft._enhanced
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : enhancingId === draft.questionId
                              ? 'bg-purple-50 text-purple-500 border-purple-200'
                              : 'text-[#2D5016]/60 border-[#2D5016]/15 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200'
                        )}
                      >
                        {enhancingId === draft.questionId
                          ? <><Loader2 className="w-3 h-3 animate-spin" /> Enhancing...</>
                          : draft._enhanced
                            ? <><Sparkles className="w-3 h-3" /> Enhanced</>
                            : <><Sparkles className="w-3 h-3" /> Enhance</>
                        }
                      </button>
                    )}

                    {/* Attach Evidence Document */}
                    {allDocuments.length > 0 && (
                      <div className="relative">
                        <button
                          onClick={() => setDocPickerOpen(docPickerOpen === draft.questionId ? null : draft.questionId)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border text-[#2D5016]/60 border-[#2D5016]/15 hover:bg-[#2D5016]/5"
                        >
                          <Paperclip className="w-3 h-3" /> Attach Evidence
                        </button>
                        {docPickerOpen === draft.questionId && (
                          <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-[#2D5016]/10 z-10 max-h-48 overflow-y-auto">
                            {allDocuments.map(doc => {
                              const isLinked = (linkedDocs[draft.questionId] || []).includes(doc.id);
                              return (
                                <button
                                  key={doc.id}
                                  onClick={() => isLinked ? unlinkDocument(draft.questionId, doc.id) : linkDocument(draft.questionId, doc.id)}
                                  className={cn('w-full text-left px-3 py-2 text-xs hover:bg-[#2D5016]/5 flex items-center gap-2', isLinked && 'bg-green-50')}
                                >
                                  <CheckCircle2 className={cn('w-3 h-3 flex-shrink-0', isLinked ? 'text-green-600' : 'text-transparent')} />
                                  <span className="truncate text-[#2D5016]">{doc.name}</span>
                                  {doc.referenceNumber && <span className="text-[#2D5016]/40 flex-shrink-0">{doc.referenceNumber}</span>}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Linked Documents */}
                  {(linkedDocs[draft.questionId] || []).length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {(linkedDocs[draft.questionId] || []).map(docId => {
                        const doc = allDocuments.find(d => d.id === docId);
                        if (!doc) return null;
                        return (
                          <span key={docId} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-medium">
                            <Paperclip className="w-2.5 h-2.5" />
                            {doc.name}
                            <button onClick={() => unlinkDocument(draft.questionId, docId)} className="hover:text-red-600 ml-0.5">
                              <XIcon className="w-2.5 h-2.5" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty state for filters */}
      {filtered.length === 0 && answerDrafts.length > 0 && (
        <div className="text-center py-8 text-[#2D5016]/50">
          <p>No answers match the current filters.</p>
          <button onClick={() => { setFilterConfidence('all'); setFilterType('all'); }} className="text-[#2D5016] underline text-sm mt-2">
            Clear filters
          </button>
        </div>
      )}

      {/* Bottom Actions */}
      {answerDrafts.length > 0 && (
        <div className="glass-card rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-[#2D5016]/60">
            {stats?.answered} of {stats?.total} questions answered · Weighted score: {stats?.weightedScore}%
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate('/upload')} className="text-[#2D5016] border-[#2D5016]/20">
              Upload Another
            </Button>
            <Button onClick={handleExport} className="bg-[#2D5016] hover:bg-[#2D5016]/90 text-white">
              <Download className="w-4 h-4 mr-2" />
              Download Excel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
