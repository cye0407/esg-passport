import React, { useRef } from 'react';
import {
  getCompanyProfile,
  getAnnualTotals,
  getDataRecords,
  getReadinessStats,
  getPolicies,
  getConfidenceRecords,
} from '@/lib/store';
import { exportAsHTML } from '@/lib/reportExport';
import { useLanguage } from '@/components/LanguageContext';
import { localizeIndustry, localizeCountry, localizeProfileOption } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Download, Printer, FileText } from 'lucide-react';

function pct(val) {
  if (val == null) return '—';
  return `${Math.round(val)}%`;
}

export default function Report() {
  const { lang, t } = useLanguage();
  const reportRef = useRef(null);
  const company = getCompanyProfile();
  const records = getDataRecords();
  const stats = getReadinessStats();
  const policies = getPolicies();
  const confidence = getConfidenceRecords();

  const numLocale = lang === 'de' ? 'de-DE' : 'en-GB';

  // Locale-aware number formatter (thousands separator + fixed decimals).
  const fmt = (val, unit = '', decimals = 1) => {
    if (val == null || val === 0) return '—';
    const n = typeof val === 'number' ? val : parseFloat(val);
    if (isNaN(n)) return '—';
    const formatted = n >= 1000
      ? n.toLocaleString(numLocale, { maximumFractionDigits: decimals })
      : n.toLocaleString(numLocale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    return `${formatted}${unit ? ' ' + unit : ''}`;
  };

  // Determine reporting year (most recent year with data)
  const years = [...new Set(records.map(r => r.period.slice(0, 4)))].sort().reverse();
  const reportYear = years[0] || new Date().getFullYear().toString();
  const yearRecords = records.filter(r => r.period.startsWith(reportYear));
  const totals = getAnnualTotals(reportYear);

  const monthsCovered = yearRecords.length;
  const companyName = company?.tradingName || company?.legalName || t('rep.companyFallback');

  // Policy summary
  const policyGroups = {
    available: policies.filter(p => p.status === 'available'),
    inProgress: policies.filter(p => p.status === 'in_progress'),
    notAvailable: policies.filter(p => p.status === 'not_available'),
  };

  // Confidence/quality summary
  const highConf = confidence.filter(c => c.confidence === 'high').length;
  const medConf = confidence.filter(c => c.confidence === 'medium').length;
  const lowConf = confidence.filter(c => c.confidence === 'low').length;

  const handlePDF = () => window.print();
  const handleHTML = () => exportAsHTML(reportRef.current, companyName);

  return (
    <>
      {/* Action bar — hidden in print */}
      <div className="print:hidden mb-6 flex items-center justify-between" data-no-export>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('rep.title')}</h1>
          <p className="text-sm text-slate-500">{t('rep.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePDF}>
            <Printer className="w-4 h-4 mr-2" /> {t('rep.downloadPdf')}
          </Button>
          <Button variant="outline" onClick={handleHTML}>
            <Download className="w-4 h-4 mr-2" /> {t('rep.downloadHtml')}
          </Button>
        </div>
      </div>

      {/* Report content */}
      <div ref={reportRef} className="report bg-white border border-slate-200 print:border-0 max-w-[800px] mx-auto p-8 print:p-0 print:max-w-none">

        {/* Header */}
        <div className="report-header border-b-[3px] border-slate-800 pb-6 mb-8">
          <div className="flex items-center gap-3 mb-1">
            <FileText className="w-6 h-6 text-slate-700 print:hidden" />
            <h1 className="text-2xl font-bold text-slate-900">ESG Passport</h1>
          </div>
          <p className="text-slate-500 text-sm">{t('rep.periodLine', { company: companyName, year: reportYear, months: monthsCovered })}</p>

          <dl className="company-meta grid grid-cols-3 gap-4 mt-4">
            {company?.industrySector && (
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-slate-400">{t('rep.industry')}</dt>
                <dd className="text-sm font-semibold">{localizeIndustry(company.industrySector, lang)}</dd>
              </div>
            )}
            {company?.countryOfIncorporation && (
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-slate-400">{t('rep.country')}</dt>
                <dd className="text-sm font-semibold">{localizeCountry(company.countryOfIncorporation, company.countryOfIncorporation, lang)}</dd>
              </div>
            )}
            {company?.totalEmployees && (
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-slate-400">{t('rep.employees')}</dt>
                <dd className="text-sm font-semibold">{company.totalEmployees}</dd>
              </div>
            )}
            {company?.numberOfFacilities && (
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-slate-400">{t('rep.facilities')}</dt>
                <dd className="text-sm font-semibold">{company.numberOfFacilities}</dd>
              </div>
            )}
            {company?.revenueBand && (
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-slate-400">{t('rep.revenueBand')}</dt>
                <dd className="text-sm font-semibold">{localizeProfileOption(company.revenueBand, lang)}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* B4: Energy & Greenhouse Gases */}
        <Section code="B4" title={t('rep.b4')} t={t}>
          <DataTable rows={[
            [t('rep.totalEnergy'), fmt(totals.totalEnergyKwh, 'kWh')],
            [t('rep.electricity'), fmt(totals.electricityKwh, 'kWh')],
            [t('rep.naturalGas'), fmt(totals.naturalGasKwh, 'kWh')],
            [t('rep.vehicleFuel'), fmt(totals.vehicleFuelLiters, 'L')],
            [t('rep.renewableShare'), pct(totals.renewablePercent)],
            [t('rep.scope1'), fmt(totals.scope1Tco2e, 'tCO₂e')],
            [t('rep.scope2'), fmt(totals.scope2Tco2e, 'tCO₂e')],
            [t('rep.scope3'), fmt(totals.scope3Total, 'tCO₂e')],
          ]} />
        </Section>

        {/* B6: Water */}
        <Section code="B6" title={t('rep.b6')} t={t}>
          <DataTable rows={[
            [t('rep.totalWater'), fmt(totals.waterM3, 'm³')],
          ]} />
        </Section>

        {/* B8: Waste */}
        <Section code="B8" title={t('rep.b8')} t={t}>
          <DataTable rows={[
            [t('rep.totalWaste'), fmt(totals.totalWasteKg ? totals.totalWasteKg / 1000 : null, 't')],
            [t('rep.wasteRecycled'), fmt(totals.recycledWasteKg ? totals.recycledWasteKg / 1000 : null, 't')],
            [t('rep.recyclingRate'), pct(totals.recyclingRate)],
            [t('rep.hazardousWaste'), fmt(totals.hazardousWasteKg, 'kg')],
          ]} />
        </Section>

        {/* B9: Workforce */}
        <Section code="B9" title={t('rep.b9')} t={t}>
          <DataTable rows={[
            [t('rep.totalEmployeesFte'), fmt(totals.totalEmployees, '', 0)],
            [t('rep.femaleEmployees'), fmt(totals.femaleEmployees, '', 0)],
            [t('rep.maleEmployees'), fmt(totals.maleEmployees, '', 0)],
            [t('rep.femaleShare'), totals.totalEmployees ? pct((totals.femaleEmployees / totals.totalEmployees) * 100) : '—'],
            [t('rep.newHires'), fmt(totals.newHires, '', 0)],
            [t('rep.departures'), fmt(totals.departures, '', 0)],
          ]} />
        </Section>

        {/* B10: Health & Safety */}
        <Section code="B10" title={t('rep.b10')} t={t}>
          {(() => {
            const trir = totals.hoursWorked > 0
              ? ((totals.workAccidents / totals.hoursWorked) * 200000).toFixed(2)
              : null;
            return (
              <DataTable rows={[
                [t('rep.workAccidents'), fmt(totals.workAccidents, '', 0)],
                [t('rep.hoursWorked'), fmt(totals.hoursWorked, '', 0)],
                [t('rep.trir'), trir || '—'],
              ]} />
            );
          })()}
        </Section>

        {/* B11: Training */}
        <Section code="B11" title={t('rep.b11')} t={t}>
          {(() => {
            const perEmployee = totals.totalEmployees > 0
              ? (totals.trainingHours / totals.totalEmployees).toFixed(1)
              : null;
            return (
              <DataTable rows={[
                [t('rep.totalTraining'), fmt(totals.trainingHours, 'h', 0)],
                [t('rep.trainingPerEmployee'), perEmployee ? `${perEmployee} h` : '—'],
              ]} />
            );
          })()}
        </Section>

        {/* B2: Policies & Governance */}
        <Section code="B2" title={t('rep.b2')} t={t}>
          <div className="mb-3 text-sm text-slate-600">
            {t('rep.policySummary', { available: policyGroups.available.length, inProgress: policyGroups.inProgress.length, notAvailable: policyGroups.notAvailable.length })}
          </div>
          <div className="policy-grid grid grid-cols-2 gap-2">
            {policies.map(p => (
              <div key={p.id} className="policy-item text-[13px] p-1.5 bg-slate-50 flex justify-between">
                <span className="truncate mr-2">{p.name}</span>
                <span className={`policy-status font-semibold whitespace-nowrap ${
                  p.status === 'available' ? 'status-approved text-green-600' :
                  p.status === 'in_progress' ? 'status-in-progress text-amber-600' :
                  'status-not-available text-slate-400'
                }`}>
                  {p.status === 'available' ? t('rep.available') : p.status === 'in_progress' ? t('rep.inProgress') : t('rep.na')}
                </span>
              </div>
            ))}
          </div>
        </Section>

        {/* Data Quality */}
        <div className="section mb-8">
          <h2 className="section-title text-base font-bold border-b border-slate-200 pb-2 mb-4">
            {t('rep.dataQuality')}
          </h2>
          <DataTable rows={[
            [t('rep.dataPointsTracked'), `${stats.safeToShareDataPoints} / ${stats.totalDataPoints}`],
            [t('rep.dataCompletion'), pct(stats.dataCompletionPercent)],
            [t('rep.policiesInPlace'), pct(stats.policyCompletionPercent)],
          ]} />
          {(highConf > 0 || medConf > 0 || lowConf > 0) && (
            <div className="quality-bar flex gap-1 mt-3">
              {highConf > 0 && <div className="quality-segment h-2 bg-green-500 rounded-sm" style={{ flex: highConf }} title={t('rep.highConf', { count: highConf })} />}
              {medConf > 0 && <div className="quality-segment h-2 bg-amber-400 rounded-sm" style={{ flex: medConf }} title={t('rep.medConf', { count: medConf })} />}
              {lowConf > 0 && <div className="quality-segment h-2 bg-red-400 rounded-sm" style={{ flex: lowConf }} title={t('rep.lowConf', { count: lowConf })} />}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="footer mt-12 pt-4 border-t border-slate-200 flex justify-between text-xs text-slate-400">
          <span>{t('rep.preparedWith', { date: new Date().toLocaleDateString(numLocale) })}</span>
          <span>{t('rep.vsmeAligned')}</span>
        </div>
      </div>
    </>
  );
}

function Section({ code, title, t, children }) {
  const disclosure = code ? t(`rep.d.${code}`) : '';
  return (
    <div className="section mb-8">
      <h2 className="section-title text-base font-bold border-b border-slate-200 pb-2 mb-4 flex items-baseline gap-2">
        {title}
        {code && <span className="vsme-badge text-[11px] font-semibold bg-slate-100 text-slate-500 px-2 py-0.5">{code}</span>}
        {disclosure && (
          <span className="text-[11px] text-slate-400 font-normal">— {disclosure}</span>
        )}
      </h2>
      {children}
    </div>
  );
}

function DataTable({ rows }) {
  return (
    <table className="w-full border-collapse text-sm">
      <tbody>
        {rows.map(([label, value], i) => (
          <tr key={i}>
            <td className="py-2 px-3 border-b border-slate-100 text-slate-600">{label}</td>
            <td className="value py-2 px-3 border-b border-slate-100 text-right font-medium tabular-nums">{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
