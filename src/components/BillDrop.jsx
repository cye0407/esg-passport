import React, { useState, useCallback, useEffect, useRef } from 'react';
import { extractFleetCsv, extractFromText } from '@extract/extractors/registry';
import { EXTRACT_FIELD_MAP } from '@/lib/extractFieldMap';
import { readPdfText, isUnreadablePdfText } from '../../web-helpers/pdfReader';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Upload, FileText, Check, X, AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';

function fieldLabel(t, field) {
  const key = `bill.field.${field}`;
  const translated = t(key);
  return translated === key ? field.replace(/([a-z])([A-Z])/g, '$1 $2') : translated;
}

function documentTypeLabel(t, type) {
  const known = {
    fleet_fuel_report: 'bill.type.fleetFuel', electricity_bill: 'bill.type.electricity',
    gas_invoice: 'bill.type.gas', water_bill: 'bill.type.water',
    waste_manifest: 'bill.type.waste', payroll_summary: 'bill.type.payroll',
  };
  return t(known[type] || 'bill.type.document');
}

function extractionExplanation(t, field, result, reasons = []) {
  if (field === 'dieselLiters' && result?.documentType === 'fleet_fuel_report') {
    const count = reasons.join(' ').match(/Summed (\d+) rows/)?.[1];
    if (count && result.period) return t('bill.fleetSummary', { count, period: result.period });
  }
  return reasons.slice(0, 2).join(' · ');
}

/**
 * BillDrop — drop utility bills to auto-fill ESG data.
 *
 * Props:
 *   onDataExtracted(fields, period, fileName) — called with accepted fields to merge into
 *     data records. fileName is the document the values came out of, so the workspace can
 *     record where each figure came from rather than losing it at the moment of import.
 *   onBatchComplete() — called once the whole dropped batch has been reviewed, accepted or
 *     cancelled. Several files are reviewed one dialog at a time, so a parent that reacts
 *     to the FIRST onDataExtracted — by navigating away, or by opening a dialog of its own
 *     over the next review — loses every document after it.
 *   incoming — files dropped somewhere else (the dashboard) and handed here to read on
 *     arrival, so the drop and the review are not two different uploaders. Processed
 *     once; the caller has already consumed its hand-off, so a re-render never re-reads.
 */
