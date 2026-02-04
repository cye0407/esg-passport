import React, { useState, useEffect } from 'react';
import { getDocuments, saveDocument, deleteDocument } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  FileText, Plus, Trash2, Calendar, Shield, Award,
  FileSpreadsheet, Building2, X, Check,
} from 'lucide-react';

const DOC_CATEGORIES = [
  { value: 'certificate', label: 'Certificate', icon: Award },
  { value: 'policy', label: 'Policy Document', icon: Shield },
  { value: 'audit', label: 'Audit Report', icon: FileSpreadsheet },
  { value: 'evidence', label: 'Measurement Evidence', icon: FileText },
  { value: 'report', label: 'Annual/ESG Report', icon: Building2 },
  { value: 'other', label: 'Other', icon: FileText },
];

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editDoc, setEditDoc] = useState(null);
  const [form, setForm] = useState({ name: '', category: 'certificate', validUntil: '', notes: '', referenceNumber: '' });

  useEffect(() => {
    setDocuments(getDocuments());
  }, []);

  const handleSave = () => {
    if (!form.name.trim()) return;
    const doc = editDoc ? { ...editDoc, ...form } : { ...form };
    const saved = saveDocument(doc);
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

  const handleDelete = (id) => {
    deleteDocument(id);
    setDocuments(getDocuments());
  };

  const isExpired = (date) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  const isExpiringSoon = (date) => {
    if (!date) return false;
    const d = new Date(date);
    const now = new Date();
    const diff = (d - now) / (1000 * 60 * 60 * 24);
    return diff > 0 && diff <= 90;
  };

  const grouped = DOC_CATEGORIES.map(cat => ({
    ...cat,
    docs: documents.filter(d => d.category === cat.value),
  })).filter(g => g.docs.length > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#2D5016] flex items-center gap-2">
            <FileText className="w-6 h-6" />
            Document Registry
          </h1>
          <p className="text-[#2D5016]/60 mt-1">
            Track certificates, policies, and evidence documents. Reference them in questionnaire responses.
          </p>
        </div>
        <Button onClick={() => { setShowForm(true); setEditDoc(null); setForm({ name: '', category: 'certificate', validUntil: '', notes: '', referenceNumber: '' }); }} className="bg-[#2D5016] text-white">
          <Plus className="w-4 h-4 mr-2" /> Add Document
        </Button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="glass-card rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[#2D5016]">{editDoc ? 'Edit Document' : 'Add Document'}</h3>
            <button onClick={() => { setShowForm(false); setEditDoc(null); }} className="text-[#2D5016]/40 hover:text-[#2D5016]">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-[#2D5016]/70">Document Name *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g., ISO 14001 Certificate" />
            </div>
            <div>
              <Label className="text-sm text-[#2D5016]/70">Category</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DOC_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm text-[#2D5016]/70">Valid Until</Label>
              <Input type="date" value={form.validUntil} onChange={e => setForm(f => ({ ...f, validUntil: e.target.value }))} />
            </div>
            <div>
              <Label className="text-sm text-[#2D5016]/70">Reference Number</Label>
              <Input value={form.referenceNumber} onChange={e => setForm(f => ({ ...f, referenceNumber: e.target.value }))} placeholder="e.g., CERT-2024-001" />
            </div>
          </div>
          <div>
            <Label className="text-sm text-[#2D5016]/70">Notes</Label>
            <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Additional details, file location, issuing body..." rows={2} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setShowForm(false); setEditDoc(null); }}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name.trim()} className="bg-[#2D5016] text-white">
              <Check className="w-4 h-4 mr-2" /> {editDoc ? 'Update' : 'Save'}
            </Button>
          </div>
        </div>
      )}

      {/* Document List */}
      {documents.length === 0 && !showForm ? (
        <div className="text-center py-16 text-[#2D5016]/50">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No documents registered yet</p>
          <p className="text-sm mt-1">Add certificates, policies, and audit reports to reference in your ESG responses.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(group => (
            <div key={group.value}>
              <h3 className="text-sm font-medium text-[#2D5016]/60 mb-2 flex items-center gap-2">
                <group.icon className="w-4 h-4" /> {group.label} ({group.docs.length})
              </h3>
              <div className="space-y-2">
                {group.docs.map(doc => (
                  <div key={doc.id} className="glass-card rounded-xl p-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#2D5016] truncate">{doc.name}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-[#2D5016]/50">
                        {doc.referenceNumber && <span>Ref: {doc.referenceNumber}</span>}
                        {doc.validUntil && (
                          <span className={cn(
                            'flex items-center gap-1 px-1.5 py-0.5 rounded',
                            isExpired(doc.validUntil) ? 'bg-red-100 text-red-700' :
                            isExpiringSoon(doc.validUntil) ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          )}>
                            <Calendar className="w-3 h-3" />
                            {isExpired(doc.validUntil) ? 'Expired' : `Valid until ${new Date(doc.validUntil).toLocaleDateString()}`}
                          </span>
                        )}
                        {doc.notes && <span className="truncate max-w-[200px]">{doc.notes}</span>}
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(doc)} className="text-[#2D5016]">Edit</Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(doc.id)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Expiry Summary */}
      {documents.some(d => isExpired(d.validUntil) || isExpiringSoon(d.validUntil)) && (
        <div className="glass-card rounded-xl p-4 border-l-4 border-yellow-500">
          <h3 className="font-medium text-[#2D5016] mb-2">Expiry Alerts</h3>
          <div className="space-y-1 text-sm">
            {documents.filter(d => isExpired(d.validUntil)).map(d => (
              <p key={d.id} className="text-red-600">{d.name} — expired {new Date(d.validUntil).toLocaleDateString()}</p>
            ))}
            {documents.filter(d => isExpiringSoon(d.validUntil)).map(d => (
              <p key={d.id} className="text-yellow-600">{d.name} — expires {new Date(d.validUntil).toLocaleDateString()}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
