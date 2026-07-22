import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  getDataRecords,
  saveDataRecord,
  getSettings,
  getCompanyProfile,
  getAnnualTotals,
  saveSettings,
} from '@/lib/store';
import { EMISSION_FACTORS } from '@/lib/constants';
import { getIndustryMetrics } from '@/data/industry-metrics';
import { FIELD_UNITS, getAlternativeUnits, convert } from '@/lib/units';
import { useLanguage } from '@/components/LanguageContext';
import { track, trackOnce } from '@/lib/track';
import { EXTRACT_FIELD_MAP } from '@/lib/extractFieldMap';
import { detectNumberFormat, parseNumber, parsePeriod, buildColumnMap } from '@/lib/csvImport';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button';
import CompanyProfileSection from '@/components/CompanyProfileSection';
import BillDrop from '@/components/BillDrop';
import ExtractorUpgradeCard from '@/components/ExtractorUpgradeCard';
import { useLicense } from '@/components/LicenseContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
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
  Trash2,
} from 'lucide-react';

export default function Data() {
  const { tier } = useLicense();
  const { lang, t } = useLanguage();
  // Honor ?period=YYYY-MM query param from deep links on Respond answer cards
  const initialYear = (() => {
    if (typeof window === 'undefined') return new Date().getFullYear();
    const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
    const period = params.get('period');
    if (period && /^\d{4}/.test(period)) return parseInt(period.slice(0, 4), 10);
    return new Date().getFullYear();
  })();
  const [records, setRecords] = useState({});
  const [selectedYear, setSelectedYear] = useState(initialYear);
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

  // Auto-save after CSV import (flag triggers save via effect below handleSave)
  const [pendingAutoSave, setPendingAutoSave] = useState(false);

  // CSV import preview (null when no import is pending confirmation)
  const [csvPreview, setCsvPreview] = useState(null);
  const [showClearYearDialog, setShowClearYearDialog] = useState(false);
  // Bill extracted with a bare-year period, awaiting confirmation before we switch to
  // annual mode and overwrite that year's values. { year, fields, extractedPeriod } or null.
  const [pendingAnnualBill, setPendingAnnualBill] = useState(null);

  // Per-metric source notes — "where I find this number each month"
  // Keyed by `${section}.${field}`. One source per metric, edited inline.
  const [dataSources, setDataSources] = useState({});
  const [notApplicableFields, setNotApplicableFields] = useState({});
  const [editingSource, setEditingSource] = useState(null); // key being edited
  const [editingSourceValue, setEditingSourceValue] = useState('');
  const [showSourceExplainer, setShowSourceExplainer] = useState(false);

  useEffect(() => {
    track('data_page_viewed');
    const settings = getSettings();
    setDataSources(settings.dataSources || {});
    setNotApplicableFields(settings.notApplicableFields || {});
  }, []);

  const sourceKey = (row) => `${row.section}.${row.field}`;
  const metricKey = (section, field) => `${section}.${field}`;
  const isFieldNotApplicable = (section, field) => !!notApplicableFields[metricKey(section, field)];

  const persistNotApplicableFields = (next) => {
    setNotApplicableFields(next);
    saveSettings({ notApplicableFields: next });
  };

  const startEditSource = (row) => {
    const key = sourceKey(row);
    setEditingSource(key);
    setEditingSourceValue(dataSources[key] || '');
    // Show the one-time explainer the first time anyone touches a source
    try {
      if (!localStorage.getItem('source_explainer_dismissed')) {
        setShowSourceExplainer(true);
      }
    } catch {}
  };

  const saveEditSource = () => {
    if (!editingSource) return;
    const trimmed = editingSourceValue.trim();
    const next = { ...dataSources };
    if (trimmed) next[editingSource] = trimmed;
    else delete next[editingSource];
    setDataSources(next);
    saveSettings({ dataSources: next });
    track('source_set', { hasValue: !!trimmed });
    setEditingSource(null);
    setEditingSourceValue('');
  };

  const cancelEditSource = () => {
    setEditingSource(null);
    setEditingSourceValue('');
  };

  const dismissSourceExplainer = () => {
    try { localStorage.setItem('source_explainer_dismissed', '1'); } catch {}
    setShowSourceExplainer(false);
  };

  // Warn on navigation with unsaved changes
  useEffect(() => {
    if (!hasChanges) return;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasChanges]);

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
        label: t(`month.${String(m).padStart(2, '0')}`).slice(0, 3),
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

  const getYearPeriods = (year) =>
    Array.from({ length: 12 }, (_, index) => `${year}-${String(index + 1).padStart(2, '0')}`);

  const getYearRecordCount = (year) =>
    getYearPeriods(year).filter((period) => {
      const record = records[period];
      if (!record) return false;
      return ['energy', 'water', 'waste', 'workforce', 'healthSafety', 'training', 'supplyChain'].some((section) =>
        Object.values(record[section] || {}).some((value) => value !== '' && value !== null && value !== undefined)
      );
    }).length;

  const createEmptyRecord = (period) => ({
    period,
    energy: {},
    water: {},
    waste: {},
    workforce: {},
    healthSafety: {},
    training: {},
    supplyChain: {},
  });

  const updateField = (period, section, field, value) => {
    const key = metricKey(section, field);
    if (notApplicableFields[key]) {
      const next = { ...notApplicableFields };
      delete next[key];
      persistNotApplicableFields(next);
    }
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

  const handleBillExtracted = useCallback((fields, extractedPeriod) => {
    // Determine where extracted values belong.
    // YYYY-MM documents map to a monthly record.
    // A YYYY-only period is an ambiguous guess: the extractor's bare-year fallback
    // can pick up an invoice or account number rather than a real reporting period.
    // Switching to annual mode and overwriting that year's values is destructive, so
    // stage it for explicit confirmation instead of applying it silently.
    if (extractedPeriod && /^\d{4}$/.test(extractedPeriod)) {
      setPendingAnnualBill({ year: parseInt(extractedPeriod, 10), fields, extractedPeriod });
      return;
    }

    let targetPeriod;
    if (extractedPeriod && /^\d{4}-\d{2}$/.test(extractedPeriod)) {
      targetPeriod = extractedPeriod;
    } else {
      targetPeriod = `${selectedYear}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    }

    for (const f of fields) {
      const mapping = EXTRACT_FIELD_MAP[f.field];
      if (!mapping) continue;
      const val = typeof f.value === 'number' ? f.value : parseFloat(f.value);
      if (isNaN(val)) continue;
      updateField(targetPeriod, mapping.section, mapping.field, val);
    }

    track('bill_extracted', {
      fields: fields.length,
      periodType: 'monthly',
      extractedPeriod: extractedPeriod || 'fallback_current_month',
      documentType: fields[0]?.source?.rawText?.slice(0, 30) || 'unknown',
    });
  }, [selectedYear, updateField]);

  // User confirmed the bare-year annual interpretation → switch to annual mode for that
  // year and write the extracted values (the previously-silent behavior, now gated).
  const applyAnnualBill = useCallback(() => {
    if (!pendingAnnualBill) return;
    const { year, fields, extractedPeriod } = pendingAnnualBill;
    setSelectedYear(year);
    setEntryMode('annual');
    setAnnualValues(prev => {
      const next = { ...prev };
      for (const f of fields) {
        const mapping = EXTRACT_FIELD_MAP[f.field];
        if (!mapping) continue;
        const val = typeof f.value === 'number' ? f.value : parseFloat(f.value);
        if (isNaN(val)) continue;
        next[`${mapping.section}.${mapping.field}`] = String(val);
      }
      return next;
    });
    setHasChanges(true);
    setSaved(false);
    track('bill_extracted', {
      fields: fields.length,
      periodType: 'annual',
      extractedPeriod,
      documentType: fields[0]?.source?.rawText?.slice(0, 30) || 'unknown',
    });
    setPendingAnnualBill(null);
  }, [pendingAnnualBill]);

  const getValue = (period, section, field) => {
    const record = records[period];
    return record?.[section]?.[field] ?? '';
  };

  const clearMetricValues = (section, field) => {
    setRecords(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(period => {
        const existing = next[period] || createEmptyRecord(period);
        next[period] = {
          ...existing,
          [section]: {
            ...existing[section],
            [field]: '',
          },
        };
      });
      return next;
    });
    setAnnualValues(prev => ({ ...prev, [metricKey(section, field)]: '' }));
  };

  // Validation logic
  const validateAllRecords = () => {
    const newErrors = {};

    Object.entries(records).forEach(([period, record]) => {
      const renewable = parseFloat(record.energy?.renewablePercent);
      if (renewable && (renewable < 0 || renewable > 100)) {
        newErrors[`${period}-energy-renewablePercent`] = t('err.range0100');
      }

      const totalWaste = parseFloat(record.waste?.totalKg) || 0;
      const recycledWaste = parseFloat(record.waste?.recycledKg) || 0;
      const hazardousWaste = parseFloat(record.waste?.hazardousKg) || 0;

      if (recycledWaste > totalWaste && totalWaste > 0) {
        newErrors[`${period}-waste-recycledKg`] = t('err.exceedTotalWaste');
      }
      if (hazardousWaste > totalWaste && totalWaste > 0) {
        newErrors[`${period}-waste-hazardousKg`] = t('err.exceedTotalWaste');
      }

      const totalEmp = parseFloat(record.workforce?.totalEmployees) || 0;
      const femaleEmp = parseFloat(record.workforce?.femaleEmployees) || 0;
      const maleEmp = parseFloat(record.workforce?.maleEmployees) || 0;

      if (totalEmp > 0 && (femaleEmp + maleEmp) > totalEmp) {
        newErrors[`${period}-workforce-femaleEmployees`] = t('err.exceedTotalFM');
        newErrors[`${period}-workforce-maleEmployees`] = t('err.exceedTotalFM');
      }
      if (femaleEmp > totalEmp && totalEmp > 0) {
        newErrors[`${period}-workforce-femaleEmployees`] = t('err.exceedEmployees');
      }
      if (maleEmp > totalEmp && totalEmp > 0) {
        newErrors[`${period}-workforce-maleEmployees`] = t('err.exceedEmployees');
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

  const numberOrNull = (value) => {
    if (value === '' || value === null || value === undefined) return null;
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const integerOrNull = (value) => {
    if (value === '' || value === null || value === undefined) return null;
    const parsed = parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
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
          if (isFieldNotApplicable(row.section, row.field)) return;
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
            extraSections[row.section][row.field] = numberOrNull(val);
          }
        });

        const recordToSave = {
          period,
          energy: {
            electricityKwh: numberOrNull(record.energy?.electricityKwh),
            naturalGasKwh: numberOrNull(record.energy?.naturalGasKwh),
            vehicleFuelLiters: isFieldNotApplicable('energy', 'vehicleFuelLiters') ? null : numberOrNull(record.energy?.vehicleFuelLiters),
            renewablePercent: numberOrNull(record.energy?.renewablePercent),
            energySavingsKwh: numberOrNull(record.energy?.energySavingsKwh),
            ...emissions,
          },
          water: {
            consumptionM3: numberOrNull(record.water?.consumptionM3),
            waterSourceMunicipalPercent: numberOrNull(record.water?.waterSourceMunicipalPercent),
          },
          waste: {
            totalKg: numberOrNull(record.waste?.totalKg),
            recycledKg: numberOrNull(record.waste?.recycledKg),
            hazardousKg: isFieldNotApplicable('waste', 'hazardousKg') ? null : numberOrNull(record.waste?.hazardousKg),
            recyclingRate,
          },
          workforce: {
            totalEmployees: integerOrNull(record.workforce?.totalEmployees),
            femaleEmployees: integerOrNull(record.workforce?.femaleEmployees),
            maleEmployees: integerOrNull(record.workforce?.maleEmployees),
            womenInLeadershipPercent: numberOrNull(record.workforce?.womenInLeadershipPercent),
            turnoverRate: numberOrNull(record.workforce?.turnoverRate),
            collectiveBargainingPercent: numberOrNull(record.workforce?.collectiveBargainingPercent),
            livingWageCompliant: record.workforce?.livingWageCompliant === 'yes' || record.workforce?.livingWageCompliant === true || null,
            grievanceMechanismExists: record.workforce?.grievanceMechanismExists === 'yes' || record.workforce?.grievanceMechanismExists === true || null,
            grievancesReported: integerOrNull(record.workforce?.grievancesReported),
            newHires: integerOrNull(record.workforce?.newHires),
          },
          healthSafety: {
            // workAccidents kept for backward compatibility (aliased to recordableIncidents on read)
            recordableIncidents: integerOrNull(record.healthSafety?.recordableIncidents ?? record.healthSafety?.workAccidents),
            lostTimeIncidents: integerOrNull(record.healthSafety?.lostTimeIncidents),
            fatalities: integerOrNull(record.healthSafety?.fatalities),
            hoursWorked: integerOrNull(record.healthSafety?.hoursWorked),
          },
          training: {
            trainingHours: numberOrNull(record.training?.trainingHours),
          },
          supplyChain: {
            suppliersAssessedPercent: numberOrNull(record.supplyChain?.suppliersAssessedPercent),
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
    trackOnce('data_first_save');
    track('data_saved', { mode: entryMode });
    setTimeout(() => setSaved(false), 2000);
  };

  // Auto-save after CSV import — runs once records state has settled
  useEffect(() => {
    if (pendingAutoSave && hasChanges) {
      setPendingAutoSave(false);
      handleSave();
    }
  }, [pendingAutoSave, hasChanges, records]);

  // Ordered by importance: required (80% of questionnaires) first, then commonly requested
  const coreDataRows = [
    // === REQUIRED FOR 80% OF REPORTING ===
    { section: 'energy', field: 'electricityKwh', label: t('data.electricity') || 'Electricity (kWh)', required: true },
    { section: 'workforce', field: 'totalEmployees', label: t('data.employees') || 'Employees (FTE)', noSum: true, required: true },
    { section: 'waste', field: 'totalKg', label: t('data.totalWaste') || 'Total Waste (kg)', required: true },
    { section: 'healthSafety', field: 'recordableIncidents', label: t('data.recordableIncidents'), tooltip: t('data.tip.recordableIncidents'), required: true },
    { section: 'healthSafety', field: 'lostTimeIncidents', label: t('data.lostTimeIncidents'), tooltip: t('data.tip.lostTimeIncidents') },
    { section: 'healthSafety', field: 'fatalities', label: t('data.fatalities'), tooltip: t('data.tip.fatalities') },
    { section: 'healthSafety', field: 'hoursWorked', label: t('data.hoursWorked'), tooltip: t('data.tip.hoursWorked') },
    // === COMMONLY REQUESTED ===
    { section: 'energy', field: 'naturalGasKwh', label: t('data.naturalGas') || 'Natural Gas (kWh)' },
    { section: 'energy', field: 'vehicleFuelLiters', label: t('data.vehicleFuel') || 'Vehicle Fuel (L)' },
    { section: 'energy', field: 'renewablePercent', label: t('data.renewablePercent') || 'Renewable %', noSum: true },
    { section: 'water', field: 'consumptionM3', label: t('data.water') || 'Water (m\u00B3)' },
    { section: 'waste', field: 'recycledKg', label: t('data.recycled') || 'Recycled (kg)' },
    { section: 'waste', field: 'hazardousKg', label: t('data.hazardous') || 'Hazardous (kg)' },
    { section: 'workforce', field: 'femaleEmployees', label: t('data.female') || 'Female', noSum: true },
    { section: 'workforce', field: 'maleEmployees', label: t('data.male') || 'Male', noSum: true },
    { section: 'training', field: 'trainingHours', label: t('data.trainingHours') || 'Training (hrs)' },
    // === SOCIAL METRICS ===
    { section: 'workforce', field: 'turnoverRate', label: t('data.turnoverRate'), noSum: true, tooltip: t('data.tip.turnoverRate') },
    { section: 'workforce', field: 'womenInLeadershipPercent', label: t('data.womenLeadership'), noSum: true, tooltip: t('data.tip.womenLeadership') },
    { section: 'workforce', field: 'collectiveBargainingPercent', label: t('data.collectiveBargaining'), noSum: true, tooltip: t('data.tip.collectiveBargaining') },
    { section: 'workforce', field: 'grievancesReported', label: t('data.grievances'), tooltip: t('data.tip.grievances') },
    { section: 'workforce', field: 'newHires', label: t('data.newHires'), tooltip: t('data.tip.newHires') },
    { section: 'energy', field: 'energySavingsKwh', label: t('data.energySavings'), tooltip: t('data.tip.energySavings') },
    { section: 'water', field: 'waterSourceMunicipalPercent', label: t('data.municipalWater'), noSum: true, tooltip: t('data.tip.municipalWater') },
    { section: 'supplyChain', field: 'suppliersAssessedPercent', label: t('data.suppliersAssessed'), noSum: true, tooltip: t('data.tip.suppliersAssessed') },
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
  const isOptionalRow = (row) => optionalFields.includes(row.field);

  const toggleNotApplicable = (row) => {
    if (!isOptionalRow(row)) return;
    const key = metricKey(row.section, row.field);
    const next = { ...notApplicableFields };
    if (next[key]) {
      delete next[key];
    } else {
      next[key] = true;
      clearMetricValues(row.section, row.field);
    }
    persistNotApplicableFields(next);
    setHasChanges(true);
    setSaved(false);
  };

  const calculateYearTotal = (section, field) => {
    if (isFieldNotApplicable(section, field)) return null;
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
    const key = metricKey(section, field);
    if (notApplicableFields[key]) {
      const next = { ...notApplicableFields };
      delete next[key];
      persistNotApplicableFields(next);
    }
    setAnnualValues(prev => ({ ...prev, [`${section}.${field}`]: value }));
    setHasChanges(true);
    setSaved(false);
  };

  // ---- CSV import ----
  const handleCsvImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    track('csv_import_started');

    const finish = () => {
      if (csvInputRef.current) csvInputRef.current.value = '';
    };

    try {
      const text = await file.text();
      Papa.parse(text, {
        header: false,
        skipEmptyLines: true,
        complete: (result) => {
          try {
            const data = result.data;
            if (!data || data.length < 2) {
              track('csv_import_failed', { error: 'empty' });
              finish();
              return;
            }

            const headers = data[0];
            const colMap = buildColumnMap(headers);

            // Sample the data columns (skip the period column at index 0) to
            // detect EU vs US number format from real values.
            const samples = [];
            for (let i = 1; i < data.length && samples.length < 50; i++) {
              for (let c = 1; c < (data[i] || []).length; c++) {
                if (data[i][c]) samples.push(data[i][c]);
              }
            }
            const numberFormat = detectNumberFormat(samples);

            // Parse rows into a normalized preview shape
            const parsedRows = [];
            const skipped = [];
            for (let i = 1; i < data.length; i++) {
              const row = data[i];
              if (!row || row.length === 0) continue;
              const period = parsePeriod(row[0]);
              if (!period) {
                skipped.push({ line: i + 1, reason: t('csv.unrecognisedPeriod', { value: row[0] }) });
                continue;
              }
              const values = {};
              Object.entries(colMap).forEach(([field, { col, section }]) => {
                if (col >= 0 && row[col] !== undefined && row[col] !== '') {
                  values[field] = { section, raw: row[col] };
                }
              });
              parsedRows.push({ period, values });
            }

            if (parsedRows.length === 0) {
              track('csv_import_failed', { error: 'no_valid_rows' });
              setCsvPreview({ file: file.name, headers, colMap, numberFormat, parsedRows, skipped, error: t('csv.noValidRows') });
              finish();
              return;
            }

            let overlapRows = 0;
            let overwriteCells = 0;
            let newCells = 0;
            parsedRows.forEach((parsedRow) => {
              const existing = records[parsedRow.period];
              let rowHasOverlap = false;
              Object.entries(parsedRow.values).forEach(([field, { section, raw }]) => {
                const num = parseNumber(raw, numberFormat);
                const value = num === null ? String(raw).trim() : String(num);
                if (value === '') return;
                const currentValue = existing?.[section]?.[field];
                const hasExistingValue = currentValue !== '' && currentValue !== null && currentValue !== undefined;
                if (hasExistingValue) {
                  overwriteCells += 1;
                  rowHasOverlap = true;
                } else {
                  newCells += 1;
                }
              });
              if (rowHasOverlap) overlapRows += 1;
            });

            setCsvPreview({
              file: file.name,
              headers,
              colMap,
              numberFormat,
              parsedRows,
              skipped,
              overlapRows,
              overwriteCells,
              newCells,
              error: null,
            });
          } catch (err) {
            console.error('CSV preview error:', err);
            track('csv_import_failed', { error: err?.name || 'parse' });
          } finally {
            finish();
          }
        },
        error: (err) => {
          console.error('Papa parse error:', err);
          track('csv_import_failed', { error: 'papa' });
          finish();
        },
      });
    } catch (err) {
      console.error('CSV read error:', err);
      track('csv_import_failed', { error: err?.name || 'read' });
      finish();
    }
  };

  const commitCsvImport = () => {
    if (!csvPreview || csvPreview.error) return;
    const { parsedRows, numberFormat } = csvPreview;
    let imported = 0;
    for (const row of parsedRows) {
      Object.entries(row.values).forEach(([field, { section, raw }]) => {
        // Numbers run through locale-aware parser; non-numeric stays as string
        const num = parseNumber(raw, numberFormat);
        const value = num === null ? String(raw).trim() : String(num);
        updateField(row.period, section, field, value);
      });
      imported++;
    }
    if (imported > 0) {
      setHasChanges(true);
      setPendingAutoSave(true);
    }
    track('csv_import_succeeded', { rows: imported, format: numberFormat });
    setCsvPreview(null);
  };

  const cancelCsvImport = () => {
    track('csv_import_cancelled');
    setCsvPreview(null);
  };

  const clearYearData = () => {
    const yearPrefix = `${selectedYear}-`;
    setRecords((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((period) => {
        if (period.startsWith(yearPrefix)) delete next[period];
      });
      return next;
    });
    setAnnualValues({});
    setHasChanges(true);
    setSaved(false);
    setShowClearYearDialog(false);
    track('year_data_cleared', { year: selectedYear });
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

  const downloadSampleCsv = () => {
    const a = document.createElement('a');
    a.href = '/sample-data-2026.csv';
    a.download = 'sample-data-2026.csv';
    a.click();
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
    { key: 'electricityKwh', label: t('data.electricity'), format: v => v.toLocaleString(lang === 'de' ? 'de-DE' : 'en-US'), lowerIsBetter: true },
    { key: 'scope1Tco2e', label: t('compare.scope1'), format: v => v.toFixed(2), lowerIsBetter: true },
    { key: 'scope2Tco2e', label: t('compare.scope2'), format: v => v.toFixed(2), lowerIsBetter: true },
    { key: 'totalWasteKg', label: t('data.totalWaste'), format: v => v.toLocaleString(lang === 'de' ? 'de-DE' : 'en-US'), lowerIsBetter: true },
    { key: 'waterM3', label: t('data.water'), format: v => v.toLocaleString(lang === 'de' ? 'de-DE' : 'en-US'), lowerIsBetter: true },
    { key: 'recyclingRate', label: t('compare.recyclingRate'), format: v => v.toFixed(0) + '%', lowerIsBetter: false },
    { key: 'totalEmployees', label: t('compare.employees'), format: v => String(v), lowerIsBetter: false },
    { key: 'workAccidents', label: t('compare.workAccidents'), format: v => String(v), lowerIsBetter: true },
    { key: 'trainingHours', label: t('compare.trainingHours'), format: v => v.toLocaleString(lang === 'de' ? 'de-DE' : 'en-US'), lowerIsBetter: false },
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
            {entryMode === 'monthly' ? t('data.title.monthly') : t('data.title.annual')}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {t('data.subtitle').replace('{mode}', entryMode === 'monthly' ? t('btn.monthly').toLowerCase() : t('btn.annual').toLowerCase()).replace('{year}', selectedYear)}
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
              {t('btn.monthly')}
            </button>
            <button
              onClick={switchToAnnual}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                entryMode === 'annual' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'
              )}
            >
              {t('btn.annual')}
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

      {/* Company Profile (collapsible) */}
      <CompanyProfileSection />

      {/* Document extraction — Pro+ only, upgrade card for Free/Pro */}
      {tier === 'pro-plus' ? (
        <BillDrop onDataExtracted={handleBillExtracted} />
      ) : (
        <ExtractorUpgradeCard tier={tier} />
      )}

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
          {t('btn.import')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={downloadCsvTemplate}
          className="text-slate-900 border-slate-200"
        >
          <Download className="w-4 h-4 mr-1" />
          {t('btn.template')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={downloadSampleCsv}
          className="text-slate-900 border-slate-200"
        >
          <Download className="w-4 h-4 mr-1" />
          {t('dataUi.sampleCsv')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowClearYearDialog(true)}
          className="text-red-700 border-red-200 hover:bg-red-50 hover:text-red-800"
          disabled={getYearRecordCount(selectedYear) === 0}
        >
          <Trash2 className="w-4 h-4 mr-1" />
          {t('dataUi.clearYearData', { year: selectedYear })}
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
          {t('btn.yoy')}
        </button>
      </div>

      {/* Industry hint */}
      {industry && optionalFields.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
          <Factory className="w-4 h-4 flex-shrink-0" />
          <span>{t('dataUi.industryHint', { industry })}</span>
          <button
            onClick={() => setShowAllMetrics(!showAllMetrics)}
            className="text-slate-900 underline ml-1"
          >
            {showAllMetrics ? t('btn.showRecommended') : `${t('btn.showAll')} (+${optionalRows.length})`}
          </button>
        </div>
      )}

      {/* Production Volume (for intensity metrics) */}
      <div className="flex items-center gap-3 bg-slate-50 rounded-lg px-3 py-2">
        <Zap className="w-4 h-4 text-slate-500 flex-shrink-0" />
        <span className="text-sm text-slate-600">{t('data.productionVolume')}:</span>
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
            <p className="text-sm font-medium text-red-800">{t('dataUi.fixErrors')}</p>
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
              <th className="text-left py-2 pr-2 font-medium text-slate-900 w-[140px]">{t('dataUi.metric')}</th>
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
                  <th className="py-2 pl-2 font-medium text-slate-900 text-right w-[80px]">{t('dataUi.total')}</th>
                </>
              ) : (
                <th className="py-2 px-4 font-medium text-center text-slate-900">
                  <div className="flex items-center justify-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{t('dataUi.yearTotal', { year: selectedYear })}</span>
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
                      <span className="flex items-center gap-1"><Zap className="w-3 h-3" />{industry} {t('data.industryMetrics')}</span>
                    </td>
                  </tr>
                )}
              <tr className={cn('border-b border-slate-200', idx % 2 === 0 ? '' : 'bg-slate-50/50')}>
                <td className="py-1.5 pr-2 text-slate-900 align-top">
                  <span className="flex items-center gap-1">
                    {row.required && <Flag className="w-3 h-3 text-orange-500 flex-shrink-0" title={t('dataUi.requiredTip')} />}
                    {row.label}
                    {row.noSum && entryMode === 'annual' && <span className="text-[10px] text-slate-400 ml-1">{t('dataUi.snapshot')}</span>}
                  </span>
                  {isOptionalRow(row) && (
                    <button
                      type="button"
                      onClick={() => toggleNotApplicable(row)}
                      className={cn(
                        "mt-1 block text-[11px] text-left",
                        isFieldNotApplicable(row.section, row.field)
                          ? "text-slate-700"
                          : "text-slate-400 hover:text-slate-700"
                      )}
                    >
                      {isFieldNotApplicable(row.section, row.field) ? t('dataUi.markedNA') : t('dataUi.markNA')}
                    </button>
                  )}
                  {editingSource === sourceKey(row) ? (
                    <div className="mt-1 flex items-center gap-1">
                      <input
                        type="text"
                        autoFocus
                        value={editingSourceValue}
                        onChange={(e) => setEditingSourceValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEditSource();
                          if (e.key === 'Escape') cancelEditSource();
                        }}
                        placeholder={t('dataUi.sourcePlaceholder')}
                        className="text-[11px] flex-1 min-w-0 h-6 px-1.5 border border-slate-300 rounded-none bg-white focus:outline-none focus:border-indigo-600"
                      />
                      <button onClick={saveEditSource} className="text-[11px] text-indigo-600 hover:text-indigo-800 px-1">{t('dataUi.saveShort')}</button>
                      <button onClick={cancelEditSource} className="text-[11px] text-slate-400 hover:text-slate-600 px-1">{t('dataUi.cancelShort')}</button>
                    </div>
                  ) : dataSources[sourceKey(row)] ? (
                    <button
                      type="button"
                      onClick={() => startEditSource(row)}
                      className="mt-0.5 block text-[11px] text-slate-400 hover:text-slate-700 text-left max-w-[260px] truncate"
                      title={dataSources[sourceKey(row)]}
                    >
                      📎 {dataSources[sourceKey(row)]}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => startEditSource(row)}
                      className="mt-0.5 block text-[11px] text-slate-300 hover:text-indigo-600 text-left"
                    >
                      {t('dataUi.addSource')}
                    </button>
                  )}
                </td>

                {entryMode === 'monthly' ? (
                  <>
                    {monthsToShow.map(month => {
                      const error = getError(month.period, row.section, row.field);
                      const notApplicable = isFieldNotApplicable(row.section, row.field);
                      return (
                        <td key={month.period} className="py-1 px-0.5">
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={notApplicable ? 'N/A' : getValue(month.period, row.section, row.field)}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9.]/g, '');
                              updateField(month.period, row.section, row.field, val);
                            }}
                            disabled={month.isFuture || notApplicable}
                            title={error || ''}
                            className={cn(
                              "w-full h-7 text-center text-sm px-1 border rounded-md focus:outline-none",
                              month.isFuture || notApplicable
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
                      {isFieldNotApplicable(row.section, row.field) ? 'N/A' : (row.noSum ? '' : (calculateYearTotal(row.section, row.field) || ''))}
                    </td>
                  </>
                ) : (
                  <td className="py-1 px-4">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={isFieldNotApplicable(row.section, row.field) ? 'N/A' : getAnnualInputValue(row.section, row.field)}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.]/g, '');
                        updateAnnualValue(row.section, row.field, val);
                      }}
                      placeholder={row.noSum ? t('dataUi.currentValue') : t('dataUi.annualTotal')}
                      disabled={isFieldNotApplicable(row.section, row.field)}
                      className={cn(
                        "w-full max-w-[200px] mx-auto h-8 text-center text-sm px-2 border rounded-md focus:outline-none block",
                        isFieldNotApplicable(row.section, row.field)
                          ? "bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed"
                          : "bg-white border-slate-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/20"
                      )}
                    />
                  </td>
                )}
              </tr>
              </React.Fragment>
            ))}

            {/* Emissions Row */}
            <tr className="bg-slate-50 border-t border-slate-200">
              <td className="py-2 pr-2 font-medium text-slate-900">{t('dataUi.emissionsRow')}</td>
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
                  {t('data.intensity')}
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
          {t('dataUi.legendRequired')}
        </span>
        <span className="flex items-center gap-1">
          <Info className="w-3 h-3" />
          {t('dataUi.legendGrid', { grid: settings.gridCountry, factor: gridFactor })}
        </span>
        {entryMode === 'annual' && (
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {t('dataUi.legendAnnual')}
          </span>
        )}
      </div>

      {/* Year-over-Year Comparison */}
      {showComparison && (
        <div className="bg-white border border-slate-200 rounded-none p-4">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5" />
            {t('dataUi.yoyTitle')}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 pr-4 font-medium text-slate-900">{t('dataUi.metric')}</th>
                  {comparisonYears.map(y => (
                    <th key={y} className="py-2 px-4 text-center font-medium text-slate-900">{y}</th>
                  ))}
                  <th className="py-2 px-4 text-center font-medium text-slate-900">{t('dataUi.trend')}</th>
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
      <div className={cn(
        "flex items-center justify-between p-4 border rounded-none sticky bottom-4 transition-all duration-300",
        hasChanges && !hasErrors
          ? "bg-amber-50 border-amber-400 shadow-lg"
          : "bg-white border-slate-200"
      )}>
        <span className={cn(
          "text-sm",
          hasErrors ? "text-red-600" : hasChanges ? "text-amber-700 font-medium" : "text-slate-500"
        )}>
          {hasErrors
            ? t('status.errors').replace('{count}', Object.keys(errors).length)
            : hasChanges
              ? t('dataUi.unsavedBanner')
              : t('status.saved')}
        </span>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-sm text-green-600 flex items-center gap-1">
              <Check className="w-4 h-4" /> {t('dataUi.savedShort')}
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
            {saving ? t('btn.saving') : t('btn.save')}
          </Button>
        </div>
      </div>

      {/* One-time explainer: why sources are paste-only, not auto-open */}
      <Dialog open={showSourceExplainer} onOpenChange={(open) => { if (!open) dismissSourceExplainer(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('csv.sourceTitle')}</DialogTitle>
            <DialogDescription>{t('csv.sourceDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm text-slate-700">
            <p>{t('csv.sourceP1')}</p>
            <p>{t('csv.sourceP2')}</p>
            <p className="text-slate-500">{t('csv.sourceP3')}</p>
          </div>
          <DialogFooter>
            <Button onClick={dismissSourceExplainer} className="bg-slate-900 hover:bg-slate-800 text-white">{t('csv.gotIt')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CSV Import Preview */}
      <Dialog open={!!csvPreview} onOpenChange={(open) => { if (!open) cancelCsvImport(); }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t('csv.previewTitle')}</DialogTitle>
            <DialogDescription>
              {t('csv.previewDesc')}
            </DialogDescription>
          </DialogHeader>

          {csvPreview && (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {csvPreview.error && (
                <div className="p-3 rounded bg-red-50 border border-red-200 text-sm text-red-700">
                  {csvPreview.error}
                </div>
              )}

              <div className="text-sm text-slate-600">
                <span className="font-medium text-slate-900">{t('csv.file')}</span> {csvPreview.file}
              </div>

              {(csvPreview.overwriteCells > 0 || csvPreview.newCells > 0) && (
                <div className={cn(
                  'p-3 rounded border text-sm',
                  csvPreview.overwriteCells > 0
                    ? 'bg-amber-50 border-amber-200 text-amber-800'
                    : 'bg-green-50 border-green-200 text-green-800'
                )}>
                  <div className="font-medium">
                    {csvPreview.overwriteCells > 0
                      ? t('csv.willOverwrite')
                      : t('csv.addsNew')}
                  </div>
                  <div className="mt-1 text-xs">
                    {csvPreview.overlapRows > 0 ? t('csv.overlapRows', { count: csvPreview.overlapRows }) : ''}
                    {csvPreview.overwriteCells > 0 ? t('csv.overwriteCells', { count: csvPreview.overwriteCells }) : ''}
                    {csvPreview.newCells > 0 ? t('csv.newCells', { count: csvPreview.newCells }) : ''}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-900">{t('csv.numberFormat')}</span>
                <div className="flex border border-slate-200 rounded-none overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setCsvPreview(p => ({ ...p, numberFormat: 'us' }))}
                    className={cn(
                      'px-3 py-1.5 text-xs',
                      csvPreview.numberFormat === 'us' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600'
                    )}
                  >
                    US (1,234.56)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCsvPreview(p => ({ ...p, numberFormat: 'eu' }))}
                    className={cn(
                      'px-3 py-1.5 text-xs',
                      csvPreview.numberFormat === 'eu' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600'
                    )}
                  >
                    EU (1.234,56)
                  </button>
                </div>
                <span className="text-xs text-slate-500">{t('csv.formatHint')}</span>
              </div>

              <div>
                <div className="text-sm font-medium text-slate-900 mb-2">
                  {t('csv.detectedColumns', { found: Object.values(csvPreview.colMap).filter(c => c.col >= 0).length, total: Object.keys(csvPreview.colMap).length })}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(csvPreview.colMap).map(([field, { col }]) => (
                    <span
                      key={field}
                      className={cn(
                        'inline-flex items-center px-2 py-0.5 text-[11px] rounded-none border',
                        col >= 0
                          ? 'bg-green-50 border-green-200 text-green-700'
                          : 'bg-slate-50 border-slate-200 text-slate-400'
                      )}
                    >
                      {field}{col >= 0 ? ` ← ${csvPreview.headers[col]}` : ` ${t('csv.notFound')}`}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-slate-900 mb-2">
                  {t('csv.firstRows', { shown: Math.min(3, csvPreview.parsedRows.length), total: csvPreview.parsedRows.length })}
                </div>
                <div className="border border-slate-200 rounded-none overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-2 py-1.5 text-left font-medium text-slate-700">{t('csv.colPeriod')}</th>
                        <th className="px-2 py-1.5 text-left font-medium text-slate-700">{t('csv.colField')}</th>
                        <th className="px-2 py-1.5 text-right font-medium text-slate-700">{t('csv.colRaw')}</th>
                        <th className="px-2 py-1.5 text-right font-medium text-slate-700">{t('csv.colParsed')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvPreview.parsedRows.slice(0, 3).flatMap((row, i) =>
                        Object.entries(row.values).map(([field, { raw }], j) => {
                          const parsed = parseNumber(raw, csvPreview.numberFormat);
                          return (
                            <tr key={`${i}-${j}`} className="border-t border-slate-100">
                              <td className="px-2 py-1.5 text-slate-600">{j === 0 ? row.period : ''}</td>
                              <td className="px-2 py-1.5 text-slate-600">{field}</td>
                              <td className="px-2 py-1.5 text-right text-slate-500 font-mono">{String(raw)}</td>
                              <td className={cn('px-2 py-1.5 text-right font-mono', parsed === null ? 'text-red-600' : 'text-slate-900')}>
                                {parsed === null ? '—' : parsed}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {csvPreview.skipped.length > 0 && (
                <div className="text-xs text-amber-700">
                  <span className="font-medium">{t('csv.skipped', { count: csvPreview.skipped.length })}</span>{' '}
                  {csvPreview.skipped.slice(0, 3).map(s => s.reason).join('; ')}
                  {csvPreview.skipped.length > 3 ? '…' : ''}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={cancelCsvImport}>{t('csv.cancel')}</Button>
            <Button
              onClick={commitCsvImport}
              disabled={!csvPreview || !!csvPreview.error || csvPreview.parsedRows.length === 0}
              className="bg-slate-900 hover:bg-slate-800 text-white"
            >
              {csvPreview?.overwriteCells > 0
                ? t('csv.replaceAndImport', { cells: csvPreview.overwriteCells, rows: csvPreview?.parsedRows.length || 0 })
                : t('csv.importRows', { rows: csvPreview?.parsedRows.length || 0 })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showClearYearDialog} onOpenChange={setShowClearYearDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('csv.clearTitle', { year: selectedYear })}</DialogTitle>
            <DialogDescription>
              {t('csv.clearDesc', { year: selectedYear })}
            </DialogDescription>
          </DialogHeader>
          <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {t('csv.clearWarn', { count: getYearRecordCount(selectedYear), year: selectedYear })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClearYearDialog(false)}>{t('csv.cancel')}</Button>
            <Button onClick={clearYearData} className="bg-red-700 hover:bg-red-800 text-white">
              {t('dataUi.clearYearData', { year: selectedYear })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!pendingAnnualBill} onOpenChange={(open) => { if (!open) setPendingAnnualBill(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('bill.annualConfirmTitle', { year: pendingAnnualBill?.year })}</DialogTitle>
            <DialogDescription>
              {t('bill.annualConfirmDesc', { year: pendingAnnualBill?.year })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingAnnualBill(null)}>{t('csv.cancel')}</Button>
            <Button onClick={applyAnnualBill}>
              {t('bill.annualConfirmApply', { year: pendingAnnualBill?.year })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
