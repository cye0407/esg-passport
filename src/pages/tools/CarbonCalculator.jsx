import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  getElectricityFactor,
  SUPPORTED_COUNTRIES,
  NATURAL_GAS_FACTOR,
  DIESEL_FACTOR,
  GAS_M3_TO_KWH,
} from '@/lib/respond/emissionFactors';
import {
  Calculator,
  Zap,
  Flame,
  Fuel,
  Users,
  ArrowRight,
  Info,
  Leaf,
  Building,
  BarChart3,
} from 'lucide-react';

// Petrol emission factor (tCO2e per litre) - DEFRA 2023
const PETROL_FACTOR = 0.00231;

export default function CarbonCalculator() {
  // Form state
  const [country, setCountry] = useState('');
  const [electricityKwh, setElectricityKwh] = useState('');
  const [naturalGasValue, setNaturalGasValue] = useState('');
  const [gasUnit, setGasUnit] = useState('kwh'); // 'kwh' or 'm3'
  const [dieselLiters, setDieselLiters] = useState('');
  const [petrolLiters, setPetrolLiters] = useState('');
  const [employees, setEmployees] = useState('');

  // Calculate emissions
  const results = useMemo(() => {
    const electricity = parseFloat(electricityKwh) || 0;
    const gasValue = parseFloat(naturalGasValue) || 0;
    const diesel = parseFloat(dieselLiters) || 0;
    const petrol = parseFloat(petrolLiters) || 0;
    const employeeCount = parseInt(employees) || 0;

    // Convert gas to m3 if needed for calculation
    const gasM3 = gasUnit === 'm3' ? gasValue : gasValue / GAS_M3_TO_KWH;

    // Get electricity factor for selected country
    const { factor: electricityFactor, source: electricitySource } = getElectricityFactor(country);

    // Scope 1: Direct emissions (natural gas + vehicle fuel)
    const gasEmissions = gasM3 * NATURAL_GAS_FACTOR;
    const dieselEmissions = diesel * DIESEL_FACTOR;
    const petrolEmissions = petrol * PETROL_FACTOR;
    const scope1 = gasEmissions + dieselEmissions + petrolEmissions;

    // Scope 2: Indirect emissions (purchased electricity)
    const scope2 = electricity * electricityFactor;

    // Total
    const total = scope1 + scope2;

    // Per-employee intensity
    const perEmployee = employeeCount > 0 ? total / employeeCount : null;

    // Breakdown for chart
    const breakdown = [
      { label: 'Natural Gas', value: gasEmissions, color: '#f97316' },
      { label: 'Diesel', value: dieselEmissions, color: '#64748b' },
      { label: 'Petrol', value: petrolEmissions, color: '#8b5cf6' },
      { label: 'Electricity', value: scope2, color: '#3b82f6' },
    ].filter(item => item.value > 0);

    return {
      scope1: Math.round(scope1 * 100) / 100,
      scope2: Math.round(scope2 * 100) / 100,
      total: Math.round(total * 100) / 100,
      perEmployee: perEmployee !== null ? Math.round(perEmployee * 100) / 100 : null,
      electricitySource,
      breakdown,
      hasData: electricity > 0 || gasValue > 0 || diesel > 0 || petrol > 0,
    };
  }, [country, electricityKwh, naturalGasValue, gasUnit, dieselLiters, petrolLiters, employees]);

  // Simple bar chart renderer
  const maxValue = Math.max(...results.breakdown.map(b => b.value), 0.001);

  const handleReset = () => {
    setCountry('');
    setElectricityKwh('');
    setNaturalGasValue('');
    setGasUnit('kwh');
    setDieselLiters('');
    setPetrolLiters('');
    setEmployees('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#2D5016]/10 mb-4">
            <Calculator className="w-8 h-8 text-[#2D5016]" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#2D5016] mb-3">
            Carbon Footprint Calculator
          </h1>
          <p className="text-lg text-[#2D5016]/70 max-w-2xl mx-auto">
            Calculate your organization's Scope 1 and Scope 2 greenhouse gas emissions.
            Free, instant, and based on the latest emission factors.
          </p>
        </div>

        {/* Info Banner */}
        <div className="glass-card rounded-xl p-4 mb-8 flex items-start gap-3 bg-blue-50/50">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-[#2D5016]/80">
            <p><strong>Scope 1</strong> = Direct emissions from fuel combustion (natural gas, diesel, petrol)</p>
            <p><strong>Scope 2</strong> = Indirect emissions from purchased electricity</p>
            <p className="mt-1 text-xs text-[#2D5016]/60">Sources: IEA 2023 (electricity), DEFRA 2023 (combustion factors)</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Input Form */}
          <div className="glass-card rounded-xl p-6">
            <h2 className="text-lg font-semibold text-[#2D5016] mb-4 flex items-center gap-2">
              <Building className="w-5 h-5" />
              Your Energy Data
            </h2>

            <div className="space-y-5">
              {/* Country Selection */}
              <div className="space-y-2">
                <Label className="text-[#2D5016] flex items-center gap-2">
                  <Leaf className="w-4 h-4" />
                  Country (for grid emission factor)
                </Label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select your country..." />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_COUNTRIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {country && (
                  <p className="text-xs text-[#2D5016]/60">
                    Grid factor: {(getElectricityFactor(country).factor * 1000).toFixed(3)} kg CO2e/kWh
                  </p>
                )}
              </div>

              {/* Electricity */}
              <div className="space-y-2">
                <Label className="text-[#2D5016] flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  Electricity Consumption (kWh/year)
                </Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="e.g., 50000"
                  value={electricityKwh}
                  onChange={(e) => setElectricityKwh(e.target.value)}
                  className="h-10"
                />
                <p className="text-xs text-[#2D5016]/60">
                  Check your electricity bills for annual consumption
                </p>
              </div>

              {/* Natural Gas */}
              <div className="space-y-2">
                <Label className="text-[#2D5016] flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  Natural Gas Consumption
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="0"
                    placeholder="e.g., 10000"
                    value={naturalGasValue}
                    onChange={(e) => setNaturalGasValue(e.target.value)}
                    className="h-10 flex-1"
                  />
                  <div className="flex bg-[#2D5016]/5 rounded-lg p-0.5">
                    <button
                      onClick={() => setGasUnit('kwh')}
                      className={cn(
                        'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                        gasUnit === 'kwh'
                          ? 'bg-white text-[#2D5016] shadow-sm'
                          : 'text-[#2D5016]/50'
                      )}
                    >
                      kWh/yr
                    </button>
                    <button
                      onClick={() => setGasUnit('m3')}
                      className={cn(
                        'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                        gasUnit === 'm3'
                          ? 'bg-white text-[#2D5016] shadow-sm'
                          : 'text-[#2D5016]/50'
                      )}
                    >
                      m³/yr
                    </button>
                  </div>
                </div>
              </div>

              {/* Vehicle Fuels */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#2D5016] flex items-center gap-2">
                    <Fuel className="w-4 h-4 text-gray-500" />
                    Diesel (liters/year)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="e.g., 5000"
                    value={dieselLiters}
                    onChange={(e) => setDieselLiters(e.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#2D5016] flex items-center gap-2">
                    <Fuel className="w-4 h-4 text-purple-500" />
                    Petrol (liters/year)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="e.g., 2000"
                    value={petrolLiters}
                    onChange={(e) => setPetrolLiters(e.target.value)}
                    className="h-10"
                  />
                </div>
              </div>

              {/* Employees (optional) */}
              <div className="space-y-2 pt-2 border-t border-[#2D5016]/10">
                <Label className="text-[#2D5016] flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  Number of Employees (optional)
                </Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="e.g., 50"
                  value={employees}
                  onChange={(e) => setEmployees(e.target.value)}
                  className="h-10"
                />
                <p className="text-xs text-[#2D5016]/60">
                  Enter to calculate per-employee carbon intensity
                </p>
              </div>

              {/* Reset Button */}
              <Button
                variant="outline"
                onClick={handleReset}
                className="w-full text-[#2D5016] border-[#2D5016]/20"
              >
                Reset Calculator
              </Button>
            </div>
          </div>

          {/* Results Panel */}
          <div className="space-y-6">
            {/* Main Results */}
            <div className="glass-card rounded-xl p-6">
              <h2 className="text-lg font-semibold text-[#2D5016] mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Your Carbon Footprint
              </h2>

              {!results.hasData ? (
                <div className="text-center py-8 text-[#2D5016]/50">
                  <Calculator className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Enter your energy data to see results</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Scope Results */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-orange-50 rounded-lg p-4">
                      <p className="text-xs font-medium text-orange-600 uppercase tracking-wide">
                        Scope 1 (Direct)
                      </p>
                      <p className="text-2xl font-bold text-orange-700 mt-1">
                        {results.scope1.toLocaleString()}
                      </p>
                      <p className="text-xs text-orange-600/70">tCO2e/year</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                        Scope 2 (Indirect)
                      </p>
                      <p className="text-2xl font-bold text-blue-700 mt-1">
                        {results.scope2.toLocaleString()}
                      </p>
                      <p className="text-xs text-blue-600/70">tCO2e/year</p>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="bg-[#2D5016]/5 rounded-lg p-4 border border-[#2D5016]/10">
                    <p className="text-xs font-medium text-[#2D5016] uppercase tracking-wide">
                      Total Emissions (Scope 1 + 2)
                    </p>
                    <p className="text-3xl font-bold text-[#2D5016] mt-1">
                      {results.total.toLocaleString()}
                    </p>
                    <p className="text-sm text-[#2D5016]/70">tonnes CO2 equivalent per year</p>
                  </div>

                  {/* Per Employee */}
                  {results.perEmployee !== null && (
                    <div className="bg-purple-50 rounded-lg p-4">
                      <p className="text-xs font-medium text-purple-600 uppercase tracking-wide flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        Per-Employee Intensity
                      </p>
                      <p className="text-2xl font-bold text-purple-700 mt-1">
                        {results.perEmployee.toLocaleString()}
                      </p>
                      <p className="text-xs text-purple-600/70">tCO2e/employee/year</p>
                    </div>
                  )}

                  {/* Source note */}
                  <p className="text-xs text-[#2D5016]/50">
                    Electricity: {results.electricitySource}
                  </p>
                </div>
              )}
            </div>

            {/* Visual Breakdown */}
            {results.hasData && results.breakdown.length > 0 && (
              <div className="glass-card rounded-xl p-6">
                <h3 className="text-sm font-semibold text-[#2D5016] mb-4">
                  Emissions Breakdown
                </h3>
                <div className="space-y-3">
                  {results.breakdown.map((item) => (
                    <div key={item.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-[#2D5016]">{item.label}</span>
                        <span className="font-medium text-[#2D5016]">
                          {item.value.toFixed(2)} tCO2e
                        </span>
                      </div>
                      <div className="h-4 bg-[#2D5016]/10 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${(item.value / maxValue) * 100}%`,
                            backgroundColor: item.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pie-style percentage breakdown */}
                <div className="mt-4 pt-4 border-t border-[#2D5016]/10 flex flex-wrap gap-3">
                  {results.breakdown.map((item) => {
                    const percentage = results.total > 0
                      ? Math.round((item.value / results.total) * 100)
                      : 0;
                    return (
                      <div key={item.label} className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-xs text-[#2D5016]/70">
                          {item.label}: {percentage}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-12 glass-card rounded-xl p-8 bg-gradient-to-r from-[#2D5016]/5 to-[#7CB342]/10 border border-[#2D5016]/10">
          <div className="text-center max-w-2xl mx-auto">
            <Leaf className="w-12 h-12 text-[#2D5016] mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-[#2D5016] mb-3">
              Save Your Carbon Data and Track Progress Over Time
            </h2>
            <p className="text-[#2D5016]/70 mb-6">
              Create your free ESG Passport to store your emissions data, monitor year-over-year improvements,
              and generate reports for customer ESG questionnaires automatically.
            </p>
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-[#2D5016] to-[#3d6b1e] hover:from-[#3d6b1e] hover:to-[#4d7b2e] text-white"
            >
              <Link to="/onboarding">
                Create Your Free ESG Passport
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <p className="text-xs text-[#2D5016]/50 mt-3">
              No credit card required. Start tracking your ESG data in minutes.
            </p>
          </div>
        </div>

        {/* Methodology Note */}
        <div className="mt-8 text-center text-xs text-[#2D5016]/50">
          <p>
            This calculator uses emission factors from the International Energy Agency (IEA) 2023 for electricity
            and UK Department for Environment, Food &amp; Rural Affairs (DEFRA) 2023 for combustion factors.
          </p>
          <p className="mt-1">
            Natural Gas: {NATURAL_GAS_FACTOR} tCO2e/m³ | Diesel: {DIESEL_FACTOR} tCO2e/L | Petrol: {PETROL_FACTOR} tCO2e/L
          </p>
        </div>
      </div>
    </div>
  );
}
