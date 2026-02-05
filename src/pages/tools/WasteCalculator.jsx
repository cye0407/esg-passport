import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Trash2,
  Recycle,
  Leaf,
  Flame,
  AlertTriangle,
  Info,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  TrendingUp,
  HelpCircle,
} from 'lucide-react';

// Benchmarks for waste diversion
const BENCHMARKS = {
  belowAverage: { max: 30, label: 'Below Average', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  average: { max: 50, label: 'Average', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  good: { max: 70, label: 'Good', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  excellent: { max: 90, label: 'Excellent', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
  zeroWaste: { max: 100, label: 'Zero Waste Leader', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
};

function getRating(diversionRate) {
  if (diversionRate < 30) return BENCHMARKS.belowAverage;
  if (diversionRate < 50) return BENCHMARKS.average;
  if (diversionRate < 70) return BENCHMARKS.good;
  if (diversionRate < 90) return BENCHMARKS.excellent;
  return BENCHMARKS.zeroWaste;
}

function ProgressBar({ value, max = 100, colorClass = 'bg-[#2D5016]', label, showValue = true }) {
  const percentage = Math.min((value / max) * 100, 100);
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-[#2D5016]/70">{label}</span>
          {showValue && <span className="text-sm font-medium text-[#2D5016]">{value.toFixed(1)}%</span>}
        </div>
      )}
      <div className="w-full h-3 bg-[#2D5016]/10 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', colorClass)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function InfoCard({ title, children, icon: Icon, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-[#2D5016]/20 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-[#2D5016]/5 hover:bg-[#2D5016]/10 transition-colors"
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-5 h-5 text-[#2D5016]" />}
          <span className="font-medium text-[#2D5016]">{title}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-[#2D5016]/60" />
        ) : (
          <ChevronDown className="w-5 h-5 text-[#2D5016]/60" />
        )}
      </button>
      {isOpen && (
        <div className="p-4 bg-white border-t border-[#2D5016]/10">
          {children}
        </div>
      )}
    </div>
  );
}

export default function WasteCalculator() {
  // Input state
  const [unit, setUnit] = useState('kg'); // 'kg' or 'tonnes'
  const [totalWaste, setTotalWaste] = useState('');
  const [recycledWaste, setRecycledWaste] = useState('');
  const [compostedWaste, setCompostedWaste] = useState('');
  const [wasteToEnergy, setWasteToEnergy] = useState('');
  const [hazardousWaste, setHazardousWaste] = useState('');

  // Parse values with unit conversion
  const parseValue = (value) => {
    const num = parseFloat(value) || 0;
    return unit === 'tonnes' ? num * 1000 : num; // Convert to kg internally
  };

  // Calculations
  const results = useMemo(() => {
    const total = parseValue(totalWaste);
    const recycled = parseValue(recycledWaste);
    const composted = parseValue(compostedWaste);
    const energy = parseValue(wasteToEnergy);
    const hazardous = parseValue(hazardousWaste);

    if (total <= 0) {
      return null;
    }

    // Validate inputs don't exceed total
    const diverted = recycled + composted + energy;
    if (diverted > total) {
      return { error: 'Diverted waste exceeds total waste' };
    }

    const landfill = total - diverted;
    const diversionRate = (diverted / total) * 100;
    const landfillRate = 100 - diversionRate;
    const recyclingRate = (recycled / total) * 100;
    const compostRate = (composted / total) * 100;
    const energyRate = (energy / total) * 100;

    return {
      total,
      recycled,
      composted,
      energy,
      hazardous,
      landfill,
      diversionRate,
      landfillRate,
      recyclingRate,
      compostRate,
      energyRate,
      rating: getRating(diversionRate),
    };
  }, [totalWaste, recycledWaste, compostedWaste, wasteToEnergy, hazardousWaste, unit]);

  const formatWeight = (kg) => {
    if (unit === 'tonnes') {
      return `${(kg / 1000).toFixed(2)} tonnes`;
    }
    return `${kg.toFixed(1)} kg`;
  };

  const handleReset = () => {
    setTotalWaste('');
    setRecycledWaste('');
    setCompostedWaste('');
    setWasteToEnergy('');
    setHazardousWaste('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2D5016] to-[#7CB342] mb-4">
          <Recycle className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-[#2D5016]">Waste Diversion Rate Calculator</h1>
        <p className="text-[#2D5016]/70 max-w-2xl mx-auto">
          Calculate your organization's waste diversion rate and see how you compare to industry benchmarks.
          Track recycling, composting, and waste-to-energy recovery.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          <div className="glass-card rounded-xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#2D5016] flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                Waste Data Input
              </h2>
              {/* Unit Toggle */}
              <div className="flex bg-[#2D5016]/5 rounded-lg p-0.5">
                <button
                  onClick={() => setUnit('kg')}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                    unit === 'kg' ? 'bg-white text-[#2D5016] shadow-sm' : 'text-[#2D5016]/50'
                  )}
                >
                  kg
                </button>
                <button
                  onClick={() => setUnit('tonnes')}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                    unit === 'tonnes' ? 'bg-white text-[#2D5016] shadow-sm' : 'text-[#2D5016]/50'
                  )}
                >
                  tonnes
                </button>
              </div>
            </div>

            {/* Total Waste - Required */}
            <div className="space-y-2">
              <Label htmlFor="totalWaste" className="flex items-center gap-1">
                Total waste generated
                <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="totalWaste"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder={`e.g., ${unit === 'kg' ? '1000' : '1'}`}
                  value={totalWaste}
                  onChange={(e) => setTotalWaste(e.target.value)}
                  className="pr-16"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#2D5016]/50">
                  {unit}
                </span>
              </div>
            </div>

            {/* Recycled Waste - Required */}
            <div className="space-y-2">
              <Label htmlFor="recycledWaste" className="flex items-center gap-2">
                <Recycle className="w-4 h-4 text-blue-600" />
                Recycled waste
                <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="recycledWaste"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder={`e.g., ${unit === 'kg' ? '300' : '0.3'}`}
                  value={recycledWaste}
                  onChange={(e) => setRecycledWaste(e.target.value)}
                  className="pr-16"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#2D5016]/50">
                  {unit}
                </span>
              </div>
            </div>

            {/* Optional Fields */}
            <div className="border-t border-[#2D5016]/10 pt-4">
              <p className="text-sm text-[#2D5016]/60 mb-4">Optional diversion streams:</p>

              {/* Composted Waste */}
              <div className="space-y-2 mb-4">
                <Label htmlFor="compostedWaste" className="flex items-center gap-2">
                  <Leaf className="w-4 h-4 text-green-600" />
                  Composted waste
                </Label>
                <div className="relative">
                  <Input
                    id="compostedWaste"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    value={compostedWaste}
                    onChange={(e) => setCompostedWaste(e.target.value)}
                    className="pr-16"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#2D5016]/50">
                    {unit}
                  </span>
                </div>
              </div>

              {/* Waste to Energy */}
              <div className="space-y-2 mb-4">
                <Label htmlFor="wasteToEnergy" className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  Waste to energy
                </Label>
                <div className="relative">
                  <Input
                    id="wasteToEnergy"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    value={wasteToEnergy}
                    onChange={(e) => setWasteToEnergy(e.target.value)}
                    className="pr-16"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#2D5016]/50">
                    {unit}
                  </span>
                </div>
              </div>

              {/* Hazardous Waste */}
              <div className="space-y-2">
                <Label htmlFor="hazardousWaste" className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Hazardous waste (tracked separately)
                </Label>
                <div className="relative">
                  <Input
                    id="hazardousWaste"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    value={hazardousWaste}
                    onChange={(e) => setHazardousWaste(e.target.value)}
                    className="pr-16"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#2D5016]/50">
                    {unit}
                  </span>
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={handleReset}
              className="w-full text-[#2D5016] border-[#2D5016]/20"
            >
              Reset Calculator
            </Button>
          </div>

          {/* Benchmarks Reference */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="font-semibold text-[#2D5016] mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Industry Benchmarks
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#2D5016]/70">Average office</span>
                <span className="font-medium text-[#2D5016]">30-50% diversion</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#2D5016]/70">Good performer</span>
                <span className="font-medium text-green-600">70%+ diversion</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#2D5016]/70">Zero waste to landfill</span>
                <span className="font-medium text-emerald-700">90%+ diversion</span>
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {!results ? (
            <div className="glass-card rounded-xl p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-[#2D5016]/10 flex items-center justify-center mx-auto mb-4">
                <Recycle className="w-8 h-8 text-[#2D5016]/40" />
              </div>
              <p className="text-[#2D5016]/60">
                Enter your waste data to see your diversion rate and benchmarks.
              </p>
            </div>
          ) : results.error ? (
            <div className="glass-card rounded-xl p-6 border-red-200 bg-red-50">
              <div className="flex items-center gap-3 text-red-700">
                <XCircle className="w-6 h-6" />
                <span className="font-medium">{results.error}</span>
              </div>
            </div>
          ) : (
            <>
              {/* Main Result Card */}
              <div className={cn(
                'glass-card rounded-xl p-6 border-2',
                results.rating.border,
                results.rating.bg
              )}>
                <div className="text-center mb-6">
                  <p className="text-sm text-[#2D5016]/60 mb-2">Your Diversion Rate</p>
                  <div className="text-5xl font-bold text-[#2D5016] mb-2">
                    {results.diversionRate.toFixed(1)}%
                  </div>
                  <div className={cn(
                    'inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium',
                    results.rating.bg,
                    results.rating.color
                  )}>
                    {results.diversionRate >= 70 ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Info className="w-5 h-5" />
                    )}
                    {results.rating.label}
                  </div>
                </div>

                {/* Visual Gauge */}
                <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden mb-2">
                  {/* Background segments */}
                  <div className="absolute inset-0 flex">
                    <div className="w-[30%] bg-red-200" />
                    <div className="w-[20%] bg-amber-200" />
                    <div className="w-[20%] bg-blue-200" />
                    <div className="w-[20%] bg-green-200" />
                    <div className="w-[10%] bg-emerald-200" />
                  </div>
                  {/* Indicator */}
                  <div
                    className="absolute top-0 bottom-0 w-1 bg-[#2D5016] rounded-full shadow-lg transition-all duration-500"
                    style={{ left: `calc(${Math.min(results.diversionRate, 100)}% - 2px)` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-[#2D5016]/50">
                  <span>0%</span>
                  <span>30%</span>
                  <span>50%</span>
                  <span>70%</span>
                  <span>90%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Breakdown Card */}
              <div className="glass-card rounded-xl p-6 space-y-4">
                <h3 className="font-semibold text-[#2D5016] flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  Waste Breakdown
                </h3>

                <div className="space-y-4">
                  <ProgressBar
                    value={results.recyclingRate}
                    label="Recycled"
                    colorClass="bg-blue-500"
                  />
                  {results.compostRate > 0 && (
                    <ProgressBar
                      value={results.compostRate}
                      label="Composted"
                      colorClass="bg-green-500"
                    />
                  )}
                  {results.energyRate > 0 && (
                    <ProgressBar
                      value={results.energyRate}
                      label="Energy Recovery"
                      colorClass="bg-orange-500"
                    />
                  )}
                  <ProgressBar
                    value={results.landfillRate}
                    label="Landfill"
                    colorClass="bg-gray-400"
                  />
                </div>

                {/* Summary Table */}
                <div className="mt-4 pt-4 border-t border-[#2D5016]/10">
                  <table className="w-full text-sm">
                    <tbody>
                      <tr>
                        <td className="py-1 text-[#2D5016]/60">Total Waste</td>
                        <td className="py-1 text-right font-medium text-[#2D5016]">
                          {formatWeight(results.total)}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1 text-[#2D5016]/60">Diverted</td>
                        <td className="py-1 text-right font-medium text-green-600">
                          {formatWeight(results.recycled + results.composted + results.energy)}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1 text-[#2D5016]/60">To Landfill</td>
                        <td className="py-1 text-right font-medium text-gray-600">
                          {formatWeight(results.landfill)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Hazardous Waste Note */}
              {results.hazardous > 0 && (
                <div className="glass-card rounded-xl p-4 border-amber-200 bg-amber-50">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-800">Hazardous Waste Tracking</p>
                      <p className="text-sm text-amber-700 mt-1">
                        You reported {formatWeight(results.hazardous)} of hazardous waste.
                        This is tracked separately from your diversion rate and requires
                        special disposal procedures per local regulations.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* CTA Card */}
              <div className="glass-card rounded-xl p-6 bg-gradient-to-br from-[#2D5016]/5 to-[#7CB342]/10 border-[#2D5016]/20">
                <h3 className="font-semibold text-[#2D5016] mb-2">Track Your Progress</h3>
                <p className="text-sm text-[#2D5016]/70 mb-4">
                  Monitor your waste streams monthly and track improvements over time with your ESG Passport.
                </p>
                <Link to="/onboarding">
                  <Button className="w-full bg-gradient-to-r from-[#2D5016] to-[#3d6b1e] hover:from-[#3d6b1e] hover:to-[#4d7b2e] text-white">
                    Track waste streams monthly in your ESG Passport
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Educational Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-[#2D5016] flex items-center gap-2">
          <HelpCircle className="w-5 h-5" />
          Understanding Waste Diversion
        </h2>

        <InfoCard
          title="What counts as waste diversion?"
          icon={Recycle}
          defaultOpen={true}
        >
          <div className="space-y-3 text-sm text-[#2D5016]/80">
            <p>
              Waste diversion refers to waste materials that are redirected away from landfills
              through alternative methods. These include:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>
                <strong>Recycling:</strong> Processing materials like paper, plastic, metal, and glass
                into new products
              </li>
              <li>
                <strong>Composting:</strong> Breaking down organic waste (food scraps, yard waste) into
                nutrient-rich soil amendments
              </li>
              <li>
                <strong>Waste-to-Energy:</strong> Converting non-recyclable waste into electricity, heat,
                or fuel through controlled combustion or other technologies
              </li>
              <li>
                <strong>Reuse:</strong> Directly reusing materials without reprocessing (e.g., donating
                furniture, refurbishing electronics)
              </li>
            </ul>
          </div>
        </InfoCard>

        <InfoCard
          title="What is 'Zero Waste to Landfill'?"
          icon={Leaf}
        >
          <div className="space-y-3 text-sm text-[#2D5016]/80">
            <p>
              "Zero Waste to Landfill" is an aspirational goal where organizations divert at least
              <strong> 90% or more</strong> of their waste away from landfills.
            </p>
            <p>
              The remaining percentage accounts for materials that currently have no viable
              alternative disposal method. Organizations achieving this status typically:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Have robust recycling and composting programs</li>
              <li>Partner with waste-to-energy facilities for non-recyclables</li>
              <li>Implement source reduction strategies to minimize waste generation</li>
              <li>Engage suppliers to reduce packaging and improve material circularity</li>
            </ul>
            <div className="mt-4 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <p className="text-emerald-800 font-medium">
                Note: Some certification programs require 99% diversion for "True Zero Waste" status.
              </p>
            </div>
          </div>
        </InfoCard>

        <InfoCard
          title="How is diversion rate calculated?"
          icon={Info}
        >
          <div className="space-y-3 text-sm text-[#2D5016]/80">
            <p>The diversion rate formula is:</p>
            <div className="bg-[#2D5016]/5 p-4 rounded-lg font-mono text-center">
              Diversion Rate = (Recycled + Composted + Energy Recovery) / Total Waste x 100
            </div>
            <p className="mt-3">
              <strong>Landfill rate</strong> is simply the inverse: 100% - Diversion Rate
            </p>
            <p>
              <strong>Recycling rate</strong> measures only recycled materials: Recycled / Total Waste x 100
            </p>
            <p className="mt-3 text-[#2D5016]/60">
              Note: Hazardous waste is tracked separately due to special handling requirements
              and is not typically included in standard diversion calculations.
            </p>
          </div>
        </InfoCard>
      </div>

      {/* SEO-friendly footer content */}
      <div className="text-center pt-8 border-t border-[#2D5016]/10">
        <p className="text-sm text-[#2D5016]/50">
          Free waste diversion calculator for businesses. Track recycling rates, composting,
          and waste-to-energy recovery. Compare your performance to industry benchmarks.
        </p>
      </div>
    </div>
  );
}
