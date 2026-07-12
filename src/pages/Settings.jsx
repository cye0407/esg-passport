import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCompanyProfile, saveCompanyProfile, getSettings, saveSettings, resetData } from '@/lib/store';
import { COUNTRIES, EMISSION_FACTORS } from '@/lib/constants';
import { useLanguage } from '@/components/LanguageContext';
import { localizeCountry } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Settings as SettingsIcon, Building2, Zap, Trash2, Download, Upload,
  Sparkles, Eye, EyeOff, ChevronDown, ChevronRight, KeyRound, Mail, Loader2, Globe,
} from 'lucide-react';
import { deactivateLicense, getStoredLicense } from '@/lib/license';
import { useLicense } from '@/components/LicenseContext';

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
  const { lang, setLang, t } = useLanguage();
  const { activate, isPaid, tier } = useLicense();
  const [company, setCompany] = useState(null);
  const [settings, setSettings] = useState(null);
  const [saved, setSaved] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [licenseKey, setLicenseKey] = useState('');
  const [licenseLoading, setLicenseLoading] = useState(false);
  const [licenseError, setLicenseError] = useState('');
  const [deactivateLoading, setDeactivateLoading] = useState(false);

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
        alert(t('settings.invalidBackup'));
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (!confirm(t('settings.resetConfirm1'))) return;
    if (!confirm(t('settings.resetConfirm2'))) return;
    resetData();
    navigate('/onboarding');
  };

  const handleLicenseActivate = async (e) => {
    e.preventDefault();
    const key = licenseKey.trim();
    if (!key) {
      setLicenseError(t('settings.enterKey'));
      return;
    }

    setLicenseLoading(true);
    setLicenseError('');

    const result = await activate(key);
    if (!result.valid) {
      setLicenseError(result.error || t('settings.activationFailed'));
    } else {
      setLicenseKey('');
    }

    setLicenseLoading(false);
  };

  if (!company || !settings) {
    return <div className="p-8 text-center text-slate-400">{t('settings.loading')}</div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <SettingsIcon className="w-6 h-6" />
          {t('settings.title')}
        </h1>
        <p className="text-slate-500 text-sm mt-1">{t('settings.subtitle')}</p>
      </div>

      {saved && (
        <div className="fixed top-20 right-4 bg-green-100 text-green-800 px-4 py-2 rounded-lg shadow-lg z-50">
          {t('settings.savedToast')}
        </div>
      )}

      {/* Interface language */}
      <CollapsibleSection icon={Globe} title={t('settings.language')}>
        <div className="pt-4">
          <Select value={lang} onValueChange={setLang}>
            <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="de">Deutsch</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CollapsibleSection>

      {/* Company Profile */}
      <div className="bg-white border border-slate-200 rounded-none p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5" /> {t('cps.title')}
        </h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('cps.legalName')}</Label>
              <Input value={company.legalName || ''} onChange={(e) => handleCompanyUpdate('legalName', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t('cps.tradingName')}</Label>
              <Input value={company.tradingName || ''} onChange={(e) => handleCompanyUpdate('tradingName', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('settings.country')}</Label>
              <Select value={company.countryOfIncorporation || ''} onValueChange={(v) => handleCompanyUpdate('countryOfIncorporation', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{localizeCountry(c.code, c.name, lang)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('onboard.employees')}</Label>
              <Input type="number" value={company.totalEmployees || ''} onChange={(e) => handleCompanyUpdate('totalEmployees', parseInt(e.target.value) || 0)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('settings.contactName')}</Label>
              <Input value={company.esgContactName || ''} onChange={(e) => handleCompanyUpdate('esgContactName', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t('settings.contactEmail')}</Label>
              <Input value={company.esgContactEmail || ''} onChange={(e) => handleCompanyUpdate('esgContactEmail', e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      {/* Calculation Settings */}
      <CollapsibleSection icon={Zap} title={t('settings.emissionCalc')}>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>{t('settings.gridFactor')}</Label>
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
            <p className="text-xs text-slate-400">{t('settings.gridFactorHint')}</p>
          </div>
        </div>
      </CollapsibleSection>

      {/* AI Enhancement */}
      <CollapsibleSection icon={Sparkles} title={t('settings.aiTitle')}>
        <div className="space-y-4 pt-4">
          {isPaid ? (
            <>
              <p className="text-sm text-slate-500">
                {t('settings.aiIntro')}
              </p>
              <div className="space-y-2">
                <Label>{t('settings.aiMode')}</Label>
                <Select value={settings.aiMode || 'proxy'} onValueChange={(v) => handleSettingsUpdate('aiMode', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="proxy">{t('settings.aiProxy')}</SelectItem>
                    <SelectItem value="direct">{t('settings.aiOwnKey')}</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-400">
                  {(settings.aiMode || 'proxy') === 'proxy'
                    ? t('settings.aiProxyHint')
                    : t('settings.aiDirectHint')}
                </p>
              </div>

              {settings.aiMode === 'direct' && (
                <>
                  <div className="space-y-2">
                    <Label>{t('settings.aiProvider')}</Label>
                    <Select value={settings.aiProvider || 'claude'} onValueChange={(v) => handleSettingsUpdate('aiProvider', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="claude">Anthropic (Claude)</SelectItem>
                        <SelectItem value="openai">OpenAI (GPT)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>{t('settings.apiKey')}</Label>
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
                      {t('settings.apiKeyHint')}
                    </p>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="rounded-none border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-900">{t('settings.aiPaid')}</p>
              <p className="mt-1 text-sm text-slate-500">
                {t('settings.aiPaidBody')}
              </p>
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* Data Management */}
      <div className="bg-white border border-slate-200 rounded-none p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">{t('settings.dataMgmt')}</h2>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={handleExportData}>
              <Download className="w-4 h-4 mr-2" /> {t('settings.exportBackup')}
            </Button>
            <label>
              <Button variant="outline" asChild>
                <span><Upload className="w-4 h-4 mr-2" /> {t('settings.importBackup')}</span>
              </Button>
              <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
            </label>
          </div>
          <p className="text-sm text-slate-500">
            {t('settings.dataMgmtHint')}
          </p>
        </div>
      </div>

      {/* License */}
      <div className="bg-white border border-slate-200 rounded-none p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <KeyRound className="w-5 h-5" /> {t('settings.license')}
        </h2>
        <p className="text-sm text-slate-500 mb-4">
          {getStoredLicense()
            ? t('settings.licenseActive', { date: new Date(getStoredLicense().activated_at).toLocaleDateString(lang === 'de' ? 'de-DE' : undefined) })
            : t('settings.noLicense')}
          {' '}{t('settings.licenseHint')}
        </p>
        {!isPaid && (
          <form onSubmit={handleLicenseActivate} className="space-y-3 mb-4">
            <div className="space-y-2">
              <Label htmlFor="license-key">{t('settings.licenseKey')}</Label>
              <Input
                id="license-key"
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
                placeholder={t('settings.licenseKeyPh')}
                className="font-mono text-sm"
                disabled={licenseLoading}
              />
            </div>
            {licenseError && <p className="text-sm text-red-600">{licenseError}</p>}
            <Button type="submit" variant="outline" disabled={licenseLoading}>
              {licenseLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('settings.activating')}
                </>
              ) : (
                t('settings.activateLicense')
              )}
            </Button>
          </form>
        )}
        <Button
          variant="outline"
          disabled={!getStoredLicense() || deactivateLoading}
          onClick={async () => {
            if (!confirm(t('settings.deactivateConfirm'))) return;
            setDeactivateLoading(true);
            setLicenseError('');
            const result = await deactivateLicense();
            setDeactivateLoading(false);
            if (!result.ok) {
              setLicenseError(result.error || t('settings.deactivationFailed'));
              return;
            }
            window.location.reload();
          }}
        >
          {deactivateLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t('settings.deactivating')}
            </>
          ) : (
            t('settings.deactivateLicense')
          )}
        </Button>
      </div>

      {/* Support */}
      <div className="bg-white border border-slate-200 rounded-none p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Mail className="w-5 h-5" /> {t('settings.support')}
        </h2>
        <p className="text-sm text-slate-500 mb-3">
          {t('settings.supportBody')}
        </p>
        <a
          href="mailto:contact@esgforsuppliers.com"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900 underline"
        >
          contact@esgforsuppliers.com
        </a>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-none p-6 border-2 border-red-200">
        <h2 className="text-lg font-semibold text-red-600 mb-4 flex items-center gap-2">
          <Trash2 className="w-5 h-5" /> {t('settings.dangerZone')}
        </h2>
        <p className="text-sm text-slate-500 mb-4">
          {t('settings.dangerBody')}
        </p>
        <Button variant="destructive" onClick={handleReset}>
          {t('settings.resetAll')}
        </Button>
      </div>
    </div>
  );
}
