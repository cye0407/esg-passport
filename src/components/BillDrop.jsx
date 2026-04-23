import React, { useState, useCallback, useRef } from 'react';
import { extractFromText } from '@extract/extractors/registry';
import { readPdfText } from '../../web-helpers/pdfReader';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Upload, FileText, Check, X, AlertTriangle } from 'lucide-react';

/**
 * BillDrop — drop utility bills to auto-fill ESG data.
 *
 * Props:
 *   onDataExtracted(fields) — called with accepted fields to merge into data records
 *   year — current reporting year
 */
export default function BillDrop({ onDataExtracted, year }) {
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [results, setResults] = useState(null); // { fileName, result, fields[] }
  const [queue, setQueue] = useState([]); // remaining files to review
  const fileInputRef = useRef(null);

  const processFile = useCallback(async (file) => {
    let text = '';
    const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');

    if (isPdf) {
      try {
        text = await readPdfText(file);
      } catch {
        text = await file.text();
      }
    } else {
      text = await file.text();
    }

    const result = extractFromText(text);

    if (result.fields.length === 0) {
      return {
        fileName: file.name,
        result,
        fields: [],
        error: 'No ESG data found. Try an electricity bill, gas invoice, water bill, waste manifest, or payroll report.',
      };
    }
    return {
      fileName: file.name,
      result,
      fields: result.fields.map(f => ({ ...f, accepted: f.confidence !== 'low' })),
      error: null,
    };
  }, []);

  const processFiles = useCallback(async (fileList) => {
    setProcessing(true);
    const allResults = [];
    for (let i = 0; i < fileList.length; i++) {
      setProgressText(`Reading ${fileList[i].name} (${i + 1}/${fileList.length})...`);
      try {
        const r = await processFile(fileList[i]);
        allResults.push(r);
      } catch (err) {
        allResults.push({
          fileName: fileList[i].name,
          result: null,
          fields: [],
          error: `Failed: ${err.message}`,
        });
      }
    }
    setProcessing(false);
    setProgressText('');

    // Show first result, queue the rest
    if (allResults.length > 0) {
      setResults(allResults[0]);
      setQueue(allResults.slice(1));
    }
  }, [processFile]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const files = e.dataTransfer?.files;
    if (files?.length > 0) processFiles(files);
  }, [processFiles]);

  const handleFileSelect = useCallback((e) => {
    const files = e.target?.files;
    if (files?.length > 0) processFiles(files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [processFiles]);

  const toggleField = useCallback((idx) => {
    setResults(prev => ({
      ...prev,
      fields: prev.fields.map((f, i) => i === idx ? { ...f, accepted: !f.accepted } : f),
    }));
  }, []);

  const showNext = useCallback(() => {
    if (queue.length > 0) {
      setResults(queue[0]);
      setQueue(prev => prev.slice(1));
    } else {
      setResults(null);
    }
  }, [queue]);

  const handleConfirm = useCallback(() => {
    if (!results) return;
    const accepted = results.fields.filter(f => f.accepted);
    if (accepted.length > 0) {
      onDataExtracted(accepted, results.result?.period);
    }
    showNext();
  }, [results, onDataExtracted, showNext]);

  const handleCancel = useCallback(() => {
    showNext();
  }, [showNext]);

  const confColor = (c) => c === 'high' ? 'text-green-700 bg-green-50' : c === 'medium' ? 'text-amber-700 bg-amber-50' : 'text-red-700 bg-red-50';

  return (
    <>
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all
          ${dragging ? 'border-blue-400 bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-300'}
          ${processing ? 'opacity-60 pointer-events-none' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.txt,.csv,.jpg,.jpeg,.png"
          onChange={handleFileSelect}
          className="hidden"
        />
        {processing ? (
          <div className="flex items-center justify-center gap-2 text-slate-500">
            <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
            <span className="text-sm font-medium">{progressText || 'Reading documents...'}</span>
          </div>
        ) : (
          <>
            <FileText className="w-6 h-6 mx-auto mb-2 text-slate-400" />
            <p className="text-sm font-medium text-slate-700">
              Drop a bill or invoice to auto-fill data
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Electricity, gas, water, waste, or payroll — PDF or text
            </p>
          </>
        )}
      </div>

      {/* Review dialog */}
      <Dialog open={!!results} onOpenChange={(open) => { if (!open) handleCancel(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {results?.fileName}
              {queue.length > 0 && (
                <span className="text-xs font-normal text-slate-400 ml-2">
                  +{queue.length} more
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          {results?.error ? (
            <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">{results.error}</p>
            </div>
          ) : results?.fields?.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                <span className="font-medium">
                  {results.result?.documentType?.replace(/_/g, ' ')}
                </span>
                {results.result?.provider && (
                  <span>— {results.result.provider}</span>
                )}
                {results.result?.period && (
                  <span>— {results.result.period}</span>
                )}
              </div>

              {(() => {
                const d = results.result?.documentDetection;
                if (!d?.runnerUp || !d.score || !d.runnerUpScore) return null;
                if (d.runnerUpScore / d.score < 0.7) return null;
                return (
                  <div className="flex items-start gap-2 p-2 mb-2 bg-amber-50 border border-amber-200 rounded text-xs">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-amber-800">
                      Could also be <span className="font-medium">{d.runnerUp.replace(/_/g, ' ')}</span>.
                      Double-check the extracted fields match what this document actually says.
                    </p>
                  </div>
                );
              })()}

              {results.fields.map((f, i) => {
                const rawDiffers = f.rawValueText && f.rawValueText !== String(f.value);
                const topReasons = (f.reasons || []).slice(0, 2).join(' · ');
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-3 p-2 rounded-lg border transition-all ${
                      f.accepted ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50 opacity-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={f.accepted}
                      onChange={() => toggleField(i)}
                      className="shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-900">{f.field}</span>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${confColor(f.confidence)}`}>
                          {f.confidence}
                        </span>
                      </div>
                      {topReasons && (
                        <p className="text-[10px] text-slate-500 mt-0.5">{topReasons}</p>
                      )}
                      <p className="text-xs text-slate-400 truncate">{f.source?.rawText}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-sm font-mono font-semibold text-slate-900">
                        {typeof f.value === 'number' ? f.value.toLocaleString() : f.value}
                      </span>
                      <span className="text-xs text-slate-400 ml-1">{f.unit}</span>
                      {rawDiffers && (
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          raw: {f.rawValueText}{f.rawUnitText ? ` ${f.rawUnitText}` : ''}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}

              {results.result?.issues?.length > 0 ? (
                <div className="p-3 bg-amber-50 rounded-lg mt-2 space-y-1.5">
                  {results.result.issues.map((issue, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-amber-800">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        {issue.field && <span className="font-medium">{issue.field}: </span>}
                        <span>{issue.message}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : results.result?.warnings?.length > 0 ? (
                <div className="p-3 bg-amber-50 rounded-lg mt-2">
                  {results.result.warnings.map((w, i) => (
                    <p key={i} className="text-xs text-amber-700">{w}</p>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleCancel}>
              {queue.length > 0 ? 'Skip' : 'Cancel'}
            </Button>
            {results?.fields?.some(f => f.accepted) && (
              <Button onClick={handleConfirm}>
                <Check className="w-4 h-4 mr-1" />
                Apply {results.fields.filter(f => f.accepted).length} fields
                {queue.length > 0 ? ' → Next' : ''}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
