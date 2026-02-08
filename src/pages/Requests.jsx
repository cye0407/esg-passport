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
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
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
    if (confirmDeleteId === id) {
      deleteRequest(id);
      loadRequests();
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId(null), 3000);
    }
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
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Inbox className="w-6 h-6" />
            Customer Requests
          </h1>
          <p className="text-slate-500 text-sm mt-1">Track and respond to sustainability data requests</p>
        </div>

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-slate-900 hover:bg-slate-800 text-white">
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
              <Button className="bg-slate-900 hover:bg-slate-800 text-white" onClick={handleAdd} disabled={!newRequest.customerName.trim()}>Log Request</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-none p-4">
          <p className="text-sm text-slate-500">Total</p>
          <p className="text-2xl font-bold text-slate-900">{requests.length}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-none p-4">
          <div className="flex items-center gap-2">
            <p className="text-sm text-slate-500">Open</p>
            {openRequests.length > 0 && <span className="w-2 h-2 rounded-full bg-amber-500" />}
          </div>
          <p className="text-2xl font-bold text-slate-900">{openRequests.length}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-none p-4">
          <div className="flex items-center gap-2">
            <p className="text-sm text-slate-500">Sent</p>
            {requests.filter(r => r.status === 'sent').length > 0 && <span className="w-2 h-2 rounded-full bg-green-500" />}
          </div>
          <p className="text-2xl font-bold text-slate-900">{requests.filter(r => r.status === 'sent').length}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-none p-4">
          <div className="flex items-center gap-2">
            <p className="text-sm text-slate-500">Overdue</p>
            {openRequests.filter(r => getDaysUntil(r.deadline) < 0).length > 0 && <span className="w-2 h-2 rounded-full bg-red-500" />}
          </div>
          <p className="text-2xl font-bold text-slate-900">{openRequests.filter(r => getDaysUntil(r.deadline) < 0).length}</p>
        </div>
      </div>

      {/* Request List */}
      {requests.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-none p-8 text-center">
          <Inbox className="w-12 h-12 mx-auto text-slate-300 mb-4" />
          <h2 className="text-lg font-semibold text-slate-900 mb-2">No requests yet</h2>
          <p className="text-slate-500 text-sm mb-4">Log your first customer request to get started</p>
        </div>
      ) : (
        <div className="space-y-2">
          {requests.map((req) => {
            const days = getDaysUntil(req.deadline);
            const badge = getStatusBadge(req.status);
            const isDeleting = confirmDeleteId === req.id;
            return (
              <Link
                key={req.id}
                to={`/requests/${req.id}`}
                className={cn(
                  'block bg-white border rounded-none p-4 transition-colors group',
                  isDeleting ? 'border-red-300 bg-red-50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                )}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      <span className="font-medium text-slate-900 text-sm">{req.customerName}</span>
                      <span className={cn('px-2 py-0.5 rounded text-xs font-medium', badge.color)}>{badge.label}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500 ml-7">
                      <span>{REQUEST_PLATFORMS.find(p => p.value === req.platform)?.label || req.platform}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(req.dateReceived)}</span>
                      {req.dataRequested && <span className="truncate max-w-xs">{req.dataRequested}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {req.deadline && (
                      <span className={cn('px-2 py-0.5 rounded text-xs font-medium', days < 0 ? 'bg-red-50 text-red-700' : days <= 7 ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600')}>
                        {days < 0 ? 'Overdue' : `${days}d`}
                      </span>
                    )}
                    {isDeleting ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={(e) => handleDelete(req.id, e)}
                        className="text-xs"
                      >
                        Confirm
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDelete(req.id, e)}
                        className="text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                    <ArrowRight className="w-4 h-4 text-slate-300" />
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
