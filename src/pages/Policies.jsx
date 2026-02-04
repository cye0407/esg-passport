import React, { useState, useEffect } from 'react';
import { getPolicies, savePolicy, addCustomPolicy, deletePolicy } from '@/lib/store';
import { POLICY_STATUSES } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { 
  FileText, 
  Plus, 
  ExternalLink, 
  CheckCircle2,
  Circle,
  AlertCircle,
  Trash2,
  Filter,
  Leaf,
  Users,
  Building,
} from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'All', icon: Filter },
  { id: 'governance', label: 'Governance', icon: Building },
  { id: 'environmental', label: 'Environmental', icon: Leaf },
  { id: 'social', label: 'Social', icon: Users },
];

const PRIORITIES = [
  { value: 'high', label: 'High', color: 'bg-red-100 text-red-700' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-700' },
];

export default function Policies() {
  const [policies, setPolicies] = useState([]);
  const [filter, setFilter] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newPolicy, setNewPolicy] = useState({
    name: '',
    category: 'governance',
    priority: 'medium',
    notes: '',
  });

  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = () => {
    const data = getPolicies();
    setPolicies(data);
  };

  const handleUpdate = (policy) => {
    savePolicy(policy);
    loadPolicies();
  };

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

  const filteredPolicies = filter === 'all' 
    ? policies 
    : policies.filter(p => p.category === filter);

  // Sort by priority, then by name
  const sortedPolicies = [...filteredPolicies].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return a.name.localeCompare(b.name);
  });

  const stats = {
    total: policies.length,
    exists: policies.filter(p => p.exists).length,
    approved: policies.filter(p => p.status === 'approved' || p.status === 'published').length,
    highPriority: policies.filter(p => p.priority === 'high').length,
    highPriorityDone: policies.filter(p => p.priority === 'high' && (p.status === 'approved' || p.status === 'published')).length,
  };

  const getStatusIcon = (policy) => {
    if (policy.status === 'approved' || policy.status === 'published') {
      return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    }
    if (policy.status === 'drafting' || policy.status === 'under_review') {
      return <AlertCircle className="w-5 h-5 text-yellow-600" />;
    }
    return <Circle className="w-5 h-5 text-gray-400" />;
  };

  const getStatusColor = (status) => {
    const found = POLICY_STATUSES.find(s => s.value === status);
    return found?.color || 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2D5016] flex items-center gap-2">
            <FileText className="w-6 h-6" />
            Policy Tracker
          </h1>
          <p className="text-[#2D5016]/70 mt-1">
            Track your policies and documents. High priority policies are commonly requested.
          </p>
        </div>

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-[#2D5016] hover:bg-[#3d6b1e] text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Policy
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Custom Policy</DialogTitle>
              <DialogDescription>
                Add a policy or document that's not in the default list.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Policy Name</Label>
                <Input
                  value={newPolicy.name}
                  onChange={(e) => setNewPolicy({ ...newPolicy, name: e.target.value })}
                  placeholder="e.g., Social Media Policy"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={newPolicy.category}
                    onValueChange={(value) => setNewPolicy({ ...newPolicy, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="governance">Governance</SelectItem>
                      <SelectItem value="environmental">Environmental</SelectItem>
                      <SelectItem value="social">Social</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={newPolicy.priority}
                    onValueChange={(value) => setNewPolicy({ ...newPolicy, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((p) => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Input
                  value={newPolicy.notes}
                  onChange={(e) => setNewPolicy({ ...newPolicy, notes: e.target.value })}
                  placeholder="Optional notes"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
              <Button onClick={handleAdd} disabled={!newPolicy.name.trim()}>Add Policy</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-4">
          <p className="text-sm text-[#2D5016]/60">Total Policies</p>
          <p className="text-2xl font-bold text-[#2D5016]">{stats.total}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-sm text-[#2D5016]/60">Documented</p>
          <p className="text-2xl font-bold text-blue-600">{stats.exists}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-sm text-[#2D5016]/60">Approved</p>
          <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-sm text-[#2D5016]/60">High Priority Done</p>
          <p className="text-2xl font-bold text-[#2D5016]">{stats.highPriorityDone}/{stats.highPriority}</p>
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

      {/* Policies List */}
      <div className="space-y-3">
        {sortedPolicies.map((policy) => (
          <div 
            key={policy.id} 
            className={cn(
              'glass-card rounded-xl p-4 transition-all',
              (policy.status === 'approved' || policy.status === 'published') && 'ring-1 ring-green-500/30'
            )}
          >
            <div className="flex items-start gap-4">
              {/* Status Icon */}
              <div className="flex-shrink-0 pt-1">
                {getStatusIcon(policy)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-medium text-[#2D5016]">{policy.name}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className={cn(
                        'inline-block px-2 py-0.5 rounded text-xs',
                        policy.category === 'environmental' && 'bg-green-100 text-green-700',
                        policy.category === 'social' && 'bg-blue-100 text-blue-700',
                        policy.category === 'governance' && 'bg-purple-100 text-purple-700',
                      )}>
                        {policy.category}
                      </span>
                      <span className={cn(
                        'inline-block px-2 py-0.5 rounded text-xs',
                        PRIORITIES.find(p => p.value === policy.priority)?.color
                      )}>
                        {policy.priority} priority
                      </span>
                      {policy.isCertification && (
                        <span className="inline-block px-2 py-0.5 rounded text-xs bg-indigo-100 text-indigo-700">
                          Certification
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {policy.id.startsWith('custom_') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(policy.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {/* Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`exists-${policy.id}`}
                      checked={policy.exists}
                      onCheckedChange={(checked) => handleUpdate({ ...policy, exists: checked })}
                    />
                    <Label htmlFor={`exists-${policy.id}`} className="text-sm text-[#2D5016]">
                      Exists
                    </Label>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-[#2D5016]/60">Status</Label>
                    <Select
                      value={policy.status}
                      onValueChange={(value) => handleUpdate({ ...policy, status: value })}
                    >
                      <SelectTrigger className={cn('h-9', getStatusColor(policy.status))}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {POLICY_STATUSES.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-xs text-[#2D5016]/60">File Location / Link</Label>
                    <div className="flex gap-2">
                      <Input
                        value={policy.fileLocation || ''}
                        onChange={(e) => handleUpdate({ ...policy, fileLocation: e.target.value })}
                        placeholder="URL or file path..."
                        className="h-9"
                      />
                      {policy.fileLocation && policy.fileLocation.startsWith('http') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 px-2"
                          onClick={() => window.open(policy.fileLocation, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {policy.notes && (
                  <p className="text-sm text-[#2D5016]/60 mt-2 italic">{policy.notes}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
