import React from 'react';
import { Link } from 'react-router-dom';
import { getCompanyProfile, getAnnualTotals, getPolicies, getSettings } from '@/lib/store';
import { COUNTRIES } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Download, FileText, Mail, Printer } from 'lucide-react';

export default function Export() {
  const company = getCompanyProfile();
  const settings = getSettings();
  const currentYear = new Date().getFullYear().toString();
  const totals = getAnnualTotals(currentYear);
  const policies = getPolicies();

  const approvedPolicies = policies.filter(p => p.status === 'approved' || p.status === 'published');
  const highPriorityPolicies = policies.filter(p => p.priority === 'high');

  const formatNumber = (num, decimals = 0) => {
    if (num == null || isNaN(num)) return '—';
    return num.toLocaleString('en-US', { maximumFractionDigits: decimals });
  };

  const getCountryName = (code) => COUNTRIES.find(c => c.code === code)?.name || code;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyEmail = () => {
    const text = `Dear [Customer],

Please find attached our Sustainability Summary for ${currentYear}.

This document provides an overview of our environmental performance, workforce data, and governance policies.

If you require any additional information, please contact me.

Best regards,
${company?.esgContactName || '[Name]'}
${company?.esgContactRole ? company.esgContactRole + '\n' : ''}${company?.legalName || ''}
${company?.esgContactEmail || ''}`;

    navigator.clipboard.writeText(text);
    alert('Email template copied!');
  };

  const totalEmissions = (totals.scope1Tco2e || 0) + (totals.scope2Tco2e || 0);
  const femalePercent = totals.totalEmployees && totals.femaleEmployees 
    ? Math.round((totals.femaleEmployees / totals.totalEmployees) * 100) 
    : null;

  if (!company) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        <FileText className="w-12 h-12 mx-auto text-[#2D5016]/30 mb-4" />
        <h2 className="text-xl font-semibold text-[#2D5016] mb-2">Complete Setup First</h2>
        <p className="text-[#2D5016]/60 mb-4">Set up your company profile before generating exports</p>
        <Link to="/onboarding"><Button>Get Started</Button></Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls - hidden in print */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-[#2D5016] flex items-center gap-2">
            <Download className="w-6 h-6" />
            Export
          </h1>
          <p className="text-[#2D5016]/70 mt-1">Print or save as PDF to share with customers</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCopyEmail}>
            <Mail className="w-4 h-4 mr-2" /> Email Template
          </Button>
          <Button onClick={handlePrint} className="bg-[#2D5016] hover:bg-[#3d6b1e] text-white">
            <Printer className="w-4 h-4 mr-2" /> Print / PDF
          </Button>
        </div>
      </div>

      {/* Document */}
      <div className="bg-white shadow-lg print:shadow-none" id="export-content">
        <div className="max-w-[800px] mx-auto px-12 py-10 print:px-0 print:py-0">
          
          {/* Letterhead */}
          <header className="mb-10 pb-6 border-b-2 border-gray-900">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              {company.tradingName || company.legalName}
            </h1>
            <p className="text-gray-600 mt-1">{company.industrySector}</p>
            <div className="flex gap-6 mt-3 text-sm text-gray-600">
              <span>{getCountryName(company.countryOfIncorporation)}</span>
              {company.website && <span>{company.website}</span>}
            </div>
          </header>

          {/* Title */}
          <div className="mb-10">
            <h2 className="text-2xl font-semibold text-gray-900">Sustainability Data Summary</h2>
            <p className="text-gray-600">Reporting Period: January – December {currentYear}</p>
          </div>

          {/* Company Overview */}
          <section className="mb-10">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Company Overview</h3>
            <table className="w-full text-sm">
              <tbody>
                <tr>
                  <td className="py-1.5 text-gray-600 w-48">Legal Name</td>
                  <td className="py-1.5 text-gray-900">{company.legalName}</td>
                </tr>
                {company.registrationNumber && (
                  <tr>
                    <td className="py-1.5 text-gray-600">Registration Number</td>
                    <td className="py-1.5 text-gray-900">{company.registrationNumber}</td>
                  </tr>
                )}
                <tr>
                  <td className="py-1.5 text-gray-600">Country</td>
                  <td className="py-1.5 text-gray-900">{getCountryName(company.countryOfIncorporation)}</td>
                </tr>
                <tr>
                  <td className="py-1.5 text-gray-600">Industry Sector</td>
                  <td className="py-1.5 text-gray-900">{company.industrySector}</td>
                </tr>
                {company.naceCode && (
                  <tr>
                    <td className="py-1.5 text-gray-600">NACE Code</td>
                    <td className="py-1.5 text-gray-900">{company.naceCode}</td>
                  </tr>
                )}
                <tr>
                  <td className="py-1.5 text-gray-600">Number of Employees</td>
                  <td className="py-1.5 text-gray-900">{formatNumber(company.totalEmployees)} FTE</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* Environmental Data */}
          <section className="mb-10">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Environmental Data</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="py-2 text-left text-gray-600 font-medium">Indicator</th>
                  <th className="py-2 text-right text-gray-600 font-medium">Value</th>
                  <th className="py-2 text-left pl-4 text-gray-600 font-medium">Unit</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="py-2 text-gray-900">Total Energy Consumption</td>
                  <td className="py-2 text-right text-gray-900">{formatNumber(totals.totalEnergyKwh)}</td>
                  <td className="py-2 pl-4 text-gray-600">kWh</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-2 text-gray-900 pl-4">– Electricity</td>
                  <td className="py-2 text-right text-gray-900">{formatNumber(totals.electricityKwh)}</td>
                  <td className="py-2 pl-4 text-gray-600">kWh</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-2 text-gray-900 pl-4">– Natural Gas</td>
                  <td className="py-2 text-right text-gray-900">{formatNumber(totals.naturalGasKwh)}</td>
                  <td className="py-2 pl-4 text-gray-600">kWh</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-2 text-gray-900">GHG Emissions – Scope 1 (Direct)</td>
                  <td className="py-2 text-right text-gray-900">{formatNumber(totals.scope1Tco2e, 2)}</td>
                  <td className="py-2 pl-4 text-gray-600">tCO₂e</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-2 text-gray-900">GHG Emissions – Scope 2 (Indirect)</td>
                  <td className="py-2 text-right text-gray-900">{formatNumber(totals.scope2Tco2e, 2)}</td>
                  <td className="py-2 pl-4 text-gray-600">tCO₂e</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-2 text-gray-900 font-medium">Total GHG Emissions (Scope 1+2)</td>
                  <td className="py-2 text-right text-gray-900 font-medium">{formatNumber(totalEmissions, 2)}</td>
                  <td className="py-2 pl-4 text-gray-600">tCO₂e</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-2 text-gray-900">Water Consumption</td>
                  <td className="py-2 text-right text-gray-900">{formatNumber(totals.waterM3)}</td>
                  <td className="py-2 pl-4 text-gray-600">m³</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-2 text-gray-900">Total Waste Generated</td>
                  <td className="py-2 text-right text-gray-900">{formatNumber((totals.totalWasteKg || 0) / 1000, 2)}</td>
                  <td className="py-2 pl-4 text-gray-600">tonnes</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-2 text-gray-900 pl-4">– Recycled</td>
                  <td className="py-2 text-right text-gray-900">{formatNumber((totals.recycledWasteKg || 0) / 1000, 2)}</td>
                  <td className="py-2 pl-4 text-gray-600">tonnes</td>
                </tr>
                <tr>
                  <td className="py-2 text-gray-900 pl-4">– Hazardous</td>
                  <td className="py-2 text-right text-gray-900">{formatNumber((totals.hazardousWasteKg || 0) / 1000, 3)}</td>
                  <td className="py-2 pl-4 text-gray-600">tonnes</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* Social Data */}
          <section className="mb-10">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Social Data</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="py-2 text-left text-gray-600 font-medium">Indicator</th>
                  <th className="py-2 text-right text-gray-600 font-medium">Value</th>
                  <th className="py-2 text-left pl-4 text-gray-600 font-medium">Unit</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="py-2 text-gray-900">Total Workforce</td>
                  <td className="py-2 text-right text-gray-900">{formatNumber(totals.totalEmployees)}</td>
                  <td className="py-2 pl-4 text-gray-600">FTE</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-2 text-gray-900">Female Employees</td>
                  <td className="py-2 text-right text-gray-900">{formatNumber(totals.femaleEmployees)}</td>
                  <td className="py-2 pl-4 text-gray-600">FTE</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-2 text-gray-900">Gender Ratio (Female)</td>
                  <td className="py-2 text-right text-gray-900">{femalePercent != null ? femalePercent : '—'}</td>
                  <td className="py-2 pl-4 text-gray-600">%</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-2 text-gray-900">Training Hours (Total)</td>
                  <td className="py-2 text-right text-gray-900">{formatNumber(totals.trainingHours)}</td>
                  <td className="py-2 pl-4 text-gray-600">hours</td>
                </tr>
                <tr>
                  <td className="py-2 text-gray-900">Work-Related Accidents</td>
                  <td className="py-2 text-right text-gray-900">{totals.workAccidents != null ? formatNumber(totals.workAccidents) : '0'}</td>
                  <td className="py-2 pl-4 text-gray-600">incidents</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* Governance */}
          <section className="mb-10">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Governance & Policies</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="py-2 text-left text-gray-600 font-medium">Policy</th>
                  <th className="py-2 text-left text-gray-600 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {highPriorityPolicies.map(policy => (
                  <tr key={policy.id} className="border-b border-gray-200">
                    <td className="py-2 text-gray-900">{policy.name}</td>
                    <td className="py-2 text-gray-900">
                      {policy.status === 'approved' || policy.status === 'published' 
                        ? 'In place' 
                        : policy.exists 
                          ? 'In development' 
                          : 'Planned'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Contact & Notes */}
          <section className="mb-10">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Contact</h3>
            <div className="text-sm text-gray-900">
              <p className="font-medium">{company.esgContactName}</p>
              {company.esgContactRole && <p>{company.esgContactRole}</p>}
              <p>{company.esgContactEmail}</p>
              {company.esgContactPhone && <p>{company.esgContactPhone}</p>}
            </div>
          </section>

          {/* Footer */}
          <footer className="pt-6 border-t border-gray-300 text-xs text-gray-500">
            <p>This document was prepared by {company.tradingName || company.legalName} based on internal data collection.</p>
            <p>GHG emissions calculated using location-based method with {settings.gridCountry} emission factors.</p>
            <p className="mt-2">Document generated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </footer>

        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          @page { 
            margin: 20mm; 
            size: A4; 
          }
          body { 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact; 
          }
          body * { visibility: hidden; }
          #export-content, #export-content * { visibility: visible; }
          #export-content { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%;
            background: white;
          }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}
