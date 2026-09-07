import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText } from 'lucide-react';
import { track } from '@/lib/track';
import { setHandoff } from '@/lib/handoff';
import { useLanguage } from '@/components/LanguageContext';

// Drop the questionnaire where you land, not three tabs away.
//
// The file is handed to /respond in memory rather than parsed here: parsing, the
// question-confirmation step and the Questionnaire Pass claim all live on that page and
// splitting them across two screens is how they drift apart.
const ACCEPTED = ['.xlsx', '.xls', '.csv', '.pdf', '.docx'];

export default function QuestionnaireDrop({ compact = false }) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState(null);

  const accept = (file) => {
    if (!file) return;
    const ok = ACCEPTED.some((ext) => file.name.toLowerCase().endsWith(ext));
    if (!ok) {
      setError(t('drop.wrongType', { formats: ACCEPTED.join(', ') }));
      track('dashboard_questionnaire_rejected', { ext: file.name.split('.').pop() });
      return;
    }
    setError(null);
    setHandoff({ kind: 'questionnaire', file });
    track('dashboard_questionnaire_dropped');
    navigate('/respond');
  };

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); accept(e.dataTransfer.files?.[0]); }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
        className={`cursor-pointer border-2 border-dashed p-6 text-center transition-colors ${
          dragging ? 'border-slate-900 bg-slate-50' : 'border-slate-300 hover:border-slate-400'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(',')}
          className="hidden"
          onChange={(e) => accept(e.target.files?.[0])}
        />
        <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
        <p className="text-sm font-medium text-slate-900">{t('drop.questionnaireTitle')}</p>
        {!compact && (
          <p className="text-xs text-slate-500 mt-1">{t('drop.questionnaireBody')}</p>
        )}
        <p className="text-xs text-slate-400 mt-2 inline-flex items-center gap-1">
          <FileText className="w-3 h-3" /> {ACCEPTED.join('  ·  ')}
        </p>
      </div>
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  );
}
