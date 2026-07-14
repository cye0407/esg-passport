import React, { useState, useEffect } from 'react';
import { getDocuments, saveDocument, deleteDocument } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/components/LanguageContext';
import { localizeCertType } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { FileText, Plus, Trash2, Calendar, Shield, Award, FileSpreadsheet, Building2, X, Check } from 'lucide-react';

// Display-only labels — stored `value` ('certificate' etc.) stays stable.
const DOC_CATEGORIES = [
  { value: 'certificate', labelKey: 'doc.catCertificate', icon: Award },
  { value: 'policy', labelKey: 'doc.catPolicy', icon: Shield },
  { value: 'audit', labelKey: 'doc.catAudit', icon: FileSpreadsheet },
  { value: 'evidence', labelKey: 'doc.catEvidence', icon: FileText },
  { value: 'report', labelKey: 'doc.catReport', icon: Building2 },
  { value: 'other', labelKey: 'doc.catOther', icon: FileText },
];

const CERTIFICATE_TYPES = [
  'B Corp Certification',
  'CDP Score Letter',
  'Cradle to Cradle',
  'EcoVadis Medal',
  'EMAS (EU Eco-Management)',
  'Fairtrade Certification',
  'FSC (Forest Stewardship Council)',
  'GRS (Global Recycled Standard)',
  'ISO 9001 (Quality Management)',
  'ISO 14001 (Environmental Management)',
  'ISO 27001 (Information Security)',
  'ISO 45001 (Occupational Health & Safety)',
  'ISO 50001 (Energy Management)',
  'OEKO-TEX',
  'PEFC (Sustainable Forestry)',
  'SA8000 (Social Accountability)',
  'Other',
];

export default function DocumentsSection() {
  const { lang, t } = useLanguage();
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
        <p className="text-sm text-slate-500">{documents.length === 1 ? t('doc.registeredOne', { count: documents.length }) : t('doc.registered', { count: documents.length })}</p>
        <Button size="sm" variant="outline" onClick={() => { setShowForm(true); setEditDoc(null); setForm({ name: '', category: 'certificate', validUntil: '', notes: '', referenceNumber: '' }); }}>
          <Plus className="w-4 h-4 mr-1" /> {t('doc.add')}
        </Button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="rounded-lg border border-slate-200 p-4 space-y-3 bg-slate-50">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-900">{editDoc ? t('doc.edit') : t('doc.add')}</p>
            <button onClick={() => { setShowForm(false); setEditDoc(null); }} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-slate-500">{t('doc.category')}</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>{DOC_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{t(c.labelKey)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {form.category === 'certificate' ? (
              <div>
                <Label className="text-xs text-slate-500">{t('doc.certType')}</Label>
                <Select
                  value={CERTIFICATE_TYPES.includes(form.name) ? form.name : 'Other'}
                  onValueChange={v => setForm(f => ({ ...f, name: v === 'Other' ? '' : v }))}
                >
                  <SelectTrigger className="h-8 text-sm"><SelectValue placeholder={t('doc.selectType')} /></SelectTrigger>
                  <SelectContent>{CERTIFICATE_TYPES.map(ct => <SelectItem key={ct} value={ct}>{localizeCertType(ct, lang)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            ) : (
              <div>
                <Label className="text-xs text-slate-500">{t('doc.name')}</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder={t('doc.namePh')} className="h-8 text-sm" />
              </div>
            )}
            <div>
              <Label className="text-xs text-slate-500">{t('doc.validUntil')}</Label>
              <Input type="date" value={form.validUntil} onChange={e => setForm(f => ({ ...f, validUntil: e.target.value }))} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs text-slate-500">{t('doc.refNumber')}</Label>
              <Input value={form.referenceNumber} onChange={e => setForm(f => ({ ...f, referenceNumber: e.target.value }))} placeholder={t('doc.refPh')} className="h-8 text-sm" />
            </div>
          </div>
          {form.category === 'certificate' && !CERTIFICATE_TYPES.includes(form.name) && (
            <div>
              <Label className="text-xs text-slate-500">{t('doc.certName')}</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder={t('doc.certNamePh')} className="h-8 text-sm" />
            </div>
          )}
          <div>
            <Label className="text-xs text-slate-500">{t('doc.notes')}</Label>
            <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder={t('doc.notesPh')} rows={2} className="text-sm" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => { setShowForm(false); setEditDoc(null); }}>{t('respond.cancel')}</Button>
            <Button size="sm" onClick={handleSave} disabled={!form.name.trim()}><Check className="w-3 h-3 mr-1" /> {editDoc ? t('doc.update') : t('doc.save')}</Button>
          </div>
        </div>
      )}

      {/* Document List */}
      {documents.length === 0 && !showForm ? (
        <p className="text-sm text-slate-400 text-center py-4">{t('doc.empty')}</p>
      ) : (
        <div className="space-y-3">
          {grouped.map(group => (
            <div key={group.value}>
              <p className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                <group.icon className="w-3 h-3" /> {t(group.labelKey)} ({group.docs.length})
              </p>
              <div className="space-y-1">
                {group.docs.map(doc => (
                  <div key={doc.id} className="rounded-lg border border-slate-200 p-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{localizeCertType(doc.name, lang)}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-slate-400">
                        {doc.referenceNumber && <span>{t('doc.ref', { ref: doc.referenceNumber })}</span>}
                        {doc.validUntil && (
                          <span className={cn('flex items-center gap-1 px-1.5 py-0.5 rounded',
                            isExpired(doc.validUntil) ? 'bg-red-100 text-red-700' :
                            isExpiringSoon(doc.validUntil) ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          )}>
                            <Calendar className="w-3 h-3" />
                            {isExpired(doc.validUntil) ? t('doc.expired') : t('doc.validUntilDate', { date: new Date(doc.validUntil).toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-GB') })}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(doc)} className="text-slate-600 h-7 text-xs">{t('doc.editBtn')}</Button>
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
          <p className="text-sm font-medium text-slate-900 mb-1">{t('doc.expiryAlerts')}</p>
          <div className="space-y-0.5 text-xs">
            {documents.filter(d => isExpired(d.validUntil)).map(d => (
              <p key={d.id} className="text-red-600">{t('doc.expiredItem', { name: localizeCertType(d.name, lang) })}</p>
            ))}
            {documents.filter(d => isExpiringSoon(d.validUntil)).map(d => (
              <p key={d.id} className="text-yellow-600">{t('doc.expiresSoon', { name: localizeCertType(d.name, lang) })}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
