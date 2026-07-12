import React, { useState, useEffect } from 'react';
import { getPolicies, savePolicy, addCustomPolicy, deletePolicy } from '@/lib/store';
import { POLICY_STATUSES } from '@/lib/constants';
import { useLanguage } from '@/components/LanguageContext';
import { localizeStatus } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Plus, ExternalLink, Trash2 } from 'lucide-react';

// Display-only maps — stored values ('governance'/'high'/…) stay stable.
const CATEGORIES = [
  { id: 'all', labelKey: 'pol.allTypes' },
  { id: 'governance', labelKey: 'pol.catGovernance' },
  { id: 'environmental', labelKey: 'pol.catEnvironmental' },
  { id: 'social', labelKey: 'pol.catSocial' },
];

const PRIORITIES = [
  { value: 'high', labelKey: 'pol.prioHigh', color: 'border-red-300 text-red-600' },
  { value: 'medium', labelKey: 'pol.prioMedium', color: 'border-amber-300 text-amber-600' },
  { value: 'low', labelKey: 'pol.prioLow', color: 'border-slate-200 text-slate-400' },
];

const CATEGORY_KEYS = { governance: 'pol.catGovernance', environmental: 'pol.catEnvironmental', social: 'pol.catSocial' };

export default function PoliciesSection() {
  const { lang, t } = useLanguage();
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
    if (!confirm(t('pol.deleteConfirm'))) return;
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
        <p className="text-sm text-slate-500">{t('pol.available', { available: stats.available, total: stats.total })}</p>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline"><Plus className="w-4 h-4 mr-1" /> {t('pol.addPolicy')}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('pol.addCustom')}</DialogTitle>
              <DialogDescription>{t('pol.addCustomDesc')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>{t('pol.policyName')}</Label>
                <Input value={newPolicy.name} onChange={(e) => setNewPolicy({ ...newPolicy, name: e.target.value })} placeholder={t('pol.policyNamePh')} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('pol.category')}</Label>
                  <Select value={newPolicy.category} onValueChange={(v) => setNewPolicy({ ...newPolicy, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="governance">{t('pol.catGovernance')}</SelectItem>
                      <SelectItem value="environmental">{t('pol.catEnvironmental')}</SelectItem>
                      <SelectItem value="social">{t('pol.catSocial')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('pol.priority')}</Label>
                  <Select value={newPolicy.priority} onValueChange={(v) => setNewPolicy({ ...newPolicy, priority: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((p) => <SelectItem key={p.value} value={p.value}>{t(p.labelKey)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>{t('respond.cancel')}</Button>
              <Button onClick={handleAdd} disabled={!newPolicy.name.trim()}>{t('pol.addPolicy')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="h-8 text-xs w-[10rem]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => <SelectItem key={cat.id} value={cat.id}>{t(cat.labelKey)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-8 text-xs w-[10rem]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('pol.allStatuses')}</SelectItem>
            {POLICY_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{localizeStatus(s.value, s.label, lang)}</SelectItem>)}
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
                )}>{t(CATEGORY_KEYS[policy.category] || 'pol.catGovernance')}</span>
                <span className={cn('text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-sm border whitespace-nowrap flex-shrink-0', PRIORITIES.find(p => p.value === policy.priority)?.color)}>{t(PRIORITIES.find(p => p.value === policy.priority)?.labelKey || 'pol.prioMedium')}</span>
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
                  {POLICY_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{localizeStatus(s.value, s.label, lang)}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="flex gap-1 flex-1 min-w-[12rem]">
                <Input value={policy.fileLocation || ''} onChange={(e) => handleUpdate({ ...policy, fileLocation: e.target.value })} placeholder={t('pol.urlPh')} className="h-7 text-xs" />
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
          <p className="text-sm text-slate-400 text-center py-4">{t('pol.noMatch')}</p>
        )}
      </div>
    </div>
  );
}
