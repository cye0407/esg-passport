// ============================================
// ESG PASSPORT - DATA STORE (localStorage)
// ============================================

import { DEFAULT_CONFIDENCE_ITEMS, DEFAULT_POLICIES } from './constants';

const STORAGE_KEY = 'esg_passport_data';
const STORAGE_VERSION = '1.0';

// ============================================
// DEFAULT DATA STRUCTURE
// ============================================

const getDefaultData = () => ({
  version: STORAGE_VERSION,
  companyProfile: null,
  dataRecords: [],
  confidenceRecords: DEFAULT_CONFIDENCE_ITEMS.map(item => ({
    ...item,
    status: 'not_started',
    confidence: null,
    safeToShare: false,
    notes: item.defaultNotes,
    updatedAt: new Date().toISOString(),
  })),
  policies: DEFAULT_POLICIES.map(policy => ({
    ...policy,
    exists: false,
    status: 'not_started',
    fileLocation: '',
    lastUpdated: null,
    updatedAt: new Date().toISOString(),
  })),
  requests: [],
  settings: {
    gridCountry: 'EU_AVERAGE',
    currency: 'EUR',
    dateFormat: 'YYYY-MM-DD',
    setupCompleted: false,
    onboardingStep: 0,
  },
});

// ============================================
// STORAGE OPERATIONS
// ============================================

export const loadData = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return getDefaultData();
    }
    const parsed = JSON.parse(stored);
    if (parsed.version !== STORAGE_VERSION) {
      console.log('Data version mismatch, merging with defaults');
      return mergeWithDefaults(parsed);
    }
    return parsed;
  } catch (error) {
    console.error('Error loading data:', error);
    return getDefaultData();
  }
};

export const saveData = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...data,
      version: STORAGE_VERSION,
    }));
    return true;
  } catch (error) {
    console.error('Error saving data:', error);
    return false;
  }
};

export const resetData = () => {
  localStorage.removeItem(STORAGE_KEY);
  return getDefaultData();
};

const mergeWithDefaults = (oldData) => {
  const defaults = getDefaultData();
  return {
    ...defaults,
    ...oldData,
    version: STORAGE_VERSION,
    confidenceRecords: mergeConfidenceRecords(oldData.confidenceRecords || [], defaults.confidenceRecords),
    policies: mergePolicies(oldData.policies || [], defaults.policies),
  };
};

const mergeConfidenceRecords = (existing, defaults) => {
  const existingIds = new Set(existing.map(r => r.id));
  const merged = [...existing];
  defaults.forEach(def => {
    if (!existingIds.has(def.id)) {
      merged.push(def);
    }
  });
  return merged;
};

const mergePolicies = (existing, defaults) => {
  const existingIds = new Set(existing.map(p => p.id));
  const merged = [...existing];
  defaults.forEach(def => {
    if (!existingIds.has(def.id)) {
      merged.push(def);
    }
  });
  return merged;
};

// ============================================
// ENTITY OPERATIONS
// ============================================

export const getCompanyProfile = () => {
  const data = loadData();
  return data.companyProfile;
};

export const saveCompanyProfile = (profile) => {
  const data = loadData();
  data.companyProfile = {
    ...profile,
    updatedAt: new Date().toISOString(),
  };
  data.settings.setupCompleted = true;
  saveData(data);
  return data.companyProfile;
};

export const getDataRecords = () => {
  const data = loadData();
  return data.dataRecords;
};

export const getDataRecordByPeriod = (period) => {
  const data = loadData();
  return data.dataRecords.find(r => r.period === period);
};

export const saveDataRecord = (record) => {
  const data = loadData();
  const existingIndex = data.dataRecords.findIndex(r => r.period === record.period);
  const updatedRecord = {
    ...record,
    updatedAt: new Date().toISOString(),
  };
  if (existingIndex >= 0) {
    data.dataRecords[existingIndex] = updatedRecord;
  } else {
    data.dataRecords.push(updatedRecord);
  }
  data.dataRecords.sort((a, b) => a.period.localeCompare(b.period));
  saveData(data);
  return updatedRecord;
};

export const deleteDataRecord = (period) => {
  const data = loadData();
  data.dataRecords = data.dataRecords.filter(r => r.period !== period);
  saveData(data);
};

export const getConfidenceRecords = () => {
  const data = loadData();
  return data.confidenceRecords;
};

export const saveConfidenceRecord = (record) => {
  const data = loadData();
  const index = data.confidenceRecords.findIndex(r => r.id === record.id);
  
  const safeToShare = record.status === 'complete' && 
    (record.confidence === 'high' || record.confidence === 'medium');
  
  const updatedRecord = {
    ...record,
    safeToShare,
    updatedAt: new Date().toISOString(),
  };
  
  if (index >= 0) {
    data.confidenceRecords[index] = updatedRecord;
  }
  saveData(data);
  return updatedRecord;
};

export const getPolicies = () => {
  const data = loadData();
  return data.policies;
};

export const savePolicy = (policy) => {
  const data = loadData();
  const index = data.policies.findIndex(p => p.id === policy.id);
  const updatedPolicy = {
    ...policy,
    updatedAt: new Date().toISOString(),
  };
  if (index >= 0) {
    data.policies[index] = updatedPolicy;
  } else {
    data.policies.push(updatedPolicy);
  }
  saveData(data);
  return updatedPolicy;
};

