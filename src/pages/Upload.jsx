import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getRequests, getRequestById, loadData, saveData } from '@/lib/store';
import { QUESTIONNAIRE_TEMPLATES, templateToParseResult } from '@/data/questionnaire-templates';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  Upload as UploadIcon, FileSpreadsheet, FileText, X, ArrowRight,
  AlertCircle, CheckCircle2, Loader2, ListChecks, Clock, Trash2,
} from 'lucide-react';

const ACCEPTED_EXTENSIONS = ['.xlsx', '.xls', '.csv', '.pdf', '.docx'];

export default function Upload() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestId = searchParams.get('requestId');
  const linkedRequest = requestId ? getRequestById(requestId) : null;

  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState(null);
  const [parseResult, setParseResult] = useState(null);
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'template' | 'history'

  // Column mapping state
  const [showMapping, setShowMapping] = useState(false);
  const [columnMapping, setColumnMapping] = useState({ questionText: '', category: '', subcategory: '', referenceId: '' });

  const requests = getRequests().filter(r => r.status !== 'closed' && r.status !== 'sent');
  const [selectedRequestId, setSelectedRequestId] = useState(requestId || '');

  // Previous results from localStorage
  const [savedResults, setSavedResults] = useState([]);
  useEffect(() => {
    const data = loadData();
    setSavedResults(data.savedResults || []);
  }, []);

  const deleteSavedResult = (id) => {
    const data = loadData();
    data.savedResults = (data.savedResults || []).filter(r => r.id !== id);
    saveData(data);
    setSavedResults(data.savedResults);
  };

  // --- File Upload Handlers ---
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
      setParseError(`Unsupported file type: ${ext}. Supports .xlsx, .csv, .pdf, .docx`);
      return;
    }
    setFile(f);
    setParseError(null);
    setParseResult(null);
    setShowMapping(false);
  };

  const removeFile = () => {
    setFile(null);
    setParseResult(null);
    setParseError(null);
    setShowMapping(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const parseFile = async () => {
    if (!file) return;
    setParsing(true);
    setParseError(null);
    try {
      const { parseQuestionFile, reprocessWithMapping } = await import('@/lib/respond/questionParser');
      const result = showMapping && columnMapping.questionText
        ? await reprocessWithMapping(file, columnMapping)
        : await parseQuestionFile(file);

      if (result.success && result.questions.length > 0) {
        setParseResult(result);
        storeAndNavigate(result, file.name);
      } else if (result.questions.length === 0) {
        setParseError('No questions found. Try adjusting the column mapping.');
        setShowMapping(true);
        if (result.metadata?.availableColumns) setParseResult(result);
      } else {
        setParseError(result.errors.join('. '));
      }
    } catch (err) {
      setParseError(`Failed to parse: ${err.message}`);
    } finally {
      setParsing(false);
    }
  };

  // --- Template Handlers ---
  const selectTemplate = (templateId) => {
    const result = templateToParseResult(templateId);
    if (result) {
      setParseResult(result);
      const template = QUESTIONNAIRE_TEMPLATES[templateId];
      storeAndNavigate(result, template.name);
    }
  };

  // --- Shared ---
  const storeAndNavigate = (result, name) => {
    localStorage.setItem('esg_parse_result', JSON.stringify(result));
    localStorage.setItem('esg_questionnaire_name', name);
    if (selectedRequestId && selectedRequestId !== 'none') localStorage.setItem('esg_linked_request', selectedRequestId);
    navigate('/results');
  };

  const loadSavedResult = (saved) => {
    localStorage.setItem('esg_parse_result', JSON.stringify(saved.parseResult));
    localStorage.setItem('esg_questionnaire_name', saved.name);
    localStorage.setItem('esg_saved_answers', JSON.stringify(saved.answers));
    navigate('/results');
  };

  const getFileIcon = () => {
    if (!file) return null;
    const ext = file.name.split('.').pop().toLowerCase();
    if (['xlsx', 'xls', 'csv'].includes(ext)) return <FileSpreadsheet className="w-8 h-8 text-green-600" />;
    return <FileText className="w-8 h-8 text-blue-600" />;
  };

  const templates = Object.values(QUESTIONNAIRE_TEMPLATES);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#2D5016]">Respond to Questionnaire</h1>
        <p className="text-[#2D5016]/60 mt-1">
          Upload a file, pick a template, or revisit previous results.
        </p>
      </div>

      {/* Linked Request */}
      {linkedRequest && (
        <div className="glass-card rounded-xl p-4 border-l-4 border-[#2D5016]">
          <p className="text-sm text-[#2D5016]/60">Linked to request</p>
          <p className="font-medium text-[#2D5016]">{linkedRequest.customerName} - {linkedRequest.platform}</p>
        </div>
      )}

      {/* Tab Selector */}
      <div className="flex gap-1 bg-[#2D5016]/5 rounded-xl p-1">
        {[
          { id: 'upload', label: 'Upload File', icon: UploadIcon },
          { id: 'template', label: 'Use Template', icon: ListChecks },
          { id: 'history', label: `Previous (${savedResults.length})`, icon: Clock },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
              activeTab === tab.id
                ? 'bg-white text-[#2D5016] shadow-sm'
                : 'text-[#2D5016]/50 hover:text-[#2D5016]/70'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* === UPLOAD TAB === */}
      {activeTab === 'upload' && (
        <>
          {/* File Drop Zone */}
          <div
            className={cn(
              'glass-card rounded-2xl p-8 border-2 border-dashed transition-all cursor-pointer',
              dragActive ? 'border-[#2D5016] bg-[#2D5016]/5' : 'border-[#2D5016]/20 hover:border-[#2D5016]/40',
              file && 'border-solid border-[#2D5016]/30'
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
                {getFileIcon()}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[#2D5016] truncate">{file.name}</p>
                  <p className="text-sm text-[#2D5016]/60">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); removeFile(); }} className="p-2 rounded-lg hover:bg-red-50 text-red-500">
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="text-center">
                <UploadIcon className="w-12 h-12 text-[#2D5016]/30 mx-auto mb-3" />
                <p className="font-medium text-[#2D5016]">Drop your questionnaire here</p>
                <p className="text-sm text-[#2D5016]/60 mt-1">or click to browse</p>
                <p className="text-xs text-[#2D5016]/40 mt-3">Supports Excel (.xlsx, .csv), PDF, and Word (.docx)</p>
              </div>
            )}
          </div>

          {/* Link to request */}
          {!linkedRequest && requests.length > 0 && (
            <div className="glass-card rounded-xl p-4">
              <Label className="text-sm text-[#2D5016]/70 mb-2 block">Link to a customer request (optional)</Label>
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

          {/* Column Mapping */}
          {showMapping && parseResult?.metadata?.availableColumns && (
            <div className="glass-card rounded-xl p-4 space-y-3">
              <h3 className="font-medium text-[#2D5016]">Column Mapping</h3>
              <p className="text-sm text-[#2D5016]/60">We couldn't auto-detect the columns. Map them manually.</p>
              {['questionText', 'category', 'subcategory', 'referenceId'].map(field => (
                <div key={field}>
                  <Label className="text-sm capitalize">{field === 'questionText' ? 'Question Text *' : field}</Label>
                  <Select value={columnMapping[field]} onValueChange={(v) => setColumnMapping(prev => ({ ...prev, [field]: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select column..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">-- Skip --</SelectItem>
                      {parseResult.metadata.availableColumns.map(col => (
                        <SelectItem key={col} value={col}>{col}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {parseError && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{parseError}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {file && !parseResult?.success && (
              <Button onClick={parseFile} disabled={parsing} className="flex-1 bg-[#2D5016] hover:bg-[#2D5016]/90 text-white">
                {parsing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Parsing...</>
                  : <><FileSpreadsheet className="w-4 h-4 mr-2" />{showMapping ? 'Re-parse with Mapping' : 'Parse Questionnaire'}</>}
              </Button>
            )}
            {!showMapping && file && !parseResult?.success && !parsing && (
              <Button variant="outline" onClick={() => setShowMapping(true)} className="text-[#2D5016] border-[#2D5016]/20">Manual Mapping</Button>
            )}
          </div>
        </>
      )}

      {/* === TEMPLATE TAB === */}
      {activeTab === 'template' && (
        <div className="space-y-3">
          {templates.map(t => (
            <button
              key={t.id}
              onClick={() => selectTemplate(t.id)}
              className="w-full glass-card rounded-xl p-4 text-left hover:bg-[#2D5016]/5 hover:shadow-md transition-all group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-[#2D5016]">{t.name}</p>
                  <p className="text-sm text-[#2D5016]/60 mt-1">{t.description}</p>
                  <p className="text-xs text-[#2D5016]/40 mt-2">{t.questionCount} questions · {t.framework}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-[#2D5016]/20 group-hover:text-[#2D5016] group-hover:translate-x-1 transition-all flex-shrink-0 ml-4" />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* === HISTORY TAB === */}
      {activeTab === 'history' && (
        <div className="space-y-3">
          {savedResults.length === 0 ? (
            <div className="text-center py-12 text-[#2D5016]/50">
              <Clock className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No previous results</p>
              <p className="text-sm mt-1">Results will appear here after you generate answers.</p>
            </div>
          ) : (
            savedResults.map(saved => (
              <div key={saved.id} className="glass-card rounded-xl p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => loadSavedResult(saved)}>
                  <p className="font-medium text-[#2D5016] truncate">{saved.name}</p>
                  <p className="text-sm text-[#2D5016]/60">
                    {saved.questionCount} questions · {saved.answeredCount} answered · {saved.score}% score
                  </p>
                  <p className="text-xs text-[#2D5016]/40">{new Date(saved.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => loadSavedResult(saved)} className="text-[#2D5016]">
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
