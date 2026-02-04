import React, { useState, useEffect } from 'react';
import { getConfidenceRecords, saveConfidenceRecord } from '@/lib/store';
import { CONFIDENCE_LEVELS, DATA_STATUSES } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Circle,
  Leaf,
  Users,
  Building,
  Filter,
  Info,
  Flag,
} from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'All', icon: Filter },
  { id: 'environmental', label: 'Environmental', icon: Leaf },
  { id: 'social', label: 'Social', icon: Users },
  { id: 'governance', label: 'Governance', icon: Building },
];

export default function Confidence() {
  const [records, setRecords] = useState([]);
  const [filter, setFilter] = useState('all');
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = () => {
    const data = getConfidenceRecords();
    setRecords(data);
  };

  const handleUpdate = (record) => {
    saveConfidenceRecord(record);
    loadRecords();
  };

  const filteredRecords = filter === 'all' 
    ? records 
    : records.filter(r => r.category === filter);

  const stats = {
    total: records.length,
    complete: records.filter(r => r.status === 'complete').length,
    safeToShare: records.filter(r => r.safeToShare).length,
    highConfidence: records.filter(r => r.confidence === 'high').length,
    mediumConfidence: records.filter(r => r.confidence === 'medium').length,
    lowConfidence: records.filter(r => r.confidence === 'low').length,
  };

  const getStatusIcon = (status, safeToShare) => {
    if (safeToShare) return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    if (status === 'complete') return <AlertCircle className="w-5 h-5 text-yellow-600" />;
    if (status === 'in_progress') return <Circle className="w-5 h-5 text-blue-600 fill-blue-200" />;
    return <Circle className="w-5 h-5 text-gray-400" />;
  };

  const getConfidenceColor = (confidence) => {
    switch (confidence) {
      case 'high': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#2D5016] flex items-center gap-2">
          <ShieldCheck className="w-6 h-6" />
          Confidence Tracker
        </h1>
        <p className="text-[#2D5016]/70 mt-1">
          Mark your confidence level for each data point. Only High and Medium confidence data should be shared.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-4">
          <p className="text-sm text-[#2D5016]/60">Safe to Share</p>
          <p className="text-2xl font-bold text-green-600">{stats.safeToShare}/{stats.total}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-sm text-[#2D5016]/60">High Confidence</p>
          <p className="text-2xl font-bold text-green-600">{stats.highConfidence}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-sm text-[#2D5016]/60">Medium Confidence</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.mediumConfidence}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-sm text-[#2D5016]/60">Low / Not Set</p>
          <p className="text-2xl font-bold text-red-600">{stats.lowConfidence + (stats.total - stats.complete)}</p>
        </div>
      </div>

      {/* Info Box */}
      <div className="glass-card rounded-xl p-4 flex items-start gap-3 bg-blue-50/50">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-[#2D5016]/80">
          <p className="font-medium mb-1">Safe to Share Rule:</p>
          <p>Data is "Safe to Share" when Status = <strong>Complete</strong> AND Confidence = <strong>High</strong> or <strong>Medium</strong>. Low confidence data should not be shared with customers.</p>
          <p className="mt-2 flex items-center gap-1">
            <Flag className="w-3.5 h-3.5 text-orange-500" />
            <span>Items marked with a flag are <strong>core metrics</strong> required by ~80% of customer questionnaires. Prioritize these first.</span>
          </p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <Button
            key={cat.id}
            variant={filter === cat.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(cat.id)}
            className={cn(
              filter === cat.id 
                ? 'bg-[#2D5016] text-white' 
                : 'text-[#2D5016] border-[#2D5016]/20'
            )}
          >
            <cat.icon className="w-4 h-4 mr-1" />
            {cat.label}
          </Button>
        ))}
      </div>

      {/* Data Points List */}
      <div className="space-y-3">
        {filteredRecords.map((record) => (
          <div 
            key={record.id} 
            className={cn(
              'glass-card rounded-xl p-4 transition-all',
              record.safeToShare && 'ring-1 ring-green-500/30'
            )}
          >
            <div className="flex items-start gap-4">
              {/* Status Icon */}
              <div className="flex-shrink-0 pt-1">
                {getStatusIcon(record.status, record.safeToShare)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-medium text-[#2D5016] flex items-center gap-1.5">
                      {record.required && <Flag className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" title="Required for 80% of questionnaires" />}
                      {record.label}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn(
                        'inline-block px-2 py-0.5 rounded text-xs',
                        record.category === 'environmental' && 'bg-green-100 text-green-700',
                        record.category === 'social' && 'bg-blue-100 text-blue-700',
                        record.category === 'governance' && 'bg-purple-100 text-purple-700',
                      )}>
                        {record.category}
                      </span>
                      {record.required && (
                        <span className="text-xs text-orange-600 font-medium">Core metric</span>
                      )}
                    </div>
                  </div>
                  
                  {record.safeToShare && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                      <CheckCircle2 className="w-3 h-3" />
                      Safe to Share
                    </span>
                  )}
                </div>

                {/* Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-[#2D5016]/60">Status</Label>
                    <Select
                      value={record.status}
                      onValueChange={(value) => handleUpdate({ ...record, status: value })}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DATA_STATUSES.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-[#2D5016]/60">Confidence</Label>
                    <Select
                      value={record.confidence || ''}
                      onValueChange={(value) => handleUpdate({ ...record, confidence: value })}
                      disabled={record.status === 'not_started'}
                    >
                      <SelectTrigger className={cn('h-9', record.confidence && getConfidenceColor(record.confidence))}>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {CONFIDENCE_LEVELS.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            <div>
                              <span>{level.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-[#2D5016]/60">Notes</Label>
                    <Input
                      value={record.notes || ''}
                      onChange={(e) => handleUpdate({ ...record, notes: e.target.value })}
                      placeholder="Data source, method..."
                      className="h-9"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Confidence Level Guide */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="font-medium text-[#2D5016] mb-4">Confidence Level Guide</h3>
        <div className="space-y-3">
          {CONFIDENCE_LEVELS.map((level) => (
            <div key={level.value} className="flex items-start gap-3">
              <span className={cn('px-2 py-1 rounded text-xs font-medium', level.color)}>
                {level.label}
              </span>
              <p className="text-sm text-[#2D5016]/70">{level.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