export const addCustomPolicy = (policy) => {
  const data = loadData();
  const newPolicy = {
    id: `custom_${Date.now()}`,
    ...policy,
    exists: false,
    status: 'not_started',
    fileLocation: '',
    lastUpdated: null,
    updatedAt: new Date().toISOString(),
  };
  data.policies.push(newPolicy);
  saveData(data);
  return newPolicy;
};

export const deletePolicy = (id) => {
  const data = loadData();
  data.policies = data.policies.filter(p => p.id !== id);
  saveData(data);
};

export const getRequests = () => {
  const data = loadData();
  return data.requests;
};

export const getRequestById = (id) => {
  const data = loadData();
  return data.requests.find(r => r.id === id);
};

export const saveRequest = (request) => {
  const data = loadData();
  const existingIndex = data.requests.findIndex(r => r.id === request.id);
  const updatedRequest = {
    ...request,
    updatedAt: new Date().toISOString(),
  };
  if (existingIndex >= 0) {
    data.requests[existingIndex] = updatedRequest;
  } else {
    updatedRequest.id = `req_${Date.now()}`;
    updatedRequest.createdAt = new Date().toISOString();
    data.requests.push(updatedRequest);
  }
  data.requests.sort((a, b) => new Date(b.dateReceived) - new Date(a.dateReceived));
  saveData(data);
  return updatedRequest;
};

export const deleteRequest = (id) => {
  const data = loadData();
  data.requests = data.requests.filter(r => r.id !== id);
  saveData(data);
};

export const getSettings = () => {
  const data = loadData();
  return data.settings;
};

export const saveSettings = (settings) => {
  const data = loadData();
  data.settings = {
    ...data.settings,
    ...settings,
  };
  saveData(data);
  return data.settings;
};

// ============================================
// COMPUTED VALUES
// ============================================

export const getAnnualTotals = (year) => {
  const records = getDataRecords().filter(r => r.period.startsWith(year));
  
  const sum = (getter) => records.reduce((acc, r) => acc + (getter(r) || 0), 0);
  const avg = (getter) => {
    const values = records.map(getter).filter(v => v != null);
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null;
  };
  const last = (getter) => {
    const sorted = records.filter(r => getter(r) != null).sort((a, b) => b.period.localeCompare(a.period));
    return sorted.length > 0 ? getter(sorted[0]) : null;
  };

  return {
    totalEnergyKwh: sum(r => (r.energy?.electricityKwh || 0) + (r.energy?.naturalGasKwh || 0)),
    electricityKwh: sum(r => r.energy?.electricityKwh),
    naturalGasKwh: sum(r => r.energy?.naturalGasKwh),
    vehicleFuelLiters: sum(r => r.energy?.vehicleFuelLiters),
    renewablePercent: avg(r => r.energy?.renewablePercent),
    scope1Tco2e: sum(r => r.energy?.scope1Tco2e),
    scope2Tco2e: sum(r => r.energy?.scope2Tco2e),
    waterM3: sum(r => r.water?.consumptionM3),
    totalWasteKg: sum(r => r.waste?.totalKg),
    recycledWasteKg: sum(r => r.waste?.recycledKg),
    hazardousWasteKg: sum(r => r.waste?.hazardousKg),
    recyclingRate: avg(r => r.waste?.recyclingRate),
    totalEmployees: last(r => r.workforce?.totalEmployees),
    femaleEmployees: last(r => r.workforce?.femaleEmployees),
    maleEmployees: last(r => r.workforce?.maleEmployees),
    newHires: sum(r => r.workforce?.newHires),
    departures: sum(r => r.workforce?.departures),
    workAccidents: sum(r => r.healthSafety?.workAccidents),
    hoursWorked: sum(r => r.healthSafety?.hoursWorked),
    trainingHours: sum(r => r.training?.trainingHours),
    scope3Total: sum(r => r.scope3?.totalScope3Tco2e),
  };
};

export const getReadinessStats = () => {
  const confidence = getConfidenceRecords();
  const policies = getPolicies();
  const requests = getRequests();
  
  const totalDataPoints = confidence.length;
  const completeDataPoints = confidence.filter(c => c.status === 'complete').length;
  const safeToShareDataPoints = confidence.filter(c => c.safeToShare).length;
  
  const totalPolicies = policies.length;
  const existingPolicies = policies.filter(p => p.exists).length;
  const approvedPolicies = policies.filter(p => p.status === 'approved' || p.status === 'published').length;
  
  const openRequests = requests.filter(r => r.status !== 'closed' && r.status !== 'sent').length;
  
  return {
    totalDataPoints,
    completeDataPoints,
    safeToShareDataPoints,
    dataCompletionPercent: Math.round((completeDataPoints / totalDataPoints) * 100),
    dataSafePercent: Math.round((safeToShareDataPoints / totalDataPoints) * 100),
    totalPolicies,
    existingPolicies,
    approvedPolicies,
    policyCompletionPercent: Math.round((approvedPolicies / totalPolicies) * 100),
    openRequests,
  };
};

export const exportAllData = () => {
  return loadData();
};

export const importData = (data) => {
  saveData(data);
  return loadData();
};
