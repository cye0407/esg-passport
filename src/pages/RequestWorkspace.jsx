import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getRequestById, saveRequest, getConfidenceRecords, getPolicies, getAnnualTotals } from '@/lib/store';
import { REQUEST_STATUSES, QUESTIONNAIRE_TOPICS, QUESTIONNAIRE_TEMPLATES } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { ArrowLeft, Building2, Calendar, CheckCircle2, AlertCircle, XCircle, Download, Send, Clock } from 'lucide-react';

export default function RequestWorkspace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [confidence, setConfidence] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [selectedTopics, setSelectedTopics] = useState([]);

  const currentYear = new Date().getFullYear().toString();

  useEffect(() => {
    const req = getRequestById(id);
    if (!req) { navigate('/requests'); return; }
    setRequest(req);
    setSelectedTopics(req.questionnaire?.requestedTopics || []);
    setConfidence(getConfidenceRecords());
    setPolicies(getPolicies());
  }, [id, navigate]);

  const handleUpdate = (updates) => {
    const updated = { ...request, ...updates };
    saveRequest(updated);
    setRequest(updated);
  };

  const handleTopicToggle = (topicId) => {
    const newTopics = selectedTopics.includes(topicId)
      ? selectedTopics.filter(t => t !== topicId)
      : [...selectedTopics, topicId];
    setSelectedTopics(newTopics);
    handleUpdate({ questionnaire: { ...request.questionnaire, requestedTopics: newTopics } });
  };

  const applyTemplate = (templateKey) => {
    const template = QUESTIONNAIRE_TEMPLATES[templateKey];
    if (template) {
      setSelectedTopics(template.topics);
      handleUpdate({ questionnaire: { type: templateKey, requestedTopics: template.topics } });
    }
  };

  if (!request) return <div className="p-8 text-center text-[#2D5016]/50">Loading...</div>;

  // Analyze readiness for selected topics
  const getDataPointsForTopics = () => {
    const dataPoints = new Set();
    selectedTopics.forEach(topicId => {
      const topic = QUESTIONNAIRE_TOPICS.find(t => t.id === topicId);
      if (topic) topic.dataPoints.forEach(dp => dataPoints.add(dp));
    });
    return Array.from(dataPoints);
  };

  const requiredDataPoints = getDataPointsForTopics();
  const readyDataPoints = requiredDataPoints.filter(dp => {
    const conf = confidence.find(c => c.id === dp);
    return conf?.safeToShare;
  });
  const needsAttention = requiredDataPoints.filter(dp => {
    const conf = confidence.find(c => c.id === dp);
    return conf && !conf.safeToShare && conf.status !== 'not_started';
  });
  const notTracked = requiredDataPoints.filter(dp => {
    const conf = confidence.find(c => c.id === dp);
    return !conf || conf.status === 'not_started';
  });

  const getDaysUntil = (deadline) => {
    if (!deadline) return null;
    return Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
  };

  const days = getDaysUntil(request.deadline);
  const statusBadge = REQUEST_STATUSES.find(s => s.value === request.status) || { label: request.status, color: 'bg-gray-100' };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/requests">
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
        </Link>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="w-6 h-6 text-[#2D5016]" />
              <h1 className="text-2xl font-bold text-[#2D5016]">{request.customerName}</h1>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-[#2D5016]/60">
              <span className={cn('px-2 py-1 rounded', statusBadge.color)}>{statusBadge.label}</span>
              <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Received: {new Date(request.dateReceived).toLocaleDateString()}</span>
              {request.deadline && (
                <span className={cn('flex items-center gap-1 px-2 py-1 rounded', days < 0 ? 'bg-red-100 text-red-700' : days <= 7 ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700')}>
                  <Clock className="w-4 h-4" />
                  {days < 0 ? `Overdue by ${Math.abs(days)}d` : `Due in ${days}d`}
                </span>
              )}
            </div>
          </div>
          <Select value={request.status} onValueChange={(v) => handleUpdate({ status: v })}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {REQUEST_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Quick Template Selector */}
        <div className="mb-6">
          <Label className="text-sm text-[#2D5016]/60 mb-2 block">Quick select questionnaire type:</Label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(QUESTIONNAIRE_TEMPLATES).map(([key, template]) => (
              <Button key={key} variant="outline" size="sm" onClick={() => applyTemplate(key)}
                className={cn(request.questionnaire?.type === key && 'bg-[#2D5016] text-white')}>
                {template.name}
              </Button>
            ))}
          </div>
        </div>

        {/* What They're Asking For */}
        <div className="mb-6">
          <Label className="text-sm font-medium text-[#2D5016] mb-3 block">What they're asking for:</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {QUESTIONNAIRE_TOPICS.map(topic => (
              <label key={topic.id} className="flex items-center gap-2 p-2 rounded-lg border border-[#2D5016]/10 hover:bg-[#2D5016]/5 cursor-pointer">
                <Checkbox checked={selectedTopics.includes(topic.id)} onCheckedChange={() => handleTopicToggle(topic.id)} />
                <span className="text-sm text-[#2D5016]">{topic.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Readiness Analysis */}
      {selectedTopics.length > 0 && (
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-[#2D5016] mb-4">Your Data Readiness</h2>
          
          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-green-50 border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800">Ready to Share ({readyDataPoints.length})</span>
              </div>
              <div className="text-sm text-green-700">
                {readyDataPoints.length > 0 ? readyDataPoints.map(dp => {
                  const conf = confidence.find(c => c.id === dp);
                  return conf?.label;
                }).join(', ') : 'None yet'}
              </div>
            </div>
            
            <div className="p-4 rounded-xl bg-yellow-50 border border-yellow-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <span className="font-medium text-yellow-800">Needs Attention ({needsAttention.length})</span>
              </div>
              <div className="text-sm text-yellow-700">
                {needsAttention.length > 0 ? needsAttention.map(dp => {
                  const conf = confidence.find(c => c.id === dp);
                  return conf?.label;
                }).join(', ') : 'None'}
              </div>
            </div>
            
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-5 h-5 text-gray-500" />
                <span className="font-medium text-gray-700">Not Tracked ({notTracked.length})</span>
              </div>
              <div className="text-sm text-gray-600">
                {notTracked.length > 0 ? notTracked.map(dp => {
                  const conf = confidence.find(c => c.id === dp);
                  return conf?.label || dp;
                }).join(', ') : 'All tracked!'}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link to="/export">
              <Button className="bg-[#2D5016] hover:bg-[#3d6b1e] text-white">
                <Download className="w-4 h-4 mr-2" /> Generate Response Pack
              </Button>
            </Link>
            <Button variant="outline" onClick={() => handleUpdate({ status: 'sent', response: { ...request.response, sentAt: new Date().toISOString() } })}>
              <Send className="w-4 h-4 mr-2" /> Mark as Sent
            </Button>
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="glass-card rounded-2xl p-6">
        <Label className="text-sm font-medium text-[#2D5016] mb-2 block">Notes</Label>
        <Textarea
          value={request.notes || ''}
          onChange={(e) => handleUpdate({ notes: e.target.value })}
          placeholder="Add notes about this request..."
          rows={3}
        />
      </div>
    </div>
  );
}
