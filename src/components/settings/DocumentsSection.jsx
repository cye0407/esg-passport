import React, { useState, useEffect } from 'react';
import { getDocuments, saveDocument, deleteDocument } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { FileText, Plus, Trash2, Calendar, Shield, Award, FileSpreadsheet, Building2, X, Check } from 'lucide-react';

const DOC_CATEGORIES = [
  { value: 'certificate', label: 'Certificate', icon: Award },
  { value: 'policy', label: 'Policy Document', icon: Shield },
  { value: 'audit', label: 'Audit Report', icon: FileSpreadsheet },
  { value: 'evidence', label: 'Measurement Evidence', icon: FileText },
  { value: 'report', label: 'Annual/ESG Report', icon: Building2 },
  { value: 'other', label: 'Other', icon: FileText },
];

export default function DocumentsSection() {
  const [documents, setDocuments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editDoc, setEditDoc] = useState(null);
  const [form, setForm] = useState({ name: '', category: 'certificate', validUntil: '', notes: '', referenceNumber: '' });

  useEffect(() => { setDocuments(getDocuments()); }, []);

  const handleSave = () => {
    if (!form.name.trim()) return;
    const doc = editDoc ? { ...editDoc, ...form } : { ...form };
    saveDocument(doc);
    setDocuments(getDocuments());
    setForm({ name: '', category: 'certificate', validUntil: '', notes: '', referenceNumber: '' });
    setEditDoc(null);
    setShowForm(false);
  };

  const handleEdit = (doc) => {
    setEditDoc(doc);
    setForm({ name: doc.name, category: doc.category, validUntil: doc.validUntil || '', notes: doc.notes || '', referenceNumber: doc.referenceNumber || '' });
    setShowForm(true);
  };

  const handleDelete = (id) => { deleteDocument(id); setDocuments(getDocuments()); };

  const isExpired = (date) => date && new Date(date) < new Date();
  const isExpiringSoon = (date) => {
    if (!date) return false;
    const diff = (new Date(date) - new Date()) / (1000 * 60 * 60 * 24);
    return diff > 0 && diff <= 90;
  };

  const grouped = DOC_CATEGORIES.map(cat => ({ ...cat, docs: documents.filter(d => d.category === cat.value) })).filter(g => g.docs.length > 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{documents.length} document{documents.length !== 1 ? 's' : ''} registered</p>
        <Button size="sm" variant="outline" onClick={() => { setShowForm(true); setEditDoc(null); setForm({ name: '', category: 'certificate', validUntil: '', notes: '', referenceNumber: '' }); }}>
          <Plus className="w-4 h-4 mr-1" /> Add Document
        </Button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="rounded-lg border border-slate-200 p-4 space-y-3 bg-slate-50">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-900">{editDoc ? 'Edit Document' : 'Add Document'}</p>
            <button onClick={() => { setShowForm(false); setEditDoc(null); }} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-slate-500">Name *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g., ISO 14001 Certificate" className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs text-slate-500">Category</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>{DOC_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-slate-500">Valid Until</Label>
              <Input type="date" value={form.validUntil} onChange={e => setForm(f => ({ ...f, validUntil: e.target.value }))} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs text-slate-500">Reference Number</Label>
              <Input value={form.referenceNumber} onChange={e => setForm(f => ({ ...f, referenceNumber: e.target.value }))} placeholder="e.g., CERT-2024-001" className="h-8 text-sm" />
            </div>
          </div>
          <div>
            <Label className="text-xs text-slate-500">Notes</Label>
            <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Additional details..." rows={2} className="text-sm" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => { setShowForm(false); setEditDoc(null); }}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={!form.name.trim()}><Check className="w-3 h-3 mr-1" /> {editDoc ? 'Update' : 'Save'}</Button>
          </div>
        </div>
      )}

      {/* Document List */}
      {documents.length === 0 && !showForm ? (
        <p className="text-sm text-slate-400 text-center py-4">No documents registered yet. Add certificates, policies, and audit reports.</p>
      ) : (
        <div className="space-y-3">
          {grouped.map(group => (
            <div key={group.value}>
              <p className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                <group.icon className="w-3 h-3" /> {group.label} ({group.docs.length})
              </p>
              <div className="space-y-1">
                {group.docs.map(doc => (
                  <div key={doc.id} className="rounded-lg border border-slate-200 p-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{doc.name}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-slate-400">
                        {doc.referenceNumber && <span>Ref: {doc.referenceNumber}</span>}
                        {doc.validUntil && (
                          <span className={cn('flex items-center gap-1 px-1.5 py-0.5 rounded',
                            isExpired(doc.validUntil) ? 'bg-red-100 text-red-700' :
                            isExpiringSoon(doc.validUntil) ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          )}>
                            <Calendar className="w-3 h-3" />
                            {isExpired(doc.validUntil) ? 'Expired' : `Valid until ${new Date(doc.validUntil).toLocaleDateString()}`}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(doc)} className="text-slate-600 h-7 text-xs">Edit</Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(doc.id)} className="text-red-500 hover:text-red-700 h-7 w-7 p-0">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Expiry Alerts */}
      {documents.some(d => isExpired(d.validUntil) || isExpiringSoon(d.validUntil)) && (
        <div className="rounded-lg border-l-4 border-yellow-500 bg-yellow-50 p-3">
          <p className="text-sm font-medium text-slate-900 mb-1">Expiry Alerts</p>
          <div className="space-y-0.5 text-xs">
            {documents.filter(d => isExpired(d.validUntil)).map(d => (
              <p key={d.id} className="text-red-600">{d.name} — expired</p>
            ))}
            {documents.filter(d => isExpiringSoon(d.validUntil)).map(d => (
              <p key={d.id} className="text-yellow-600">{d.name} — expires soon</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
