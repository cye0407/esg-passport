import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { getRequests, getRequestById, loadData, saveData, saveMasterAnswer, getMasterAnswers, getDocuments } from '@/lib/store';
import { QUESTIONNAIRE_TEMPLATES, templateToParseResult } from '@/data/questionnaire-templates';
import { buildCompanyData, buildCompanyProfile, getDataQualitySummary, computeYoYTrends } from '@/lib/dataBridge';
import { computeFrameworkScores } from '@/lib/frameworkScoring';
import { generateDataChecklist } from '@/lib/dataCollectionGuide';
import { LANGUAGES, translateAnswer } from '@/lib/translations';
import { enhanceAnswer, enhanceBatch } from '@/lib/aiEnhancer';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  Upload as UploadIcon, FileSpreadsheet, FileText, X as XIcon, ArrowRight,
  AlertCircle, CheckCircle2, Loader2, ListChecks, Clock, Trash2,
  Download, ChevronDown, ChevronUp, AlertTriangle, HelpCircle,
  BarChart3, Shield, Target, RefreshCw, Globe, Ban, BookmarkPlus,
  BookmarkCheck, TrendingUp, TrendingDown, ClipboardList, Paperclip,
  Pencil, Sparkles, Check,
} from 'lucide-react';

// Lazy engine singleton — created on first use
let _engine = null;
async function getEngine() {
  if (!_engine) {
    const { createResponseEngine } = await import('response-ready');
    const { esgDomainPack } = await import('response-ready/domain-packs/esg');
    _engine = createResponseEngine(esgDomainPack);
  }
  return _engine;
}

const ACCEPTED_EXTENSIONS = ['.xlsx', '.xls', '.csv', '.pdf', '.docx'];

const CONFIDENCE_CONFIG = {
  high: { color: 'text-green-700', bg: 'bg-green-50', dot: 'bg-green-500', label: 'High' },
  medium: { color: 'text-amber-700', bg: 'bg-amber-50', dot: 'bg-amber-500', label: 'Medium' },
  low: { color: 'text-orange-700', bg: 'bg-orange-50', dot: 'bg-orange-500', label: 'Low' },
  none: { color: 'text-red-700', bg: 'bg-red-50', dot: 'bg-red-500', label: 'No data' },
};

