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
} from '@/lib/respond/emissionFactors';
import {
  Zap,
  Globe,
  Leaf,
  Calculator,
  Info,
  ArrowRight,
  Building2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export default function Scope2Calculator() {
  const [country, setCountry] = useState('');
  const [consumption, setConsumption] = useState('');
  const [unit, setUnit] = useState('kWh');
  const [recPercent, setRecPercent] = useState(0);
  const [showEducation, setShowEducation] = useState(false);

  // Convert consumption to kWh
  const consumptionKwh = useMemo(() => {
    const value = parseFloat(consumption);
    if (isNaN(value) || value < 0) return null;
    return unit === 'MWh' ? value * 1000 : value;
  }, [consumption, unit]);

  // Get emission factor for selected country
  const factorInfo = useMemo(() => {
    return getElectricityFactor(country || undefined);
  }, [country]);

  // Calculate emissions
  const calculations = useMemo(() => {
    if (!consumptionKwh || consumptionKwh <= 0) return null;

    const locationBased = consumptionKwh * factorInfo.factor;
    const marketBased = consumptionKwh * (1 - recPercent / 100) * factorInfo.factor;

    return {
      locationBased: Math.round(locationBased * 1000) / 1000,
      marketBased: Math.round(marketBased * 1000) / 1000,
      reduction: Math.round((locationBased - marketBased) * 1000) / 1000,
      reductionPercent: recPercent,
    };
  }, [consumptionKwh, factorInfo.factor, recPercent]);

  const formatNumber = (num, decimals = 3) => {
    if (num == null) return '-';
    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 text-white mb-4">
          <Zap className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold text-[#2D5016]">
          Scope 2 Emissions Calculator
        </h1>
        <p className="text-[#2D5016]/70 max-w-2xl mx-auto">
          Calculate your organization's electricity-related carbon emissions using
          country-specific grid emission factors from the IEA.
        </p>
      </div>

      {/* Calculator Card */}
      <div className="glass-card rounded-2xl p-6 sm:p-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-[#2D5016] flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Enter Your Data
            </h2>

            {/* Country Selector */}
            <div className="space-y-2">
              <Label htmlFor="country" className="text-[#2D5016]">
                Country
              </Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger id="country" className="w-full">
                  <SelectValue placeholder="Select your country" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {SUPPORTED_COUNTRIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {country && (
                <p className="text-xs text-[#2D5016]/60">
                  Grid factor: {(factorInfo.factor * 1000).toFixed(3)} kgCO2e/kWh
                </p>
              )}
            </div>

            {/* Electricity Consumption */}
            <div className="space-y-2">
              <Label htmlFor="consumption" className="text-[#2D5016]">
                Electricity Consumption
              </Label>
              <div className="flex gap-2">
                <Input
                  id="consumption"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="Enter amount"
                  value={consumption}
                  onChange={(e) => setConsumption(e.target.value)}
                  className="flex-1"
                />
                <div className="flex rounded-md border border-input overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setUnit('kWh')}
                    className={cn(
                      'px-3 py-2 text-sm font-medium transition-colors',
                      unit === 'kWh'
                        ? 'bg-[#2D5016] text-white'
                        : 'bg-transparent text-[#2D5016]/70 hover:bg-[#2D5016]/10'
                    )}
                  >
                    kWh
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnit('MWh')}
                    className={cn(
                      'px-3 py-2 text-sm font-medium transition-colors border-l border-input',
                      unit === 'MWh'
                        ? 'bg-[#2D5016] text-white'
                        : 'bg-transparent text-[#2D5016]/70 hover:bg-[#2D5016]/10'
                    )}
                  >
                    MWh
                  </button>
                </div>
              </div>
            </div>

            {/* REC Slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="rec" className="text-[#2D5016]">
                  Renewable Energy Certificates (RECs)
                </Label>
                <span className="text-sm font-medium text-[#2D5016]">
                  {recPercent}%
                </span>
              </div>
              <input
                id="rec"
                type="range"
                min="0"
                max="100"
                step="1"
                value={recPercent}
                onChange={(e) => setRecPercent(parseInt(e.target.value))}
                className="w-full h-2 bg-[#2D5016]/10 rounded-lg appearance-none cursor-pointer accent-[#7CB342]"
              />
              <div className="flex justify-between text-xs text-[#2D5016]/50">
                <span>0% (No RECs)</span>
                <span>100% (Fully renewable)</span>
              </div>
              <p className="text-xs text-[#2D5016]/60">
                If you purchase renewable energy certificates, adjust this slider to
                reflect the percentage of your electricity covered by RECs.
              </p>
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-[#2D5016] flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Your Scope 2 Emissions
            </h2>

            {calculations ? (
              <div className="space-y-4">
                {/* Location-Based Result */}
                <div className="p-5 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-700">
                        Location-Based
                      </p>
                      <p className="text-3xl font-bold text-blue-900 mt-1">
                        {formatNumber(calculations.locationBased)}
                      </p>
                      <p className="text-sm text-blue-600">tCO2e</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                </div>

                {/* Market-Based Result (show if RECs > 0) */}
                {recPercent > 0 && (
                  <div className="p-5 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-700">
                          Market-Based
                        </p>
                        <p className="text-3xl font-bold text-green-900 mt-1">
                          {formatNumber(calculations.marketBased)}
                        </p>
                        <p className="text-sm text-green-600">tCO2e</p>
                      </div>
                      <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                        <Leaf className="w-5 h-5 text-green-600" />
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <p className="text-sm text-green-700">
                        Your RECs reduce emissions by{' '}
                        <span className="font-semibold">
                          {formatNumber(calculations.reduction)} tCO2e
                        </span>{' '}
                        ({calculations.reductionPercent}%)
                      </p>
                    </div>
                  </div>
                )}

                {/* Source Attribution */}
                <div className="flex items-start gap-2 p-3 rounded-lg bg-[#2D5016]/5">
                  <Info className="w-4 h-4 text-[#2D5016]/60 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-[#2D5016]/70">
                    <p className="font-medium">Data Source: IEA 2023</p>
                    <p className="mt-1">
                      Grid emission factor:{' '}
                      <span className="font-mono">
                        {(factorInfo.factor * 1000).toFixed(3)} kgCO2e/kWh
                      </span>
                    </p>
                    {factorInfo.isDefault && (
                      <p className="mt-1 text-amber-600">
                        Using global average (country not in database)
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 rounded-xl border-2 border-dashed border-[#2D5016]/20">
                <Calculator className="w-12 h-12 text-[#2D5016]/30 mb-3" />
                <p className="text-[#2D5016]/50">
                  Enter your country and electricity consumption to calculate
                  emissions
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Educational Content */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowEducation(!showEducation)}
          className="w-full p-6 flex items-center justify-between text-left hover:bg-[#2D5016]/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#2D5016]/10 flex items-center justify-center">
              <Info className="w-5 h-5 text-[#2D5016]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#2D5016]">
                Understanding Scope 2 Emissions
              </h2>
              <p className="text-sm text-[#2D5016]/60">
                Learn about location-based vs market-based accounting
              </p>
            </div>
          </div>
          {showEducation ? (
            <ChevronUp className="w-5 h-5 text-[#2D5016]/50" />
          ) : (
            <ChevronDown className="w-5 h-5 text-[#2D5016]/50" />
          )}
        </button>

        {showEducation && (
          <div className="px-6 pb-6 space-y-6 border-t border-[#2D5016]/10 pt-6">
            {/* What is Scope 2? */}
            <div>
              <h3 className="font-semibold text-[#2D5016] mb-2">
                What is Scope 2?
              </h3>
              <p className="text-sm text-[#2D5016]/70 leading-relaxed">
                Scope 2 emissions are indirect greenhouse gas emissions from the
                generation of purchased electricity, steam, heating, and cooling
                consumed by your organization. For most companies, electricity is
                the primary source of Scope 2 emissions.
              </p>
            </div>

            {/* Location vs Market-Based */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                <h4 className="font-semibold text-blue-800 mb-2">
                  Location-Based Method
                </h4>
                <p className="text-sm text-blue-700/80 leading-relaxed">
                  Reflects the average emissions intensity of the local electricity
                  grid where consumption occurs. This method uses country or
                  regional grid emission factors.
                </p>
                <p className="text-xs text-blue-600 mt-3 font-medium">
                  Use when: Reporting your physical emissions footprint based on
                  where you operate.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-green-50 border border-green-100">
                <h4 className="font-semibold text-green-800 mb-2">
                  Market-Based Method
                </h4>
                <p className="text-sm text-green-700/80 leading-relaxed">
                  Reflects emissions from electricity that you have purposefully
                  chosen (or not chosen). It accounts for contractual instruments
                  like RECs, PPAs, or green tariffs.
                </p>
                <p className="text-xs text-green-600 mt-3 font-medium">
                  Use when: Demonstrating impact of renewable energy procurement
                  decisions.
                </p>
              </div>
            </div>

            {/* GHG Protocol Note */}
            <div className="p-4 rounded-lg bg-[#2D5016]/5 border border-[#2D5016]/10">
              <p className="text-sm text-[#2D5016]/80">
                <span className="font-semibold">GHG Protocol Guidance:</span> The
                GHG Protocol requires companies to report both location-based and
                market-based Scope 2 emissions. This dual reporting provides
                transparency about both the grid emissions where you operate and the
                impact of your renewable energy choices.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* CTA Section */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 bg-gradient-to-br from-[#2D5016]/5 to-[#7CB342]/10">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-xl font-bold text-[#2D5016] mb-2">
              Track your Scope 2 emissions monthly with ESG Passport
            </h2>
            <p className="text-[#2D5016]/70">
              Build a complete emissions profile over time. Respond to customer
              questionnaires with confidence using verified data.
            </p>
          </div>
          <Link to="/onboarding">
            <Button className="bg-[#2D5016] hover:bg-[#2D5016]/90 text-white px-6">
              Get Started Free
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>

      {/* SEO Content Footer */}
      <div className="text-center text-sm text-[#2D5016]/50 space-y-2">
        <p>
          Free Scope 2 emissions calculator using IEA 2023 grid emission factors
        </p>
        <p>
          Supports {SUPPORTED_COUNTRIES.length} countries | Location-based &
          market-based accounting
        </p>
      </div>
    </div>
  );
}
