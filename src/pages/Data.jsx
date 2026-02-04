import React, { useState, useEffect } from 'react';
import { 
  getDataRecords, 
  saveDataRecord, 
  getSettings,
} from '@/lib/store';
import { MONTHS, EMISSION_FACTORS } from '@/lib/constants';
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
} from 'lucide-react';

export default function Data() {
  const [records, setRecords] = useState({});
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState({});
  
  const settings = getSettings();
  const gridFactor = EMISSION_FACTORS.electricity[settings.gridCountry] || EMISSION_FACTORS.electricity.EU_AVERAGE;

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
      // Renewable % must be 0-100
      const renewable = parseFloat(record.energy?.renewablePercent);
      if (renewable && (renewable < 0 || renewable > 100)) {
        newErrors[`${period}-energy-renewablePercent`] = 'Must be 0-100';
      }

      // Recycled waste can't exceed total waste
      const totalWaste = parseFloat(record.waste?.totalKg) || 0;
      const recycledWaste = parseFloat(record.waste?.recycledKg) || 0;
      const hazardousWaste = parseFloat(record.waste?.hazardousKg) || 0;
      
      if (recycledWaste > totalWaste && totalWaste > 0) {
        newErrors[`${period}-waste-recycledKg`] = 'Cannot exceed total waste';
      }
      if (hazardousWaste > totalWaste && totalWaste > 0) {
        newErrors[`${period}-waste-hazardousKg`] = 'Cannot exceed total waste';
      }

      // Female + Male can't exceed total employees
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

    Object.entries(records).forEach(([period, record]) => {
      const hasData = Object.values(record).some(section => {
        if (typeof section !== 'object') return false;
        return Object.values(section).some(v => v !== '' && v !== null && v !== undefined);
      });

      if (hasData) {
        const emissions = calculateEmissions(record);
        const totalWaste = parseFloat(record.waste?.totalKg) || 0;
        const recycledWaste = parseFloat(record.waste?.recycledKg) || 0;
        const recyclingRate = totalWaste > 0 ? Math.round((recycledWaste / totalWaste) * 100) : null;

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

  // Ordered by importance: required (80% of questionnaires) first, then commonly requested
  const dataRows = [
    // === REQUIRED FOR 80% OF REPORTING ===
    { section: 'energy', field: 'electricityKwh', label: 'Electricity (kWh)', required: true },
    { section: 'workforce', field: 'totalEmployees', label: 'Employees (FTE)', noSum: true, required: true },
    { section: 'waste', field: 'totalKg', label: 'Total Waste (kg)', required: true },
    { section: 'healthSafety', field: 'workAccidents', label: 'Work Accidents', required: true },
    // === COMMONLY REQUESTED ===
    { section: 'energy', field: 'naturalGasKwh', label: 'Natural Gas (kWh)' },
    { section: 'energy', field: 'vehicleFuelLiters', label: 'Vehicle Fuel (L)' },
    { section: 'energy', field: 'renewablePercent', label: 'Renewable %', noSum: true },
    { section: 'water', field: 'consumptionM3', label: 'Water (m³)' },
    { section: 'waste', field: 'recycledKg', label: 'Recycled (kg)' },
    { section: 'waste', field: 'hazardousKg', label: 'Hazardous (kg)' },
    { section: 'workforce', field: 'femaleEmployees', label: 'Female', noSum: true },
    { section: 'workforce', field: 'maleEmployees', label: 'Male', noSum: true },
    { section: 'training', field: 'trainingHours', label: 'Training (hrs)' },
  ];

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

  // Get unique error messages for display
  const uniqueErrors = [...new Set(Object.values(errors))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2D5016] flex items-center gap-2">
            <Database className="w-6 h-6" />
            Monthly Data
          </h1>
          <p className="text-[#2D5016]/70 mt-1">Enter data for {selectedYear}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setSelectedYear(y => y - 1)}
            disabled={selectedYear <= currentYear - 2}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="font-semibold text-[#2D5016] w-16 text-center">{selectedYear}</span>
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

      {/* Error Banner */}
      {hasErrors && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Please fix the following errors:</p>
            <ul className="text-sm text-red-700 mt-1">
              {uniqueErrors.map((err, i) => (
                <li key={i}>• {err}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Data Grid */}
      <div className="glass-card rounded-xl p-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2D5016]/20">
              <th className="text-left py-2 pr-2 font-medium text-[#2D5016] w-[140px]">Metric</th>
              {monthsToShow.map(month => (
                <th key={month.period} className={cn(
                  "py-2 px-1 font-medium text-center",
                  month.isFuture ? "text-[#2D5016]/30" : "text-[#2D5016]"
                )}>
                  <div className="flex flex-col items-center">
                    <span className="text-xs">{month.label}</span>
                    {!month.isFuture && monthHasData(month.period) && <Check className="w-3 h-3 text-green-600 mt-0.5" />}
                  </div>
                </th>
              ))}
              <th className="py-2 pl-2 font-medium text-[#2D5016] text-right w-[80px]">Total</th>
            </tr>
          </thead>
          <tbody>
            {dataRows.map((row, idx) => (
              <tr key={`${row.section}-${row.field}`} className={cn('border-b border-[#2D5016]/10', idx % 2 === 0 ? '' : 'bg-[#2D5016]/[0.02]')}>
                <td className="py-1.5 pr-2 text-[#2D5016]">
                  <span className="flex items-center gap-1">
                    {row.required && <Flag className="w-3 h-3 text-orange-500 flex-shrink-0" title="Required for 80% of questionnaires" />}
                    {row.label}
                  </span>
                </td>
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
                              : "bg-white border-[#2D5016]/20 focus:border-[#2D5016] focus:ring-1 focus:ring-[#2D5016]/20"
                        )}
                      />
                    </td>
                  );
                })}
                <td className="py-1.5 pl-2 text-right font-medium text-[#2D5016]">
                  {row.noSum ? '' : (calculateYearTotal(row.section, row.field) || '')}
                </td>
              </tr>
            ))}
            
            {/* Emissions Row */}
            <tr className="bg-[#2D5016]/5 border-t border-[#2D5016]/20">
              <td className="py-2 pr-2 font-medium text-[#2D5016]">CO₂e (tonnes)</td>
              {monthsToShow.map(month => {
                const record = getRecord(month.period);
                const emissions = calculateEmissions(record);
                const total = emissions.scope1Tco2e + emissions.scope2Tco2e;
                return (
                  <td key={month.period} className={cn(
                    "py-2 px-1 text-center font-medium",
                    month.isFuture ? "text-gray-300" : "text-[#2D5016]"
                  )}>
                    {month.isFuture ? '' : (total > 0 ? total.toFixed(2) : '')}
                  </td>
                );
              })}
              <td className="py-2 pl-2 text-right font-bold text-[#2D5016]">
                {(() => {
                  const total = monthsToShow.reduce((acc, month) => {
                    const record = getRecord(month.period);
                    const emissions = calculateEmissions(record);
                    return acc + emissions.scope1Tco2e + emissions.scope2Tco2e;
                  }, 0);
                  return total > 0 ? total.toFixed(2) : '';
                })()}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-[#2D5016]/60">
        <span className="flex items-center gap-1">
          <Flag className="w-3 h-3 text-orange-500" />
          Required for 80% of questionnaires
        </span>
        <span className="flex items-center gap-1">
          <Info className="w-3 h-3" />
          Emissions use {settings.gridCountry} grid factor ({gridFactor} kg CO₂/kWh)
        </span>
      </div>

      {/* Save Bar */}
      <div className="flex items-center justify-between p-4 glass-card rounded-xl sticky bottom-4">
        <span className={cn(
          "text-sm",
          hasErrors ? "text-red-600" : "text-[#2D5016]/60"
        )}>
          {hasErrors 
            ? `${Object.keys(errors).length} validation error${Object.keys(errors).length > 1 ? 's' : ''}`
            : hasChanges 
              ? 'Unsaved changes' 
              : 'All saved'}
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
                : "bg-gradient-to-r from-[#2D5016] to-[#3d6b1e] hover:from-[#3d6b1e] hover:to-[#4d7b2e]"
            )}
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
}
