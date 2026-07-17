import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useLicense } from '@/components/LicenseContext';
import { useLanguage } from '@/components/LanguageContext';
import { getRequests, getRequestById, loadData, saveData, saveMasterAnswer, getDocuments, getDataRecords, getSettings } from '@/lib/store';
import { loadDemoData } from '@/lib/demoData';
import { QUESTIONNAIRE_TEMPLATES, templateToParseResult } from '@/data/questionnaire-templates';
import { buildCompanyData, buildCompanyProfile } from '@/lib/dataBridge';
import { LANGUAGES, localizeAnswerDrafts, translateAnswer } from '@/lib/translations';
import { enhanceAnswer, enhanceBatch } from '@/lib/aiEnhancer';
import { exportAnswersAsHtml, exportAnswersAsWord, printAnswersAsPdf } from '@/lib/respondExport';
import { track } from '@/lib/track';
import { saveAs } from 'file-saver';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  Upload as UploadIcon, FileSpreadsheet, FileText, X as XIcon, ArrowRight,
  AlertCircle, CheckCircle2, Loader2, ListChecks, Clock, Trash2,
  Download, ChevronDown, ChevronUp, AlertTriangle, HelpCircle,
  BarChart3, Shield, Target, RefreshCw, Globe, Ban, BookmarkPlus,
  BookmarkCheck, TrendingUp, TrendingDown, ClipboardList, Paperclip,
  Pencil, Sparkles, Check, Database,
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
const FREE_PREVIEW_LIMIT = 5;
const CHECKOUT_URL = 'https://catyeldi.lemonsqueezy.com/checkout/buy/d5cb1011-fdd1-4936-afe8-819f53073970';
const DATA_SECTIONS = ['energy', 'water', 'waste', 'workforce', 'healthSafety', 'training'];
const PASSPORT_DATA_KEY = 'esg_passport_data';

function hasUsableWorkspaceData() {
  const records = getDataRecords();
  return records.some(r =>
    DATA_SECTIONS.some(section => {
      const s = r[section];
      return s && Object.values(s).some(v => v !== null && v !== undefined && v !== '');
    })
  );
}

