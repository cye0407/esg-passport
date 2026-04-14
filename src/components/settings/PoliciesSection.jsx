import React, { useState, useEffect } from 'react';
import { getPolicies, savePolicy, addCustomPolicy, deletePolicy } from '@/lib/store';
import { POLICY_STATUSES } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Plus, ExternalLink, Trash2 } from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'All Types' },
  { id: 'governance', label: 'Governance' },
  { id: 'environmental', label: 'Environmental' },
  { id: 'social', label: 'Social' },
];

const PRIORITIES = [
  { value: 'high', label: 'High', color: 'border-red-300 text-red-600' },
  { value: 'medium', label: 'Medium', color: 'border-amber-300 text-amber-600' },
  { value: 'low', label: 'Low', color: 'border-slate-200 text-slate-400' },
];

export default function PoliciesSection() {
  const [policies, setPolicies] = useState([]);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newPolicy, setNewPolicy] = useState({ name: '', category: 'governance', priority: 'medium', notes: '' });

  useEffect(() => { loadPolicies(); }, []);

  const loadPolicies = () => setPolicies(getPolicies());

  const handleUpdate = (policy) => { savePolicy(policy); loadPolicies(); };

  const handleAdd = () => {
    if (!newPolicy.name.trim()) return;
    addCustomPolicy(newPolicy);
    loadPolicies();
    setNewPolicy({ name: '', category: 'governance', priority: 'medium', notes: '' });
    setShowAddDialog(false);
  };

  const handleDelete = (id) => {
    if (!confirm('Delete this policy?')) return;
    deletePolicy(id);
    loadPolicies();
  };

  const filteredPolicies = policies.filter(p =>
    (filterCategory === 'all' || p.category === filterCategory) &&
    (filterStatus === 'all' || p.status === filterStatus)
  );
  const sortedPolicies = [...filteredPolicies].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    if (order[a.priority] !== order[b.priority]) return order[a.priority] - order[b.priority];
    return a.name.localeCompare(b.name);
  });

  const stats = {
    total: policies.length,
    available: policies.filter(p => p.status === 'available').length,
  };

  const getLeftBorderColor = (status) => {
    if (status === 'available') return 'border-l-green-500';
    if (status === 'in_progress') return 'border-l-amber-400';
    if (status === 'not_planned') return 'border-l-slate-200';
    return 'border-l-slate-300';
  };


  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{stats.available}/{stats.total} available</p>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline"><Plus className="w-4 h-4 mr-1" /> Add Policy</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Custom Policy</DialogTitle>
              <DialogDescription>Add a policy not in the default list.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Policy Name</Label>
                <Input value={newPolicy.name} onChange={(e) => setNewPolicy({ ...newPolicy, name: e.target.value })} placeholder="e.g., Social Media Policy" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={newPolicy.category} onValueChange={(v) => setNewPolicy({ ...newPolicy, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="governance">Governance</SelectItem>
                      <SelectItem value="environmental">Environmental</SelectItem>
                      <SelectItem value="social">Social</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={newPolicy.priority} onValueChange={(v) => setNewPolicy({ ...newPolicy, priority: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
              <Button onClick={handleAdd} disabled={!newPolicy.name.trim()}>Add Policy</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="h-8 text-xs w-[10rem]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-8 text-xs w-[10rem]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {POLICY_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Policy List */}
      <div className="space-y-2">
        {sortedPolicies.map((policy) => (
          <div key={policy.id} className={cn('rounded-lg border border-slate-200 border-l-[3px] p-3 transition-all', getLeftBorderColor(policy.status))}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{policy.name}</p>
                <span className={cn('text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-sm border whitespace-nowrap flex-shrink-0',
                  policy.category === 'environmental' && 'border-emerald-300 text-emerald-600',
                  policy.category === 'social' && 'border-sky-300 text-sky-600',
                  policy.category === 'governance' && 'border-violet-300 text-violet-600',
                )}>{policy.category}</span>
                <span className={cn('text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-sm border whitespace-nowrap flex-shrink-0', PRIORITIES.find(p => p.value === policy.priority)?.color)}>{policy.priority}</span>
              </div>
              {policy.id.startsWith('custom_') && (
                <Button variant="ghost" size="sm" onClick={() => handleDelete(policy.id)} className="text-red-500 hover:text-red-700 h-6 w-6 p-0 flex-shrink-0">
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Select value={policy.status} onValueChange={(v) => handleUpdate({ ...policy, status: v })}>
                <SelectTrigger className={'h-7 text-xs w-[11rem]'}><SelectValue /></SelectTrigger>
                <SelectContent>
                  {POLICY_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="flex gap-1 flex-1 min-w-[12rem]">
                <Input value={policy.fileLocation || ''} onChange={(e) => handleUpdate({ ...policy, fileLocation: e.target.value })} placeholder="URL or path..." className="h-7 text-xs" />
                {policy.fileLocation?.startsWith('http') && (
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 flex-shrink-0" onClick={() => window.open(policy.fileLocation, '_blank')}>
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
        {sortedPolicies.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-4">No policies match the current filter.</p>
        )}
      </div>
    </div>
  );
}
