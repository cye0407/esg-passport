import React, { useState, useEffect, useRef } from 'react';
import {
  getDataRecords,
  saveDataRecord,
  getSettings,
  getCompanyProfile,
  getAnnualTotals,
  saveSettings,
} from '@/lib/store';
import { MONTHS, EMISSION_FACTORS } from '@/lib/constants';
import { getIndustryMetrics } from '@/data/industry-metrics';
import { FIELD_UNITS, getAlternativeUnits, convert } from '@/lib/units';
import { t } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Database,
  Save,
  ChevronLeft,
  ChevronRight,
  Check,
  Info,
  AlertTriangle,
  Flag,
  Upload as UploadIcon,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Factory,
  Calendar,
  ChevronDown,
  ChevronUp,
  Zap,
} from 'lucide-react';

export default function Data() {
  const [records, setRecords] = useState({});
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState({});

  // Entry mode: monthly grid vs annual totals
  const [entryMode, setEntryMode] = useState('monthly');
  const [annualValues, setAnnualValues] = useState({});

  // Industry-adaptive: toggle to show all metrics
  const [showAllMetrics, setShowAllMetrics] = useState(false);

  // Year-over-year comparison
  const [showComparison, setShowComparison] = useState(false);

  // CSV import
  const csvInputRef = useRef(null);

  const settings = getSettings();
  const profile = getCompanyProfile();
  const industry = profile?.industrySector || '';
  const gridFactor = EMISSION_FACTORS.electricity[settings.gridCountry] || EMISSION_FACTORS.electricity.EU_AVERAGE;

  // Intensity metrics
  const [productionVolume, setProductionVolume] = useState(settings.productionVolume || '');
  const productionUnit = settings.productionUnit || 'units';
  const productionUnitLabel = settings.productionUnitLabel || 'Units produced';

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const getMonthsForYear = (year) => {
    const months = [];
    for (let m = 1; m <= 12; m++) {
      const isFuture = year === currentYear && m > currentMonth;
      months.push({
        period: `${year}-${String(m).padStart(2, '0')}`,
        label: MONTHS.find(mo => mo.value === String(m).padStart(2, '0'))?.label.slice(0, 3),
        isFuture,
      });
    }
    return months;
  };

  const monthsToShow = getMonthsForYear(selectedYear);

  useEffect(() => {
    loadRecords();
  }, []);

  // Validate whenever records change
  useEffect(() => {
    validateAllRecords();
  }, [records]);

  const loadRecords = () => {
    const data = getDataRecords();
    const recordsMap = {};
    data.forEach(r => {
      recordsMap[r.period] = r;
    });
    setRecords(recordsMap);
  };

  const getRecord = (period) => {
    return records[period] || createEmptyRecord(period);
  };

  const createEmptyRecord = (period) => ({
    period,
    energy: {},
    water: {},
    waste: {},
    workforce: {},
    healthSafety: {},
    training: {},
  });

  const updateField = (period, section, field, value) => {
    setRecords(prev => {
      const existing = prev[period] || createEmptyRecord(period);
      return {
        ...prev,
        [period]: {
          ...existing,
          [section]: {
            ...existing[section],
            [field]: value,
          }
        }
      };
    });
    setHasChanges(true);
    setSaved(false);
  };

  const getValue = (period, section, field) => {
    const record = records[period];
    return record?.[section]?.[field] ?? '';
  };

  // Validation logic
  const validateAllRecords = () => {
    const newErrors = {};

    Object.entries(records).forEach(([period, record]) => {
      const renewable = parseFloat(record.energy?.renewablePercent);
      if (renewable && (renewable < 0 || renewable > 100)) {
        newErrors[`${period}-energy-renewablePercent`] = 'Must be 0-100';
      }

      const totalWaste = parseFloat(record.waste?.totalKg) || 0;
      const recycledWaste = parseFloat(record.waste?.recycledKg) || 0;
      const hazardousWaste = parseFloat(record.waste?.hazardousKg) || 0;

      if (recycledWaste > totalWaste && totalWaste > 0) {
        newErrors[`${period}-waste-recycledKg`] = 'Cannot exceed total waste';
      }
      if (hazardousWaste > totalWaste && totalWaste > 0) {
        newErrors[`${period}-waste-hazardousKg`] = 'Cannot exceed total waste';
      }

      const totalEmp = parseFloat(record.workforce?.totalEmployees) || 0;
      const femaleEmp = parseFloat(record.workforce?.femaleEmployees) || 0;
      const maleEmp = parseFloat(record.workforce?.maleEmployees) || 0;

      if (totalEmp > 0 && (femaleEmp + maleEmp) > totalEmp) {
        newErrors[`${period}-workforce-femaleEmployees`] = 'Female + Male exceeds total';
        newErrors[`${period}-workforce-maleEmployees`] = 'Female + Male exceeds total';
      }
      if (femaleEmp > totalEmp && totalEmp > 0) {
        newErrors[`${period}-workforce-femaleEmployees`] = 'Cannot exceed total employees';
      }
      if (maleEmp > totalEmp && totalEmp > 0) {
        newErrors[`${period}-workforce-maleEmployees`] = 'Cannot exceed total employees';
      }
    });

    setErrors(newErrors);
  };

  const hasErrors = Object.keys(errors).length > 0;

  const getError = (period, section, field) => {
    return errors[`${period}-${section}-${field}`];
  };

  const calculateEmissions = (record) => {
    const electricity = parseFloat(record?.energy?.electricityKwh) || 0;
    const gas = parseFloat(record?.energy?.naturalGasKwh) || 0;
    const fuel = parseFloat(record?.energy?.vehicleFuelLiters) || 0;
    const scope1 = (gas * EMISSION_FACTORS.naturalGas) + (fuel * EMISSION_FACTORS.vehicleFuel);
    const scope2 = electricity * gridFactor;
    return { scope1Tco2e: Math.round(scope1 * 1000) / 1000, scope2Tco2e: Math.round(scope2 * 1000) / 1000 };
  };

  const handleSave = async () => {
    if (hasErrors) return;

    setSaving(true);

    // In annual mode, distribute values to monthly records first
    let recordsToProcess = { ...records };
    if (entryMode === 'annual') {
      const months = monthsToShow.filter(m => !m.isFuture);
      const monthCount = months.length || 1;

      months.forEach(month => {
        const existing = recordsToProcess[month.period] || createEmptyRecord(month.period);
        const updated = { ...existing, period: month.period };

        dataRows.forEach(row => {
          const val = getAnnualInputValue(row.section, row.field);
          if (val !== '') {
            const numVal = parseFloat(val) || 0;
            const distributed = row.noSum ? numVal : Math.round((numVal / monthCount) * 100) / 100;
            updated[row.section] = { ...updated[row.section], [row.field]: String(distributed) };
          }
        });

        recordsToProcess[month.period] = updated;
      });

      setRecords(recordsToProcess);
    }

    Object.entries(recordsToProcess).forEach(([period, record]) => {
      const hasData = Object.values(record).some(section => {
        if (typeof section !== 'object') return false;
        return Object.values(section).some(v => v !== '' && v !== null && v !== undefined);
      });

      if (hasData) {
        const emissions = calculateEmissions(record);
        const totalWaste = parseFloat(record.waste?.totalKg) || 0;
        const recycledWaste = parseFloat(record.waste?.recycledKg) || 0;
        const recyclingRate = totalWaste > 0 ? Math.round((recycledWaste / totalWaste) * 100) : null;

        // Gather industry-specific sections dynamically
        const extraSections = {};
        industryMetricRows.forEach(row => {
          if (!extraSections[row.section]) extraSections[row.section] = {};
          const val = record[row.section]?.[row.field];
          if (val !== undefined && val !== '' && val !== null) {
            extraSections[row.section][row.field] = parseFloat(val) || null;
          }
        });

        const recordToSave = {
          period,
          energy: {
            electricityKwh: parseFloat(record.energy?.electricityKwh) || null,
            naturalGasKwh: parseFloat(record.energy?.naturalGasKwh) || null,
            vehicleFuelLiters: parseFloat(record.energy?.vehicleFuelLiters) || null,
            renewablePercent: parseFloat(record.energy?.renewablePercent) || null,
            ...emissions,
          },
          water: { consumptionM3: parseFloat(record.water?.consumptionM3) || null },
          waste: {
            totalKg: parseFloat(record.waste?.totalKg) || null,
            recycledKg: parseFloat(record.waste?.recycledKg) || null,
            hazardousKg: parseFloat(record.waste?.hazardousKg) || null,
            recyclingRate,
          },
          workforce: {
            totalEmployees: parseInt(record.workforce?.totalEmployees) || null,
            femaleEmployees: parseInt(record.workforce?.femaleEmployees) || null,
            maleEmployees: parseInt(record.workforce?.maleEmployees) || null,
          },
          healthSafety: {
            workAccidents: parseInt(record.healthSafety?.workAccidents) || null,
          },
          training: {
            trainingHours: parseFloat(record.training?.trainingHours) || null,
          },
          ...extraSections,
        };

        saveDataRecord(recordToSave);
      }
    });

    loadRecords();
    setHasChanges(false);
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 2000);
  };

  const lang = settings.language || 'en';

  // Ordered by importance: required (80% of questionnaires) first, then commonly requested
  const coreDataRows = [
    // === REQUIRED FOR 80% OF REPORTING ===
    { section: 'energy', field: 'electricityKwh', label: t('data.electricity', lang) || 'Electricity (kWh)', required: true },
    { section: 'workforce', field: 'totalEmployees', label: t('data.employees', lang) || 'Employees (FTE)', noSum: true, required: true },
    { section: 'waste', field: 'totalKg', label: t('data.totalWaste', lang) || 'Total Waste (kg)', required: true },
    { section: 'healthSafety', field: 'workAccidents', label: t('data.workAccidents', lang) || 'Work Accidents', required: true },
    // === COMMONLY REQUESTED ===
    { section: 'energy', field: 'naturalGasKwh', label: t('data.naturalGas', lang) || 'Natural Gas (kWh)' },
    { section: 'energy', field: 'vehicleFuelLiters', label: t('data.vehicleFuel', lang) || 'Vehicle Fuel (L)' },
    { section: 'energy', field: 'renewablePercent', label: t('data.renewablePercent', lang) || 'Renewable %', noSum: true },
    { section: 'water', field: 'consumptionM3', label: t('data.water', lang) || 'Water (m\u00B3)' },
    { section: 'waste', field: 'recycledKg', label: t('data.recycled', lang) || 'Recycled (kg)' },
    { section: 'waste', field: 'hazardousKg', label: t('data.hazardous', lang) || 'Hazardous (kg)' },
    { section: 'workforce', field: 'femaleEmployees', label: t('data.female', lang) || 'Female', noSum: true },
    { section: 'workforce', field: 'maleEmployees', label: t('data.male', lang) || 'Male', noSum: true },
    { section: 'training', field: 'trainingHours', label: t('data.trainingHours', lang) || 'Training (hrs)' },
  ];

  // Industry-specific metrics appended after core rows
  const industryMetricRows = getIndustryMetrics(industry);
  const dataRows = [...coreDataRows, ...industryMetricRows];

  // ---- Industry-adaptive row filtering ----
  const INDUSTRY_OPTIONAL = {
    'Technology & Software': ['vehicleFuelLiters', 'naturalGasKwh', 'hazardousKg'],
    'Professional Services': ['vehicleFuelLiters', 'naturalGasKwh', 'hazardousKg', 'recycledKg'],
    'Retail': ['vehicleFuelLiters', 'naturalGasKwh', 'hazardousKg'],
    'Healthcare': ['vehicleFuelLiters'],
  };

  const optionalFields = INDUSTRY_OPTIONAL[industry] || [];
  const coreRows = dataRows.filter(r => !optionalFields.includes(r.field));
  const optionalRows = dataRows.filter(r => optionalFields.includes(r.field));
  const visibleRows = showAllMetrics || optionalFields.length === 0 ? dataRows : coreRows;

  const calculateYearTotal = (section, field) => {
    let total = 0;
    monthsToShow.forEach(month => {
      const val = parseFloat(getValue(month.period, section, field)) || 0;
      total += val;
    });
    return total;
  };

  const monthHasData = (period) => {
    const record = records[period];
    if (!record) return false;
    return dataRows.some(row => {
      const val = record[row.section]?.[row.field];
      return val !== undefined && val !== null && val !== '';
    });
  };

  // ---- Annual mode helpers ----
  const switchToAnnual = () => {
    const values = {};
    dataRows.forEach(row => {
      const key = `${row.section}.${row.field}`;
      if (row.noSum) {
        // Snapshot: use last known value
        const months = monthsToShow.filter(m => !m.isFuture);
        let found = false;
        for (let i = months.length - 1; i >= 0; i--) {
          const val = getValue(months[i].period, row.section, row.field);
          if (val !== '') { values[key] = val; found = true; break; }
        }
        if (!found) values[key] = '';
      } else {
        const total = calculateYearTotal(row.section, row.field);
        values[key] = total > 0 ? String(total) : '';
      }
    });
    setAnnualValues(values);
    setEntryMode('annual');
  };

  const switchToMonthly = () => {
    setEntryMode('monthly');
  };

  const getAnnualInputValue = (section, field) => annualValues[`${section}.${field}`] ?? '';

  const updateAnnualValue = (section, field, value) => {
    setAnnualValues(prev => ({ ...prev, [`${section}.${field}`]: value }));
    setHasChanges(true);
    setSaved(false);
  };

  // ---- CSV import ----
  const handleCsvImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const lines = text.split('\n').map(l => l.trim()).filter(l => l);
      if (lines.length < 2) return;

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const findCol = (...terms) => headers.findIndex(h => terms.some(t => h.includes(t)));

      const colMap = {
        electricityKwh: { col: findCol('electricity'), section: 'energy' },
        naturalGasKwh: { col: findCol('natural gas', 'gas (kwh)'), section: 'energy' },
        vehicleFuelLiters: { col: findCol('vehicle fuel', 'fuel (l)', 'diesel'), section: 'energy' },
        renewablePercent: { col: findCol('renewable'), section: 'energy' },
        consumptionM3: { col: findCol('water'), section: 'water' },
        totalKg: { col: findCol('total waste', 'waste (kg)'), section: 'waste' },
        recycledKg: { col: findCol('recycled'), section: 'waste' },
        hazardousKg: { col: findCol('hazardous'), section: 'waste' },
        totalEmployees: { col: findCol('employee', 'fte', 'headcount'), section: 'workforce' },
        femaleEmployees: { col: findCol('female'), section: 'workforce' },
        maleEmployees: { col: headers.findIndex(h => h.includes('male') && !h.includes('female')), section: 'workforce' },
        workAccidents: { col: findCol('accident', 'incident', 'injury'), section: 'healthSafety' },
        trainingHours: { col: findCol('training'), section: 'training' },
      };

      let imported = 0;
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim());
        const period = cols[0];
        if (!period || !/^\d{4}-\d{2}$/.test(period)) continue;

        Object.entries(colMap).forEach(([field, { col, section }]) => {
          if (col >= 0 && cols[col] !== undefined && cols[col] !== '') {
            updateField(period, section, field, cols[col]);
          }
        });
        imported++;
      }

      if (imported > 0) setHasChanges(true);
    } catch (err) {
      console.error('CSV import error:', err);
    }
    if (csvInputRef.current) csvInputRef.current.value = '';
  };

  const downloadCsvTemplate = () => {
    const headers = ['Period', ...dataRows.map(r => r.label)];
    const rows = monthsToShow
      .filter(m => !m.isFuture)
      .map(m => [m.period, ...dataRows.map(() => '')].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `esg-data-template-${selectedYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ---- Year-over-year comparison ----
  const comparisonYears = [currentYear - 2, currentYear - 1, currentYear];
  const comparisonTotals = {};
  if (showComparison) {
    comparisonYears.forEach(y => {
      comparisonTotals[y] = getAnnualTotals(String(y));
    });
  }

  const comparisonMetrics = [
    { key: 'electricityKwh', label: 'Electricity (kWh)', format: v => v.toLocaleString(), lowerIsBetter: true },
    { key: 'scope1Tco2e', label: 'Scope 1 (tCO\u2082e)', format: v => v.toFixed(2), lowerIsBetter: true },
    { key: 'scope2Tco2e', label: 'Scope 2 (tCO\u2082e)', format: v => v.toFixed(2), lowerIsBetter: true },
    { key: 'totalWasteKg', label: 'Total Waste (kg)', format: v => v.toLocaleString(), lowerIsBetter: true },
    { key: 'waterM3', label: 'Water (m\u00B3)', format: v => v.toLocaleString(), lowerIsBetter: true },
    { key: 'recyclingRate', label: 'Recycling Rate', format: v => v.toFixed(0) + '%', lowerIsBetter: false },
    { key: 'totalEmployees', label: 'Employees', format: v => String(v), lowerIsBetter: false },
    { key: 'workAccidents', label: 'Work Accidents', format: v => String(v), lowerIsBetter: true },
    { key: 'trainingHours', label: 'Training Hours', format: v => v.toLocaleString(), lowerIsBetter: false },
  ];

  // Get unique error messages for display
  const uniqueErrors = [...new Set(Object.values(errors))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-6 h-6" />
            {entryMode === 'monthly' ? t('data.title.monthly', lang) : t('data.title.annual', lang)}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {t('data.subtitle', lang).replace('{mode}', entryMode === 'monthly' ? t('btn.monthly', lang).toLowerCase() : t('btn.annual', lang).toLowerCase()).replace('{year}', selectedYear)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Entry mode toggle */}
          <div className="flex bg-slate-50 rounded-lg p-0.5 mr-2">
            <button
              onClick={switchToMonthly}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                entryMode === 'monthly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'
              )}
            >
              {t('btn.monthly', lang)}
            </button>
            <button
              onClick={switchToAnnual}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                entryMode === 'annual' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'
              )}
            >
              {t('btn.annual', lang)}
            </button>
          </div>

          {/* Year selector */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedYear(y => y - 1)}
            disabled={selectedYear <= currentYear - 2}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="font-semibold text-slate-900 w-16 text-center">{selectedYear}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedYear(y => y + 1)}
            disabled={selectedYear >= currentYear}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* CSV Import / Template Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={csvInputRef}
          type="file"
          accept=".csv"
          onChange={handleCsvImport}
          className="hidden"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => csvInputRef.current?.click()}
          className="text-slate-900 border-slate-200"
        >
          <UploadIcon className="w-4 h-4 mr-1" />
          {t('btn.import', lang)}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={downloadCsvTemplate}
          className="text-slate-900 border-slate-200"
        >
          <Download className="w-4 h-4 mr-1" />
          {t('btn.template', lang)}
        </Button>
        <button
          onClick={() => setShowComparison(!showComparison)}
          className={cn(
            'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
            showComparison
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'text-slate-500 border-slate-200 hover:text-slate-900'
          )}
        >
          <ArrowUpRight className="w-3 h-3" />
          {t('btn.yoy', lang)}
        </button>
      </div>

      {/* Industry hint */}
      {industry && optionalFields.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
          <Factory className="w-4 h-4 flex-shrink-0" />
          <span>Showing metrics most relevant for <strong>{industry}</strong>.</span>
          <button
            onClick={() => setShowAllMetrics(!showAllMetrics)}
            className="text-slate-900 underline ml-1"
          >
            {showAllMetrics ? t('btn.showRecommended', lang) : `${t('btn.showAll', lang)} (+${optionalRows.length})`}
          </button>
        </div>
      )}

      {/* Production Volume (for intensity metrics) */}
      <div className="flex items-center gap-3 bg-slate-50 rounded-lg px-3 py-2">
        <Zap className="w-4 h-4 text-slate-500 flex-shrink-0" />
        <span className="text-sm text-slate-600">{t('data.productionVolume', lang)}:</span>
        <input
          type="text"
          inputMode="numeric"
          value={productionVolume}
          onChange={(e) => {
            const val = e.target.value.replace(/[^0-9.]/g, '');
            setProductionVolume(val);
            saveSettings({ productionVolume: parseFloat(val) || null });
          }}
          placeholder={productionUnitLabel}
          className="w-32 h-7 text-center text-sm px-2 border rounded-md bg-white border-slate-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20 focus:outline-none"
        />
        <span className="text-xs text-slate-400">{productionUnit}</span>
      </div>

      {/* Error Banner */}
      {hasErrors && (
        <div className="bg-red-50 border border-red-200 rounded-none p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Please fix the following errors:</p>
            <ul className="text-sm text-red-700 mt-1">
              {uniqueErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Data Grid */}
      <div className="bg-white border border-slate-200 rounded-none p-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-2 pr-2 font-medium text-slate-900 w-[140px]">Metric</th>
              {entryMode === 'monthly' ? (
                <>
                  {monthsToShow.map(month => (
                    <th key={month.period} className={cn(
                      "py-2 px-1 font-medium text-center",
                      month.isFuture ? "text-slate-300" : "text-slate-900"
                    )}>
                      <div className="flex flex-col items-center">
                        <span className="text-xs">{month.label}</span>
                        {!month.isFuture && monthHasData(month.period) && <Check className="w-3 h-3 text-green-600 mt-0.5" />}
                      </div>
                    </th>
                  ))}
                  <th className="py-2 pl-2 font-medium text-slate-900 text-right w-[80px]">Total</th>
                </>
              ) : (
                <th className="py-2 px-4 font-medium text-center text-slate-900">
                  <div className="flex items-center justify-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{selectedYear} Total</span>
                  </div>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, idx) => (
              <React.Fragment key={`${row.section}-${row.field}`}>
                {/* Industry metrics section header */}
                {idx === coreDataRows.length && industryMetricRows.length > 0 && (
                  <tr className="border-t-2 border-indigo-500/30">
                    <td colSpan={entryMode === 'monthly' ? 14 : 2} className="py-2 text-xs font-semibold text-indigo-500 uppercase tracking-wide">
                      <span className="flex items-center gap-1"><Zap className="w-3 h-3" />{industry} {t('data.industryMetrics', lang)}</span>
                    </td>
                  </tr>
                )}
              <tr className={cn('border-b border-slate-200', idx % 2 === 0 ? '' : 'bg-slate-50/50')}>
                <td className="py-1.5 pr-2 text-slate-900">
                  <span className="flex items-center gap-1">
                    {row.required && <Flag className="w-3 h-3 text-orange-500 flex-shrink-0" title="Required for 80% of questionnaires" />}
                    {row.label}
                    {row.noSum && entryMode === 'annual' && <span className="text-[10px] text-slate-400 ml-1">(snapshot)</span>}
                  </span>
                </td>

                {entryMode === 'monthly' ? (
                  <>
                    {monthsToShow.map(month => {
                      const error = getError(month.period, row.section, row.field);
                      return (
                        <td key={month.period} className="py-1 px-0.5">
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={getValue(month.period, row.section, row.field)}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9.]/g, '');
                              updateField(month.period, row.section, row.field, val);
                            }}
                            disabled={month.isFuture}
                            title={error || ''}
                            className={cn(
                              "w-full h-7 text-center text-sm px-1 border rounded-md focus:outline-none",
                              month.isFuture
                                ? "bg-gray-100 border-gray-200 text-gray-300 cursor-not-allowed"
                                : error
                                  ? "bg-red-50 border-red-400 text-red-900 focus:border-red-500 focus:ring-1 focus:ring-red-200"
                                  : "bg-white border-slate-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20"
                            )}
                          />
                        </td>
                      );
                    })}
                    <td className="py-1.5 pl-2 text-right font-medium text-slate-900">
                      {row.noSum ? '' : (calculateYearTotal(row.section, row.field) || '')}
                    </td>
                  </>
                ) : (
                  <td className="py-1 px-4">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={getAnnualInputValue(row.section, row.field)}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.]/g, '');
                        updateAnnualValue(row.section, row.field, val);
                      }}
                      placeholder={row.noSum ? 'Current value' : 'Annual total'}
                      className="w-full max-w-[200px] mx-auto h-8 text-center text-sm px-2 border rounded-md focus:outline-none bg-white border-slate-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20 block"
                    />
                  </td>
                )}
              </tr>
              </React.Fragment>
            ))}

            {/* Emissions Row */}
            <tr className="bg-slate-50 border-t border-slate-200">
              <td className="py-2 pr-2 font-medium text-slate-900">CO&#x2082;e (tonnes)</td>
              {entryMode === 'monthly' ? (
                <>
                  {monthsToShow.map(month => {
                    const record = getRecord(month.period);
                    const emissions = calculateEmissions(record);
                    const total = emissions.scope1Tco2e + emissions.scope2Tco2e;
                    return (
                      <td key={month.period} className={cn(
                        "py-2 px-1 text-center font-medium",
                        month.isFuture ? "text-gray-300" : "text-slate-900"
                      )}>
                        {month.isFuture ? '' : (total > 0 ? total.toFixed(2) : '')}
                      </td>
                    );
                  })}
                  <td className="py-2 pl-2 text-right font-bold text-slate-900">
                    {(() => {
                      const total = monthsToShow.reduce((acc, month) => {
                        const record = getRecord(month.period);
                        const emissions = calculateEmissions(record);
                        return acc + emissions.scope1Tco2e + emissions.scope2Tco2e;
                      }, 0);
                      return total > 0 ? total.toFixed(2) : '';
                    })()}
                  </td>
                </>
              ) : (
                <td className="py-2 px-4 text-center font-bold text-slate-900">
                  {(() => {
                    const electricity = parseFloat(getAnnualInputValue('energy', 'electricityKwh')) || 0;
                    const gas = parseFloat(getAnnualInputValue('energy', 'naturalGasKwh')) || 0;
                    const fuel = parseFloat(getAnnualInputValue('energy', 'vehicleFuelLiters')) || 0;
                    const scope1 = (gas * EMISSION_FACTORS.naturalGas) + (fuel * EMISSION_FACTORS.vehicleFuel);
                    const scope2 = electricity * gridFactor;
                    const total = scope1 + scope2;
                    return total > 0 ? total.toFixed(2) : '';
                  })()}
                </td>
              )}
            </tr>

            {/* Intensity Row (emissions per production unit) */}
            {productionVolume && parseFloat(productionVolume) > 0 && (
              <tr className="bg-slate-50 border-t border-slate-200">
                <td className="py-2 pr-2 font-medium text-slate-900 flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  {t('data.intensity', lang)}
                </td>
                {entryMode === 'monthly' ? (
                  <>
                    {monthsToShow.map(month => {
                      const record = getRecord(month.period);
                      const emissions = calculateEmissions(record);
                      const total = emissions.scope1Tco2e + emissions.scope2Tco2e;
                      const intensity = total > 0 ? (total / parseFloat(productionVolume) * 12).toFixed(4) : '';
                      return (
                        <td key={month.period} className={cn("py-2 px-1 text-center text-xs", month.isFuture ? "text-gray-300" : "text-slate-600")}>
                          {month.isFuture ? '' : intensity}
                        </td>
                      );
                    })}
                    <td className="py-2 pl-2 text-right text-xs font-medium text-slate-900">
                      {(() => {
                        const total = monthsToShow.reduce((acc, month) => {
                          const record = getRecord(month.period);
                          const emissions = calculateEmissions(record);
                          return acc + emissions.scope1Tco2e + emissions.scope2Tco2e;
                        }, 0);
                        return total > 0 ? (total / parseFloat(productionVolume)).toFixed(4) : '';
                      })()}
                    </td>
                  </>
                ) : (
                  <td className="py-2 px-4 text-center text-xs font-medium text-slate-900">
                    {(() => {
                      const electricity = parseFloat(getAnnualInputValue('energy', 'electricityKwh')) || 0;
                      const gas = parseFloat(getAnnualInputValue('energy', 'naturalGasKwh')) || 0;
                      const fuel = parseFloat(getAnnualInputValue('energy', 'vehicleFuelLiters')) || 0;
                      const scope1 = (gas * EMISSION_FACTORS.naturalGas) + (fuel * EMISSION_FACTORS.vehicleFuel);
                      const scope2 = electricity * gridFactor;
                      const total = scope1 + scope2;
                      return total > 0 ? `${(total / parseFloat(productionVolume)).toFixed(4)} tCO₂e/${productionUnit}` : '';
                    })()}
                  </td>
                )}
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <Flag className="w-3 h-3 text-orange-500" />
          Required for 80% of questionnaires
        </span>
        <span className="flex items-center gap-1">
          <Info className="w-3 h-3" />
          Emissions use {settings.gridCountry} grid factor ({gridFactor} kg CO&#x2082;/kWh)
        </span>
        {entryMode === 'annual' && (
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Annual values are distributed evenly across months when saved
          </span>
        )}
      </div>

      {/* Year-over-Year Comparison */}
      {showComparison && (
        <div className="bg-white border border-slate-200 rounded-none p-4">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5" />
            Year-over-Year Comparison
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 pr-4 font-medium text-slate-900">Metric</th>
                  {comparisonYears.map(y => (
                    <th key={y} className="py-2 px-4 text-center font-medium text-slate-900">{y}</th>
                  ))}
                  <th className="py-2 px-4 text-center font-medium text-slate-900">Trend</th>
                </tr>
              </thead>
              <tbody>
                {comparisonMetrics.map(metric => {
                  const values = comparisonYears.map(y => comparisonTotals[y]?.[metric.key] || 0);
                  const prev = values[1];
                  const curr = values[2];
                  const trend = prev > 0 && curr > 0
                    ? ((curr - prev) / prev * 100).toFixed(1)
                    : null;

                  return (
                    <tr key={metric.key} className="border-b border-slate-200">
                      <td className="py-2 pr-4 text-slate-900">{metric.label}</td>
                      {values.map((v, i) => (
                        <td key={i} className="py-2 px-4 text-center text-slate-900">
                          {v > 0 ? metric.format(v) : '-'}
                        </td>
                      ))}
                      <td className="py-2 px-4 text-center">
                        {trend !== null ? (
                          <span className={cn(
                            'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
                            parseFloat(trend) < 0
                              ? (metric.lowerIsBetter ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')
                              : parseFloat(trend) > 0
                                ? (metric.lowerIsBetter ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700')
                                : 'bg-gray-100 text-gray-600'
                          )}>
                            {parseFloat(trend) < 0 ? <ArrowDownRight className="w-3 h-3" /> :
                             parseFloat(trend) > 0 ? <ArrowUpRight className="w-3 h-3" /> :
                             <Minus className="w-3 h-3" />}
                            {Math.abs(parseFloat(trend))}%
                          </span>
                        ) : (
                          <span className="text-xs text-slate-300">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Save Bar */}
      <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-none sticky bottom-4">
        <span className={cn(
          "text-sm",
          hasErrors ? "text-red-600" : "text-slate-500"
        )}>
          {hasErrors
            ? t('status.errors', lang).replace('{count}', Object.keys(errors).length)
            : hasChanges
              ? t('status.unsaved', lang)
              : t('status.saved', lang)}
        </span>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-sm text-green-600 flex items-center gap-1">
              <Check className="w-4 h-4" /> Saved
            </span>
          )}
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saving || hasErrors}
            className={cn(
              "text-white",
              hasErrors
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-slate-900 hover:bg-slate-800"
            )}
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? t('btn.saving', lang) : t('btn.save', lang)}
          </Button>
        </div>
      </div>
    </div>
  );
}
