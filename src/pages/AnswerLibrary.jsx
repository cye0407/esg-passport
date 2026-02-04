import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { getMasterAnswers, saveMasterAnswer, deleteMasterAnswer } from '@/lib/store';
import {
  BookOpen, Search, Trash2, Edit3, Check, X, Filter, Tag,
} from 'lucide-react';

const CONFIDENCE_STYLES = {
  high: { bg: 'bg-green-100', text: 'text-green-800', label: 'High' },
  medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Medium' },
  low: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Low' },
  none: { bg: 'bg-red-100', text: 'text-red-800', label: 'Unknown' },
};

const TYPE_STYLES = {
  POLICY: { bg: 'bg-blue-100', text: 'text-blue-800' },
  MEASURE: { bg: 'bg-purple-100', text: 'text-purple-800' },
  KPI: { bg: 'bg-teal-100', text: 'text-teal-800' },
};

export default function AnswerLibrary() {
  const [answers, setAnswers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterConfidence, setFilterConfidence] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  useEffect(() => {
    setAnswers(getMasterAnswers());
  }, []);

  // Computed stats
  const stats = useMemo(() => {
    const total = answers.length;
    const byConfidence = { high: 0, medium: 0, low: 0, none: 0 };
    const byType = { POLICY: 0, MEASURE: 0, KPI: 0 };

    answers.forEach(a => {
      const conf = a.confidence || 'none';
      if (byConfidence[conf] !== undefined) byConfidence[conf]++;
      const qt = a.questionType;
      if (qt && byType[qt] !== undefined) byType[qt]++;
    });

    return { total, byConfidence, byType };
  }, [answers]);

  // Filtered list
  const filtered = useMemo(() => {
    return answers.filter(a => {
      // Confidence filter
      if (filterConfidence !== 'all') {
        const conf = a.confidence || 'none';
        if (conf !== filterConfidence) return false;
      }

      // Type filter
      if (filterType !== 'all') {
        if (a.questionType !== filterType) return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const topicMatch = (a.topic || '').toLowerCase().includes(q);
        const questionMatch = (a.questionText || '').toLowerCase().includes(q);
        const answerMatch = (a.answer || '').toLowerCase().includes(q);
        const keywordMatch = (a.keywords || []).some(kw => kw.toLowerCase().includes(q));
        if (!topicMatch && !questionMatch && !answerMatch && !keywordMatch) return false;
      }

      return true;
    });
  }, [answers, searchQuery, filterConfidence, filterType]);

  const toggleExpand = (id) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const startEditing = (answer) => {
    setEditingId(answer.id);
    setEditText(answer.answer || '');
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditText('');
  };

  const saveEditing = (answer) => {
    const updated = saveMasterAnswer({ ...answer, answer: editText });
    setAnswers(prev => prev.map(a => a.id === answer.id ? updated : a));
    setEditingId(null);
    setEditText('');
  };

  const handleDelete = (id) => {
    deleteMasterAnswer(id);
    setAnswers(prev => prev.filter(a => a.id !== id));
    setDeleteConfirmId(null);
  };

  // Empty state
  if (answers.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-[#2D5016]" />
          <div>
            <h1 className="text-2xl font-bold text-[#2D5016]">Answer Library</h1>
            <p className="text-[#2D5016]/60 text-sm mt-1">Master answers you can reuse across questionnaires</p>
          </div>
        </div>

        <div className="glass-card rounded-xl p-12 text-center">
          <BookOpen className="w-16 h-16 text-[#2D5016]/20 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-[#2D5016] mb-2">No Master Answers Yet</h3>
          <p className="text-[#2D5016]/60 max-w-md mx-auto">
            Save answers from the Results page to build your library. Master answers can be reused across
            different questionnaires to save time and ensure consistency.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-[#2D5016]" />
          <div>
            <h1 className="text-2xl font-bold text-[#2D5016]">Answer Library</h1>
            <p className="text-[#2D5016]/60 text-sm mt-1">Master answers you can reuse across questionnaires</p>
          </div>
        </div>
      </div>

      {/* Stats Header */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total */}
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-5 h-5 text-[#2D5016]" />
            <span className="text-sm text-[#2D5016]/60">Total Answers</span>
          </div>
          <p className="text-3xl font-bold text-[#2D5016]">{stats.total}</p>
        </div>

        {/* Confidence Breakdown */}
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Filter className="w-5 h-5 text-[#2D5016]" />
            <span className="text-sm text-[#2D5016]/60">By Confidence</span>
          </div>
          <div className="flex gap-1 mt-1">
            {['high', 'medium', 'low'].map(level => (
              <div
                key={level}
                className={cn(
                  'flex-1 h-6 rounded-sm flex items-center justify-center text-xs font-medium',
                  CONFIDENCE_STYLES[level].bg, CONFIDENCE_STYLES[level].text
                )}
                title={`${CONFIDENCE_STYLES[level].label}: ${stats.byConfidence[level]}`}
              >
                {stats.byConfidence[level]}
              </div>
            ))}
          </div>
          <div className="flex gap-1 mt-1 text-[9px] text-[#2D5016]/40">
            <span className="flex-1 text-center">High</span>
            <span className="flex-1 text-center">Med</span>
            <span className="flex-1 text-center">Low</span>
          </div>
        </div>

        {/* By Type */}
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Tag className="w-5 h-5 text-[#2D5016]" />
            <span className="text-sm text-[#2D5016]/60">By Type</span>
          </div>
          <div className="space-y-1 mt-1">
            {['POLICY', 'MEASURE', 'KPI'].map(type => (
              <div key={type} className="flex items-center justify-between">
                <span className={cn('text-xs px-1.5 py-0.5 rounded', TYPE_STYLES[type].bg, TYPE_STYLES[type].text)}>
                  {type}
                </span>
                <span className="text-sm font-medium text-[#2D5016]">{stats.byType[type]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Coverage Summary */}
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Search className="w-5 h-5 text-[#2D5016]" />
            <span className="text-sm text-[#2D5016]/60">Coverage</span>
          </div>
          <p className="text-3xl font-bold text-[#2D5016]">
            {stats.byConfidence.high + stats.byConfidence.medium}
          </p>
          <p className="text-xs text-[#2D5016]/50">
            high/medium confidence
          </p>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="glass-card rounded-xl p-4 space-y-3">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#2D5016]/40" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by topic, question, answer text, or keywords..."
            className="pl-10 h-11 border-[#2D5016]/20 focus:border-[#2D5016] focus:ring-[#2D5016]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-[#2D5016]/10"
            >
              <X className="w-4 h-4 text-[#2D5016]/40" />
            </button>
          )}
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-[#2D5016]/50">
            <Filter className="w-3.5 h-3.5" />
            <span>Confidence:</span>
          </div>
          <div className="flex gap-1">
            {['all', 'high', 'medium', 'low'].map(level => (
              <button
                key={level}
                onClick={() => setFilterConfidence(level)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  filterConfidence === level
                    ? 'bg-[#2D5016] text-white'
                    : 'bg-[#2D5016]/5 text-[#2D5016]/70 hover:bg-[#2D5016]/10'
                )}
              >
                {level === 'all' ? 'All' : CONFIDENCE_STYLES[level].label}
                {level !== 'all' && ` (${stats.byConfidence[level]})`}
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-[#2D5016]/15 hidden sm:block" />

          <div className="flex items-center gap-1.5 text-xs text-[#2D5016]/50">
            <Tag className="w-3.5 h-3.5" />
            <span>Type:</span>
          </div>
          <div className="flex gap-1">
            {['all', 'POLICY', 'MEASURE', 'KPI'].map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  filterType === type
                    ? 'bg-[#2D5016] text-white'
                    : 'bg-[#2D5016]/5 text-[#2D5016]/70 hover:bg-[#2D5016]/10'
                )}
              >
                {type === 'all' ? 'All Types' : type}
                {type !== 'all' && ` (${stats.byType[type]})`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#2D5016]/60">
          Showing {filtered.length} of {answers.length} answer{answers.length !== 1 ? 's' : ''}
        </p>
        {(searchQuery || filterConfidence !== 'all' || filterType !== 'all') && (
          <button
            onClick={() => { setSearchQuery(''); setFilterConfidence('all'); setFilterType('all'); }}
            className="text-xs text-[#2D5016] underline hover:text-[#2D5016]/80"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Answer Cards */}
      <div className="space-y-3">
        {filtered.map(answer => {
          const expanded = expandedIds.has(answer.id);
          const isEditing = editingId === answer.id;
          const confStyle = CONFIDENCE_STYLES[answer.confidence] || CONFIDENCE_STYLES.none;
          const typeStyle = answer.questionType ? TYPE_STYLES[answer.questionType] : null;

          return (
            <div key={answer.id} className="glass-card rounded-xl overflow-hidden">
              {/* Card Header */}
              <button
                onClick={() => toggleExpand(answer.id)}
                className="w-full p-4 flex items-start gap-3 text-left hover:bg-[#2D5016]/5 transition-all"
              >
                <div className="flex-1 min-w-0">
                  {/* Topic */}
                  <p className="text-xs font-medium text-[#2D5016]/50 uppercase tracking-wide mb-1">
                    {answer.topic || 'General'}
                    {answer.framework && (
                      <span className="ml-2 normal-case tracking-normal text-[#2D5016]/30">
                        {answer.framework}
                      </span>
                    )}
                  </p>
                  {/* Question Text - truncated */}
                  <p className="text-sm font-medium text-[#2D5016] leading-snug">
                    {!expanded && (answer.questionText || '').length > 120
                      ? (answer.questionText || '').slice(0, 120) + '...'
                      : answer.questionText || '(No question text)'}
                  </p>
                  {/* Keywords as tags */}
                  {answer.keywords && answer.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {answer.keywords.slice(0, expanded ? undefined : 5).map(kw => (
                        <span
                          key={kw}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-[#2D5016]/10 text-[#2D5016]/50"
                        >
                          {kw}
                        </span>
                      ))}
                      {!expanded && answer.keywords.length > 5 && (
                        <span className="text-[10px] px-1.5 py-0.5 text-[#2D5016]/30">
                          +{answer.keywords.length - 5} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Badges */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {typeStyle && (
                    <span className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded font-medium',
                      typeStyle.bg, typeStyle.text
                    )}>
                      {answer.questionType}
                    </span>
                  )}
                  <span className={cn(
                    'text-xs px-2 py-1 rounded-full font-medium',
                    confStyle.bg, confStyle.text
                  )}>
                    {confStyle.label}
                  </span>
                </div>
              </button>

              {/* Card Body - expanded */}
              {expanded && (
                <div className="px-4 pb-4 border-t border-[#2D5016]/10">
                  {/* Answer content */}
                  {isEditing ? (
                    <div className="mt-3 space-y-2">
                      <Textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        rows={6}
                        className="text-sm border-[#2D5016]/20 focus:border-[#2D5016] focus:ring-[#2D5016]"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => saveEditing(answer)}
                          className="bg-[#2D5016] hover:bg-[#2D5016]/90 text-white text-xs"
                        >
                          <Check className="w-3.5 h-3.5 mr-1" />
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={cancelEditing}
                          className="text-xs text-[#2D5016]/60"
                        >
                          <X className="w-3.5 h-3.5 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 p-3 rounded-lg bg-[#2D5016]/5">
                      <p className="text-sm text-[#2D5016] whitespace-pre-line">
                        {answer.answer || '(No answer text)'}
                      </p>
                    </div>
                  )}

                  {/* Metadata row */}
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-[#2D5016]/50">
                    {answer.framework && (
                      <span>Framework: <strong className="text-[#2D5016]/70">{answer.framework}</strong></span>
                    )}
                    {answer.createdAt && (
                      <span>Created: {new Date(answer.createdAt).toLocaleDateString()}</span>
                    )}
                    {answer.updatedAt && (
                      <span>Updated: {new Date(answer.updatedAt).toLocaleDateString()}</span>
                    )}
                  </div>

                  {/* Action buttons */}
                  {!isEditing && (
                    <div className="mt-3 pt-3 border-t border-[#2D5016]/10 flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEditing(answer)}
                        className="text-xs text-[#2D5016] border-[#2D5016]/20 hover:bg-[#2D5016]/5"
                      >
                        <Edit3 className="w-3.5 h-3.5 mr-1" />
                        Edit Answer
                      </Button>

                      {deleteConfirmId === answer.id ? (
                        <div className="flex items-center gap-1 ml-auto">
                          <span className="text-xs text-red-600 mr-1">Delete this answer?</span>
                          <Button
                            size="sm"
                            onClick={() => handleDelete(answer.id)}
                            className="bg-red-500 hover:bg-red-600 text-white text-xs"
                          >
                            Confirm
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteConfirmId(null)}
                            className="text-xs"
                          >
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteConfirmId(answer.id)}
                          className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 ml-auto"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" />
                          Delete
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty filtered state */}
      {filtered.length === 0 && answers.length > 0 && (
        <div className="text-center py-8 text-[#2D5016]/50">
          <Search className="w-10 h-10 text-[#2D5016]/20 mx-auto mb-3" />
          <p className="font-medium text-[#2D5016]/60">No answers match your search or filters.</p>
          <button
            onClick={() => { setSearchQuery(''); setFilterConfidence('all'); setFilterType('all'); }}
            className="text-[#2D5016] underline text-sm mt-2"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
