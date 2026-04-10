import React, { useState, useEffect } from 'react';
import { getCompanyProfile, saveCompanyProfile } from '@/lib/store';
import { INDUSTRIES, COUNTRIES } from '@/lib/constants';
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
import { Building2, ChevronDown, ChevronUp, Check } from 'lucide-react';

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
  'grievanceMechanismExists',
  'registeredAddress',
  'noSignificantFines',
  'dataProtectionPolicy',
  'publishesSustainabilityReport',
  'reportingFramework',
  'externalAssurance',
  'assuranceStandard',
  'csrdApplicable',
];

export default function CompanyProfileSection() {
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
      const ok = window.confirm('You have unsaved changes to your Company Profile. Collapse anyway and lose them?');
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
            <h2 className="text-base font-semibold text-slate-900">Company Profile</h2>
            <p className="text-xs text-slate-500">
              {completionCount} of {FIELDS.length} fields complete · {completionPercent}%
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
            These fields populate the qualitative answers in your questionnaires. The more complete your profile, the more personalized your responses.
          </p>

          {/* Identity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">Legal Name</Label>
              <Input value={profile.legalName || ''} onChange={(e) => update('legalName', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">Trading Name</Label>
              <Input value={profile.tradingName || ''} onChange={(e) => update('tradingName', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">ESG Contact Email</Label>
              <Input type="email" value={profile.esgContactEmail || ''} onChange={(e) => update('esgContactEmail', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">Year Founded</Label>
              <Input type="number" value={profile.yearFounded || ''} onChange={(e) => update('yearFounded', e.target.value)} placeholder="e.g. 1998" />
            </div>
          </div>

          {/* Registered address */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-700">Registered Address</Label>
            <Input
              value={profile.registeredAddress || ''}
              onChange={(e) => update('registeredAddress', e.target.value)}
              placeholder="e.g. Industriestr. 24, 40231 Düsseldorf, Germany"
            />
          </div>

          {/* Industry / location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">Industry</Label>
              <Select value={profile.industrySector || ''} onValueChange={(v) => update('industrySector', v)}>
                <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">Country of Incorporation</Label>
              <Select value={profile.countryOfIncorporation || ''} onValueChange={(v) => update('countryOfIncorporation', v)}>
                <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">Total Employees (FTE)</Label>
              <Input type="number" value={profile.totalEmployees || ''} onChange={(e) => update('totalEmployees', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">Number of Sites / Facilities</Label>
              <Input type="number" value={profile.numberOfFacilities || ''} onChange={(e) => update('numberOfFacilities', e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-medium text-slate-700">Operating Countries</Label>
              <Input
                value={profile.operatingCountries || ''}
                onChange={(e) => update('operatingCountries', e.target.value)}
                placeholder="e.g. Germany, France, Poland"
              />
            </div>
          </div>

          {/* Products / services */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-700">Products / Services</Label>
            <Textarea
              rows={3}
              value={profile.productsServices || ''}
              onChange={(e) => update('productsServices', e.target.value)}
              placeholder="Brief description of what your company makes or sells. e.g. 'Precision-machined components for the automotive aftermarket.'"
            />
          </div>

          {/* Ownership / structure */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">Ownership Structure</Label>
              <Select value={profile.ownership || ''} onValueChange={(v) => update('ownership', v)}>
                <SelectTrigger><SelectValue placeholder="Select ownership type" /></SelectTrigger>
                <SelectContent>
                  {OWNERSHIP_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">Annual Revenue Band</Label>
              <Select value={profile.revenueBand || ''} onValueChange={(v) => update('revenueBand', v)}>
                <SelectTrigger><SelectValue placeholder="Select range" /></SelectTrigger>
                <SelectContent>
                  {REVENUE_BANDS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">Parent Company (if any)</Label>
              <Input value={profile.parentCompany || ''} onChange={(e) => update('parentCompany', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">Subsidiaries (if any)</Label>
              <Input value={profile.subsidiaries || ''} onChange={(e) => update('subsidiaries', e.target.value)} placeholder="Comma-separated" />
            </div>
          </div>

          {/* Customers / markets */}
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-medium text-slate-700 block mb-2">Customer Types</Label>
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
                      {ct}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">Main Markets</Label>
              <Input
                value={profile.mainMarkets || ''}
                onChange={(e) => update('mainMarkets', e.target.value)}
                placeholder="e.g. Western Europe, North America"
              />
            </div>
          </div>

          {/* Certifications */}
          <div>
            <Label className="text-xs font-medium text-slate-700 block mb-2">Certifications</Label>
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
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Social governance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">Living Wage Compliance</Label>
              <Select value={profile.livingWageCompliant || ''} onValueChange={(v) => update('livingWageCompliant', v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes — all employees paid at or above living wage</SelectItem>
                  <SelectItem value="no">No / Not yet assessed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">Formal Grievance Mechanism</Label>
              <Select value={profile.grievanceMechanismExists || ''} onValueChange={(v) => update('grievanceMechanismExists', v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes — formal channel in place</SelectItem>
                  <SelectItem value="no">No / Informal only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Governance & compliance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">Significant Fines / Sanctions (past 3 years)</Label>
              <Select value={profile.noSignificantFines || ''} onValueChange={(v) => update('noSignificantFines', v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="yes">Yes — details available</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">Data Protection / Privacy Policy</Label>
              <Select value={profile.dataProtectionPolicy || ''} onValueChange={(v) => update('dataProtectionPolicy', v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes — GDPR / data protection policy in place</SelectItem>
                  <SelectItem value="no">No / In development</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">CSRD Applicability</Label>
              <Select value={profile.csrdApplicable || ''} onValueChange={(v) => update('csrdApplicable', v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes — in scope</SelectItem>
                  <SelectItem value="assessing">Currently assessing</SelectItem>
                  <SelectItem value="no">Not currently in scope</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">External ESG Data Assurance</Label>
              <Select value={profile.externalAssurance || ''} onValueChange={(v) => update('externalAssurance', v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes — externally assured</SelectItem>
                  <SelectItem value="no">No — not yet assured</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {profile.externalAssurance === 'yes' && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-700">Assurance Standard</Label>
                <Input
                  value={profile.assuranceStandard || ''}
                  onChange={(e) => update('assuranceStandard', e.target.value)}
                  placeholder="e.g. ISAE 3000, AA1000"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">Publish Sustainability Report?</Label>
              <Select value={profile.publishesSustainabilityReport || ''} onValueChange={(v) => update('publishesSustainabilityReport', v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes — published</SelectItem>
                  <SelectItem value="no">No — not yet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {profile.publishesSustainabilityReport === 'yes' && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-700">Reporting Framework</Label>
                <Input
                  value={profile.reportingFramework || ''}
                  onChange={(e) => update('reportingFramework', e.target.value)}
                  placeholder="e.g. GRI, CSRD/ESRS, TCFD"
                />
              </div>
            )}
          </div>

          {/* Reporting period */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-700">Reporting Period</Label>
            <Select value={profile.reportingPeriod || ''} onValueChange={(v) => update('reportingPeriod', v)}>
              <SelectTrigger><SelectValue placeholder="Select reporting period" /></SelectTrigger>
              <SelectContent>
                {REPORTING_PERIODS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Save bar */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              {hasChanges ? 'Unsaved changes' : saved ? 'Saved' : 'All changes saved'}
            </p>
            <Button
              onClick={handleSave}
              disabled={!hasChanges}
              size="sm"
              className="bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-50"
            >
              {saved ? <><Check className="w-4 h-4 mr-1.5" />Saved</> : 'Save Profile'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