export default function Respond() {
  const [searchParams] = useSearchParams();
  const requestId = searchParams.get('requestId');
  const linkedRequest = requestId ? getRequestById(requestId) : null;

  // Phase: 'upload' | 'generating' | 'results'
  const [phase, setPhase] = useState('upload');
  const [generatingProgress, setGeneratingProgress] = useState({ step: '', percent: 0 });

  // --- Upload State ---
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState(null);
  const [uploadTab, setUploadTab] = useState('upload'); // 'upload' | 'template' | 'history'
  const [showMapping, setShowMapping] = useState(false);
  const [columnMapping, setColumnMapping] = useState({ questionText: '', category: '', subcategory: '', referenceId: '' });
  const [mappingColumns, setMappingColumns] = useState(null);

  const requests = getRequests().filter(r => r.status !== 'closed' && r.status !== 'sent');
  const [selectedRequestId, setSelectedRequestId] = useState(requestId || '');

  const [savedResults, setSavedResults] = useState([]);
  useEffect(() => {
    const data = loadData();
    setSavedResults(data.savedResults || []);
  }, []);

  // --- Results State ---
  const [answerDrafts, setAnswerDrafts] = useState([]);
  const [companyData, setCompanyData] = useState(null);
  const [questionnaireName, setQuestionnaireName] = useState('');
  const [framework, setFramework] = useState(null);
  const [parseResult, setParseResult] = useState(null);
  const [pipelineError, setPipelineError] = useState(null);
  const [filterConfidence, setFilterConfidence] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [language, setLanguage] = useState('en');
  const [naJustifications, setNaJustifications] = useState({});
  const [naEditing, setNaEditing] = useState(null);
  const [savedMasterIds, setSavedMasterIds] = useState(new Set());
  const [linkedDocs, setLinkedDocs] = useState({});
  const [docPickerOpen, setDocPickerOpen] = useState(null);
  const [editingAnswerId, setEditingAnswerId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [enhancingId, setEnhancingId] = useState(null);
  const [enhancingAll, setEnhancingAll] = useState(false);
  const [enhanceProgress, setEnhanceProgress] = useState({ done: 0, total: 0 });
  const [enhanceError, setEnhanceError] = useState(null);
  const [showDetails, setShowDetails] = useState(new Set());
  const [savedFeedback, setSavedFeedback] = useState(null);

  const templates = Object.values(QUESTIONNAIRE_TEMPLATES);

  // ============ UPLOAD HANDLERS ============

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) validateAndSetFile(dropped);
  }, []);

  const handleFileSelect = (e) => {
    const selected = e.target.files[0];
    if (selected) validateAndSetFile(selected);
  };

  const validateAndSetFile = (f) => {
    const ext = '.' + f.name.split('.').pop().toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      setParseError(`Unsupported file type: ${ext}. We support Excel (.xlsx, .csv), PDF, and Word (.docx).`);
      return;
    }
    setFile(f);
    setParseError(null);
    setShowMapping(false);
    setMappingColumns(null);
  };

  const removeFile = () => {
    setFile(null);
    setParseError(null);
    setShowMapping(false);
    setMappingColumns(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const parseFile = async () => {
    if (!file) return;
    setParsing(true);
    setParseError(null);
    try {
      const engine = await getEngine();
      const result = showMapping && columnMapping.questionText
        ? await engine.parseWithMapping(file, columnMapping)
        : await engine.parseFile(file);

      if (result.success && result.questions.length > 0) {
        runPipeline(result, file.name);
      } else if (result.questions.length === 0) {
        setParseError('No questions found in this file. Try using the column mapping option, or export your questionnaire as .xlsx and try again.');
        setShowMapping(true);
        if (result.metadata?.availableColumns) setMappingColumns(result.metadata.availableColumns);
      } else {
        setParseError(result.errors.join('. '));
      }
    } catch (err) {
      setParseError(`We couldn't read this file. Try exporting it from Excel as .xlsx and uploading again.`);
    } finally {
      setParsing(false);
    }
  };

  const selectTemplate = (templateId) => {
    const result = templateToParseResult(templateId);
    if (result) {
      const template = QUESTIONNAIRE_TEMPLATES[templateId];
      runPipeline(result, template.name);
    }
  };

  const deleteSavedResult = (id) => {
    const data = loadData();
    data.savedResults = (data.savedResults || []).filter(r => r.id !== id);
    saveData(data);
    setSavedResults(data.savedResults);
  };

  const loadSavedResult = (saved) => {
    setQuestionnaireName(saved.name);
    setAnswerDrafts(saved.answers.map(s => ({
      ...s,
      matchResult: { matchedKeywords: s.matchedKeywords || [] },
      dataContext: { company: [], operational: [], calculated: [], metadata: { dataGaps: s.limitations || [], sitesIncluded: [] } },
      evidence: '', metricKeysUsed: [], needsReview: s.answerConfidence !== 'high',
      isEstimate: s.confidenceSource === 'estimated', hasDataGaps: (s.limitations || []).length > 0,
    })));
    setCompanyData(buildCompanyData());
    setPhase('results');
  };

  // ============ PIPELINE ============

  function saveResults(drafts, name, fw, pr) {
    const data = loadData();
    if (!data.savedResults) data.savedResults = [];
    const total = drafts.length;
    const bySource = { provided: 0, estimated: 0, unknown: 0 };
    drafts.forEach(d => { const k = d.confidenceSource || 'unknown'; bySource[k] = (bySource[k] || 0) + 1; });
    const score = total > 0 ? Math.round(((bySource.provided * 1.0 + bySource.estimated * 0.5) / total) * 100) : 0;
    const answered = drafts.filter(d => d.answerConfidence !== 'none').length;

    data.savedResults = data.savedResults.filter(r => r.name !== name);
    data.savedResults.unshift({
      id: `res_${Date.now()}`,
      name,
      framework: fw,
      questionCount: total,
      answeredCount: answered,
      score,
      createdAt: new Date().toISOString(),
      parseResult: pr,
      answers: drafts.map(d => ({
        questionId: d.questionId, questionText: d.questionText, category: d.category,
        questionType: d.questionType, answer: d.answer, answerConfidence: d.answerConfidence,
        confidenceSource: d.confidenceSource, dataValue: d.dataValue, dataUnit: d.dataUnit,
        dataPeriod: d.dataPeriod, dataSource: d.dataSource,
        assumptions: d.assumptions, limitations: d.limitations,
        matchedKeywords: d.matchResult?.matchedKeywords,
      })),
    });

    if (data.savedResults.length > 20) data.savedResults = data.savedResults.slice(0, 20);
    saveData(data);
    setSavedResults(data.savedResults);
  }

  async function runPipeline(pr, name) {
    setPhase('generating');
    setPipelineError(null);
    setQuestionnaireName(name);
    setGeneratingProgress({ step: 'Loading engine...', percent: 10 });

    try {
      setParseResult(pr);
      const questions = pr.questions;
      const fw = pr.metadata?.detectedFramework || null;
      setFramework(fw);

      setGeneratingProgress({ step: `Analysing ${questions.length} questions...`, percent: 25 });
      const cd = buildCompanyData();
      setCompanyData(cd);

      const engine = await getEngine();

      setGeneratingProgress({ step: 'Matching questions to your data...', percent: 50 });
      const matchResults = engine.matchQuestions(questions);
      const classifications = engine.classifyQuestions?.(questions) || [];
      const dataContexts = matchResults.map(mr => engine.retrieveData(mr, cd));

      setGeneratingProgress({ step: 'Generating answers...', percent: 75 });
      const config = {
        useLLM: false,
        includeMethodology: true,
        includeAssumptions: true,
        includeLimitations: true,
        verbosity: 'standard',
        aggregateSites: true,
      };

      const profile = buildCompanyProfile();
      const drafts = engine.generateDrafts(questions, matchResults, dataContexts, config, profile, classifications);
      setAnswerDrafts(drafts);

      setGeneratingProgress({ step: 'Saving results...', percent: 95 });
      saveResults(drafts, name, fw, pr);
      setPhase('results');
    } catch (err) {
      console.error('Pipeline error:', err);
      setPipelineError(`Failed to generate answers: ${err.message}`);
      setPhase('results');
    }
  }

  // ============ RESULTS HELPERS ============

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
  const trends = useMemo(() => computeYoYTrends(), []);
  const allDocuments = useMemo(() => getDocuments(), []);

  const filtered = useMemo(() => {
    return answerDrafts.filter(d => {
      if (filterConfidence !== 'all' && d.answerConfidence !== filterConfidence) return false;
      if (filterType !== 'all' && d.questionType !== filterType) return false;
      return true;
    });
  }, [answerDrafts, filterConfidence, filterType]);

  const toggleDetails = (id) => {
    setShowDetails(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleNA = (questionId, justification) => {
    setAnswerDrafts(prev => prev.map(d => {
      if (d.questionId !== questionId) return d;
      const isNA = d._markedNA;
      if (isNA) {
        return { ...d, _markedNA: false, answer: d._originalAnswer || d.answer, answerConfidence: d._originalConfidence || d.answerConfidence };
      } else {
        return { ...d, _markedNA: true, _originalAnswer: d.answer, _originalConfidence: d.answerConfidence, answer: `Not applicable. ${justification || ''}`.trim(), answerConfidence: 'high' };
      }
    }));
    setNaEditing(null);
  };

  const handleSaveAsMaster = (draft) => {
    saveMasterAnswer({
      topic: draft.category || draft.questionText.slice(0, 60),
      questionText: draft.questionText,
      answer: draft.answer,
      confidence: draft.answerConfidence,
      keywords: draft.matchResult?.matchedKeywords || [],
      questionType: draft.questionType,
      framework: framework || '',
    });
    setSavedMasterIds(prev => new Set([...prev, draft.questionId]));
    showFeedback('Saved to answer library');
  };

  const showFeedback = (msg) => {
    setSavedFeedback(msg);
    setTimeout(() => setSavedFeedback(null), 2000);
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
    showFeedback('Answer saved');
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
      const engine = await getEngine();
      engine.exportToExcel({
        answerDrafts,
        metadata: {
          companyName: companyData?.companyName || '',
          framework: framework || undefined,
          reportingPeriod: companyData?.reportingPeriod || '',
          generatedAt: new Date().toISOString(),
          packName: 'esg',
          packVersion: '1.0.0',
        },
      });
      showFeedback('Excel downloaded');
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  const resetToUpload = () => {
    setPhase('upload');
    setFile(null);
    setParseError(null);
    setShowMapping(false);
    setMappingColumns(null);
    setAnswerDrafts([]);
    setPipelineError(null);
    setShowDetails(new Set());
    setFilterConfidence('all');
    setFilterType('all');
    if (fileInputRef.current) fileInputRef.current.value = '';
    const data = loadData();
    setSavedResults(data.savedResults || []);
  };

  // ============ RENDER: GENERATING ============
  if (phase === 'generating') {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="w-full max-w-sm">
          <div className="w-16 h-16 rounded-none bg-indigo-100 flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 text-center mb-2">Generating your answers</h2>
          <p className="text-sm text-slate-500 text-center mb-6">{generatingProgress.step}</p>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${generatingProgress.percent}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 text-center mt-2">{generatingProgress.percent}%</p>
        </div>
      </div>
    );
  }

  // ============ RENDER: RESULTS ============
  if (phase === 'results') {
    if (pipelineError) {
      return (
        <div className="max-w-lg mx-auto text-center py-20">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg font-medium text-slate-900 mb-2">Something went wrong</p>
          <p className="text-sm text-red-600 mb-6">{pipelineError}</p>
          <Button variant="outline" onClick={resetToUpload}>Try Again</Button>
        </div>
      );
    }

    const activeFilterCount = (filterConfidence !== 'all' ? 1 : 0) + (filterType !== 'all' ? 1 : 0);

    return (
      <div className="space-y-0">
        {/* Feedback toast */}
        {savedFeedback && (
          <div className="fixed top-20 right-4 bg-green-100 text-green-800 px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2">
            <Check className="w-4 h-4" /> {savedFeedback}
          </div>
        )}

        {/* AI Enhancement Error */}
        {enhanceError && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 mb-4">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-700">{enhanceError}</p>
              {enhanceError.toLowerCase().includes('key') && (
                <Link to="/settings" className="text-xs text-red-600 underline mt-1 block">Configure API key in Settings</Link>
              )}
            </div>
            <button onClick={() => setEnhanceError(null)} className="text-red-400 hover:text-red-600"><XIcon className="w-4 h-4" /></button>
          </div>
        )}

        {/* ===== REPORT HEADER ===== */}
        <div className="bg-white border border-slate-200 rounded-none px-6 py-5">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Questionnaire Response Report</p>
              <h1 className="text-xl font-semibold text-slate-900">{questionnaireName}</h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                {framework && <span>{framework}</span>}
                <span>{stats?.total} questions</span>
                <span>{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={resetToUpload}>
                <UploadIcon className="w-4 h-4 mr-1.5" /> New
              </Button>
              <Button size="sm" onClick={handleExport} className="bg-slate-900 hover:bg-slate-800 text-white">
                <Download className="w-4 h-4 mr-1.5" /> Export Excel
              </Button>
            </div>
          </div>
        </div>

        {/* ===== SUMMARY BAR ===== */}
        {stats && (
          <div className="bg-slate-50 border-x border-slate-200 px-6 py-4">
            <div className="flex flex-wrap items-center gap-6">
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.answered}<span className="text-base font-normal text-slate-400">/{stats.total}</span></p>
                <p className="text-xs text-slate-500">answered</p>
              </div>
              <div className="h-8 w-px bg-slate-200" />
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.readinessPercent}%</p>
                <p className="text-xs text-slate-500">data backed</p>
              </div>
              <div className="h-8 w-px bg-slate-200" />
              <div className="flex items-center gap-2">
                {['high', 'medium', 'low', 'none'].map(level => (
                  <button
                    key={level}
                    onClick={() => setFilterConfidence(filterConfidence === level ? 'all' : level)}
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all',
                      filterConfidence === level ? 'ring-2 ring-indigo-500 ring-offset-1' : 'hover:bg-white',
                      CONFIDENCE_CONFIG[level].bg, CONFIDENCE_CONFIG[level].color
                    )}
                  >
                    <span className={cn('w-2 h-2 rounded-full', CONFIDENCE_CONFIG[level].dot)} />
                    {stats.byConfidence[level]}
                  </button>
                ))}
              </div>
              <div className="ml-auto flex items-center gap-2">
                {/* Language */}
                <div className="flex items-center gap-0.5 bg-white border border-slate-200 rounded p-0.5">
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => setLanguage(lang.code)}
                      className={cn(
                        'px-2 py-1 rounded text-xs font-medium transition-all',
                        language === lang.code ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-700'
                      )}
                    >
                      {lang.code.toUpperCase()}
                    </button>
                  ))}
                </div>
                {/* AI Enhance All */}
                <Button
                  onClick={handleEnhanceAll}
                  disabled={enhancingAll}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  {enhancingAll ? (
                    <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> {enhanceProgress.done}/{enhanceProgress.total}</>
                  ) : (
                    <><Sparkles className="w-3 h-3 mr-1.5" /> AI Enhance</>
                  )}
                </Button>
              </div>
            </div>

            {/* Active filter indicator */}
            {activeFilterCount > 0 && (
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                <span>Showing {filtered.length} of {answerDrafts.length} —</span>
                {filterConfidence !== 'all' && (
                  <span className={cn('px-2 py-0.5 rounded', CONFIDENCE_CONFIG[filterConfidence].bg, CONFIDENCE_CONFIG[filterConfidence].color)}>
                    {CONFIDENCE_CONFIG[filterConfidence].label}
                  </span>
                )}
                {filterType !== 'all' && (
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600">{filterType}</span>
                )}
                <button onClick={() => { setFilterConfidence('all'); setFilterType('all'); }} className="text-indigo-600 hover:underline ml-1">Clear</button>
              </div>
            )}

            {/* No Data Warning */}
            {stats.needData > stats.withData && (
              <div className="mt-3 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>
                  {stats.withData === 0
                    ? 'No company data entered — answers are generic templates. '
                    : `Only ${stats.withData} of ${stats.total} answers use your data. `}
                  <Link to="/data" className="underline font-medium">Enter your data</Link> to get personalized answers.
                </span>
              </div>
            )}
          </div>
        )}

        {/* ===== ANSWER TABLE ===== */}
        <div className="bg-white border border-slate-200 rounded-none overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[3rem_1fr_6rem_5rem] gap-0 px-6 py-2.5 bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-500 uppercase tracking-wider">
            <span>#</span>
            <span>Question & Answer</span>
            <span className="text-center">Confidence</span>
            <span className="text-right">Actions</span>
          </div>

          {/* Answer rows */}
          {filtered.length === 0 && answerDrafts.length > 0 && (
            <div className="text-center py-12 text-slate-500">
              <p>No answers match the current filters.</p>
              <button onClick={() => { setFilterConfidence('all'); setFilterType('all'); }} className="text-indigo-600 underline text-sm mt-2">Clear filters</button>
            </div>
          )}

          {filtered.map((draft, i) => {
            const conf = CONFIDENCE_CONFIG[draft.answerConfidence] || CONFIDENCE_CONFIG.none;
            const isExpanded = showDetails.has(draft.questionId);
            const isEditing = editingAnswerId === draft.questionId;
            const isEnhancing = enhancingId === draft.questionId;

            return (
              <div
                key={draft.questionId}
                className={cn(
                  'border-b border-slate-100 last:border-b-0',
                  draft.answerConfidence === 'none' && 'bg-red-50/30',
                  draft._markedNA && 'bg-slate-50/50',
                )}
              >
                {/* Main row */}
                <div className="grid grid-cols-[3rem_1fr_6rem_5rem] gap-0 px-6 py-4 items-start">
                  {/* Number */}
                  <span className="text-sm text-slate-400 font-mono pt-0.5">{i + 1}</span>

                  {/* Question + Answer */}
                  <div className="pr-4 min-w-0">
                    {/* Question */}
                    <p className="text-sm font-medium text-slate-900 leading-relaxed">{draft.questionText}</p>
                    {draft.category && (
                      <span className="text-[11px] text-slate-400 mt-0.5 inline-block">{draft.category}</span>
                    )}

                    {/* Answer */}
                    <div className={cn('mt-3', draft.answerConfidence === 'none' && 'opacity-60')}>
                      {isEditing ? (
                        <div className="space-y-2">
                          <Textarea value={editingText} onChange={(e) => setEditingText(e.target.value)} rows={5} className="text-sm" autoFocus />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => saveEdit(draft.questionId)} className="bg-slate-900 text-white text-xs h-7">Save</Button>
                            <Button size="sm" variant="ghost" onClick={cancelEdit} className="text-xs h-7">Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                          {translateAnswer(draft.answer, language)}
                          {draft._edited && <span className="text-[10px] text-slate-400 italic ml-1">(edited)</span>}
                          {draft._enhanced && <span className="text-[10px] text-indigo-400 italic ml-1">(AI enhanced)</span>}
                        </p>
                      )}
                    </div>

                    {/* Data backing — shown inline for items with real data */}
                    {draft.dataValue && !isExpanded && (
                      <p className="mt-1.5 text-xs text-slate-400">
                        Based on: <span className="font-medium text-slate-500">{draft.dataValue}{draft.dataUnit && ` ${draft.dataUnit}`}</span>
                        {draft.dataPeriod && ` (${draft.dataPeriod})`}
                      </p>
                    )}

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                        {draft.dataValue && (
                          <div className="flex gap-4 text-xs text-slate-500">
                            <span>Value: <strong className="text-slate-700">{draft.dataValue}</strong>{draft.dataUnit && ` ${draft.dataUnit}`}</span>
                            {draft.dataPeriod && <span>Period: {draft.dataPeriod}</span>}
                            {draft.dataSource && <span>Source: {draft.dataSource}</span>}
                          </div>
                        )}
                        {draft.assumptions?.length > 0 && (
                          <p className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded">
                            Assumptions: {draft.assumptions.join('. ')}
                          </p>
                        )}
                        {draft.limitations?.length > 0 && (
                          <p className="text-xs text-orange-700 bg-orange-50 px-2 py-1 rounded">
                            Data gaps: {draft.limitations.join('. ')}
                          </p>
                        )}
                        {draft.matchResult?.matchedKeywords?.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {draft.matchResult.matchedKeywords.map(kw => (
                              <span key={kw} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{kw}</span>
                            ))}
                          </div>
                        )}

                        {/* N/A section */}
                        {naEditing === draft.questionId ? (
                          <div className="space-y-2 pt-2">
                            <Textarea
                              value={naJustifications[draft.questionId] || ''}
                              onChange={(e) => setNaJustifications(prev => ({ ...prev, [draft.questionId]: e.target.value }))}
                              placeholder="Why is this question not applicable to your company?"
                              rows={2}
                              className="text-sm"
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => toggleNA(draft.questionId, naJustifications[draft.questionId])} className="bg-slate-900 text-white text-xs h-7">Confirm N/A</Button>
                              <Button size="sm" variant="ghost" onClick={() => setNaEditing(null)} className="text-xs h-7">Cancel</Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center gap-2 pt-2">
                            <button
                              onClick={() => draft._markedNA ? toggleNA(draft.questionId) : setNaEditing(draft.questionId)}
                              className={cn(
                                'text-xs px-2 py-1 rounded border transition-colors',
                                draft._markedNA ? 'bg-slate-200 text-slate-700 border-slate-300' : 'text-slate-500 border-slate-200 hover:bg-slate-50'
                              )}
                            >
                              <Ban className="w-3 h-3 inline mr-1" />{draft._markedNA ? 'Undo N/A' : 'Mark N/A'}
                            </button>
                            {draft.answerConfidence !== 'none' && !draft._markedNA && (
                              <button
                                onClick={() => handleSaveAsMaster(draft)}
                                disabled={savedMasterIds.has(draft.questionId)}
                                className={cn(
                                  'text-xs px-2 py-1 rounded border transition-colors',
                                  savedMasterIds.has(draft.questionId)
                                    ? 'bg-green-50 text-green-700 border-green-200'
                                    : 'text-slate-500 border-slate-200 hover:bg-slate-50'
                                )}
                              >
                                {savedMasterIds.has(draft.questionId) ? <><BookmarkCheck className="w-3 h-3 inline mr-1" /> Saved</> : <><BookmarkPlus className="w-3 h-3 inline mr-1" /> Save to library</>}
                              </button>
                            )}
                            {allDocuments.length > 0 && (
                              <div className="relative">
                                <button
                                  onClick={() => setDocPickerOpen(docPickerOpen === draft.questionId ? null : draft.questionId)}
                                  className="text-xs px-2 py-1 rounded border text-slate-500 border-slate-200 hover:bg-slate-50 transition-colors"
                                >
                                  <Paperclip className="w-3 h-3 inline mr-1" /> Evidence
                                </button>
                                {docPickerOpen === draft.questionId && (
                                  <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-slate-200 z-10 max-h-48 overflow-y-auto">
                                    {allDocuments.map(doc => {
                                      const isLinked = (linkedDocs[draft.questionId] || []).includes(doc.id);
                                      return (
                                        <button
                                          key={doc.id}
                                          onClick={() => isLinked ? unlinkDocument(draft.questionId, doc.id) : linkDocument(draft.questionId, doc.id)}
                                          className={cn('w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center gap-2', isLinked && 'bg-green-50')}
                                        >
                                          <CheckCircle2 className={cn('w-3 h-3 flex-shrink-0', isLinked ? 'text-green-600' : 'text-transparent')} />
                                          <span className="truncate text-slate-900">{doc.name}</span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {(linkedDocs[draft.questionId] || []).length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {(linkedDocs[draft.questionId] || []).map(docId => {
                              const doc = allDocuments.find(d => d.id === docId);
                              if (!doc) return null;
                              return (
                                <span key={docId} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-medium">
                                  <Paperclip className="w-2.5 h-2.5" />{doc.name}
                                  <button onClick={() => unlinkDocument(draft.questionId, docId)} className="hover:text-red-600 ml-0.5"><XIcon className="w-2.5 h-2.5" /></button>
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Confidence */}
                  <div className="flex justify-center pt-0.5">
                    <span className={cn('inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded', conf.bg, conf.color)}>
                      <span className={cn('w-1.5 h-1.5 rounded-full', conf.dot)} />
                      {conf.label}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-start justify-end gap-1 pt-0.5">
                    {!draft._markedNA && draft.answerConfidence !== 'none' && (
                      <button
                        onClick={() => handleEnhanceSingle(draft)}
                        disabled={isEnhancing || draft._enhanced}
                        className={cn(
                          'p-1.5 rounded transition-colors',
                          draft._enhanced ? 'text-indigo-400' : isEnhancing ? 'text-slate-300' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
                        )}
                        title={draft._enhanced ? 'AI enhanced' : 'Enhance with AI'}
                      >
                        {isEnhancing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      </button>
                    )}
                    <button
                      onClick={() => startEditing(draft)}
                      className="p-1.5 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                      title="Edit answer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => toggleDetails(draft.questionId)}
                      className={cn(
                        'p-1.5 rounded transition-colors',
                        isExpanded ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                      )}
                      title="Details"
                    >
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ===== BOTTOM BAR ===== */}
        {answerDrafts.length > 0 && (
          <div className="mt-6 bg-white border border-slate-200 rounded-none px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500">
              {stats?.answered} of {stats?.total} questions answered · {stats?.readinessPercent}% data backed · Score: {stats?.weightedScore}%
            </p>
            <Button onClick={handleExport} className="bg-slate-900 hover:bg-slate-800 text-white">
              <Download className="w-4 h-4 mr-2" />Export to Excel
            </Button>
          </div>
        )}
      </div>
    );
  }

  // ============ RENDER: UPLOAD ============
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Respond to Questionnaire</h1>
        <p className="text-slate-500 mt-1">Upload a file, pick a template, or revisit previous results.</p>
      </div>

      {linkedRequest && (
        <div className="bg-white border border-slate-200 rounded-none p-4 border-l-4 border-l-indigo-600">
          <p className="text-sm text-slate-500">Linked to request</p>
          <p className="font-medium text-slate-900">{linkedRequest.customerName} - {linkedRequest.platform}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-none p-1">
        {[
          { id: 'upload', label: 'Upload File', icon: UploadIcon },
          { id: 'template', label: 'Use Template', icon: ListChecks },
          { id: 'history', label: `Previous (${savedResults.length})`, icon: Clock },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setUploadTab(tab.id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
              uploadTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            )}
          >
            <tab.icon className="w-4 h-4" />{tab.label}
          </button>
        ))}
      </div>

      {/* Upload Tab */}
      {uploadTab === 'upload' && (
        <>
          <div
            className={cn(
              'bg-white border-2 border-dashed rounded-none p-8 transition-all cursor-pointer',
              dragActive ? 'border-indigo-600 bg-indigo-50' : 'border-slate-300 hover:border-slate-400',
              file && 'border-solid border-slate-200'
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => !file && fileInputRef.current?.click()}
          >
            <input ref={fileInputRef} type="file" accept={ACCEPTED_EXTENSIONS.join(',')} onChange={handleFileSelect} className="hidden" />
            {file ? (
              <div className="flex items-center gap-4">
                <FileSpreadsheet className="w-8 h-8 text-indigo-600" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">{file.name}</p>
                  <p className="text-sm text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); removeFile(); }} className="p-2 rounded-lg hover:bg-red-50 text-red-500">
                  <XIcon className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="text-center">
                <UploadIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="font-medium text-slate-900">Drop your questionnaire here</p>
                <p className="text-sm text-slate-500 mt-1">or click to browse</p>
                <p className="text-xs text-slate-400 mt-3">Excel (.xlsx, .csv), PDF, or Word (.docx)</p>
              </div>
            )}
          </div>

          {!linkedRequest && requests.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-none p-4">
              <Label className="text-sm text-slate-600 mb-2 block">Link to a customer request (optional)</Label>
              <Select value={selectedRequestId} onValueChange={setSelectedRequestId}>
                <SelectTrigger><SelectValue placeholder="Select a request..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {requests.map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.customerName} - {r.platform}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {showMapping && mappingColumns && (
            <div className="bg-white border border-slate-200 rounded-none p-4 space-y-3">
              <h3 className="font-medium text-slate-900">Column Mapping</h3>
              <p className="text-sm text-slate-500">We couldn't auto-detect the columns. Map them manually.</p>
              {['questionText', 'category', 'subcategory', 'referenceId'].map(field => (
                <div key={field}>
                  <Label className="text-sm capitalize">{field === 'questionText' ? 'Question Text *' : field}</Label>
                  <Select value={columnMapping[field]} onValueChange={(v) => setColumnMapping(prev => ({ ...prev, [field]: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select column..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">-- Skip --</SelectItem>
                      {mappingColumns.map(col => (
                        <SelectItem key={col} value={col}>{col}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          )}

          {parseError && (
            <div className="flex items-start gap-3 p-4 rounded-none bg-red-50 border border-red-200 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{parseError}</p>
            </div>
          )}

          <div className="flex gap-3">
            {file && (
              <Button onClick={parseFile} disabled={parsing} className="flex-1 bg-slate-900 hover:bg-slate-800 text-white">
                {parsing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Parsing...</>
                  : <><FileSpreadsheet className="w-4 h-4 mr-2" />{showMapping ? 'Re-parse with Mapping' : 'Generate Answers'}</>}
              </Button>
            )}
            {!showMapping && file && !parsing && (
              <Button variant="outline" onClick={() => { setShowMapping(true); if (mappingColumns) {} else parseFile(); }} className="text-slate-600 border-slate-300">Manual Mapping</Button>
            )}
          </div>
        </>
      )}

      {/* Template Tab */}
      {uploadTab === 'template' && (
        <div className="space-y-3">
          {templates.map(t => (
            <button
              key={t.id}
              onClick={() => selectTemplate(t.id)}
              className="w-full bg-white border border-slate-200 rounded-none p-4 text-left hover:border-slate-300 hover:shadow-sm transition-all group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">{t.name}</p>
                  <p className="text-sm text-slate-500 mt-1">{t.description}</p>
                  <p className="text-xs text-slate-400 mt-2">{t.questionCount} questions · {t.framework}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-1 transition-all flex-shrink-0 ml-4" />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* History Tab */}
      {uploadTab === 'history' && (
        <div className="space-y-3">
          {savedResults.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Clock className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No previous results</p>
              <p className="text-sm mt-1">Results will appear here after you generate answers.</p>
            </div>
          ) : (
            savedResults.map(saved => (
              <div key={saved.id} className="bg-white border border-slate-200 rounded-none p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => loadSavedResult(saved)}>
                  <p className="font-medium text-slate-900 truncate">{saved.name}</p>
                  <p className="text-sm text-slate-500">
                    {saved.questionCount} questions · {saved.answeredCount} answered · {saved.score}% score
                  </p>
                  <p className="text-xs text-slate-400">{new Date(saved.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => loadSavedResult(saved)} className="text-slate-600">
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteSavedResult(saved.id)} className="text-red-500 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
