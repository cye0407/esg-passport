import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCompanyProfile, saveCompanyProfile } from '@/lib/store';
import { INDUSTRIES, COUNTRIES } from '@/lib/constants';
import { useLanguage } from '@/components/LanguageContext';
import { localizeIndustry, localizeCountry, localizeProfileOption } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2, ChevronDown, ChevronUp, Check, ArrowUpRight } from 'lucide-react';

const REVENUE_BANDS = [
  '< €1M',
  '€1M – €10M',
  '€10M – €50M',
  '€50M – €250M',
  '€250M – €1B',
  '> €1B',
];

const OWNERSHIP_OPTIONS = [
  'Private (founder-owned)',
  'Private (family-owned)',
  'Private (PE/VC-backed)',
  'Public / Listed',
  'Subsidiary of larger group',
  'Cooperative',
  'Non-profit',
  'Other',
];

const CUSTOMER_TYPES = ['B2B', 'B2C', 'Government / Public sector', 'Non-profit'];

const CERTIFICATIONS = [
  'ISO 9001 (Quality)',
  'ISO 14001 (Environment)',
  'ISO 45001 (Health & Safety)',
  'ISO 27001 (Information Security)',
  'ISO 50001 (Energy)',
  'B Corp',
  'EcoVadis (rated)',
  'SA8000',
  'FSC / PEFC',
];

const REPORTING_PERIODS = [
  'Calendar year (Jan – Dec)',
  'Fiscal year (Apr – Mar)',
  'Fiscal year (Jul – Jun)',
  'Fiscal year (Oct – Sep)',
];

const IMPLEMENTATION_STATUS_OPTIONS = [
  { value: 'implemented', label: 'Implemented' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'not_in_place', label: 'Not in place' },
  { value: 'not_applicable', label: 'Not applicable to this business' },
];

const FIELDS = [
  'legalName',
  'tradingName',
  'esgContactEmail',
  'industrySector',
  'countryOfIncorporation',
  'totalEmployees',
  'yearFounded',
  'numberOfFacilities',
  'operatingCountries',
  'productsServices',
  'ownership',
  'parentCompany',
  'subsidiaries',
  'customerTypes',
  'mainMarkets',
  'certifications',
  'revenueBand',
  'reportingPeriod',
  'livingWageCompliant',
  'registeredAddress',
  'noSignificantFines',
  'publishesSustainabilityReport',
  'reportingFramework',
  'externalAssurance',
  'assuranceStandard',
  'csrdApplicable',
  'humanRightsDueDiligenceStatus',
  'supplierCorrectiveActionProcess',
  'responsibleSourcingPolicyStatus',
  'conflictMineralsStatus',
  'cmrtStatus',
  'emrtStatus',
  'wastewaterTreatmentDetails',
  'transportReductionMeasures',
  'fleetComposition',
  'packagingRecycledContentPercent',
];