export default function BillDrop({ onDataExtracted, onBatchComplete, incoming = null, inputId }) {
  const { lang, t } = useLanguage();
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [results, setResults] = useState(null); // { fileName, result, fields[] }
  const [queue, setQueue] = useState([]); // remaining files to review
  const fileInputRef = useRef(null);

  const processFile = useCallback(async (file) => {
    let text = '';
    const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
    const isCsv = file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv');

    if (isPdf) {
      try {
        text = await readPdfText(file);
      } catch {
        text = await file.text();
      }
    } else {
      text = await file.text();
    }

    // A scanned or photographed PDF has no text layer, so readPdfText returns
    // almost nothing and the file.text() fallback returns raw PDF bytes. Say so
    // instead of reporting "no ESG data found", which sends the user looking for
    // a better bill when the problem is the file format.
    if (isPdf && isUnreadablePdfText(text)) {
      return {
        fileName: file.name,
        result: null,
        fields: [],
        error: t('bill.scannedPdf'),
      };
    }

    // A transaction export is a table, not prose. The generic document matcher can
    // see hundreds of "ARAL" strings but has no row/column semantics, so it cannot
    // safely distinguish litres from prices, spend or odometer readings.
    const result = isCsv ? extractFleetCsv(text) : extractFromText(text);

    // Only surface fields we can actually write to the store. A field the
    // extractor produces but that has no EXTRACT_FIELD_MAP entry (e.g.
    // femalePercent, which is derived at bridge time) would be silently
    // dropped on Apply — showing it as a checkbox is a fake door.
    const applicable = result.fields.filter(f => EXTRACT_FIELD_MAP[f.field]);

    if (applicable.length === 0) {
      return {
        fileName: file.name,
        result,
        fields: [],
        error: t('bill.noData'),
      };
    }
    return {
      fileName: file.name,
      result,
      fields: applicable.map(f => ({ ...f, accepted: f.confidence !== 'low' })),
      error: null,
    };
  }, [t]);

  const processFiles = useCallback(async (fileList) => {
    setProcessing(true);
    const allResults = [];
    for (let i = 0; i < fileList.length; i++) {
      setProgressText(t('bill.reading', { name: fileList[i].name, index: i + 1, total: fileList.length }));
      try {
        const r = await processFile(fileList[i]);
        allResults.push(r);
      } catch (err) {
        allResults.push({
          fileName: fileList[i].name,
          result: null,
          fields: [],
          error: t('bill.failed', { message: err.message }),
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
  }, [processFile, t]);

  // Files handed over from another screen. The ref guards against a second pass if the
  // parent re-renders with the same array — reading a bill twice would ask the user to
  // confirm the same figures again.
  const consumedIncoming = useRef(false);
  useEffect(() => {
    if (consumedIncoming.current) return;
    if (!incoming || incoming.length === 0) return;
    consumedIncoming.current = true;
    // Deferred a tick: processFiles sets the reading state on its first line, and doing
    // that synchronously inside an effect makes React re-render mid-commit.
    queueMicrotask(() => processFiles(incoming));
  }, [incoming, processFiles]);

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
      onBatchComplete?.();
    }
  }, [queue, onBatchComplete]);

  const handleConfirm = useCallback(() => {
    if (!results) return;
    const accepted = results.fields.filter(f => f.accepted);
    if (accepted.length > 0) {
      onDataExtracted(accepted, results.result?.period, results.fileName, {
        coveredMonths: results.result?.coveredMonths,
        periodStart: results.result?.periodStart,
        periodEnd: results.result?.periodEnd,
      });
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
          id={inputId}
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.txt,.csv"
          onChange={handleFileSelect}
          className="hidden"
        />
        {processing ? (
          <div className="flex items-center justify-center gap-2 text-slate-500">
            <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
            <span className="text-sm font-medium">{progressText || t('bill.readingDocs')}</span>
          </div>
        ) : (
          <>
            <FileText className="w-6 h-6 mx-auto mb-2 text-slate-400" />
            <p className="text-sm font-medium text-slate-700">
              {t('bill.dropZone')}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {t('bill.dropHint')}
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
                  {t('bill.more', { count: queue.length })}
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
            <div className="space-y-4">
              <p className="text-sm leading-relaxed text-slate-600">{t('bill.reviewIntro')}</p>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                <span className="font-medium text-slate-700">
                  {documentTypeLabel(t, results.result?.documentType)}
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
                      {t('bill.couldAlsoBePre')} <span className="font-medium">{d.runnerUp.replace(/_/g, ' ')}</span>{t('bill.couldAlsoBePost')}
                    </p>
                  </div>
                );
              })()}

              {results.fields.map((f, i) => {
                const rawDiffers = f.rawValueText && f.rawValueText !== String(f.value);
                const explanation = extractionExplanation(t, f.field, results.result, f.reasons);
                return (
                  <div
                    key={i}
                    className={`flex items-start gap-4 rounded-lg border p-4 transition-all ${
                      f.accepted ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50 opacity-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={f.accepted}
                      onChange={() => toggleField(i)}
                      aria-label={fieldLabel(t, f.field)}
                      className="mt-1 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-slate-900">{fieldLabel(t, f.field)}</span>
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${confColor(f.confidence)}`}>
                          {t(`bill.confidence.${f.confidence}`)}
                        </span>
                      </div>
                      {explanation && (
                        <p className="mt-2 text-xs leading-relaxed text-slate-600">{explanation}</p>
                      )}
                      <p className="mt-2 border-t border-slate-100 pt-2 text-[11px] text-slate-400">{t('bill.foundAs')} {f.source?.rawText}</p>
                    </div>
                    <div className="shrink-0 pt-8 text-right">
                      <span className="text-xl font-semibold tabular-nums text-slate-900">
                        {typeof f.value === 'number' ? f.value.toLocaleString(lang === 'de' ? 'de-DE' : 'en-GB') : f.value}
                      </span>
                      <span className="ml-1 text-sm font-medium text-slate-500">{f.unit}</span>
                      {rawDiffers && (
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {t('bill.raw')} {f.rawValueText}{f.rawUnitText ? ` ${f.rawUnitText}` : ''}
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
              {queue.length > 0 ? t('bill.skip') : t('respond.cancel')}
            </Button>
            {results?.fields?.some(f => f.accepted) && (
              <Button onClick={handleConfirm}>
                <Check className="w-4 h-4 mr-1" />
                {t('bill.apply', { count: results.fields.filter(f => f.accepted).length })}
                {queue.length > 0 ? t('bill.next') : ''}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
