import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCompanyProfile, saveCompanyProfile, getSettings, saveSettings, resetData } from '@/lib/store';
import { COUNTRIES, EMISSION_FACTORS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Settings as SettingsIcon, Building2, Zap, Trash2, Download, Upload,
  Sparkles, Eye, EyeOff, FileText, BookOpen, ChevronDown, ChevronRight, KeyRound,
} from 'lucide-react';
import { deactivateLicense, getStoredLicense } from '@/lib/license';
import PoliciesSection from '@/components/settings/PoliciesSection';
import DocumentsSection from '@/components/settings/DocumentsSection';
import AnswerLibrarySection from '@/components/settings/AnswerLibrarySection';
import { cn } from '@/lib/utils';

function CollapsibleSection({ icon: Icon, title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white border border-slate-200 rounded-none overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-colors"
      >
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <Icon className="w-5 h-5" /> {title}
        </h2>
        {open ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
      </button>
      {open && <div className="px-6 pb-6 border-t border-slate-100">{children}</div>}
    </div>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [settings, setSettings] = useState(null);
  const [saved, setSaved] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    setCompany(getCompanyProfile());
    setSettings(getSettings());
  }, []);

  const handleCompanyUpdate = (field, value) => {
    const updated = { ...company, [field]: value };
    setCompany(updated);
    saveCompanyProfile(updated);
    showSavedToast();
  };

  const handleSettingsUpdate = (field, value) => {
    const updated = { ...settings, [field]: value };
    setSettings(updated);
    saveSettings(updated);
    showSavedToast();
  };

  const showSavedToast = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExportData = () => {
    const data = localStorage.getItem('esg_passport_data');
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `esg-passport-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        localStorage.setItem('esg_passport_data', JSON.stringify(data));
        window.location.reload();
      } catch (err) {
        alert('Invalid backup file');
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (!confirm('Are you sure you want to reset ALL data? This cannot be undone.')) return;
    if (!confirm('Really delete everything?')) return;
    resetData();
    navigate('/onboarding');
  };

  if (!company || !settings) {
    return <div className="p-8 text-center text-slate-400">Loading...</div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <SettingsIcon className="w-6 h-6" />
          Settings
        </h1>
        <p className="text-slate-500 text-sm mt-1">Manage your profile, documents, and preferences</p>
      </div>

      {saved && (
        <div className="fixed top-20 right-4 bg-green-100 text-green-800 px-4 py-2 rounded-lg shadow-lg z-50">
          Saved!
        </div>
      )}

      {/* Company Profile */}
      <div className="bg-white border border-slate-200 rounded-none p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5" /> Company Profile
        </h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Legal Name</Label>
              <Input value={company.legalName || ''} onChange={(e) => handleCompanyUpdate('legalName', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Trading Name</Label>
              <Input value={company.tradingName || ''} onChange={(e) => handleCompanyUpdate('tradingName', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Country</Label>
              <Select value={company.countryOfIncorporation || ''} onValueChange={(v) => handleCompanyUpdate('countryOfIncorporation', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Employees</Label>
              <Input type="number" value={company.totalEmployees || ''} onChange={(e) => handleCompanyUpdate('totalEmployees', parseInt(e.target.value) || 0)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Contact Name</Label>
              <Input value={company.esgContactName || ''} onChange={(e) => handleCompanyUpdate('esgContactName', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Contact Email</Label>
              <Input value={company.esgContactEmail || ''} onChange={(e) => handleCompanyUpdate('esgContactEmail', e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      {/* Policies (collapsible) */}
      <CollapsibleSection icon={FileText} title="Policies">
        <PoliciesSection />
      </CollapsibleSection>

      {/* Documents (collapsible) */}
      <CollapsibleSection icon={FileText} title="Documents">
        <DocumentsSection />
      </CollapsibleSection>

      {/* Answer Library (collapsible) */}
      <CollapsibleSection icon={BookOpen} title="Answer Library">
        <AnswerLibrarySection />
      </CollapsibleSection>

      {/* Calculation Settings */}
      <CollapsibleSection icon={Zap} title="Emission Calculations">
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Grid Emission Factor Country</Label>
            <Select value={settings.gridCountry} onValueChange={(v) => handleSettingsUpdate('gridCountry', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.keys(EMISSION_FACTORS.electricity).map(code => (
                  <SelectItem key={code} value={code}>
                    {code} ({EMISSION_FACTORS.electricity[code]} kg CO₂/kWh)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-400">Used to calculate Scope 2 emissions from electricity</p>
          </div>
        </div>
      </CollapsibleSection>

      {/* AI Enhancement */}
      <CollapsibleSection icon={Sparkles} title="AI Answer Enhancement">
        <div className="space-y-4 pt-4">
          <p className="text-sm text-slate-500">
            Optionally use AI to rewrite template answers into natural, company-specific language.
          </p>
          <div className="space-y-2">
            <Label>Mode</Label>
            <Select value={settings.aiMode || 'proxy'} onValueChange={(v) => handleSettingsUpdate('aiMode', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="proxy">Server proxy (no key needed)</SelectItem>
                <SelectItem value="direct">Use my own API key</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-400">
              {(settings.aiMode || 'proxy') === 'proxy'
                ? 'Requests go through the ESG Passport server. Works out of the box.'
                : 'Your API key is stored locally and calls go directly from your browser.'}
            </p>
          </div>

          {settings.aiMode === 'direct' && (
            <>
              <div className="space-y-2">
                <Label>Provider</Label>
                <Select value={settings.aiProvider || 'claude'} onValueChange={(v) => handleSettingsUpdate('aiProvider', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="claude">Anthropic (Claude)</SelectItem>
                    <SelectItem value="openai">OpenAI (GPT)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>API Key</Label>
                <div className="flex gap-2">
                  <Input
                    type={showApiKey ? 'text' : 'password'}
                    value={settings.aiApiKey || ''}
                    onChange={(e) => handleSettingsUpdate('aiApiKey', e.target.value)}
                    placeholder={settings.aiProvider === 'openai' ? 'sk-...' : 'sk-ant-...'}
                  />
                  <Button variant="ghost" size="sm" onClick={() => setShowApiKey(!showApiKey)} className="px-2">
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-xs text-slate-400">
                  Your key stays in your browser. It is never sent to our servers.
                </p>
              </div>
            </>
          )}
        </div>
      </CollapsibleSection>

      {/* Data Management */}
      <div className="bg-white border border-slate-200 rounded-none p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Data Management</h2>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={handleExportData}>
              <Download className="w-4 h-4 mr-2" /> Export Backup
            </Button>
            <label>
              <Button variant="outline" asChild>
                <span><Upload className="w-4 h-4 mr-2" /> Import Backup</span>
              </Button>
              <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
            </label>
          </div>
          <p className="text-sm text-slate-500">
            Your data is stored locally in your browser. Export regularly to avoid data loss.
          </p>
        </div>
      </div>

      {/* License */}
      <div className="bg-white border border-slate-200 rounded-none p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <KeyRound className="w-5 h-5" /> License
        </h2>
        <p className="text-sm text-slate-500 mb-4">
          {getStoredLicense()
            ? `License active since ${new Date(getStoredLicense().activated_at).toLocaleDateString()}.`
            : 'No license activated.'}
          {' '}Deactivate to transfer to another device.
        </p>
        <Button
          variant="outline"
          onClick={async () => {
            if (!confirm('Deactivate your license on this device? You can reactivate on another device.')) return;
            await deactivateLicense();
            window.location.reload();
          }}
        >
          Deactivate License
        </Button>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-none p-6 border-2 border-red-200">
        <h2 className="text-lg font-semibold text-red-600 mb-4 flex items-center gap-2">
          <Trash2 className="w-5 h-5" /> Danger Zone
        </h2>
        <p className="text-sm text-slate-500 mb-4">
          This will permanently delete all your data including company profile, metrics, policies, and requests.
        </p>
        <Button variant="destructive" onClick={handleReset}>
          Reset All Data
        </Button>
      </div>
    </div>
  );
}
