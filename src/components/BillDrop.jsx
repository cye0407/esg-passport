import React, { useState, useCallback, useEffect, useRef } from 'react';
import { extractFleetCsv, extractFromText } from '@extract/extractors/registry';
import { EXTRACT_FIELD_MAP } from '@/lib/extractFieldMap';
import { readPdfText, isUnreadablePdfText } from '../../web-helpers/pdfReader';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Upload, FileText, Check, X, AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';
import { dropSurfaceClass } from '@/lib/dropSurface';

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
// Rows keep the same shape as the single card's `results` (fileName, result, fields with
// `accepted`), plus `included` for the whole document. Grouped by what the document is,
// ordered by period, so twelve payroll summaries read Jan → Dec.
function buildBatch(allResults) {
  const read = allResults.filter(r => !r.error && r.fields?.length > 0);
  const unread = allResults.filter(r => r.error || !r.fields?.length);
  const byType = new Map();
  for (const r of read) {
    const type = r.result?.documentType || 'unknown';
    if (!byType.has(type)) byType.set(type, []);
    byType.get(type).push({ ...r, included: true });
  }
  const groups = [...byType.entries()].map(([documentType, rows]) => ({
    documentType,
    rows: rows.sort((a, b) => String(a.result?.period || '').localeCompare(String(b.result?.period || '')) || a.fileName.localeCompare(b.fileName)),
    columns: [...new Set(rows.flatMap(r => r.fields.map(f => f.field)))],
  }));
  return { groups, unread };
}

