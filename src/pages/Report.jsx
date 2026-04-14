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
import { Button } from '@/components/ui/button';
import { Download, Printer, FileText } from 'lucide-react';

// VSME Basic Module disclosure names
const VSME_DISCLOSURES = {
  B1: 'Basis for preparation',
  B2: 'Practices for sustainability due diligence',
  B4: 'Energy and greenhouse gases',
  B6: 'Water',
  B8: 'Resource use, circular economy and waste',
  B9: 'Workforce — General characteristics',
  B10: 'Workforce — Health and safety',
  B11: 'Workforce — Training',
};

function fmt(val, unit = '', decimals = 1) {
  if (val == null || val === 0) return '—';
  const n = typeof val === 'number' ? val : parseFloat(val);
  if (isNaN(n)) return '—';
  const formatted = n >= 1000
    ? n.toLocaleString('en-EU', { maximumFractionDigits: decimals })
    : n.toFixed(decimals);
  return `${formatted}${unit ? ' ' + unit : ''}`;
}

function pct(val) {
  if (val == null) return '—';
  return `${Math.round(val)}%`;
}

export default function Report() {
  const reportRef = useRef(null);
  const company = getCompanyProfile();
  const records = getDataRecords();
  const stats = getReadinessStats();
  const policies = getPolicies();
  const confidence = getConfidenceRecords();

  // Determine reporting year (most recent year with data)
  const years = [...new Set(records.map(r => r.period.slice(0, 4)))].sort().reverse();
  const reportYear = years[0] || new Date().getFullYear().toString();
  const yearRecords = records.filter(r => r.period.startsWith(reportYear));
  const totals = getAnnualTotals(reportYear);

  const monthsCovered = yearRecords.length;
  const companyName = company?.tradingName || company?.legalName || 'Company';

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
          <h1 className="text-2xl font-bold text-slate-900">ESG Passport Report</h1>
          <p className="text-sm text-slate-500">Share your ESG data with customers and stakeholders.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePDF}>
            <Printer className="w-4 h-4 mr-2" /> Download PDF
          </Button>
          <Button variant="outline" onClick={handleHTML}>
            <Download className="w-4 h-4 mr-2" /> Download HTML
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
          <p className="text-slate-500 text-sm">{companyName} — Reporting Period {reportYear} ({monthsCovered} months of data)</p>

          <dl className="company-meta grid grid-cols-3 gap-4 mt-4">
            {company?.industry && (
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-slate-400">Industry</dt>
                <dd className="text-sm font-semibold">{company.industry}</dd>
              </div>
            )}
            {company?.country && (
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-slate-400">Country</dt>
                <dd className="text-sm font-semibold">{company.country}</dd>
              </div>
            )}
            {company?.totalEmployees && (
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-slate-400">Employees</dt>
                <dd className="text-sm font-semibold">{company.totalEmployees}</dd>
              </div>
            )}
            {company?.numberOfFacilities && (
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-slate-400">Facilities</dt>
                <dd className="text-sm font-semibold">{company.numberOfFacilities}</dd>
              </div>
            )}
            {company?.revenueBand && (
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-slate-400">Revenue Band</dt>
                <dd className="text-sm font-semibold">{company.revenueBand}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* B4: Energy & Greenhouse Gases */}
        <Section code="B4" title="Energy and Greenhouse Gases">
          <DataTable rows={[
            ['Total energy consumption', fmt(totals.totalEnergyKwh, 'kWh')],
            ['Electricity', fmt(totals.electricityKwh, 'kWh')],
            ['Natural gas', fmt(totals.naturalGasKwh, 'kWh')],
            ['Vehicle fuel', fmt(totals.vehicleFuelLiters, 'L')],
            ['Renewable energy share', pct(totals.renewablePercent)],
            ['Scope 1 emissions (direct)', fmt(totals.scope1Tco2e, 'tCO₂e')],
            ['Scope 2 emissions (purchased energy)', fmt(totals.scope2Tco2e, 'tCO₂e')],
            ['Scope 3 emissions (value chain)', fmt(totals.scope3Total, 'tCO₂e')],
          ]} />
        </Section>

        {/* B6: Water */}
        <Section code="B6" title="Water">
          <DataTable rows={[
            ['Total water consumption', fmt(totals.waterM3, 'm³')],
          ]} />
        </Section>

        {/* B8: Waste */}
        <Section code="B8" title="Resource Use, Circular Economy and Waste">
          <DataTable rows={[
            ['Total waste generated', fmt(totals.totalWasteKg ? totals.totalWasteKg / 1000 : null, 't')],
            ['Waste recycled', fmt(totals.recycledWasteKg ? totals.recycledWasteKg / 1000 : null, 't')],
            ['Recycling rate', pct(totals.recyclingRate)],
            ['Hazardous waste', fmt(totals.hazardousWasteKg, 'kg')],
          ]} />
        </Section>

        {/* B9: Workforce */}
        <Section code="B9" title="Workforce — General Characteristics">
          <DataTable rows={[
            ['Total employees (FTE)', fmt(totals.totalEmployees, '', 0)],
            ['Female employees', fmt(totals.femaleEmployees, '', 0)],
            ['Male employees', fmt(totals.maleEmployees, '', 0)],
            ['Female share', totals.totalEmployees ? pct((totals.femaleEmployees / totals.totalEmployees) * 100) : '—'],
            ['New hires (period)', fmt(totals.newHires, '', 0)],
            ['Departures (period)', fmt(totals.departures, '', 0)],
          ]} />
        </Section>

        {/* B10: Health & Safety */}
        <Section code="B10" title="Workforce — Health and Safety">
          {(() => {
            const trir = totals.hoursWorked > 0
              ? ((totals.workAccidents / totals.hoursWorked) * 200000).toFixed(2)
              : null;
            return (
              <DataTable rows={[
                ['Work-related accidents', fmt(totals.workAccidents, '', 0)],
                ['Hours worked', fmt(totals.hoursWorked, '', 0)],
                ['TRIR (per 200,000 hours)', trir || '—'],
              ]} />
            );
          })()}
        </Section>

        {/* B11: Training */}
        <Section code="B11" title="Workforce — Training">
          {(() => {
            const perEmployee = totals.totalEmployees > 0
              ? (totals.trainingHours / totals.totalEmployees).toFixed(1)
              : null;
            return (
              <DataTable rows={[
                ['Total training hours', fmt(totals.trainingHours, 'h', 0)],
                ['Training hours per employee', perEmployee ? `${perEmployee} h` : '—'],
              ]} />
            );
          })()}
        </Section>

        {/* B2: Policies & Governance */}
        <Section code="B2" title="Policies and Governance">
          <div className="mb-3 text-sm text-slate-600">
            {policyGroups.available.length} available, {policyGroups.inProgress.length} in progress, {policyGroups.notAvailable.length} not yet available
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
                  {p.status === 'available' ? 'Available' : p.status === 'in_progress' ? 'In Progress' : 'N/A'}
                </span>
              </div>
            ))}
          </div>
        </Section>

        {/* Data Quality */}
        <div className="section mb-8">
          <h2 className="section-title text-base font-bold border-b border-slate-200 pb-2 mb-4">
            Data Quality Summary
          </h2>
          <DataTable rows={[
            ['Data points tracked', `${stats.safeToShareDataPoints} / ${stats.totalDataPoints}`],
            ['Data completion', pct(stats.dataCompletionPercent)],
            ['Policies in place', pct(stats.policyCompletionPercent)],
          ]} />
          {(highConf > 0 || medConf > 0 || lowConf > 0) && (
            <div className="quality-bar flex gap-1 mt-3">
              {highConf > 0 && <div className="quality-segment h-2 bg-green-500 rounded-sm" style={{ flex: highConf }} title={`${highConf} high confidence`} />}
              {medConf > 0 && <div className="quality-segment h-2 bg-amber-400 rounded-sm" style={{ flex: medConf }} title={`${medConf} medium confidence`} />}
              {lowConf > 0 && <div className="quality-segment h-2 bg-red-400 rounded-sm" style={{ flex: lowConf }} title={`${lowConf} low confidence`} />}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="footer mt-12 pt-4 border-t border-slate-200 flex justify-between text-xs text-slate-400">
          <span>Generated by ESG Passport — {new Date().toLocaleDateString()}</span>
          <span>VSME Basic Module aligned</span>
        </div>
      </div>
    </>
  );
}

function Section({ code, title, children }) {
  return (
    <div className="section mb-8">
      <h2 className="section-title text-base font-bold border-b border-slate-200 pb-2 mb-4 flex items-baseline gap-2">
        {title}
        {code && <span className="vsme-badge text-[11px] font-semibold bg-slate-100 text-slate-500 px-2 py-0.5">{code}</span>}
        {code && VSME_DISCLOSURES[code] && (
          <span className="text-[11px] text-slate-400 font-normal">— {VSME_DISCLOSURES[code]}</span>
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
