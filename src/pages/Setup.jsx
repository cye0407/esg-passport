import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCompanyProfile, saveCompanyProfile, getSettings } from '@/lib/store';
import { COUNTRIES, INDUSTRIES, CUSTOMER_SEGMENTS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Leaf, Building2, Users, Globe, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  { id: 'identity', title: 'Company Identity', icon: Building2 },
  { id: 'business', title: 'Business Context', icon: Globe },
  { id: 'size', title: 'Size & Scope', icon: Users },
  { id: 'reporting', title: 'Reporting', icon: Check },
];

export default function Setup() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    // Legal & Identity
    legalName: '',
    tradingName: '',
    registrationNumber: '',
    vatNumber: '',
    countryOfIncorporation: '',
    yearEstablished: '',
    // Business Context
    industrySector: '',
    naceCode: '',
    primaryProducts: '',
    customerSegments: '',
    // Size & Scope
    totalEmployees: '',
    annualRevenue: '',
    numberOfFacilities: '',
    countriesOfOperation: '',
    // Reporting
    reportingPeriodStart: '',
    reportingPeriodEnd: '',
    baselineYear: new Date().getFullYear().toString(),
    // Contact
    esgContactName: '',
    esgContactRole: '',
    esgContactEmail: '',
    esgContactPhone: '',
    website: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Check if already set up
    const settings = getSettings();
    if (settings.setupCompleted) {
      const existing = getCompanyProfile();
      if (existing) {
        setFormData(prev => ({ ...prev, ...existing }));
      }
    }
  }, []);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    if (step === 0) {
      if (!formData.legalName.trim()) newErrors.legalName = 'Company name is required';
      if (!formData.countryOfIncorporation) newErrors.countryOfIncorporation = 'Country is required';
    }
    
    if (step === 1) {
      if (!formData.industrySector) newErrors.industrySector = 'Industry is required';
    }
    
    if (step === 2) {
      if (!formData.totalEmployees) newErrors.totalEmployees = 'Number of employees is required';
    }
    
    if (step === 3) {
      if (!formData.esgContactName.trim()) newErrors.esgContactName = 'Contact name is required';
      if (!formData.esgContactEmail.trim()) newErrors.esgContactEmail = 'Contact email is required';
      if (formData.esgContactEmail && !/\S+@\S+\.\S+/.test(formData.esgContactEmail)) {
        newErrors.esgContactEmail = 'Invalid email format';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < STEPS.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    console.log('handleSubmit called, currentStep:', currentStep);
    if (!validateStep(currentStep)) {
      console.log('Validation failed, errors:', errors);
      return;
    }
    
    console.log('Validation passed, saving profile...');
    const profileData = {
      ...formData,
      totalEmployees: parseInt(formData.totalEmployees) || 0,
      annualRevenue: parseFloat(formData.annualRevenue) || 0,
      numberOfFacilities: parseInt(formData.numberOfFacilities) || 1,
      yearEstablished: parseInt(formData.yearEstablished) || null,
      baselineYear: parseInt(formData.baselineYear) || new Date().getFullYear(),
      countriesOfOperation: Array.isArray(formData.countriesOfOperation) 
        ? formData.countriesOfOperation 
        : (formData.countriesOfOperation || '').split(',').map(c => c.trim()).filter(Boolean),
    };
    console.log('Profile data:', profileData);
    
    try {
      saveCompanyProfile(profileData);
      console.log('Profile saved, redirecting...');
      // Use window.location for full page reload to pick up new settings
      window.location.href = '/';
    } catch (err) {
      console.error('Error saving profile:', err);
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8faf5] to-[#e8f0e0] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2D5016] to-[#7CB342] mb-4">
            <Leaf className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#2D5016]">ESG Passport Setup</h1>
          <p className="text-[#2D5016]/70 mt-2">Let's set up your company profile</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((step, index) => (
            <React.Fragment key={step.id}>
              <div
                className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium transition-all',
                  index < currentStep
                    ? 'bg-[#7CB342] text-white'
                    : index === currentStep
                    ? 'bg-[#2D5016] text-white'
                    : 'bg-[#2D5016]/10 text-[#2D5016]/50'
                )}
              >
                {index < currentStep ? <Check className="w-5 h-5" /> : index + 1}
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    'w-12 h-1 rounded-full transition-all',
                    index < currentStep ? 'bg-[#7CB342]' : 'bg-[#2D5016]/10'
                  )}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Form Card */}
        <div className="glass-card rounded-2xl p-8 shadow-xl">
          <h2 className="text-xl font-semibold text-[#2D5016] mb-6 flex items-center gap-2">
            {React.createElement(STEPS[currentStep].icon, { className: 'w-5 h-5' })}
            {STEPS[currentStep].title}
          </h2>

          {/* Step 0: Identity */}
          {currentStep === 0 && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="legalName" className="text-[#2D5016]">Legal Company Name *</Label>
                <Input
                  id="legalName"
                  value={formData.legalName}
                  onChange={(e) => updateField('legalName', e.target.value)}
                  placeholder="e.g., Acme GmbH"
                  className={cn('h-11', errors.legalName && 'border-red-500')}
                />
                {errors.legalName && <p className="text-red-500 text-sm">{errors.legalName}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tradingName" className="text-[#2D5016]">Trading Name (if different)</Label>
                <Input
                  id="tradingName"
                  value={formData.tradingName}
                  onChange={(e) => updateField('tradingName', e.target.value)}
                  placeholder="e.g., Acme Solutions"
                  className="h-11"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="registrationNumber" className="text-[#2D5016]">Registration Number</Label>
                  <Input
                    id="registrationNumber"
                    value={formData.registrationNumber}
                    onChange={(e) => updateField('registrationNumber', e.target.value)}
                    placeholder="e.g., HRB 12345"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vatNumber" className="text-[#2D5016]">VAT / Tax ID</Label>
                  <Input
                    id="vatNumber"
                    value={formData.vatNumber}
                    onChange={(e) => updateField('vatNumber', e.target.value)}
                    placeholder="e.g., DE123456789"
                    className="h-11"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#2D5016]">Country of Incorporation *</Label>
                  <Select
                    value={formData.countryOfIncorporation}
                    onValueChange={(value) => updateField('countryOfIncorporation', value)}
                  >
                    <SelectTrigger className={cn('h-11', errors.countryOfIncorporation && 'border-red-500')}>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((country) => (
                        <SelectItem key={country.code} value={country.code}>{country.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.countryOfIncorporation && <p className="text-red-500 text-sm">{errors.countryOfIncorporation}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="yearEstablished" className="text-[#2D5016]">Year Established</Label>
                  <Input
                    id="yearEstablished"
                    type="number"
                    min="1800"
                    max={currentYear}
                    value={formData.yearEstablished}
                    onChange={(e) => updateField('yearEstablished', e.target.value)}
                    placeholder={currentYear.toString()}
                    className="h-11"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Business Context */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-[#2D5016]">Industry / Sector *</Label>
                <Select
                  value={formData.industrySector}
                  onValueChange={(value) => updateField('industrySector', value)}
                >
                  <SelectTrigger className={cn('h-11', errors.industrySector && 'border-red-500')}>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map((industry) => (
                      <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.industrySector && <p className="text-red-500 text-sm">{errors.industrySector}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="naceCode" className="text-[#2D5016]">NACE Code (optional)</Label>
                <Input
                  id="naceCode"
                  value={formData.naceCode}
                  onChange={(e) => updateField('naceCode', e.target.value)}
                  placeholder="e.g., 25.11"
                  className="h-11"
                />
                <p className="text-xs text-[#2D5016]/50">European industry classification code</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="primaryProducts" className="text-[#2D5016]">Primary Products / Services</Label>
                <Textarea
                  id="primaryProducts"
                  value={formData.primaryProducts}
                  onChange={(e) => updateField('primaryProducts', e.target.value)}
                  placeholder="Describe your main products or services in 1-2 lines"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[#2D5016]">Customer Segments</Label>
                <Select
                  value={formData.customerSegments}
                  onValueChange={(value) => updateField('customerSegments', value)}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select primary segment" />
                  </SelectTrigger>
                  <SelectContent>
                    {CUSTOMER_SEGMENTS.map((seg) => (
                      <SelectItem key={seg.value} value={seg.value}>{seg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 2: Size & Scope */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="totalEmployees" className="text-[#2D5016]">Total Employees (FTE) *</Label>
                <Input
                  id="totalEmployees"
                  type="number"
                  min="1"
                  value={formData.totalEmployees}
                  onChange={(e) => updateField('totalEmployees', e.target.value)}
                  placeholder="e.g., 85"
                  className={cn('h-11', errors.totalEmployees && 'border-red-500')}
                />
                {errors.totalEmployees && <p className="text-red-500 text-sm">{errors.totalEmployees}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="annualRevenue" className="text-[#2D5016]">Annual Revenue (€)</Label>
                <Input
                  id="annualRevenue"
                  type="number"
                  min="0"
                  value={formData.annualRevenue}
                  onChange={(e) => updateField('annualRevenue', e.target.value)}
                  placeholder="e.g., 5000000"
                  className="h-11"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numberOfFacilities" className="text-[#2D5016]">Number of Facilities</Label>
                  <Input
                    id="numberOfFacilities"
                    type="number"
                    min="1"
                    value={formData.numberOfFacilities}
                    onChange={(e) => updateField('numberOfFacilities', e.target.value)}
                    placeholder="e.g., 2"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="baselineYear" className="text-[#2D5016]">Baseline Year</Label>
                  <Input
                    id="baselineYear"
                    type="number"
                    min="2015"
                    max={currentYear}
                    value={formData.baselineYear}
                    onChange={(e) => updateField('baselineYear', e.target.value)}
                    className="h-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="countriesOfOperation" className="text-[#2D5016]">Countries of Operation</Label>
                <Input
                  id="countriesOfOperation"
                  value={formData.countriesOfOperation}
                  onChange={(e) => updateField('countriesOfOperation', e.target.value)}
                  placeholder="e.g., Germany, France, Netherlands"
                  className="h-11"
                />
                <p className="text-xs text-[#2D5016]/50">Comma-separated list</p>
              </div>
            </div>
          )}

          {/* Step 3: Reporting & Contact */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <div className="p-4 bg-[#2D5016]/5 rounded-xl mb-4">
                <p className="text-sm text-[#2D5016]/70">
                  This person will be listed as the sustainability contact on your export documents.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="esgContactName" className="text-[#2D5016]">Contact Name *</Label>
                  <Input
                    id="esgContactName"
                    value={formData.esgContactName}
                    onChange={(e) => updateField('esgContactName', e.target.value)}
                    placeholder="e.g., Maria Schmidt"
                    className={cn('h-11', errors.esgContactName && 'border-red-500')}
                  />
                  {errors.esgContactName && <p className="text-red-500 text-sm">{errors.esgContactName}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="esgContactRole" className="text-[#2D5016]">Role / Title</Label>
                  <Input
                    id="esgContactRole"
                    value={formData.esgContactRole}
                    onChange={(e) => updateField('esgContactRole', e.target.value)}
                    placeholder="e.g., Operations Manager"
                    className="h-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="esgContactEmail" className="text-[#2D5016]">Contact Email *</Label>
                <Input
                  id="esgContactEmail"
                  type="email"
                  value={formData.esgContactEmail}
                  onChange={(e) => updateField('esgContactEmail', e.target.value)}
                  placeholder="e.g., sustainability@company.com"
                  className={cn('h-11', errors.esgContactEmail && 'border-red-500')}
                />
                {errors.esgContactEmail && <p className="text-red-500 text-sm">{errors.esgContactEmail}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="esgContactPhone" className="text-[#2D5016]">Contact Phone</Label>
                  <Input
                    id="esgContactPhone"
                    type="tel"
                    value={formData.esgContactPhone}
                    onChange={(e) => updateField('esgContactPhone', e.target.value)}
                    placeholder="e.g., +49 123 456789"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website" className="text-[#2D5016]">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => updateField('website', e.target.value)}
                    placeholder="e.g., https://company.com"
                    className="h-11"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-[#2D5016]/10">
            <Button
              type="button"
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 0}
              className="text-[#2D5016]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              type="button"
              onClick={handleNext}
              className="bg-gradient-to-r from-[#2D5016] to-[#3d6b1e] hover:from-[#3d6b1e] hover:to-[#4d7b2e] text-white px-8"
            >
              {currentStep === STEPS.length - 1 ? 'Complete Setup' : 'Continue'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>

        {/* Skip for now */}
        <p className="text-center mt-4 text-sm text-[#2D5016]/50">
          You can update this information anytime in Settings
        </p>
      </div>
    </div>
  );
}
