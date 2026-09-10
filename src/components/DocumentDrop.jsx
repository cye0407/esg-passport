import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Upload } from 'lucide-react';
import { track } from '@/lib/track';
import { setHandoff } from '@/lib/handoff';
import { useLanguage } from '@/components/LanguageContext';

// Drop the bills where you land, not three tabs away.
//
// The sibling of QuestionnaireDrop, and deliberately the same shape: the files are
// handed to /evidence in memory rather than read here. Extraction, the field-by-field
// review dialog and the hand-off that applies accepted values on /data all live on that
// page, and splitting them across two screens is how they drift apart.
//
// The accepted list is BillDrop's, not a wish list. It reads a text layer out of the
// file, so a Word document or a photograph of a bill has nothing for it to read, and
// promising those here would produce "no ESG data found" on a file we never could read.
const ACCEPTED = ['.pdf', '.txt', '.csv'];

export default function DocumentDrop() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState(null);

  const accept = (fileList) => {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;

    const readable = files.filter((file) => ACCEPTED.some((ext) => file.name.toLowerCase().endsWith(ext)));
    if (readable.length === 0) {
      setError(t('drop.wrongType', { formats: ACCEPTED.join(', ') }));
      track('dashboard_document_rejected', { ext: files[0].name.split('.').pop() });
      return;
    }

    setError(null);
    setHandoff({ kind: 'documents', files: readable });
    track('dashboard_documents_dropped', { documents: readable.length });
    navigate('/evidence');
  };

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); accept(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
        className={`mx-auto max-w-md cursor-pointer border border-dashed p-8 text-center transition-colors ${
          dragging ? 'border-slate-900 bg-slate-50' : 'border-slate-300 bg-slate-50/60 hover:border-slate-400'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED.join(',')}
          className="hidden"
          onChange={(e) => accept(e.target.files)}
        />
        <Upload className="mx-auto mb-2 h-5 w-5 text-indigo-600" />
        <p className="text-sm font-medium text-slate-900">{t('drop.documentsTitle')}</p>
        <p className="mt-1 text-xs text-slate-500">{t('drop.documentsBody')}</p>
        <p className="mt-2 inline-flex items-center gap-1 text-xs text-slate-400">
          <FileText className="h-3 w-3" /> {ACCEPTED.join('  ·  ')}
        </p>
      </div>
      {error && <p className="mt-2 text-center text-xs text-red-600">{error}</p>}
    </div>
  );
}