export default function BillDrop({ onDataExtracted, onBatchComplete, incoming = null, inputId }) {
  const { lang, t } = useLanguage();
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [results, setResults] = useState(null); // { fileName, result, fields[] }
  const [queue, setQueue] = useState([]); // remaining files to review (single-file path)
  // Two or more files are reviewed as ONE table — a year of monthly bills is one batch,
  // not twelve dialogs. { groups: [{ documentType, rows: [...] }], unread: [...] }
  const [batch, setBatch] = useState(null);
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

  const processFiles = useCallback(async (incomingFiles) => {
    // Copy first. An <input>'s FileList is LIVE — it is the input's own list, not a
    // snapshot — and handleFileSelect clears the input right after calling this. This
    // loop awaits between files, so by the second turn the live list was empty and a
    // twelve-file selection was read as one: the user confirmed January and was handed
    // off to the summary with eleven months never looked at. Drag-and-drop never showed
    // it, because dataTransfer.files is not tied to an input.
    const fileList = Array.from(incomingFiles || []);
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

    if (allResults.length >= 2) {
      setBatch(buildBatch(allResults));
      setResults(null);
      setQueue([]);
    } else if (allResults.length === 1) {
      setResults(allResults[0]);
      setQueue([]);
    }
  }, [processFile, t]);

  const toggleBatchRow = useCallback((groupIndex, rowIndex) => {
    setBatch(prev => ({
      ...prev,
      groups: prev.groups.map((g, gi) => gi !== groupIndex ? g : {
        ...g,
        rows: g.rows.map((r, ri) => ri !== rowIndex ? r : { ...r, included: !r.included }),
      }),
    }));
  }, []);

  const toggleBatchCell = useCallback((groupIndex, rowIndex, field) => {
    setBatch(prev => ({
      ...prev,
      groups: prev.groups.map((g, gi) => gi !== groupIndex ? g : {
        ...g,
        rows: g.rows.map((r, ri) => ri !== rowIndex ? r : {
          ...r,
          fields: r.fields.map(f => f.field === field ? { ...f, accepted: !f.accepted } : f),
        }),
      }),
    }));
  }, []);

  const handleBatchConfirm = useCallback(() => {
    if (!batch) return;
    for (const group of batch.groups) {
      for (const row of group.rows) {
        if (!row.included) continue;
        const accepted = row.fields.filter(f => f.accepted);
        if (accepted.length > 0) onDataExtracted(accepted, row.result?.period, row.fileName);
      }
    }
    setBatch(null);
    onBatchComplete?.();
  }, [batch, onDataExtracted, onBatchComplete]);

  const handleBatchCancel = useCallback(() => {
    setBatch(null);
    onBatchComplete?.();
  }, [onBatchComplete]);

  const batchIncludedCount = batch ? batch.groups.reduce((n, g) => n + g.rows.filter(r => r.included && r.fields.some(f => f.accepted)).length, 0) : 0;

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
      onDataExtracted(accepted, results.result?.period, results.fileName);
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
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
        className={dropSurfaceClass({ active: dragging, disabled: processing })}
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
            <FileText className="w-8 h-8 mx-auto mb-3 text-slate-400" />
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
      {/* A batch: one table per kind of document, one Apply. */}
      <Dialog open={!!batch} onOpenChange={(open) => { if (!open) handleBatchCancel(); }}>
        <DialogContent className="max-h-[calc(100vh-2rem)] max-w-5xl overflow-y-auto overscroll-contain sm:max-h-[calc(100vh-4rem)]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {t('bill.batchTitle', { count: (batch?.groups.reduce((n, g) => n + g.rows.length, 0) || 0) + (batch?.unread.length || 0) })}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm leading-relaxed text-slate-600">{t('bill.batchIntro')}</p>

          {batch?.groups.map((group, gi) => (
            <div key={group.documentType} className="space-y-2">
              <p className="text-sm font-semibold text-slate-900">
                {documentTypeLabel(t, group.documentType)}
                <span className="ml-2 text-xs font-normal text-slate-500">{t('bill.batchRows', { count: group.rows.length })}</span>
              </p>
              <div className="overflow-x-auto border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium"><span className="sr-only">{t('bill.batchInclude')}</span></th>
                      <th className="px-3 py-2 text-left font-medium whitespace-nowrap">{t('bill.batchPeriod')}</th>
                      <th className="px-3 py-2 text-left font-medium">{t('bill.batchDocument')}</th>
                      {group.columns.map(col => (
                        <th key={col} className="px-3 py-2 text-right font-medium whitespace-nowrap">{fieldLabel(t, col)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {group.rows.map((row, ri) => (
                      <tr key={row.fileName} className={`border-t border-slate-100 ${row.included ? '' : 'opacity-40'}`}>
                        <td className="px-3 py-2">
                          <input type="checkbox" checked={row.included} onChange={() => toggleBatchRow(gi, ri)} aria-label={row.fileName} />
                        </td>
                        <td className="px-3 py-2 font-mono text-xs text-slate-700 whitespace-nowrap">{row.result?.period || '—'}</td>
                        <td className="px-3 py-2 text-xs text-slate-500 max-w-[14rem] truncate" title={row.fileName}>{row.fileName}</td>
                        {group.columns.map(col => {
                          const f = row.fields.find(x => x.field === col);
                          if (!f) return <td key={col} className="px-3 py-2 text-right text-slate-300">—</td>;
                          const value = typeof f.value === 'number' ? f.value.toLocaleString(lang === 'de' ? 'de-DE' : 'en-GB') : f.value;
                          return (
                            <td key={col} className="px-1 py-1 text-right">
                              <button
                                type="button"
                                onClick={() => toggleBatchCell(gi, ri, col)}
                                aria-pressed={f.accepted}
                                title={`${fieldLabel(t, col)} · ${t(`bill.confidence.${f.confidence}`)} · ${t('bill.foundAs')} ${f.source?.rawText || ''}`}
                                className={`w-full whitespace-nowrap rounded px-2 py-1 text-right tabular-nums transition-colors ${
                                  !f.accepted ? 'text-slate-400 line-through'
                                    : f.confidence === 'low' ? 'bg-red-50 text-red-800'
                                      : f.confidence === 'medium' ? 'bg-amber-50 text-amber-900'
                                        : 'text-slate-900'
                                }`}
                              >
                                {value}{f.unit ? <span className="ml-1 text-xs text-slate-500">{f.unit}</span> : null}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {batch?.unread.length > 0 && (
            <div className="space-y-1.5 rounded-lg bg-amber-50 p-3">
              <p className="text-xs font-semibold text-amber-900">{t('bill.batchNotRead', { count: batch.unread.length })}</p>
              {batch.unread.map(r => (
                <p key={r.fileName} className="flex items-start gap-2 text-xs text-amber-800">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
                  <span><span className="font-medium">{r.fileName}</span> — {r.error}</span>
                </p>
              ))}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleBatchCancel}>{t('respond.cancel')}</Button>
            {batchIncludedCount > 0 && (
              <Button onClick={handleBatchConfirm}>
                <Check className="w-4 h-4 mr-1" />
                {t('bill.batchApply', { count: batchIncludedCount })}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!results} onOpenChange={(open) => { if (!open) handleCancel(); }}>
        <DialogContent className="max-h-[calc(100vh-2rem)] max-w-lg overflow-y-auto overscroll-contain sm:max-h-[calc(100vh-4rem)]">
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
