import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getRequests, saveRequest, deleteRequest } from '@/lib/store';
import { REQUEST_PLATFORMS, REQUEST_STATUSES } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Inbox, Plus, ArrowRight, Calendar, Building2, Trash2 } from 'lucide-react';

export default function Requests() {
  const [requests, setRequests] = useState([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newRequest, setNewRequest] = useState({
    customerName: '',
    platform: 'custom',
    dateReceived: new Date().toISOString().split('T')[0],
    deadline: '',
    dataRequested: '',
    status: 'received',
    notes: '',
    questionnaire: { type: 'custom', requestedTopics: [] },
    response: { status: 'not_started', includedDataPoints: [] },
  });

  useEffect(() => { loadRequests(); }, []);

  const loadRequests = () => setRequests(getRequests());

  const handleAdd = () => {
    if (!newRequest.customerName.trim()) return;
    saveRequest(newRequest);
    loadRequests();
    setNewRequest({
      customerName: '', platform: 'custom', dateReceived: new Date().toISOString().split('T')[0],
      deadline: '', dataRequested: '', status: 'received', notes: '',
      questionnaire: { type: 'custom', requestedTopics: [] },
      response: { status: 'not_started', includedDataPoints: [] },
    });
    setShowAddDialog(false);
  };

  const handleDelete = (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Delete this request?')) return;
    deleteRequest(id);
    loadRequests();
  };

  const getStatusBadge = (status) => {
    const found = REQUEST_STATUSES.find(s => s.value === status);
    return found || { label: status, color: 'bg-gray-100 text-gray-600' };
  };

  const getDaysUntil = (deadline) => {
    if (!deadline) return null;
    return Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

  const openRequests = requests.filter(r => r.status !== 'closed' && r.status !== 'sent');
  const closedRequests = requests.filter(r => r.status === 'closed' || r.status === 'sent');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2D5016] flex items-center gap-2">
            <Inbox className="w-6 h-6" />
            Customer Requests
          </h1>
          <p className="text-[#2D5016]/70 mt-1">Track and respond to sustainability data requests</p>
        </div>

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-[#2D5016] hover:bg-[#3d6b1e] text-white">
              <Plus className="w-4 h-4 mr-2" /> Log Request
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Log New Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Customer Name *</Label>
                <Input value={newRequest.customerName} onChange={(e) => setNewRequest({ ...newRequest, customerName: e.target.value })} placeholder="e.g., ACME Corp" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Platform</Label>
                  <Select value={newRequest.platform} onValueChange={(v) => setNewRequest({ ...newRequest, platform: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {REQUEST_PLATFORMS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Deadline</Label>
                  <Input type="date" value={newRequest.deadline} onChange={(e) => setNewRequest({ ...newRequest, deadline: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>What are they asking for?</Label>
                <Input value={newRequest.dataRequested} onChange={(e) => setNewRequest({ ...newRequest, dataRequested: e.target.value })} placeholder="e.g., Scope 1+2 emissions, policies..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
              <Button onClick={handleAdd} disabled={!newRequest.customerName.trim()}>Log Request</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-4">
          <p className="text-sm text-[#2D5016]/60">Total</p>
          <p className="text-2xl font-bold text-[#2D5016]">{requests.length}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-sm text-[#2D5016]/60">Open</p>
          <p className="text-2xl font-bold text-yellow-600">{openRequests.length}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-sm text-[#2D5016]/60">Sent</p>
          <p className="text-2xl font-bold text-green-600">{requests.filter(r => r.status === 'sent').length}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-sm text-[#2D5016]/60">Overdue</p>
          <p className="text-2xl font-bold text-red-600">{openRequests.filter(r => getDaysUntil(r.deadline) < 0).length}</p>
        </div>
      </div>

      {/* Request List */}
      {requests.length === 0 ? (
        <div className="glass-card rounded-2xl p-8 text-center">
          <Inbox className="w-12 h-12 mx-auto text-[#2D5016]/30 mb-4" />
          <h2 className="text-xl font-semibold text-[#2D5016] mb-2">No requests yet</h2>
          <p className="text-[#2D5016]/60 mb-4">Log your first customer request to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const days = getDaysUntil(req.deadline);
            const badge = getStatusBadge(req.status);
            return (
              <Link key={req.id} to={`/requests/${req.id}`} className="block glass-card rounded-xl p-4 hover:shadow-lg transition-all">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <Building2 className="w-4 h-4 text-[#2D5016]/50" />
                      <span className="font-semibold text-[#2D5016]">{req.customerName}</span>
                      <span className={cn('px-2 py-0.5 rounded text-xs', badge.color)}>{badge.label}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-[#2D5016]/60">
                      <span>{REQUEST_PLATFORMS.find(p => p.value === req.platform)?.label || req.platform}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(req.dateReceived)}</span>
                      {req.dataRequested && <span className="truncate max-w-xs">{req.dataRequested}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {req.deadline && (
                      <span className={cn('px-2 py-1 rounded text-xs font-medium', days < 0 ? 'bg-red-100 text-red-700' : days <= 7 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600')}>
                        {days < 0 ? 'Overdue' : `${days}d`}
                      </span>
                    )}
                    <Button variant="ghost" size="sm" onClick={(e) => handleDelete(req.id, e)} className="text-red-500 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <ArrowRight className="w-4 h-4 text-[#2D5016]/30" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
