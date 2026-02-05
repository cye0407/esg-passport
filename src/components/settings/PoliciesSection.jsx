import React, { useState, useEffect } from 'react';
import { getPolicies, savePolicy, addCustomPolicy, deletePolicy } from '@/lib/store';
import { POLICY_STATUSES } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Plus, ExternalLink, CheckCircle2, Circle, AlertCircle, Trash2, Filter, Users, Building } from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'All', icon: Filter },
  { id: 'governance', label: 'Governance', icon: Building },
  { id: 'environmental', label: 'Environmental', icon: Filter },
  { id: 'social', label: 'Social', icon: Users },
];

const PRIORITIES = [
  { value: 'high', label: 'High', color: 'bg-red-100 text-red-700' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-700' },
];

export default function PoliciesSection() {
  const [policies, setPolicies] = useState([]);
  const [filter, setFilter] = useState('all');
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

  const filteredPolicies = filter === 'all' ? policies : policies.filter(p => p.category === filter);
  const sortedPolicies = [...filteredPolicies].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    if (order[a.priority] !== order[b.priority]) return order[a.priority] - order[b.priority];
    return a.name.localeCompare(b.name);
  });

  const stats = {
    total: policies.length,
    approved: policies.filter(p => p.status === 'approved' || p.status === 'published').length,
  };

  const getStatusIcon = (policy) => {
    if (policy.status === 'approved' || policy.status === 'published') return <CheckCircle2 className="w-4 h-4 text-green-600" />;
    if (policy.status === 'drafting' || policy.status === 'under_review') return <AlertCircle className="w-4 h-4 text-yellow-600" />;
    return <Circle className="w-4 h-4 text-gray-400" />;
  };

  const getStatusColor = (status) => {
    const found = POLICY_STATUSES.find(s => s.value === status);
    return found?.color || 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{stats.approved}/{stats.total} approved</p>
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
      <div className="flex flex-wrap gap-1">
        {CATEGORIES.map((cat) => (
          <button key={cat.id} onClick={() => setFilter(cat.id)}
            className={cn('px-2 py-1 rounded text-xs font-medium transition-all',
              filter === cat.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            )}>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Policy List */}
      <div className="space-y-2">
        {sortedPolicies.map((policy) => (
          <div key={policy.id} className={cn('rounded-lg border p-3 transition-all', (policy.status === 'approved' || policy.status === 'published') ? 'border-green-200 bg-green-50/30' : 'border-slate-200')}>
            <div className="flex items-start gap-3">
              <div className="pt-0.5">{getStatusIcon(policy)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{policy.name}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <span className={cn('text-[10px] px-1.5 py-0.5 rounded',
                        policy.category === 'environmental' && 'bg-green-100 text-green-700',
                        policy.category === 'social' && 'bg-blue-100 text-blue-700',
                        policy.category === 'governance' && 'bg-purple-100 text-purple-700',
                      )}>{policy.category}</span>
                      <span className={cn('text-[10px] px-1.5 py-0.5 rounded', PRIORITIES.find(p => p.value === policy.priority)?.color)}>{policy.priority}</span>
                    </div>
                  </div>
                  {policy.id.startsWith('custom_') && (
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(policy.id)} className="text-red-500 hover:text-red-700 h-6 w-6 p-0">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                  <div className="flex items-center gap-2">
                    <Checkbox id={`exists-${policy.id}`} checked={policy.exists} onCheckedChange={(checked) => handleUpdate({ ...policy, exists: checked })} />
                    <Label htmlFor={`exists-${policy.id}`} className="text-xs text-slate-600">Exists</Label>
                  </div>
                  <Select value={policy.status} onValueChange={(v) => handleUpdate({ ...policy, status: v })}>
                    <SelectTrigger className={cn('h-7 text-xs', getStatusColor(policy.status))}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {POLICY_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-1">
                    <Input value={policy.fileLocation || ''} onChange={(e) => handleUpdate({ ...policy, fileLocation: e.target.value })} placeholder="URL or path..." className="h-7 text-xs" />
                    {policy.fileLocation?.startsWith('http') && (
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => window.open(policy.fileLocation, '_blank')}>
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
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
