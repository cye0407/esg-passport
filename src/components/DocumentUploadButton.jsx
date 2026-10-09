import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload } from 'lucide-react';
import { track } from '@/lib/track';
import { setHandoff } from '@/lib/handoff';
import { useLanguage } from '@/components/LanguageContext';
import { ACCEPTED_DOCUMENT_TYPES as ACCEPTED } from '@/lib/dropSurface';
import { cn } from '@/lib/utils';

// DocumentDrop as a button, for the coverage report. The report says which records the
// questionnaire needs; the way to add one used to sit under the topic cards at the very
// bottom, and it navigated away before you had chosen anything. This opens the file
// picker where the list is, then hands the files to /evidence exactly as DocumentDrop
// does — extraction, the review dialog and the way back to the report all live there.
export default function DocumentUploadButton({ source, variant = 'primary', className = '' }) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const inputRef = useRef(null);
  const [error, setError] = useState(null);

  const accept = (fileList) => {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;

    const readable = files.filter((file) => ACCEPTED.some((ext) => file.name.toLowerCase().endsWith(ext)));
    if (readable.length === 0) {
      setError(t('drop.wrongType', { formats: ACCEPTED.join(', ') }));
      track('coverage_document_rejected', { ext: files[0].name.split('.').pop(), source });
      return;
    }

    setError(null);
    setHandoff({ kind: 'documents', files: readable });
    track('coverage_documents_chosen', { documents: readable.length, source });
    navigate('/evidence');
  };

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPTED.join(',')}
        className="hidden"
        data-testid={`coverage-upload-input-${source}`}
        onChange={(e) => accept(e.target.files)}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        data-testid={`coverage-upload-${source}`}
        className={cn(
          'inline-flex min-h-11 items-center justify-center gap-2 px-5 text-sm font-semibold transition-colors',
          variant === 'primary'
            ? 'bg-[#1A1A1A] text-[#FDFBF7] hover:bg-[#146B55]'
            : 'border border-[#1A1A1A] bg-transparent text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-[#FDFBF7]',
        )}
      >
        <Upload className="h-4 w-4" />
        {t('coverage.uploadRecords')}
      </button>
      <p className="mt-1.5 text-[12px] leading-5 text-[#6B6B6B]">{t('coverage.uploadRecordsHint', { formats: ACCEPTED.join(', ') })}</p>
      {error && <p className="mt-1 text-[12px] text-red-600">{error}</p>}
    </div>
  );
}
