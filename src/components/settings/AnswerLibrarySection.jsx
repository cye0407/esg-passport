import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { getMasterAnswers, saveMasterAnswer, deleteMasterAnswer } from '@/lib/store';
import { useLanguage } from '@/components/LanguageContext';
import { BookOpen, Search, Trash2, Edit3, Check, X, Filter, Tag } from 'lucide-react';

const CONFIDENCE_STYLES = {
  high: { bg: 'bg-green-100', text: 'text-green-800', labelKey: 'alib.confHigh' },
  medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', labelKey: 'alib.confMedium' },
  low: { bg: 'bg-orange-100', text: 'text-orange-800', labelKey: 'alib.confLow' },
  none: { bg: 'bg-red-100', text: 'text-red-800', labelKey: 'alib.confUnknown' },
};

const TYPE_STYLES = {
  POLICY: { bg: 'bg-blue-100', text: 'text-blue-800' },
  MEASURE: { bg: 'bg-purple-100', text: 'text-purple-800' },
  KPI: { bg: 'bg-teal-100', text: 'text-teal-800' },
};

export default function AnswerLibrarySection() {
  const { t } = useLanguage();
  const [answers, setAnswers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterConfidence, setFilterConfidence] = useState('all');
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  useEffect(() => { setAnswers(getMasterAnswers()); }, []);

  const stats = useMemo(() => {
    const byConfidence = { high: 0, medium: 0, low: 0, none: 0 };
    answers.forEach(a => { const c = a.confidence || 'none'; if (byConfidence[c] !== undefined) byConfidence[c]++; });
    return { total: answers.length, byConfidence };
  }, [answers]);

  const filtered = useMemo(() => {
    return answers.filter(a => {
      if (filterConfidence !== 'all' && (a.confidence || 'none') !== filterConfidence) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match = [a.topic, a.questionText, a.answer].some(txt => (txt || '').toLowerCase().includes(q))
          || (a.keywords || []).some(kw => kw.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [answers, searchQuery, filterConfidence]);

  const toggleExpand = (id) => setExpandedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const startEditing = (a) => { setEditingId(a.id); setEditText(a.answer || ''); };
  const cancelEditing = () => { setEditingId(null); setEditText(''); };
  const saveEditing = (a) => { const u = saveMasterAnswer({ ...a, answer: editText }); setAnswers(prev => prev.map(x => x.id === a.id ? u : x)); setEditingId(null); };
  const handleDelete = (id) => { deleteMasterAnswer(id); setAnswers(prev => prev.filter(a => a.id !== id)); setDeleteConfirmId(null); };

  if (answers.length === 0) {
    return (
      <div className="text-center py-6">
        <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
        <p className="text-sm text-slate-500">{t('alib.empty')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-slate-500">
        <span>{t('alib.answers', { count: stats.total })}</span>
        <span className="text-green-700">{t('alib.nHigh', { count: stats.byConfidence.high })}</span>
        <span className="text-yellow-700">{t('alib.nMedium', { count: stats.byConfidence.medium })}</span>
        <span className="text-orange-700">{t('alib.nLow', { count: stats.byConfidence.low })}</span>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t('alib.searchPh')} className="pl-8 h-8 text-sm" />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2"><X className="w-3 h-3 text-slate-400" /></button>
        )}
      </div>

      {/* Confidence filter */}
      <div className="flex gap-1">
        {['all', 'high', 'medium', 'low'].map(level => (
          <button key={level} onClick={() => setFilterConfidence(level)}
            className={cn('px-2 py-1 rounded text-xs font-medium transition-all',
              filterConfidence === level ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            )}>
            {level === 'all' ? t('alib.all') : t(CONFIDENCE_STYLES[level].labelKey)}
          </button>
        ))}
      </div>

      {/* Answer list */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {filtered.map(answer => {
          const expanded = expandedIds.has(answer.id);
          const isEditing = editingId === answer.id;
          const confStyle = CONFIDENCE_STYLES[answer.confidence] || CONFIDENCE_STYLES.none;

          return (
            <div key={answer.id} className="rounded-lg border border-slate-200 overflow-hidden">
              <button onClick={() => toggleExpand(answer.id)} className="w-full p-3 flex items-start gap-2 text-left hover:bg-slate-50 transition-all">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">{answer.topic || t('alib.general')}</p>
                  <p className="text-sm text-slate-900 leading-snug mt-0.5">
                    {!expanded && (answer.questionText || '').length > 100 ? (answer.questionText || '').slice(0, 100) + '...' : answer.questionText || t('alib.noQuestion')}
                  </p>
                </div>
                <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0', confStyle.bg, confStyle.text)}>{t(confStyle.labelKey)}</span>
              </button>
              {expanded && (
                <div className="px-3 pb-3 border-t border-slate-100">
                  {isEditing ? (
                    <div className="mt-2 space-y-2">
                      <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={4} className="text-sm" />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => saveEditing(answer)} className="text-xs"><Check className="w-3 h-3 mr-1" /> {t('alib.save')}</Button>
                        <Button size="sm" variant="ghost" onClick={cancelEditing} className="text-xs"><X className="w-3 h-3 mr-1" /> {t('alib.cancel')}</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 p-2 rounded bg-slate-50">
                      <p className="text-sm text-slate-700 whitespace-pre-line">{answer.answer || t('alib.noAnswer')}</p>
                    </div>
                  )}
                  {!isEditing && (
                    <div className="mt-2 flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => startEditing(answer)} className="text-xs h-7">
                        <Edit3 className="w-3 h-3 mr-1" /> {t('alib.edit')}
                      </Button>
                      {deleteConfirmId === answer.id ? (
                        <div className="flex items-center gap-1 ml-auto">
                          <span className="text-xs text-red-600">{t('alib.deleteQ')}</span>
                          <Button size="sm" onClick={() => handleDelete(answer.id)} className="bg-red-500 hover:bg-red-600 text-white text-xs h-7">{t('alib.yes')}</Button>
                          <Button size="sm" variant="ghost" onClick={() => setDeleteConfirmId(null)} className="text-xs h-7"><X className="w-3 h-3" /></Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => setDeleteConfirmId(answer.id)} className="text-xs text-red-500 hover:text-red-700 ml-auto h-7">
                          <Trash2 className="w-3 h-3 mr-1" /> {t('alib.delete')}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && <p className="text-sm text-slate-400 text-center py-4">{t('alib.noMatch')}</p>}
      </div>
    </div>
  );
}