function buildExcelFileName(companyName) {
  const safeCompany = String(companyName || 'responses')
    .replace(/[^a-zA-Z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  const date = new Date().toISOString().slice(0, 10);
  return `ESG-Responses-${safeCompany || 'responses'}-${date}.xlsx`;
}

// `labelKey` is resolved with t() at render (these are module-level, so no hook here).
const CONFIDENCE_CONFIG = {
  high: { color: 'text-green-700', bg: 'bg-green-50', dot: 'bg-green-500', labelKey: 'conf.high' },
  medium: { color: 'text-amber-700', bg: 'bg-amber-50', dot: 'bg-amber-500', labelKey: 'conf.medium' },
  low: { color: 'text-orange-700', bg: 'bg-orange-50', dot: 'bg-orange-500', labelKey: 'conf.low' },
  none: { color: 'text-red-700', bg: 'bg-red-50', dot: 'bg-red-500', labelKey: 'conf.none' },
};

const SUPPORT_CONFIG = {
  supported: { color: 'text-emerald-700', bg: 'bg-emerald-50', dot: 'bg-emerald-500', labelKey: 'support.supported' },
  estimated: { color: 'text-amber-700', bg: 'bg-amber-50', dot: 'bg-amber-500', labelKey: 'support.estimated' },
  draft: { color: 'text-violet-700', bg: 'bg-violet-50', dot: 'bg-violet-500', labelKey: 'support.draft' },
};

export default function Respond({ demoOnly = false }) {
  const { isPaid } = useLicense();
  const { t, lang } = useLanguage();
  const dateLocale = lang === 'de' ? 'de-DE' : 'en-GB';
  const canRespond = isPaid && !demoOnly;
  const isDemo = !canRespond;
  const [searchParams] = useSearchParams();
  const requestId = searchParams.get('requestId');
  const linkedRequest = requestId ? getRequestById(requestId) : null;
  const devExportsEnabled = (
    searchParams.get('devexports') === '1'
    || window.localStorage.getItem('esg-passport-dev-exports') === '1'
    || window.location.hostname === 'localhost'
    || window.location.hostname === '127.0.0.1'
  );

  // Phase: 'upload' | 'generating' | 'results'
  const [phase, setPhase] = useState('upload');
  const [generatingProgress, setGeneratingProgress] = useState({ step: '', percent: 0 });

  // --- Upload State ---
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState(null);
  const [uploadTab, setUploadTab] = useState('upload'); // 'upload' | 'history' | 'readiness'
  const [showMapping, setShowMapping] = useState(false);
  const [columnMapping, setColumnMapping] = useState({ questionText: '', category: '', subcategory: '', referenceId: '' });
  const [mappingColumns, setMappingColumns] = useState(null);

  const requests = getRequests().filter(r => r.status !== 'closed' && r.status !== 'sent');
  const [selectedRequestId, setSelectedRequestId] = useState(requestId || '');

  const [savedResults, setSavedResults] = useState([]);
  const [demoLibraryUsed, setDemoLibraryUsed] = useState(false);
  const setupSkipped = getSettings()?.setupSkipped === true;
  const responseUpgradeLabel = isDemo ? t('respond.buyPassport') : t('respond.exportPassport');
  useEffect(() => {
    const data = loadData();
    setSavedResults(data.savedResults || []);
  }, []);

  // Auto-resume sample after user returns from entering data via the nudge
  useEffect(() => {
    if (sessionStorage.getItem('respond_resume_sample') !== '1') return;
    if (!hasUsableWorkspaceData()) return;
    sessionStorage.removeItem('respond_resume_sample');
    const sample = [...Object.values(QUESTIONNAIRE_TEMPLATES)].sort((a, b) => (a.questionCount || 999) - (b.questionCount || 999))[0];
    if (sample) selectTemplate(sample.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  const [language, setLanguage] = useState(() => {
    const saved = loadData()?.settings?.language;
    if (saved) return saved;
    return (navigator.language || 'en').split('-')[0];
  });
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
  const demoAutoStartedRef = useRef(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportReviewConfirmed, setExportReviewConfirmed] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState('xlsx');
  const [batchExporting, setBatchExporting] = useState(false);

  const templates = Object.values(QUESTIONNAIRE_TEMPLATES);

  useEffect(() => {
    track('respond_page_viewed');
  }, []);

  useEffect(() => {
    const data = loadData();
    saveData({
      ...data,
      settings: {
        ...(data.settings || {}),
        language,
      },
    });
  }, [language]);

  useEffect(() => {
    if (searchParams.get('devexports') === '1') {
      window.localStorage.setItem('esg-passport-dev-exports', '1');
    }
  }, [searchParams]);

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
      track('respond_upload_rejected', { ext });
      setParseError(t('respond.errUnsupported', { ext }));
      return;
    }
    track('respond_upload_started', { ext });
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
        setParseError(result.errors?.length ? result.errors.join('. ') : t('respond.errNoQuestions'));
        setShowMapping(true);
        if (result.metadata?.availableColumns) setMappingColumns(result.metadata.availableColumns);
      } else {
        setParseError(result.errors.join('. '));
      }
    } catch (error) {
      console.error('Questionnaire parse failed:', error);
      const message = error instanceof Error ? error.message : '';
      setParseError(message ? `${t('respond.errUnreadable')} ${message}` : t('respond.errUnreadable'));
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

  const runSampleTemplate = (templateId) => {
    selectTemplate(templateId);
  };

  useEffect(() => {
    if (!demoOnly || demoAutoStartedRef.current || phase !== 'upload') return;
    const sample = [...Object.values(QUESTIONNAIRE_TEMPLATES)].sort((a, b) => (a.questionCount || 999) - (b.questionCount || 999))[0];
    if (!sample) return;
    demoAutoStartedRef.current = true;
    selectTemplate(sample.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demoOnly, phase]);

  const deleteSavedResult = (id) => {
    const data = loadData();
    data.savedResults = (data.savedResults || []).filter(r => r.id !== id);
    saveData(data);
    setSavedResults(data.savedResults);
  };

  const normalizeDraft = (s) => ({
    ...s,
    matchResult: s.matchResult || { matchedKeywords: s.matchedKeywords || [] },
    dataContext: s.dataContext || { company: [], operational: [], calculated: [], metadata: { dataGaps: s.limitations || [], sitesIncluded: [] } },
    evidence: s.evidence || '',
    metricKeysUsed: s.metricKeysUsed || [],
    needsReview: s.needsReview ?? s.answerConfidence !== 'high',
    verifiedAnswer: s.verifiedAnswer ?? s.answer ?? null,
    draftAnswer: s.draftAnswer ?? (s.isDrafted ? s.answer : null),
    supportLevel: s.supportLevel || (
      s.confidenceSource === 'provided' && !s.isDrafted ? 'supported'
        : (s.confidenceSource === 'estimated' || s.isEstimate) && !s.isDrafted ? 'estimated'
          : 'draft'
    ),
    dataCoverage: s.dataCoverage || (
      s.confidenceSource === 'provided' && !s.isDrafted ? 'complete'
        : (s.confidenceSource === 'estimated' || s.isEstimate) && !s.isDrafted ? 'estimated'
          : (s.limitations?.length ? 'partial' : 'missing')
    ),
    contentMode: s.contentMode || (s.isDrafted ? 'mixed' : 'verified_only'),
    evidenceRefs: s.evidenceRefs || [],
    missingFields: s.missingFields || [],
    suggestedFieldsToTrack: s.suggestedFieldsToTrack || [],
    draftRisk: s.draftRisk || 'safe',
    draftReason: s.draftReason || [],
    consistencyFlags: s.consistencyFlags || [],
    isEstimate: s.isEstimate ?? s.confidenceSource === 'estimated',
    isDrafted: s.isDrafted ?? s.confidenceSource === 'drafted',
    hasDataGaps: s.hasDataGaps ?? (s.limitations || []).length > 0,
  });

  const loadSavedResult = (saved) => {
    setQuestionnaireName(saved.name);
    setFramework(saved.framework || null);
    setParseResult(saved.parseResult || null);
    setAnswerDrafts(saved.answers.map(normalizeDraft));
    setCompanyData(buildCompanyData());
    setDemoLibraryUsed(isDemo && getSettings()?.demoLibrarySeeded === true);
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
        verifiedAnswer: d.verifiedAnswer, draftAnswer: d.draftAnswer,
        supportLevel: d.supportLevel, dataCoverage: d.dataCoverage, contentMode: d.contentMode,
        evidenceRefs: d.evidenceRefs, missingFields: d.missingFields, suggestedFieldsToTrack: d.suggestedFieldsToTrack,
        draftRisk: d.draftRisk, draftReason: d.draftReason, consistencyFlags: d.consistencyFlags,
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
    setGeneratingProgress({ step: t('respond.progLoading'), percent: 10 });
    track('respond_generation_started', { questions: pr?.questions?.length || 0 });

    try {
      const shouldUseExampleData = isDemo && !hasUsableWorkspaceData();
      let cd;
      let profile;

      if (shouldUseExampleData) {
        const previousWorkspace = window.localStorage.getItem(PASSPORT_DATA_KEY);
        loadDemoData();
        setDemoLibraryUsed(true);
        track('respond_demo_library_loaded', { source: name });
        cd = buildCompanyData();
        profile = buildCompanyProfile();
        if (previousWorkspace === null) {
          window.localStorage.removeItem(PASSPORT_DATA_KEY);
        } else {
          window.localStorage.setItem(PASSPORT_DATA_KEY, previousWorkspace);
        }
      } else {
        setDemoLibraryUsed(isDemo && getSettings()?.demoLibrarySeeded === true);
        cd = buildCompanyData();
        profile = buildCompanyProfile();
      }

      setParseResult(pr);
      const questions = pr.questions;
      const fw = pr.metadata?.detectedFramework || null;
      setFramework(fw);

      setGeneratingProgress({ step: t('respond.progAnalysing', { count: questions.length }), percent: 25 });
      setCompanyData(cd);

      const engine = await getEngine();

      setGeneratingProgress({ step: t('respond.progMatching'), percent: 50 });
      const matchResults = engine.matchQuestions(questions);
      const classifications = engine.classifyQuestions?.(questions) || [];
      const dataContexts = matchResults.map(mr => engine.retrieveData(mr, cd));

      setGeneratingProgress({ step: t('respond.progGenerating'), percent: 75 });
      const config = {
        useLLM: false,
        includeMethodology: true,
        includeAssumptions: true,
        includeLimitations: true,
        verbosity: 'standard',
        aggregateSites: true,
        // Generate answers in the selected language at the source. The engine
        // supports en/de; anything else falls back to English generation (and
        // the translateAnswer() display layer handles remaining locales).
        language: language === 'de' ? 'de' : 'en',
      };

      const drafts = engine.generateDrafts(questions, matchResults, dataContexts, config, profile, classifications);
      const normalizedDrafts = drafts.map(normalizeDraft);

      // Preserve user-edited answers on regenerate
      setAnswerDrafts(prev => {
        if (prev.length === 0) return normalizedDrafts;
        const editedMap = new Map(prev.filter(d => d._edited).map(d => [d.questionId, d]));
        return normalizedDrafts.map(d => editedMap.has(d.questionId) ? { ...editedMap.get(d.questionId) } : d);
      });

      setGeneratingProgress({ step: t('respond.progSaving'), percent: 95 });
      // Free users get current-session preview only — no history persistence
      if (isPaid) {
        saveResults(normalizedDrafts, name, fw, pr);
      }
      track('respond_answers_generated', { count: normalizedDrafts.length, framework: fw || 'none' });
      setPhase('results');
    } catch (err) {
      console.error('Pipeline error:', err);
      track('respond_generation_failed', { error: err?.name || 'unknown' });
      setPipelineError(t('respond.errFailed', { message: err.message }));
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

    // "Supported" = non-drafted, non-insufficient, non-none answers backed by real data
    const supported = answerDrafts.filter(d => d.supportLevel === 'supported').length;
    const drafted = answerDrafts.filter(d => d.supportLevel === 'draft').length;
    const insufficient = byConfidence.none || 0;
    const withData = supported;
    const needData = drafted + insufficient;
    const answered = supported;
    const readinessPercent = total > 0 ? Math.round((supported / total) * 100) : 0;
    const weightedScore = total > 0 ? Math.round(
      ((supported * 1.0 + bySource.estimated * 0.3) / total) * 100
    ) : 0;

    return { total, byConfidence, byType, bySource, withData, needData, answered, readinessPercent, weightedScore, supported, drafted, insufficient };
  }, [answerDrafts]);

  const allDocuments = useMemo(() => getDocuments(), []);

  const filtered = useMemo(() => {
    return answerDrafts.filter(d => {
      if (filterConfidence !== 'all' && d.answerConfidence !== filterConfidence) return false;
      if (filterType !== 'all' && d.questionType !== filterType) return false;
      return true;
    });
  }, [answerDrafts, filterConfidence, filterType]);

  const getDisplayedVerified = (draft) => draft.verifiedAnswer || draft.answer || '';
  const getDisplayedDraft = (draft) => {
    if (!draft.draftAnswer) return '';
    if (draft.draftAnswer === draft.verifiedAnswer) return '';
    return draft.draftAnswer;
  };
  const getCoverageLabel = (draft) => {
    switch (draft.dataCoverage) {
      case 'complete': return t('respond.covComplete');
      case 'estimated': return t('respond.covEstimated');
      case 'partial': return t('respond.covPartial');
      case 'missing': return t('respond.covMissing');
      default:
        if (draft.supportLevel === 'estimated') return t('respond.covEstimated');
        return draft.supportLevel === 'draft' ? t('respond.covMissing') : t('respond.covComplete');
    }
  };

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
    showFeedback(t('respond.savedToLibrary'));
  };

  const showFeedback = (msg) => {
    setSavedFeedback(msg);
    setTimeout(() => setSavedFeedback(null), 2000);
  };

  const startEditing = (draft) => {
    setEditingAnswerId(draft.questionId);
    setEditingText(draft.draftAnswer || draft.answer);
  };

  const saveEdit = (questionId) => {
    setAnswerDrafts(prev => prev.map(d =>
      d.questionId === questionId ? { ...d, answer: editingText, draftAnswer: editingText, supportLevel: 'draft', contentMode: d.verifiedAnswer ? 'mixed' : 'draft_only', _edited: true } : d
    ));
    setEditingAnswerId(null);
    setEditingText('');
    showFeedback(t('respond.answerSaved'));
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
      templateAnswer: draft.draftAnswer || draft.answer,
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
          ? { ...d, answer: d.verifiedAnswer || result.enhanced, draftAnswer: result.enhanced, supportLevel: 'draft', contentMode: d.verifiedAnswer ? 'mixed' : 'draft_only', _enhanced: true, _originalTemplate: d._originalTemplate || d.draftAnswer || d.answer }
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
      if (enhanced && enhanced !== (d.draftAnswer || d.answer)) {
        return { ...d, answer: d.verifiedAnswer || enhanced, draftAnswer: enhanced, supportLevel: 'draft', contentMode: d.verifiedAnswer ? 'mixed' : 'draft_only', _enhanced: true, _originalTemplate: d._originalTemplate || d.draftAnswer || d.answer };
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

  const handleExport = () => {
    setExportReviewConfirmed(false);
    setExportFormat('xlsx');
    setShowExportDialog(true);
  };

  const getExportFormatLabel = (format) => (
    format === 'xlsx' ? 'Excel'
      : format === 'pdf' ? 'PDF'
      : format === 'doc' ? 'Word'
      : 'HTML'
  );

  const buildRepreparePayload = () => {
    if (parseResult?.questions?.length) return parseResult;
    if (answerDrafts.length === 0) return null;
    return {
      metadata: {
        detectedFramework: framework || null,
      },
      questions: answerDrafts.map((draft, index) => ({
        id: draft.questionId || `Q${index + 1}`,
        text: draft.questionText,
        category: draft.category,
        type: draft.questionType,
      })),
    };
  };

  const handleReprepare = () => {
    const repreparePayload = buildRepreparePayload();
    if (!repreparePayload?.questions?.length) {
      showFeedback(t('respond.reprepareUnavailable'));
      return;
    }
    setPipelineError(null);
    runPipeline(repreparePayload, questionnaireName);
  };

  const buildExportMetadata = (data, exportLanguage, exportFramework, creator = 'ESG Passport') => {
    const policyNames = (data?.policies || [])
      .filter(p => p.status === 'available')
      .map(p => p.name)
      .join('|');

    return {
      companyName: data?.companyName || '',
      framework: exportFramework || undefined,
      reportingPeriod: data?.reportingPeriod || '',
      generatedAt: new Date().toISOString(),
      language: exportLanguage,
      packName: 'esg',
      packVersion: '1.0.0',
      creator,
      extra: {
        industry: data?.industry,
        country: data?.country,
        employeeCount: data?.employeeCount,
        numberOfSites: data?.numberOfSites,
        revenueBand: data?.revenueBand,
        electricityKwh: data?.electricityKwh,
        renewablePercent: data?.renewablePercent,
        naturalGasM3: data?.naturalGasM3,
        dieselLiters: data?.dieselLiters,
        scope1Tco2e: data?.scope1Tco2e,
        scope2Tco2e: data?.scope2Tco2e,
        scope3Tco2e: data?.scope3Tco2e,
        waterM3: data?.waterM3,
        totalWasteKg: data?.totalWasteKg,
        recyclingPercent: data?.recyclingPercent,
        hazardousWasteKg: data?.hazardousWasteKg,
        femalePercent: data?.femalePercent,
        trainingHoursPerEmployee: data?.trainingHoursPerEmployee,
        trirRate: data?.trirRate,
        certifications: data?.certifications,
        policyNames,
      },
    };
  };

  const exportWorkbook = async ({ drafts, metadata, fileName }) => {
    const engine = await getEngine();
    const localizedDrafts = localizeAnswerDrafts(drafts, metadata.language);
    const buffer = await engine.exportToBuffer({ answerDrafts: localizedDrafts, metadata });
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    saveAs(blob, fileName);
  };

  const confirmExport = async () => {
    setExporting(true);
    try {
      const exportMetadata = buildExportMetadata(companyData, language, framework);

      if (exportFormat === 'xlsx') {
        await exportWorkbook({
          drafts: answerDrafts,
          metadata: exportMetadata,
          fileName: buildExcelFileName(exportMetadata.companyName),
        });
        showFeedback(t('respond.dlExcel'));
      } else if (exportFormat === 'html') {
        exportAnswersAsHtml(localizeAnswerDrafts(answerDrafts, language), exportMetadata);
        showFeedback(t('respond.dlHtml'));
      } else if (exportFormat === 'doc') {
        exportAnswersAsWord(localizeAnswerDrafts(answerDrafts, language), exportMetadata);
        showFeedback(t('respond.dlWord'));
      } else if (exportFormat === 'pdf') {
        printAnswersAsPdf(localizeAnswerDrafts(answerDrafts, language), exportMetadata);
        showFeedback(t('respond.dlPdf'));
      }
      setShowExportDialog(false);
    } catch (err) {
      console.error('Export error:', err);
      showFeedback(t('respond.exportFailed'));
    } finally {
      setExporting(false);
    }
  };

  const handleBatchExportAllTemplates = async () => {
    setBatchExporting(true);
    try {
      const engine = await getEngine();
      const exportCompanyData = buildCompanyData();
      const profile = buildCompanyProfile();
      const templateList = Object.values(QUESTIONNAIRE_TEMPLATES);

      for (const template of templateList) {
        const parsePayload = templateToParseResult(template.id);
        if (!parsePayload?.questions?.length) continue;

        const questions = parsePayload.questions;
        const matchResults = engine.matchQuestions(questions);
        const classifications = engine.classifyQuestions?.(questions) || [];
        const dataContexts = matchResults.map(mr => engine.retrieveData(mr, exportCompanyData));
        const drafts = engine.generateDrafts(questions, matchResults, dataContexts, {
          useLLM: false,
          includeMethodology: true,
          includeAssumptions: true,
          includeLimitations: true,
          verbosity: 'standard',
          aggregateSites: true,
        }, profile, classifications).map(normalizeDraft);

        await exportWorkbook({
          drafts,
          metadata: buildExportMetadata(exportCompanyData, language, template.framework, 'ESG Passport Dev Export'),
          fileName: buildExcelFileName(`${exportCompanyData?.companyName || 'responses'}-${template.id}`),
        });
      }

      track('respond_batch_export_completed', { templates: templateList.length });
      showFeedback(t('respond.batchDone', { count: templateList.length }));
    } catch (err) {
      console.error('Batch export error:', err);
      showFeedback(t('respond.batchFailed'));
    } finally {
      setBatchExporting(false);
    }
  };

  const exportWarnings = useMemo(() => {
    if (answerDrafts.length === 0) return { unknown: [], estimated: [], drafted: [], allGood: true };
    const unknown = answerDrafts
      .filter(d => d.dataCoverage === 'missing')
      .map(d => ({ id: d.questionId, text: d.questionText, action: d.promptForMissing || t('respond.dataNotAvailable') }));
    const estimated = answerDrafts
      .filter(d => d.confidenceSource === 'estimated' || d.dataCoverage === 'partial')
      .map(d => ({ id: d.questionId, text: d.questionText }));
    const drafted = answerDrafts
      .filter(d => d.supportLevel === 'draft')
      .map(d => ({ id: d.questionId, text: d.questionText }));
    return { unknown, estimated, drafted, allGood: unknown.length === 0 && estimated.length === 0 && drafted.length === 0 };
  }, [answerDrafts]);

  const resetToUpload = () => {
    setPhase('upload');
    setDemoLibraryUsed(false);
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
          <h2 className="text-xl font-semibold text-slate-900 text-center mb-2">{t('respond.preparing')}</h2>
          <p className="text-sm text-slate-500 text-center mb-6">{generatingProgress.step}</p>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${generatingProgress.percent}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 text-center mt-2">{generatingProgress.percent}%</p>
        </div>
        <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
          <DialogContent className="max-w-3xl max-h-[88vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {exportWarnings.allGood ? (
                  <><CheckCircle2 className="w-5 h-5 text-green-600" /> {t('respond.readyExport')}</>
                ) : (
                  <><AlertTriangle className="w-5 h-5 text-amber-500" /> {t('respond.reviewExport')}</>
                )}
              </DialogTitle>
              <DialogDescription>
                {exportWarnings.allGood
                  ? t('respond.exportReady')
                  : t('respond.needAttention', { count: exportWarnings.unknown.length + exportWarnings.estimated.length, total: answerDrafts.length })}
              </DialogDescription>
            </DialogHeader>

            {!exportWarnings.allGood && (
              <div className="overflow-y-auto flex-1 space-y-4 pr-1">
                {exportWarnings.unknown.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4" />
                      {t('respond.missingData', { count: exportWarnings.unknown.length })}
                    </p>
                    <div className="space-y-1.5">
                      {exportWarnings.unknown.map(q => (
                        <div key={q.id} className="text-sm border-l-2 border-red-300 pl-3 py-1">
                          <p className="text-slate-800 font-medium">{q.id}: {q.text.length > 80 ? q.text.slice(0, 80) + '...' : q.text}</p>
                          <p className="text-slate-500 text-xs">{q.action}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {exportWarnings.drafted.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-violet-700 mb-2 flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4" />
                      {t('respond.draftAnswers', { count: exportWarnings.drafted.length })}
                    </p>
                    <div className="space-y-1.5">
                      {exportWarnings.drafted.map(q => (
                        <div key={q.id} className="text-sm border-l-2 border-violet-300 pl-3 py-1">
                          <p className="text-slate-800">{q.id}: {q.text.length > 80 ? q.text.slice(0, 80) + '...' : q.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {exportWarnings.estimated.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-amber-700 mb-2 flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4" />
                      {t('respond.estimatedAnswers', { count: exportWarnings.estimated.length })}
                    </p>
                    <div className="space-y-1.5">
                      {exportWarnings.estimated.map(q => (
                        <div key={q.id} className="text-sm border-l-2 border-amber-300 pl-3 py-1">
                          <p className="text-slate-800">{q.id}: {q.text.length > 80 ? q.text.slice(0, 80) + '...' : q.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="border-t border-slate-100 pt-4">
              <p className="text-sm font-semibold text-slate-900 mb-2">{t('respond.exportFormat')}</p>
              <RadioGroup value={exportFormat} onValueChange={setExportFormat} className="grid grid-cols-2 gap-3">
                <label className="flex items-start gap-2 rounded border border-slate-200 p-3 cursor-pointer">
                  <RadioGroupItem value="xlsx" className="mt-0.5" />
                  <span className="text-sm text-slate-700">
                    <span className="block font-medium text-slate-900">Excel</span>
                    <span className="block text-xs text-slate-500">{t('respond.fmtExcelDesc')}</span>
                  </span>
                </label>
                <label className="flex items-start gap-2 rounded border border-slate-200 p-3 cursor-pointer">
                  <RadioGroupItem value="pdf" className="mt-0.5" />
                  <span className="text-sm text-slate-700">
                    <span className="block font-medium text-slate-900">PDF</span>
                    <span className="block text-xs text-slate-500">{t('respond.fmtPdfDesc')}</span>
                  </span>
                </label>
                <label className="flex items-start gap-2 rounded border border-slate-200 p-3 cursor-pointer">
                  <RadioGroupItem value="doc" className="mt-0.5" />
                  <span className="text-sm text-slate-700">
                    <span className="block font-medium text-slate-900">Word</span>
                    <span className="block text-xs text-slate-500">{t('respond.fmtWordDesc')}</span>
                  </span>
                </label>
                <label className="flex items-start gap-2 rounded border border-slate-200 p-3 cursor-pointer">
                  <RadioGroupItem value="html" className="mt-0.5" />
                  <span className="text-sm text-slate-700">
                    <span className="block font-medium text-slate-900">HTML</span>
                    <span className="block text-xs text-slate-500">{t('respond.fmtHtmlDesc')}</span>
                  </span>
                </label>
              </RadioGroup>
            </div>

            {!exportWarnings.allGood && (
              <label className="flex items-start gap-3 px-1 py-3 border-t border-slate-100 cursor-pointer">
                <input
                  type="checkbox"
                  checked={exportReviewConfirmed}
                  onChange={(e) => setExportReviewConfirmed(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300"
                />
                <span className="text-sm text-slate-700">
                  {t('respond.reviewConfirm')}
                </span>
              </label>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setShowExportDialog(false)}>
                {t('respond.goBackReview')}
              </Button>
              <Button
                onClick={confirmExport}
                disabled={exporting || (!exportWarnings.allGood && !exportReviewConfirmed)}
                className="bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-40"
              >
                {exporting ? (
                  <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> {t('respond.exportingFmt', { fmt: getExportFormatLabel(exportFormat) })}</>
                ) : (
                  <><Download className="w-4 h-4 mr-1.5" /> {t('respond.exportFmt', { fmt: getExportFormatLabel(exportFormat) })}</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ============ RENDER: RESULTS ============
  if (phase === 'results') {
    if (pipelineError) {
      return (
        <div className="max-w-lg mx-auto text-center py-20">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg font-medium text-slate-900 mb-2">{t('respond.somethingWrong')}</p>
          <p className="text-sm text-red-600 mb-6">{pipelineError}</p>
          <Button variant="outline" onClick={resetToUpload}>{t('respond.tryAgain')}</Button>
        </div>
      );
    }

    const activeFilterCount = (filterConfidence !== 'all' ? 1 : 0) + (filterType !== 'all' ? 1 : 0);

    return (
      <div className={cn('space-y-0', isDemo && 'pb-44 sm:pb-32')}>
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
                <Link to="/settings" className="text-xs text-red-600 underline mt-1 block">{t('respond.configureApiKey')}</Link>
              )}
            </div>
            <button onClick={() => setEnhanceError(null)} className="text-red-400 hover:text-red-600"><XIcon className="w-4 h-4" /></button>
          </div>
        )}

        {/* ===== REPORT HEADER ===== */}
        <div className="bg-white border border-slate-200 rounded-none px-6 py-5">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">{t('respond.responseDrafts')}</p>
              <h1 className="text-xl font-semibold text-slate-900">{questionnaireName}</h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                {framework && <span>{framework}</span>}
                <span>{t('respond.questionsCount', { count: stats?.total })}</span>
                <span>{new Date().toLocaleDateString(dateLocale, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                {demoLibraryUsed && <span>{t('respond.exampleData')}</span>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {canRespond && (
                <>
                  <Button variant="outline" size="sm" onClick={handleReprepare}>
                    <RefreshCw className="w-4 h-4 mr-1.5" /> {t('respond.reprepare')}
                  </Button>
                  <Button variant="outline" size="sm" onClick={resetToUpload}>
                    <UploadIcon className="w-4 h-4 mr-1.5" /> {t('respond.new')}
                  </Button>
                </>
              )}
              <Button
                size="sm"
                onClick={canRespond ? handleExport : () => window.open(CHECKOUT_URL, '_blank')}
                className="bg-slate-900 hover:bg-slate-800 text-white"
                title={canRespond ? t('respond.titleExport') : t('respond.titleUnlockExport')}
              >
                {canRespond ? <Download className="w-4 h-4 mr-1.5" /> : <Shield className="w-4 h-4 mr-1.5" />}
                {canRespond ? t('respond.export') : responseUpgradeLabel}
              </Button>
            </div>
          </div>
        </div>

        {/* ===== SUMMARY BAR ===== */}
        {stats && (
          <div className="bg-slate-50 border-x border-slate-200 px-6 py-4">
            <div className="flex flex-wrap items-center gap-6">
              <div>
                <p className="text-2xl font-bold text-green-700">{stats.supported}<span className="text-base font-normal text-slate-400">/{stats.total}</span></p>
                <p className="text-xs text-slate-500">{t('respond.supported')}</p>
              </div>
              <div className="h-8 w-px bg-slate-200" />
              <div>
                <p className="text-2xl font-bold text-violet-700">{stats.drafted}</p>
                <p className="text-xs text-slate-500">{t('respond.drafts')}</p>
              </div>
              <div className="h-8 w-px bg-slate-200" />
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.readinessPercent}%</p>
                <p className="text-xs text-slate-500">{t('respond.dataBacked')}</p>
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
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="h-8 w-[140px] text-xs">
                    <Globe className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                    <SelectValue placeholder={t('respond.languagePlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((option) => (
                      <SelectItem key={option.code} value={option.code}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* AI Enhance All */}
                <Button
                  onClick={canRespond ? handleEnhanceAll : () => window.open(CHECKOUT_URL, '_blank')}
                  disabled={enhancingAll}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  title={canRespond ? '' : t('respond.titleUnlockAi')}
                >
                  {enhancingAll ? (
                    <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> {enhanceProgress.done}/{enhanceProgress.total}</>
                  ) : (
                    <><Sparkles className="w-3 h-3 mr-1.5" /> {canRespond ? t('respond.aiEnhance') : t('respond.aiEnhancePassport')}</>
                  )}
                </Button>
              </div>
            </div>

            {/* Active filter indicator */}
            {activeFilterCount > 0 && (
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                <span>{t('respond.showingXofY', { shown: filtered.length, total: answerDrafts.length })}</span>
                {filterConfidence !== 'all' && (
                  <span className={cn('px-2 py-0.5 rounded', CONFIDENCE_CONFIG[filterConfidence].bg, CONFIDENCE_CONFIG[filterConfidence].color)}>
                    {t(CONFIDENCE_CONFIG[filterConfidence].labelKey)}
                  </span>
                )}
                {filterType !== 'all' && (
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600">{filterType}</span>
                )}
                <button onClick={() => { setFilterConfidence('all'); setFilterType('all'); }} className="text-indigo-600 hover:underline ml-1">{t('respond.clear')}</button>
              </div>
            )}

            {/* No Data Warning */}
            {stats.needData > stats.withData && (
              <div className="mt-3 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>
                  {stats.withData === 0
                    ? t('respond.noDataGeneric')
                    : t('respond.onlyXofY', { withData: stats.withData, total: stats.total })}
                  <Link to="/data" className="underline font-medium">{t('respond.enterYourData')}</Link>{t('respond.toPersonalize')}
                </span>
              </div>
            )}
          </div>
        )}

        {/* ===== ANSWER TABLE ===== */}
        <div className="bg-white border border-slate-200 rounded-none overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[3rem_1fr_6rem_5rem] gap-0 px-6 py-2.5 bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-500 uppercase tracking-wider">
            <span>{t('respond.colNumber')}</span>
            <span>{t('respond.colQA')}</span>
            <span className="text-center">{t('respond.colConfidence')}</span>
            <span className="text-right">{t('respond.colActions')}</span>
          </div>

          {/* Answer rows */}
          {filtered.length === 0 && answerDrafts.length > 0 && (
            <div className="text-center py-12 text-slate-500">
              <p>{t('respond.noMatchFilters')}</p>
              <button onClick={() => { setFilterConfidence('all'); setFilterType('all'); }} className="text-indigo-600 underline text-sm mt-2">{t('respond.clearFilters')}</button>
            </div>
          )}

          {(canRespond ? filtered : filtered.slice(0, FREE_PREVIEW_LIMIT)).map((draft, i) => {
            const conf = CONFIDENCE_CONFIG[draft.answerConfidence] || CONFIDENCE_CONFIG.none;
            const support = SUPPORT_CONFIG[draft.supportLevel || 'draft'] || SUPPORT_CONFIG.draft;
            const isExpanded = showDetails.has(draft.questionId);
            const isEditing = editingAnswerId === draft.questionId;
            const isEnhancing = enhancingId === draft.questionId;
            const verifiedText = getDisplayedVerified(draft);
            const draftText = getDisplayedDraft(draft);
            const coverageLabel = getCoverageLabel(draft);

            return (
              <div
                key={draft.questionId}
                className={cn(
                  'border-b border-slate-100 last:border-b-0',
                  draft.supportLevel === 'draft' && draft.dataCoverage === 'missing' && 'bg-violet-50/20',
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
                    {(draft.category || draft.dataValue) && (
                      <Link
                        to={draft.dataPeriod ? `/data?period=${encodeURIComponent(draft.dataPeriod)}` : '/data'}
                        className="text-[11px] text-slate-400 hover:text-indigo-600 mt-0.5 inline-flex items-center gap-1.5 transition-colors"
                        title={draft.dataValue ? `${t('respond.labelSource')} ${draft.dataValue}${draft.dataUnit ? ' ' + draft.dataUnit : ''}${draft.dataPeriod ? ' (' + draft.dataPeriod + ')' : ''}` : t('respond.viewSourceData')}
                      >
                        {draft.category && <span>{draft.category}</span>}
                        {draft.category && draft.dataValue && <span className="text-slate-300">·</span>}
                        {draft.dataValue && (
                          <span>
                            {draft.dataValue}{draft.dataUnit && ` ${draft.dataUnit}`}
                            {draft.dataPeriod && ` (${draft.dataPeriod})`}
                          </span>
                        )}
                      </Link>
                    )}

                    {/* Answer */}
                    <div className={cn('mt-3', draft.supportLevel === 'draft' && draft.dataCoverage === 'missing' && 'opacity-90')}>
                      {isEditing ? (
                        <div className="space-y-2">
                          <Textarea value={editingText} onChange={(e) => setEditingText(e.target.value)} rows={5} className="text-sm" autoFocus />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => saveEdit(draft.questionId)} className="bg-slate-900 text-white text-xs h-7">{t('respond.save')}</Button>
                            <Button size="sm" variant="ghost" onClick={cancelEdit} className="text-xs h-7">{t('respond.cancel')}</Button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                          {translateAnswer(verifiedText, language)}
                          {draft._edited && <span className="text-[10px] text-slate-400 italic ml-1">{t('respond.edited')}</span>}
                          {draft._enhanced && <span className="text-[10px] text-indigo-400 italic ml-1">{t('respond.aiEnhanced')}</span>}
                          {draft.supportLevel === 'draft' && !draft._edited && !draft._markedNA && (
                            <span className="block mt-1.5 text-[10px] text-violet-600 font-medium">{t('respond.notBackedReview')}</span>
                          )}
                        </p>
                          {draftText && !draft._markedNA && (
                            <span className="block mt-2 rounded bg-violet-50/70 border border-violet-100 px-3 py-2">
                              <span className="block text-[10px] font-semibold uppercase tracking-wide text-violet-700">{t('respond.suggestedDraft')}</span>
                              <span className="block mt-1 text-sm text-violet-900 leading-relaxed whitespace-pre-line">
                                {translateAnswer(draftText, language)}
                              </span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Data backing line removed — merged into category link above the answer */}

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                        {draft.dataValue && (
                          <div className="flex gap-4 text-xs text-slate-500">
                            <span>{t('respond.labelValue')} <strong className="text-slate-700">{draft.dataValue}</strong>{draft.dataUnit && ` ${draft.dataUnit}`}</span>
                            {draft.dataPeriod && <span>{t('respond.labelPeriod')} {draft.dataPeriod}</span>}
                            {draft.dataSource && <span>{t('respond.labelSource')} {draft.dataSource}</span>}
                          </div>
                        )}
                        {draft.assumptions?.length > 0 && (
                          <p className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded">
                            {t('respond.labelAssumptions')} {draft.assumptions.join('. ')}
                          </p>
                        )}
                        {draft.limitations?.length > 0 && (
                          <p className="text-xs text-orange-700 bg-orange-50 px-2 py-1 rounded">
                            {t('respond.labelDataGaps')} {draft.limitations.join('. ')}
                          </p>
                        )}
                        {draft.draftReason?.length > 0 && (
                          <p className="text-xs text-violet-700 bg-violet-50 px-2 py-1 rounded">
                            {t('respond.labelWhyDraft')} {draft.draftReason.join(' ')}
                          </p>
                        )}
                        {draft.consistencyFlags?.length > 0 && (
                          <p className="text-xs text-red-700 bg-red-50 px-2 py-1 rounded">
                            {t('respond.labelConsistency')} {draft.consistencyFlags.join(' ')}
                          </p>
                        )}
                        {draft.evidenceRefs?.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {draft.evidenceRefs.map(ref => (
                              <span key={`${ref.type}:${ref.key}`} className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">{ref.label}</span>
                            ))}
                          </div>
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
                              placeholder={t('respond.naPlaceholder')}
                              rows={2}
                              className="text-sm"
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => toggleNA(draft.questionId, naJustifications[draft.questionId])} className="bg-slate-900 text-white text-xs h-7">{t('respond.confirmNA')}</Button>
                              <Button size="sm" variant="ghost" onClick={() => setNaEditing(null)} className="text-xs h-7">{t('respond.cancel')}</Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center gap-2 pt-2">
                            {canRespond && (
                            <button
                              onClick={() => draft._markedNA ? toggleNA(draft.questionId) : setNaEditing(draft.questionId)}
                              className={cn(
                                'text-xs px-2 py-1 rounded border transition-colors',
                                draft._markedNA ? 'bg-slate-200 text-slate-700 border-slate-300' : 'text-slate-500 border-slate-200 hover:bg-slate-50'
                              )}
                            >
                              <Ban className="w-3 h-3 inline mr-1" />{draft._markedNA ? t('respond.undoNA') : t('respond.markNA')}
                            </button>
                            )}
                            {canRespond && (draft.answerConfidence !== 'none' || draft.supportLevel === 'supported') && !draft._markedNA && (
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
                                {savedMasterIds.has(draft.questionId) ? <><BookmarkCheck className="w-3 h-3 inline mr-1" /> {t('respond.savedShort')}</> : <><BookmarkPlus className="w-3 h-3 inline mr-1" /> {t('respond.saveToLibrary')}</>}
                              </button>
                            )}
                            {allDocuments.length > 0 && (
                              <div className="relative">
                                <button
                                  onClick={() => setDocPickerOpen(docPickerOpen === draft.questionId ? null : draft.questionId)}
                                  className="text-xs px-2 py-1 rounded border text-slate-500 border-slate-200 hover:bg-slate-50 transition-colors"
                                >
                                  <Paperclip className="w-3 h-3 inline mr-1" /> {t('respond.evidence')}
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
                  <div className="flex flex-col items-center gap-1 pt-0.5">
                    <span className={cn('inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded', support.bg, support.color)}>
                      <span className={cn('w-1.5 h-1.5 rounded-full', support.dot)} />
                      {t(support.labelKey)}
                    </span>
                    {draft.supportLevel === 'supported' && draft.answerConfidence !== 'none' && (
                      <span className={cn(
                        'inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border bg-white',
                        conf.color,
                        draft.answerConfidence === 'high' && 'border-green-200',
                        draft.answerConfidence === 'medium' && 'border-amber-200',
                        draft.answerConfidence === 'low' && 'border-orange-200',
                        draft.answerConfidence === 'none' && 'border-red-200'
                      )}>
                        <span className={cn('w-1.5 h-1.5 rounded-full', conf.dot)} />
                        {t(conf.labelKey)}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 text-center">{coverageLabel}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-start justify-end gap-1 pt-0.5">
                    {canRespond && !draft._markedNA && (draft.answerConfidence !== 'none' || draft.supportLevel === 'supported') && (
                      <button
                        onClick={() => handleEnhanceSingle(draft)}
                        disabled={isEnhancing || draft._enhanced}
                        className={cn(
                          'p-1.5 rounded transition-colors',
                          draft._enhanced ? 'text-indigo-400' : isEnhancing ? 'text-slate-300' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
                        )}
                        title={draft._enhanced ? t('respond.tipAiEnhanced') : t('respond.tipEnhanceAi')}
                      >
                        {isEnhancing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      </button>
                    )}
                    {canRespond && (
                      <button
                        onClick={() => startEditing(draft)}
                        className="p-1.5 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                        title={t('respond.tipEdit')}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => toggleDetails(draft.questionId)}
                      className={cn(
                        'p-1.5 rounded transition-colors',
                        isExpanded ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                      )}
                      title={t('respond.tipDetails')}
                    >
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* ===== UPGRADE CARD + LOCKED PLACEHOLDERS (free users only) ===== */}
          {isDemo && filtered.length > FREE_PREVIEW_LIMIT && (
            <>
              <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 text-center">
                <div className="mx-auto max-w-xl">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {t('respond.moreUnlock')}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {t('respond.fullWorkflow')}
                  </p>
                </div>
              </div>

              {filtered.slice(FREE_PREVIEW_LIMIT).map((draft, i) => (
                <div
                  key={draft.questionId}
                  className="border-b border-slate-100 last:border-b-0 px-6 py-4 grid grid-cols-[3rem_1fr_6rem_5rem] gap-0 items-start opacity-60"
                >
                  <span className="text-sm text-slate-400 font-mono pt-0.5">{FREE_PREVIEW_LIMIT + i + 1}</span>
                  <div className="pr-4 min-w-0">
                    <p className="text-sm font-medium text-slate-900 leading-relaxed blur-sm select-none">{draft.questionText}</p>
                    <div className="mt-3 h-3 bg-slate-200 rounded w-full blur-sm" />
                    <div className="mt-1.5 h-3 bg-slate-200 rounded w-5/6 blur-sm" />
                    <div className="mt-1.5 h-3 bg-slate-200 rounded w-4/6 blur-sm" />
                  </div>
                  <div className="flex justify-center pt-0.5">
                    <Shield className="w-4 h-4 text-slate-300" />
                  </div>
                  <div />
                </div>
              ))}
            </>
          )}
        </div>

        {/* ===== BOTTOM BAR ===== */}
        {answerDrafts.length > 0 && (
          <div className="mt-6 bg-white border border-slate-200 rounded-none px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500">
              {t('respond.bottomSummary', { supported: stats?.supported, total: stats?.total, drafts: stats?.drafted, readiness: stats?.readinessPercent })}
            </p>
            <Button
              onClick={canRespond ? handleExport : () => window.open(CHECKOUT_URL, '_blank')}
              className="bg-slate-900 hover:bg-slate-800 text-white"
              title={canRespond ? '' : t('respond.titleUnlockExportBottom')}
            >
              {canRespond ? <Download className="w-4 h-4 mr-2" /> : <Shield className="w-4 h-4 mr-2" />}
              {canRespond ? t('respond.export') : responseUpgradeLabel}
            </Button>
          </div>
        )}
        {isDemo && (
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-12px_30px_rgba(15,23,42,0.12)] backdrop-blur">
            <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">{t('respond.exampleView')}</p>
                <div className="mt-2 grid gap-2 text-xs text-slate-600 sm:grid-cols-3">
                  <span className="inline-flex items-center gap-1.5">
                    <UploadIcon className="h-3.5 w-3.5 text-slate-500" /> {t('respond.uploadDocuments')}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Database className="h-3.5 w-3.5 text-slate-500" /> {t('respond.extractData')}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-slate-500" /> {t('respond.reviewAnswers')}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <a
                  href={CHECKOUT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center justify-center bg-slate-900 px-4 text-sm font-medium text-white transition-colors hover:bg-slate-800"
                >
                  {t('respond.buyPassport')}
                </a>
                <Link to="/settings" className="text-center text-xs text-slate-500 underline underline-offset-2">
                  {t('respond.alreadyPurchased')}
                </Link>
              </div>
            </div>
          </div>
        )}
        <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
          <DialogContent className="max-w-3xl max-h-[88vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {exportWarnings.allGood ? (
                  <><CheckCircle2 className="w-5 h-5 text-green-600" /> {t('respond.readyExport')}</>
                ) : (
                  <><AlertTriangle className="w-5 h-5 text-amber-500" /> {t('respond.reviewExport')}</>
                )}
              </DialogTitle>
              <DialogDescription>
                {exportWarnings.allGood
                  ? t('respond.exportReady')
                  : t('respond.needAttention', { count: exportWarnings.unknown.length + exportWarnings.estimated.length, total: answerDrafts.length })}
              </DialogDescription>
            </DialogHeader>

            {!exportWarnings.allGood && (
              <div className="overflow-y-auto flex-1 space-y-4 pr-1">
                {exportWarnings.unknown.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4" />
                      {t('respond.missingData', { count: exportWarnings.unknown.length })}
                    </p>
                    <div className="space-y-1.5">
                      {exportWarnings.unknown.map(q => (
                        <div key={q.id} className="text-sm border-l-2 border-red-300 pl-3 py-1">
                          <p className="text-slate-800 font-medium">{q.id}: {q.text.length > 80 ? q.text.slice(0, 80) + '...' : q.text}</p>
                          <p className="text-slate-500 text-xs">{q.action}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {exportWarnings.drafted.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-violet-700 mb-2 flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4" />
                      {t('respond.draftAnswers', { count: exportWarnings.drafted.length })}
                    </p>
                    <div className="space-y-1.5">
                      {exportWarnings.drafted.map(q => (
                        <div key={q.id} className="text-sm border-l-2 border-violet-300 pl-3 py-1">
                          <p className="text-slate-800">{q.id}: {q.text.length > 80 ? q.text.slice(0, 80) + '...' : q.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {exportWarnings.estimated.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-amber-700 mb-2 flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4" />
                      {t('respond.estimatedAnswers', { count: exportWarnings.estimated.length })}
                    </p>
                    <div className="space-y-1.5">
                      {exportWarnings.estimated.map(q => (
                        <div key={q.id} className="text-sm border-l-2 border-amber-300 pl-3 py-1">
                          <p className="text-slate-800">{q.id}: {q.text.length > 80 ? q.text.slice(0, 80) + '...' : q.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="border-t border-slate-100 pt-4">
              <p className="text-sm font-semibold text-slate-900 mb-2">{t('respond.exportFormat')}</p>
              <RadioGroup value={exportFormat} onValueChange={setExportFormat} className="grid grid-cols-2 gap-3">
                <label className="flex items-start gap-2 rounded border border-slate-200 p-3 cursor-pointer">
                  <RadioGroupItem value="xlsx" className="mt-0.5" />
                  <span className="text-sm text-slate-700">
                    <span className="block font-medium text-slate-900">Excel</span>
                    <span className="block text-xs text-slate-500">{t('respond.fmtExcelDesc')}</span>
                  </span>
                </label>
                <label className="flex items-start gap-2 rounded border border-slate-200 p-3 cursor-pointer">
                  <RadioGroupItem value="pdf" className="mt-0.5" />
                  <span className="text-sm text-slate-700">
                    <span className="block font-medium text-slate-900">PDF</span>
                    <span className="block text-xs text-slate-500">{t('respond.fmtPdfDesc')}</span>
                  </span>
                </label>
                <label className="flex items-start gap-2 rounded border border-slate-200 p-3 cursor-pointer">
                  <RadioGroupItem value="doc" className="mt-0.5" />
                  <span className="text-sm text-slate-700">
                    <span className="block font-medium text-slate-900">Word</span>
                    <span className="block text-xs text-slate-500">{t('respond.fmtWordDesc')}</span>
                  </span>
                </label>
                <label className="flex items-start gap-2 rounded border border-slate-200 p-3 cursor-pointer">
                  <RadioGroupItem value="html" className="mt-0.5" />
                  <span className="text-sm text-slate-700">
                    <span className="block font-medium text-slate-900">HTML</span>
                    <span className="block text-xs text-slate-500">{t('respond.fmtHtmlDesc')}</span>
                  </span>
                </label>
              </RadioGroup>
            </div>

            {!exportWarnings.allGood && (
              <label className="flex items-start gap-3 px-1 py-3 border-t border-slate-100 cursor-pointer">
                <input
                  type="checkbox"
                  checked={exportReviewConfirmed}
                  onChange={(e) => setExportReviewConfirmed(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300"
                />
                <span className="text-sm text-slate-700">
                  {t('respond.reviewConfirm')}
                </span>
              </label>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setShowExportDialog(false)}>
                {t('respond.goBackReview')}
              </Button>
              <Button
                onClick={confirmExport}
                disabled={exporting || (!exportWarnings.allGood && !exportReviewConfirmed)}
                className="bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-40"
              >
                {exporting ? (
                  <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> {t('respond.exportingFmt', { fmt: getExportFormatLabel(exportFormat) })}</>
                ) : (
                  <><Download className="w-4 h-4 mr-1.5" /> {t('respond.exportFmt', { fmt: getExportFormatLabel(exportFormat) })}</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ============ RENDER: UPLOAD ============
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-900">{canRespond ? t('respond.titleRespond') : t('respond.titleExample')}</h1>
          {isDemo && (
            <span className="rounded bg-slate-200 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-slate-700">
              {t('respond.example')}
            </span>
          )}
        </div>
        <p className="text-slate-500 mt-1">
          {isPaid
            ? t('respond.subtitlePaid')
            : t('respond.subtitleDemo')}
        </p>
      </div>

      {canRespond && linkedRequest && (
        <div className="bg-white border border-slate-200 rounded-none p-4 border-l-4 border-l-indigo-600">
          <p className="text-sm text-slate-500">{t('respond.linkedToRequest')}</p>
          <p className="font-medium text-slate-900">{linkedRequest.customerName} - {linkedRequest.platform}</p>
        </div>
      )}

      {canRespond && (
        <div className="flex gap-1 bg-slate-100 rounded-none p-1">
          {[
            { id: 'upload', label: t('respond.tabUpload'), icon: UploadIcon },
            { id: 'history', label: t('respond.tabPrevious', { count: savedResults.length }), icon: Clock },
            { id: 'readiness', label: t('respond.tabReadiness'), icon: ListChecks },
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
      )}

      {/* Data nudge — warn users with empty/sparse Data store before they upload */}
      {canRespond && setupSkipped && (
        <div className="bg-white border border-slate-200 rounded-none p-3 flex items-center gap-3">
          <Shield className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-600">{t('respond.nudgeProfile')}</p>
          </div>
          <Link
            to="/settings"
            className="inline-flex items-center justify-center h-9 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-none flex-shrink-0"
          >
            {t('respond.addProfile')}
          </Link>
        </div>
      )}

      {canRespond && (() => {
        const hasAnyData = hasUsableWorkspaceData();
        if (hasAnyData) return null;
        return (
          <div className="bg-white border border-slate-200 rounded-none p-3 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-600">{t('respond.nudgeNoData')}</p>
            </div>
            <Link
              to="/data"
              onClick={() => sessionStorage.setItem('respond_resume_sample', '1')}
              className="inline-flex items-center justify-center h-9 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-none flex-shrink-0"
            >
              {t('respond.addYourData')}
            </Link>
          </div>
        );
      })()}

      {/* Upload Tab */}
      {uploadTab === 'upload' && (
        <>
          {/* Try with sample — quick example path for users without a real questionnaire */}
          {(() => {
            const sample = [...templates].sort((a, b) => (a.questionCount || 999) - (b.questionCount || 999))[0];
            if (!sample) return null;
            return (
              <div className="bg-indigo-50 border border-indigo-200 rounded-none p-5 flex items-start gap-4">
                <Sparkles className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">{canRespond ? t('respond.noQHandy') : t('respond.tryExample')}</p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {isPaid
                      ? t('respond.samplePaid', { count: sample.questionCount, framework: sample.framework })
                      : t('respond.sampleDemo', { count: sample.questionCount, framework: sample.framework, limit: FREE_PREVIEW_LIMIT })}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => runSampleTemplate(sample.id)}
                  className="border-indigo-300 text-indigo-700 hover:bg-indigo-100 flex-shrink-0"
                >
                  {canRespond ? t('respond.trySample') : t('respond.viewExample')}
                </Button>
              </div>
            );
          })()}

          {canRespond ? (
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
                <p className="font-medium text-slate-900">{t('respond.dropHere')}</p>
                <p className="text-sm text-slate-500 mt-1">{t('respond.orBrowse')}</p>
                <p className="text-xs text-slate-400 mt-3">{t('respond.fileTypes')}</p>
              </div>
            )}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-none p-5">
              <p className="text-sm font-medium text-slate-900">{t('respond.ownNeedsPassport')}</p>
              <p className="mt-1 text-sm text-slate-500">
                {t('respond.ownNeedsBody')}
              </p>
              <a
                href={CHECKOUT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center justify-center h-10 px-4 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-none"
              >
                {t('respond.unlockPassport')}
              </a>
            </div>
          )}

          {canRespond && !linkedRequest && requests.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-none p-4">
              <Label className="text-sm text-slate-600 mb-2 block">{t('respond.linkRequest')}</Label>
              <Select value={selectedRequestId} onValueChange={setSelectedRequestId}>
                <SelectTrigger><SelectValue placeholder={t('respond.selectRequest')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('respond.none')}</SelectItem>
                  {requests.map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.customerName} - {r.platform}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {canRespond && showMapping && mappingColumns && (
            <div className="bg-white border border-slate-200 rounded-none p-4 space-y-3">
              <h3 className="font-medium text-slate-900">{t('respond.columnMapping')}</h3>
              <p className="text-sm text-slate-500">{t('respond.mappingBody')}</p>
              {['questionText', 'category', 'subcategory', 'referenceId'].map(field => (
                <div key={field}>
                  <Label className="text-sm capitalize">{field === 'questionText' ? t('respond.questionTextReq') : field}</Label>
                  <Select value={columnMapping[field]} onValueChange={(v) => setColumnMapping(prev => ({ ...prev, [field]: v }))}>
                    <SelectTrigger><SelectValue placeholder={t('respond.selectColumn')} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">{t('respond.skip')}</SelectItem>
                      {mappingColumns.map(col => (
                        <SelectItem key={col} value={col}>{col}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          )}

          {canRespond && parseError && (
            <div className="flex items-start gap-3 p-4 rounded-none bg-red-50 border border-red-200 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{parseError}</p>
            </div>
          )}

          {canRespond && (
          <div className="flex gap-3">
            {file && (
              <Button onClick={parseFile} disabled={parsing} className="flex-1 bg-slate-900 hover:bg-slate-800 text-white">
                {parsing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('respond.parsing')}</>
                  : <><FileSpreadsheet className="w-4 h-4 mr-2" />{showMapping ? t('respond.reparse') : t('respond.prepareAnswers')}</>}
              </Button>
            )}
            {!showMapping && file && !parsing && (
              <Button variant="outline" onClick={() => { setShowMapping(true); if (!mappingColumns) parseFile(); }} className="text-slate-600 border-slate-300">{t('respond.manualMapping')}</Button>
            )}
          </div>
          )}
        </>
      )}

      {/* Readiness Tab */}
      {uploadTab === 'readiness' && (
        <div className="space-y-3">
          <div className="bg-slate-50 border border-slate-200 rounded-none p-4">
            <p className="text-sm font-semibold text-slate-900">{t('respond.testReadiness')}</p>
            <p className="text-xs text-slate-600 mt-1">
              {t('respond.readinessBody')}
            </p>
          </div>
          {devExportsEnabled && (
            <div className="bg-amber-50 border border-amber-200 rounded-none p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900">{t('respond.devTools')}</p>
                <p className="text-xs text-slate-600 mt-1">{t('respond.devToolsBody')}</p>
              </div>
              <Button
                size="sm"
                onClick={handleBatchExportAllTemplates}
                disabled={batchExporting}
                className="bg-slate-900 hover:bg-slate-800 text-white whitespace-nowrap"
              >
                {batchExporting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t('respond.exportingAll')}</>
                ) : (
                  <><Download className="w-4 h-4 mr-2" /> {t('respond.exportAllTemplates')}</>
                )}
              </Button>
            </div>
          )}

          {templates.map(tpl => (
            <button
              key={tpl.id}
              onClick={() => selectTemplate(tpl.id)}
              className="w-full bg-white border border-slate-200 rounded-none p-4 text-left hover:border-slate-300 hover:shadow-sm transition-all group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">{tpl.name}</p>
                  <p className="text-sm text-slate-500 mt-1">{tpl.description}</p>
                  <p className="text-xs text-slate-400 mt-2">{t('respond.templateMeta', { count: tpl.questionCount, framework: tpl.framework })}</p>
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
              <p className="font-medium">{t('respond.noPrevious')}</p>
              <p className="text-sm mt-1">{t('respond.resultsAppear')}</p>
            </div>
          ) : (
            savedResults.map(saved => (
              <div key={saved.id} className="bg-white border border-slate-200 rounded-none p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => loadSavedResult(saved)}>
                  <p className="font-medium text-slate-900 truncate">{saved.name}</p>
                  <p className="text-sm text-slate-500">
                    {t('respond.historyMeta', { questions: saved.questionCount, answered: saved.answeredCount, score: saved.score })}
                  </p>
                  <p className="text-xs text-slate-400">{new Date(saved.createdAt).toLocaleDateString(dateLocale)}</p>
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
      {/* Export validation dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="max-w-3xl max-h-[88vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {exportWarnings.allGood ? (
                <><CheckCircle2 className="w-5 h-5 text-green-600" /> {t('respond.readyExport')}</>
              ) : (
                <><AlertTriangle className="w-5 h-5 text-amber-500" /> {t('respond.reviewExport')}</>
              )}
            </DialogTitle>
            <DialogDescription>
              {exportWarnings.allGood
                ? t('respond.exportReady')
                : t('respond.needAttention', { count: exportWarnings.unknown.length + exportWarnings.estimated.length, total: answerDrafts.length })}
            </DialogDescription>
          </DialogHeader>

          {!exportWarnings.allGood && (
            <div className="overflow-y-auto flex-1 space-y-4 pr-1">
              {exportWarnings.unknown.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    {t('respond.missingData', { count: exportWarnings.unknown.length })}
                  </p>
                  <div className="space-y-1.5">
                    {exportWarnings.unknown.map(q => (
                      <div key={q.id} className="text-sm border-l-2 border-red-300 pl-3 py-1">
                        <p className="text-slate-800 font-medium">{q.id}: {q.text.length > 80 ? q.text.slice(0, 80) + '...' : q.text}</p>
                        <p className="text-slate-500 text-xs">{q.action}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {exportWarnings.drafted.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-violet-700 mb-2 flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4" />
                    {t('respond.draftAnswers', { count: exportWarnings.drafted.length })}
                  </p>
                  <div className="space-y-1.5">
                    {exportWarnings.drafted.map(q => (
                      <div key={q.id} className="text-sm border-l-2 border-violet-300 pl-3 py-1">
                        <p className="text-slate-800">{q.id}: {q.text.length > 80 ? q.text.slice(0, 80) + '...' : q.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {exportWarnings.estimated.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-amber-700 mb-2 flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4" />
                    {t('respond.estimatedAnswers', { count: exportWarnings.estimated.length })}
                  </p>
                  <div className="space-y-1.5">
                    {exportWarnings.estimated.map(q => (
                      <div key={q.id} className="text-sm border-l-2 border-amber-300 pl-3 py-1">
                        <p className="text-slate-800">{q.id}: {q.text.length > 80 ? q.text.slice(0, 80) + '...' : q.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="border-t border-slate-100 pt-4">
            <p className="text-sm font-semibold text-slate-900 mb-2">{t('respond.exportFormat')}</p>
            <RadioGroup value={exportFormat} onValueChange={setExportFormat} className="grid grid-cols-2 gap-3">
              <label className="flex items-start gap-2 rounded border border-slate-200 p-3 cursor-pointer">
                <RadioGroupItem value="xlsx" className="mt-0.5" />
                <span className="text-sm text-slate-700">
                  <span className="block font-medium text-slate-900">Excel</span>
                  <span className="block text-xs text-slate-500">{t('respond.fmtExcelDesc')}</span>
                </span>
              </label>
              <label className="flex items-start gap-2 rounded border border-slate-200 p-3 cursor-pointer">
                <RadioGroupItem value="pdf" className="mt-0.5" />
                <span className="text-sm text-slate-700">
                  <span className="block font-medium text-slate-900">PDF</span>
                  <span className="block text-xs text-slate-500">{t('respond.fmtPdfDesc')}</span>
                </span>
              </label>
              <label className="flex items-start gap-2 rounded border border-slate-200 p-3 cursor-pointer">
                <RadioGroupItem value="doc" className="mt-0.5" />
                <span className="text-sm text-slate-700">
                  <span className="block font-medium text-slate-900">Word</span>
                  <span className="block text-xs text-slate-500">{t('respond.fmtWordDesc')}</span>
                </span>
              </label>
              <label className="flex items-start gap-2 rounded border border-slate-200 p-3 cursor-pointer">
                <RadioGroupItem value="html" className="mt-0.5" />
                <span className="text-sm text-slate-700">
                  <span className="block font-medium text-slate-900">HTML</span>
                  <span className="block text-xs text-slate-500">{t('respond.fmtHtmlDesc')}</span>
                </span>
              </label>
            </RadioGroup>
          </div>

          {!exportWarnings.allGood && (
            <label className="flex items-start gap-3 px-1 py-3 border-t border-slate-100 cursor-pointer">
              <input
                type="checkbox"
                checked={exportReviewConfirmed}
                onChange={(e) => setExportReviewConfirmed(e.target.checked)}
                className="mt-0.5 rounded border-slate-300"
              />
              <span className="text-sm text-slate-700">
                {t('respond.reviewConfirm')}
              </span>
            </label>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowExportDialog(false)}>
              {t('respond.goBackReview')}
            </Button>
            <Button
              onClick={confirmExport}
              disabled={exporting || (!exportWarnings.allGood && !exportReviewConfirmed)}
              className="bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-40"
            >
              {exporting ? (
                <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> {t('respond.exportingFmt', { fmt: getExportFormatLabel(exportFormat) })}</>
              ) : (
                <><Download className="w-4 h-4 mr-1.5" /> {t('respond.exportFmt', { fmt: getExportFormatLabel(exportFormat) })}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
