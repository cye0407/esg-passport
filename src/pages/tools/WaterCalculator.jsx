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
import {
  Droplets,
  Calculator,
  Users,
  DollarSign,
  Building2,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Minus,
  Info,
  Lightbulb,
  ClipboardList,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Conversion factor: 1 gallon = 0.00378541 m3
const GALLON_TO_M3 = 0.00378541;

// Industry benchmarks (m3/employee/year)
const INDUSTRY_BENCHMARKS = {
  office_services: {
    label: 'Office / Services',
    min: 10,
    max: 20,
    typical: 15,
    description: 'Typical office environments, professional services',
  },
  light_manufacturing: {
    label: 'Light Manufacturing',
    min: 30,
    max: 50,
    typical: 40,
    description: 'Assembly, electronics, textiles',
  },
  heavy_manufacturing: {
    label: 'Heavy Manufacturing',
    min: 100,
    max: 200,
    typical: 150,
    description: 'Metals, machinery, automotive',
  },
  food_beverage: {
    label: 'Food & Beverage',
    min: 200,
    max: 500,
    typical: 350,
    description: 'Food processing, beverages, brewing',
  },
  retail: {
    label: 'Retail',
    min: 15,
    max: 30,
    typical: 22,
    description: 'Retail stores, warehousing',
  },
  healthcare: {
    label: 'Healthcare',
    min: 80,
    max: 150,
    typical: 115,
    description: 'Hospitals, clinics, laboratories',
  },
  hospitality: {
    label: 'Hospitality',
    min: 150,
    max: 300,
    typical: 225,
    description: 'Hotels, restaurants, catering',
  },
  agriculture: {
    label: 'Agriculture',
    min: 500,
    max: 2000,
    typical: 1000,
    description: 'Farming, irrigation (highly variable)',
  },
};

// Common water questionnaire topics
const COMMON_QUESTIONS = [
  'Total water withdrawal by source',
  'Water consumption in water-stressed areas',
  'Water recycling and reuse percentage',
  'Water intensity metrics (per unit produced)',
  'Water discharge quality and treatment',
  'Water risk assessment and management',
];

export default function WaterCalculator() {
  // Input state
  const [waterConsumption, setWaterConsumption] = useState('');
  const [waterUnit, setWaterUnit] = useState('m3');
  const [employees, setEmployees] = useState('');
  const [revenue, setRevenue] = useState('');
  const [industry, setIndustry] = useState('');

  // Calculations
  const results = useMemo(() => {
    const consumptionNum = parseFloat(waterConsumption) || 0;
    const employeesNum = parseInt(employees, 10) || 0;
    const revenueNum = parseFloat(revenue) || 0;

    if (consumptionNum <= 0 || employeesNum <= 0) {
      return null;
    }

    // Convert to m3 if needed
    const consumptionM3 = waterUnit === 'gallons'
      ? consumptionNum * GALLON_TO_M3
      : consumptionNum;

    // Water per employee
    const waterPerEmployee = consumptionM3 / employeesNum;

    // Water per $1M revenue (if provided)
    const waterPerMillionRevenue = revenueNum > 0
      ? (consumptionM3 / revenueNum) * 1000000
      : null;

    // Benchmark comparison
    let benchmarkComparison = null;
    if (industry && INDUSTRY_BENCHMARKS[industry]) {
      const benchmark = INDUSTRY_BENCHMARKS[industry];
      const ratio = waterPerEmployee / benchmark.typical;

      let status;
      let message;
      if (waterPerEmployee < benchmark.min) {
        status = 'excellent';
        message = `Well below industry average (${benchmark.min}-${benchmark.max} m\u00B3/employee)`;
      } else if (waterPerEmployee <= benchmark.max) {
        status = 'good';
        message = `Within industry average (${benchmark.min}-${benchmark.max} m\u00B3/employee)`;
      } else if (waterPerEmployee <= benchmark.max * 1.5) {
        status = 'warning';
        message = `Above industry average (${benchmark.min}-${benchmark.max} m\u00B3/employee)`;
      } else {
        status = 'high';
        message = `Significantly above industry average (${benchmark.min}-${benchmark.max} m\u00B3/employee)`;
      }

      benchmarkComparison = {
        benchmark,
        ratio,
        status,
        message,
        percentDiff: ((waterPerEmployee - benchmark.typical) / benchmark.typical) * 100,
      };
    }

    return {
      consumptionM3,
      waterPerEmployee,
      waterPerMillionRevenue,
      benchmarkComparison,
    };
  }, [waterConsumption, waterUnit, employees, revenue, industry]);

  const formatNumber = (num, decimals = 2) => {
    if (num == null) return '-';
    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'excellent':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'good':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'excellent':
      case 'good':
        return <CheckCircle2 className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'high':
        return <TrendingUp className="w-5 h-5" />;
      default:
        return <Minus className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8faf5] to-[#e8f0e0]">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 mb-4">
            <Droplets className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#2D5016] mb-2">
            Water Intensity Calculator
          </h1>
          <p className="text-[#2D5016]/70 max-w-xl mx-auto">
            Calculate your water intensity metrics and see how you compare to industry benchmarks.
            Essential for ESG reporting and sustainability assessments.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-[#2D5016] mb-4 flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Enter Your Data
            </h2>

            <div className="space-y-4">
              {/* Water Consumption */}
              <div className="space-y-2">
                <Label className="text-[#2D5016] font-medium flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-blue-500" />
                  Total Water Consumption (Annual)
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    value={waterConsumption}
                    onChange={(e) => setWaterConsumption(e.target.value)}
                    placeholder="e.g. 5000"
                    className="flex-1 h-11 border-[#2D5016]/20 focus:border-[#7CB342] focus:ring-[#7CB342]"
                  />
                  <Select value={waterUnit} onValueChange={setWaterUnit}>
                    <SelectTrigger className="w-28 h-11 border-[#2D5016]/20 focus:border-[#7CB342] focus:ring-[#7CB342]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="m3">m³</SelectItem>
                      <SelectItem value="gallons">Gallons</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {waterUnit === 'gallons' && waterConsumption && (
                  <p className="text-xs text-[#2D5016]/60">
                    = {formatNumber(parseFloat(waterConsumption) * GALLON_TO_M3)} m³
                  </p>
                )}
              </div>

              {/* Number of Employees */}
              <div className="space-y-2">
                <Label className="text-[#2D5016] font-medium flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-500" />
                  Number of Employees (FTE)
                </Label>
                <Input
                  type="number"
                  min="1"
                  value={employees}
                  onChange={(e) => setEmployees(e.target.value)}
                  placeholder="e.g. 150"
                  className="h-11 border-[#2D5016]/20 focus:border-[#7CB342] focus:ring-[#7CB342]"
                />
              </div>

              {/* Annual Revenue (Optional) */}
              <div className="space-y-2">
                <Label className="text-[#2D5016] font-medium flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  Annual Revenue (USD)
                  <span className="text-xs text-[#2D5016]/50 font-normal">Optional</span>
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  value={revenue}
                  onChange={(e) => setRevenue(e.target.value)}
                  placeholder="e.g. 10000000"
                  className="h-11 border-[#2D5016]/20 focus:border-[#7CB342] focus:ring-[#7CB342]"
                />
              </div>

              {/* Industry Sector (Optional) */}
              <div className="space-y-2">
                <Label className="text-[#2D5016] font-medium flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-orange-500" />
                  Industry Sector
                  <span className="text-xs text-[#2D5016]/50 font-normal">For benchmarking</span>
                </Label>
                <Select value={industry} onValueChange={setIndustry}>
                  <SelectTrigger className="h-11 border-[#2D5016]/20 focus:border-[#7CB342] focus:ring-[#7CB342]">
                    <SelectValue placeholder="Select your industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(INDUSTRY_BENCHMARKS).map(([key, data]) => (
                      <SelectItem key={key} value={key}>
                        {data.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {industry && INDUSTRY_BENCHMARKS[industry] && (
                  <p className="text-xs text-[#2D5016]/60">
                    {INDUSTRY_BENCHMARKS[industry].description}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-[#2D5016] mb-4 flex items-center gap-2">
              <TrendingDown className="w-5 h-5" />
              Your Water Intensity
            </h2>

            {results ? (
              <div className="space-y-4">
                {/* Water per Employee */}
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-blue-700">Water per Employee</span>
                    <Droplets className="w-4 h-4 text-blue-500" />
                  </div>
                  <p className="text-2xl font-bold text-blue-900">
                    {formatNumber(results.waterPerEmployee)} m³/employee/year
                  </p>
                </div>

                {/* Water per $1M Revenue */}
                {results.waterPerMillionRevenue !== null && (
                  <div className="p-4 rounded-xl bg-green-50 border border-green-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-green-700">Water per $1M Revenue</span>
                      <DollarSign className="w-4 h-4 text-green-500" />
                    </div>
                    <p className="text-2xl font-bold text-green-900">
                      {formatNumber(results.waterPerMillionRevenue)} m³/$1M
                    </p>
                  </div>
                )}

                {/* Benchmark Comparison */}
                {results.benchmarkComparison && (
                  <div className={cn(
                    'p-4 rounded-xl border',
                    getStatusColor(results.benchmarkComparison.status)
                  )}>
                    <div className="flex items-start gap-3">
                      {getStatusIcon(results.benchmarkComparison.status)}
                      <div className="flex-1">
                        <p className="font-semibold mb-1">
                          {results.benchmarkComparison.status === 'excellent' && 'Excellent Performance'}
                          {results.benchmarkComparison.status === 'good' && 'Good Performance'}
                          {results.benchmarkComparison.status === 'warning' && 'Above Average'}
                          {results.benchmarkComparison.status === 'high' && 'High Water Usage'}
                        </p>
                        <p className="text-sm opacity-80">
                          {results.benchmarkComparison.message}
                        </p>
                        {results.benchmarkComparison.percentDiff !== 0 && (
                          <p className="text-sm mt-2 font-medium">
                            {results.benchmarkComparison.percentDiff > 0 ? '+' : ''}
                            {formatNumber(results.benchmarkComparison.percentDiff, 0)}% vs. typical
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Conversion Note */}
                {waterUnit === 'gallons' && (
                  <div className="p-3 rounded-lg bg-[#2D5016]/5 border border-[#2D5016]/10">
                    <p className="text-xs text-[#2D5016]/70">
                      <Info className="w-3 h-3 inline mr-1" />
                      Converted from {formatNumber(parseFloat(waterConsumption), 0)} gallons to {formatNumber(results.consumptionM3)} m³
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-[#2D5016]/50">
                <Droplets className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">
                  Enter your water consumption and employee count to calculate intensity metrics
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Industry Benchmarks Reference */}
        <div className="glass-card rounded-2xl p-6 mt-6">
          <h2 className="text-lg font-semibold text-[#2D5016] mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Industry Benchmarks (m³/employee/year)
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.entries(INDUSTRY_BENCHMARKS).map(([key, data]) => (
              <div
                key={key}
                className={cn(
                  'p-3 rounded-xl border transition-colors',
                  industry === key
                    ? 'bg-[#2D5016]/10 border-[#2D5016]/30'
                    : 'bg-white/50 border-[#2D5016]/10'
                )}
              >
                <p className="font-medium text-[#2D5016] text-sm">{data.label}</p>
                <p className="text-lg font-bold text-[#2D5016]">
                  {data.min}-{data.max}
                </p>
                <p className="text-xs text-[#2D5016]/60">typical: {data.typical}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Educational Section */}
        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          {/* Why Track Water */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-[#2D5016] mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
              Why Track Water?
            </h2>
            <div className="space-y-3 text-sm text-[#2D5016]/80">
              <p>
                Water management is a critical component of ESG reporting. Here's why it matters:
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span><strong>Regulatory compliance:</strong> Many frameworks (GRI, CDP, CSRD) require water disclosure</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span><strong>Risk management:</strong> Water scarcity affects 40% of the global population</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span><strong>Cost savings:</strong> Efficient water use reduces operational expenses</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span><strong>Customer requirements:</strong> Major buyers increasingly request water data</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Common Questionnaire Topics */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-[#2D5016] mb-4 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-purple-500" />
              Common Questionnaire Questions
            </h2>
            <p className="text-sm text-[#2D5016]/70 mb-3">
              ESG questionnaires typically ask about:
            </p>
            <ul className="space-y-2">
              {COMMON_QUESTIONS.map((question, index) => (
                <li
                  key={index}
                  className="flex items-center gap-2 text-sm text-[#2D5016]/80"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-[#2D5016]/40" />
                  {question}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* CTA Section */}
        <div className="glass-card rounded-2xl p-6 mt-6 bg-gradient-to-r from-[#2D5016] to-[#3d6b1e] text-white">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <h2 className="text-xl font-semibold mb-1">
                Track Water Consumption Monthly
              </h2>
              <p className="text-white/80 text-sm">
                Build a complete water consumption history in your ESG Passport.
                Be ready for any customer questionnaire with verified data.
              </p>
            </div>
            <Link to="/onboarding">
              <Button className="bg-white/20 hover:bg-white/30 text-white border-0 w-full sm:w-auto">
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-xs text-[#2D5016]/50 mt-6">
          This calculator provides estimates based on industry averages.
          Actual water intensity varies based on specific operations, location, and climate conditions.
        </p>
      </div>
    </div>
  );
}