export default function CompanyProfileSection() {
  const { lang, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState({});
  const [saved, setSaved] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const stored = getCompanyProfile() || {};
    const init = {};
    FIELDS.forEach(f => { init[f] = stored[f] || ''; });
    init.customerTypes = stored.customerTypes || [];
    init.certifications = stored.certifications || [];
    setProfile(init);
  }, []);

  const update = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
    setSaved(false);
  };

  const toggleArrayValue = (field, value) => {
    setProfile(prev => {
      const current = prev[field] || [];
      const next = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [field]: next };
    });
    setHasChanges(true);
    setSaved(false);
  };

  const handleSave = () => {
    saveCompanyProfile(profile);
    setHasChanges(false);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setOpen(false);
    }, 1200);
  };

  const handleToggle = () => {
    if (open && hasChanges) {
      const ok = window.confirm(t('cps.confirmCollapse'));
      if (!ok) return;
      // Reset in-memory edits back to last saved state
      const stored = getCompanyProfile() || {};
      const reset = {};
      FIELDS.forEach(f => { reset[f] = stored[f] || ''; });
      reset.customerTypes = stored.customerTypes || [];
      reset.certifications = stored.certifications || [];
      setProfile(reset);
      setHasChanges(false);
    }
    setOpen(o => !o);
  };

  // Warn on tab close / refresh with unsaved changes
  useEffect(() => {
    if (!hasChanges) return;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasChanges]);

  const completionCount = FIELDS.filter(f => {
    const v = profile[f];
    return Array.isArray(v) ? v.length > 0 : v && String(v).trim().length > 0;
  }).length;
  const completionPercent = Math.round((completionCount / FIELDS.length) * 100);

  return (
    <div className="bg-white border border-slate-200 rounded-none">
      {/* Header / toggle */}
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Building2 className="w-5 h-5 text-slate-700" />
          <div className="text-left">
            <h2 className="text-base font-semibold text-slate-900">{t('cps.title')}</h2>
            <p className="text-xs text-slate-500">
              {t('cps.completion', { count: completionCount, total: FIELDS.length, percent: completionPercent })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:block w-32 bg-slate-100 rounded-full h-1.5">
            <div
              className="bg-indigo-600 h-1.5 rounded-full transition-all"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
          {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {/* Expanded form */}
      {open && (
        <div className="border-t border-slate-200 p-6 space-y-6">
          <p className="text-xs text-slate-500">
            {t('cps.intro')}
          </p>

          {/* Identity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">{t('cps.legalName')}</Label>
              <Input value={profile.legalName || ''} onChange={(e) => update('legalName', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">{t('cps.tradingName')}</Label>
              <Input value={profile.tradingName || ''} onChange={(e) => update('tradingName', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">{t('cps.esgContactEmail')}</Label>
              <Input type="email" value={profile.esgContactEmail || ''} onChange={(e) => update('esgContactEmail', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">{t('cps.yearFounded')}</Label>
              <Input type="number" value={profile.yearFounded || ''} onChange={(e) => update('yearFounded', e.target.value)} placeholder={t('cps.yearFoundedPh')} />
            </div>
          </div>

          {/* Registered address */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-700">{t('cps.registeredAddress')}</Label>
            <Input
              value={profile.registeredAddress || ''}
              onChange={(e) => update('registeredAddress', e.target.value)}
              placeholder={t('cps.registeredAddressPh')}
            />
          </div>

          {/* Industry / location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">{t('cps.industry')}</Label>
              <Select value={profile.industrySector || ''} onValueChange={(v) => update('industrySector', v)}>
                <SelectTrigger><SelectValue placeholder={t('cps.selectIndustry')} /></SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map(i => <SelectItem key={i} value={i}>{localizeIndustry(i, lang)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">{t('cps.country')}</Label>
              <Select value={profile.countryOfIncorporation || ''} onValueChange={(v) => update('countryOfIncorporation', v)}>
                <SelectTrigger><SelectValue placeholder={t('cps.selectCountry')} /></SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{localizeCountry(c.code, c.name, lang)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">{t('cps.totalEmployees')}</Label>
              <Input type="number" value={profile.totalEmployees || ''} onChange={(e) => update('totalEmployees', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">{t('cps.facilities')}</Label>
              <Input type="number" value={profile.numberOfFacilities || ''} onChange={(e) => update('numberOfFacilities', e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-medium text-slate-700">{t('cps.operatingCountries')}</Label>
              <Input
                value={profile.operatingCountries || ''}
                onChange={(e) => update('operatingCountries', e.target.value)}
                placeholder={t('cps.operatingCountriesPh')}
              />
            </div>
          </div>

          {/* Products / services */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-700">{t('cps.products')}</Label>
            <Textarea
              rows={3}
              value={profile.productsServices || ''}
              onChange={(e) => update('productsServices', e.target.value)}
              placeholder={t('cps.productsPh')}
            />
          </div>

          {/* Ownership / structure */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">{t('cps.ownership')}</Label>
              <Select value={profile.ownership || ''} onValueChange={(v) => update('ownership', v)}>
                <SelectTrigger><SelectValue placeholder={t('cps.selectOwnership')} /></SelectTrigger>
                <SelectContent>
                  {OWNERSHIP_OPTIONS.map(o => <SelectItem key={o} value={o}>{localizeProfileOption(o, lang)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">{t('cps.revenue')}</Label>
              <Select value={profile.revenueBand || ''} onValueChange={(v) => update('revenueBand', v)}>
                <SelectTrigger><SelectValue placeholder={t('cps.selectRange')} /></SelectTrigger>
                <SelectContent>
                  {REVENUE_BANDS.map(r => <SelectItem key={r} value={r}>{localizeProfileOption(r, lang)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">{t('cps.parent')}</Label>
              <Input value={profile.parentCompany || ''} onChange={(e) => update('parentCompany', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">{t('cps.subsidiaries')}</Label>
              <Input value={profile.subsidiaries || ''} onChange={(e) => update('subsidiaries', e.target.value)} placeholder={t('cps.commaSeparated')} />
            </div>
          </div>

          {/* Customers / markets */}
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-medium text-slate-700 block mb-2">{t('cps.customerTypes')}</Label>
              <div className="flex flex-wrap gap-2">
                {CUSTOMER_TYPES.map(ct => {
                  const checked = (profile.customerTypes || []).includes(ct);
                  return (
                    <button
                      key={ct}
                      type="button"
                      onClick={() => toggleArrayValue('customerTypes', ct)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                        checked
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'
                      }`}
                    >
                      {localizeProfileOption(ct, lang)}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">{t('cps.mainMarkets')}</Label>
              <Input
                value={profile.mainMarkets || ''}
                onChange={(e) => update('mainMarkets', e.target.value)}
                placeholder={t('cps.mainMarketsPh')}
              />
            </div>
          </div>

          {/* Certifications */}
          <div>
            <Label className="text-xs font-medium text-slate-700 block mb-2">{t('cps.certifications')}</Label>
            <div className="flex flex-wrap gap-2">
              {CERTIFICATIONS.map(c => {
                const checked = (profile.certifications || []).includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleArrayValue('certifications', c)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      checked
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    {localizeProfileOption(c, lang)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Social governance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">{t('cps.livingWage')}</Label>
              <Select value={profile.livingWageCompliant || ''} onValueChange={(v) => update('livingWageCompliant', v)}>
                <SelectTrigger><SelectValue placeholder={t('cps.select')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">{t('cps.livingWageYes')}</SelectItem>
                  <SelectItem value="no">{t('cps.livingWageNo')}</SelectItem>
                  <SelectItem value="not_applicable">{t('cps.naBusiness')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">{t('cps.formalPolicies')}</Label>
              <p className="text-xs text-slate-500 leading-relaxed">
                {t('cps.formalPoliciesBody')}
              </p>
              <Link
                to="/policies"
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-900 hover:text-slate-700 underline underline-offset-2"
              >
                {t('cps.openPolicies')}
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Governance & compliance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">{t('cps.fines')}</Label>
              <Select value={profile.noSignificantFines || ''} onValueChange={(v) => update('noSignificantFines', v)}>
                <SelectTrigger><SelectValue placeholder={t('cps.select')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('cps.none')}</SelectItem>
                  <SelectItem value="yes">{t('cps.finesYes')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">{t('cps.csrd')}</Label>
              <Select value={profile.csrdApplicable || ''} onValueChange={(v) => update('csrdApplicable', v)}>
                <SelectTrigger><SelectValue placeholder={t('cps.select')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">{t('cps.csrdYes')}</SelectItem>
                  <SelectItem value="assessing">{t('cps.csrdAssessing')}</SelectItem>
                  <SelectItem value="no">{t('cps.csrdNo')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">{t('cps.assurance')}</Label>
              <Select value={profile.externalAssurance || ''} onValueChange={(v) => update('externalAssurance', v)}>
                <SelectTrigger><SelectValue placeholder={t('cps.select')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">{t('cps.assuranceYes')}</SelectItem>
                  <SelectItem value="no">{t('cps.assuranceNo')}</SelectItem>
                  <SelectItem value="not_applicable">{t('cps.naBusiness')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {profile.externalAssurance === 'yes' && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-700">{t('cps.assuranceStandard')}</Label>
                <Input
                  value={profile.assuranceStandard || ''}
                  onChange={(e) => update('assuranceStandard', e.target.value)}
                  placeholder={t('cps.assuranceStandardPh')}
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">{t('cps.publishReport')}</Label>
              <Select value={profile.publishesSustainabilityReport || ''} onValueChange={(v) => update('publishesSustainabilityReport', v)}>
                <SelectTrigger><SelectValue placeholder={t('cps.select')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">{t('cps.publishYes')}</SelectItem>
                  <SelectItem value="no">{t('cps.publishNo')}</SelectItem>
                  <SelectItem value="not_applicable">{t('cps.naBusiness')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {profile.publishesSustainabilityReport === 'yes' && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-700">{t('cps.framework')}</Label>
                <Input
                  value={profile.reportingFramework || ''}
                  onChange={(e) => update('reportingFramework', e.target.value)}
                  placeholder={t('cps.frameworkPh')}
                />
              </div>
            )}
          </div>

          {/* Policy and process status */}
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            {t('cps.policyNote')}
            <div className="mt-2 flex flex-wrap gap-3">
              <Link to="/policies" className="inline-flex items-center gap-1 font-medium text-slate-900 hover:text-slate-700 underline underline-offset-2">
                {t('cps.managePolicies')}
                <ArrowUpRight className="w-3 h-3" />
              </Link>
              <span>{t('cps.policyExamples')}</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">{t('cps.hrdd')}</Label>
              <Select value={profile.humanRightsDueDiligenceStatus || ''} onValueChange={(v) => update('humanRightsDueDiligenceStatus', v)}>
                <SelectTrigger><SelectValue placeholder={t('cps.select')} /></SelectTrigger>
                <SelectContent>
                  {IMPLEMENTATION_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{localizeProfileOption(option.label, lang)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">{t('cps.sourcing')}</Label>
              <Select value={profile.responsibleSourcingPolicyStatus || ''} onValueChange={(v) => update('responsibleSourcingPolicyStatus', v)}>
                <SelectTrigger><SelectValue placeholder={t('cps.select')} /></SelectTrigger>
                <SelectContent>
                  {IMPLEMENTATION_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{localizeProfileOption(option.label, lang)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">{t('cps.conflictMinerals')}</Label>
              <Select value={profile.conflictMineralsStatus || ''} onValueChange={(v) => update('conflictMineralsStatus', v)}>
                <SelectTrigger><SelectValue placeholder={t('cps.select')} /></SelectTrigger>
                <SelectContent>
                  {IMPLEMENTATION_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{localizeProfileOption(option.label, lang)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">{t('cps.cmrtEmrt')}</Label>
              <div className="grid grid-cols-2 gap-2">
                <Select value={profile.cmrtStatus || ''} onValueChange={(v) => update('cmrtStatus', v)}>
                  <SelectTrigger><SelectValue placeholder="CMRT" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="implemented">{t('cps.cmrtLive')}</SelectItem>
                    <SelectItem value="in_progress">{t('cps.cmrtProgress')}</SelectItem>
                    <SelectItem value="not_in_place">{t('cps.cmrtNone')}</SelectItem>
                    <SelectItem value="not_applicable">{t('cps.cmrtNa')}</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={profile.emrtStatus || ''} onValueChange={(v) => update('emrtStatus', v)}>
                  <SelectTrigger><SelectValue placeholder="EMRT" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="implemented">{t('cps.emrtLive')}</SelectItem>
                    <SelectItem value="in_progress">{t('cps.emrtProgress')}</SelectItem>
                    <SelectItem value="not_in_place">{t('cps.emrtNone')}</SelectItem>
                    <SelectItem value="not_applicable">{t('cps.emrtNa')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Operational notes for draft generation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">{t('cps.supplierCorrective')}</Label>
              <Textarea
                value={profile.supplierCorrectiveActionProcess || ''}
                onChange={(e) => update('supplierCorrectiveActionProcess', e.target.value)}
                rows={3}
                placeholder={t('cps.supplierCorrectivePh')}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">{t('cps.wastewater')}</Label>
              <Textarea
                value={profile.wastewaterTreatmentDetails || ''}
                onChange={(e) => update('wastewaterTreatmentDetails', e.target.value)}
                rows={3}
                placeholder={t('cps.wastewaterPh')}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">{t('cps.transport')}</Label>
              <Textarea
                value={profile.transportReductionMeasures || ''}
                onChange={(e) => update('transportReductionMeasures', e.target.value)}
                rows={3}
                placeholder={t('cps.transportPh')}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">{t('cps.fleet')}</Label>
              <Input
                value={profile.fleetComposition || ''}
                onChange={(e) => update('fleetComposition', e.target.value)}
                placeholder={t('cps.fleetPh')}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">{t('cps.packaging')}</Label>
              <Input
                type="number"
                value={profile.packagingRecycledContentPercent || ''}
                onChange={(e) => update('packagingRecycledContentPercent', e.target.value)}
                placeholder={t('cps.packagingPh')}
              />
            </div>
          </div>

          {/* Reporting period */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-700">{t('cps.reportingPeriod')}</Label>
            <Select value={profile.reportingPeriod || ''} onValueChange={(v) => update('reportingPeriod', v)}>
              <SelectTrigger><SelectValue placeholder={t('cps.selectPeriod')} /></SelectTrigger>
              <SelectContent>
                {REPORTING_PERIODS.map(r => <SelectItem key={r} value={r}>{localizeProfileOption(r, lang)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Save bar */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              {hasChanges ? t('cps.unsaved') : saved ? t('cps.saved') : t('cps.allSaved')}
            </p>
            <Button
              onClick={handleSave}
              disabled={!hasChanges}
              size="sm"
              className="bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-50"
            >
              {saved ? <><Check className="w-4 h-4 mr-1.5" />{t('cps.saved')}</> : t('cps.saveProfile')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
