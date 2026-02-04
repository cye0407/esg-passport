// ============================================
// Industry-Specific Metric Packs
// ============================================
// Additional data entry rows shown based on company industry.
// Same structure as core dataRows in Data.jsx.

export const INDUSTRY_METRICS = {
  'Manufacturing': [
    { section: 'production', field: 'unitsProduced', label: 'Units Produced', labelKey: 'ind.unitsProduced' },
    { section: 'production', field: 'productionHours', label: 'Production Hours', labelKey: 'ind.productionHours' },
    { section: 'production', field: 'materialInputTonnes', label: 'Material Input (tonnes)', labelKey: 'ind.materialInput' },
  ],
  'Logistics & Transport': [
    { section: 'fleet', field: 'totalKmDriven', label: 'Total km Driven', labelKey: 'ind.totalKm' },
    { section: 'fleet', field: 'fleetSize', label: 'Fleet Size (vehicles)', noSum: true, labelKey: 'ind.fleetSize' },
    { section: 'fleet', field: 'avgVehicleAge', label: 'Avg Vehicle Age (yrs)', noSum: true, labelKey: 'ind.vehicleAge' },
    { section: 'fleet', field: 'altFuelPercent', label: 'Alt Fuel Vehicles (%)', noSum: true, labelKey: 'ind.altFuel' },
  ],
  'Technology & Software': [
    { section: 'office', field: 'officeSpaceM2', label: 'Office Space (m\u00B2)', noSum: true, labelKey: 'ind.officeSpace' },
    { section: 'office', field: 'businessTravelKm', label: 'Business Travel (km)', labelKey: 'ind.bizTravel' },
    { section: 'office', field: 'wfhPercent', label: 'Remote Work (%)', noSum: true, labelKey: 'ind.wfh' },
  ],
  'Professional Services': [
    { section: 'office', field: 'officeSpaceM2', label: 'Office Space (m\u00B2)', noSum: true, labelKey: 'ind.officeSpace' },
    { section: 'office', field: 'businessTravelKm', label: 'Business Travel (km)', labelKey: 'ind.bizTravel' },
    { section: 'office', field: 'wfhPercent', label: 'Remote Work (%)', noSum: true, labelKey: 'ind.wfh' },
  ],
  'Food & Beverage': [
    { section: 'agriculture', field: 'landUseHectares', label: 'Land Use (hectares)', noSum: true, labelKey: 'ind.landUse' },
    { section: 'agriculture', field: 'fertilizerKg', label: 'Fertilizer (kg)', labelKey: 'ind.fertilizer' },
    { section: 'agriculture', field: 'pesticideKg', label: 'Pesticide (kg)', labelKey: 'ind.pesticide' },
    { section: 'agriculture', field: 'seasonalWorkers', label: 'Seasonal Workers', noSum: true, labelKey: 'ind.seasonal' },
  ],
  'Chemicals': [
    { section: 'chemicals', field: 'svhcCount', label: 'SVHC Substances', noSum: true, labelKey: 'ind.svhc' },
    { section: 'chemicals', field: 'sdsCoveragePercent', label: 'SDS Coverage (%)', noSum: true, labelKey: 'ind.sds' },
    { section: 'chemicals', field: 'processSafetyIncidents', label: 'Process Safety Incidents', labelKey: 'ind.psi' },
    { section: 'chemicals', field: 'nearMisses', label: 'Near Misses', labelKey: 'ind.nearMiss' },
  ],
  'Textiles & Apparel': [
    { section: 'textile', field: 'waterDischargeM3', label: 'Water Discharge (m\u00B3)', labelKey: 'ind.waterDischarge' },
    { section: 'textile', field: 'fabricProducedM2', label: 'Fabric Produced (m\u00B2)', labelKey: 'ind.fabricProduced' },
    { section: 'textile', field: 'chemicalInventoryCount', label: 'Chemical Inventory', noSum: true, labelKey: 'ind.chemInventory' },
    { section: 'textile', field: 'mrslCompliancePercent', label: 'MRSL Compliance (%)', noSum: true, labelKey: 'ind.mrsl' },
  ],
  'Construction': [
    { section: 'construction', field: 'concreteTonnes', label: 'Concrete (tonnes)', labelKey: 'ind.concrete' },
    { section: 'construction', field: 'steelTonnes', label: 'Steel (tonnes)', labelKey: 'ind.steel' },
    { section: 'construction', field: 'siteAreaM2', label: 'Site Area (m\u00B2)', noSum: true, labelKey: 'ind.siteArea' },
    { section: 'construction', field: 'equipmentHours', label: 'Equipment Hours', labelKey: 'ind.equipHours' },
  ],
  'Automotive': [
    { section: 'production', field: 'unitsProduced', label: 'Parts/Vehicles Produced', labelKey: 'ind.unitsProduced' },
    { section: 'production', field: 'productionHours', label: 'Production Hours', labelKey: 'ind.productionHours' },
    { section: 'production', field: 'materialInputTonnes', label: 'Material Input (tonnes)', labelKey: 'ind.materialInput' },
  ],
  'Energy & Utilities': [
    { section: 'generation', field: 'energyGeneratedMwh', label: 'Energy Generated (MWh)', labelKey: 'ind.energyGen' },
    { section: 'generation', field: 'capacityFactorPercent', label: 'Capacity Factor (%)', noSum: true, labelKey: 'ind.capFactor' },
  ],
  'Healthcare': [
    { section: 'healthcare', field: 'medicalWasteKg', label: 'Medical Waste (kg)', labelKey: 'ind.medWaste' },
    { section: 'healthcare', field: 'pharmaceuticalWasteKg', label: 'Pharmaceutical Waste (kg)', labelKey: 'ind.pharmaWaste' },
  ],
  'Wholesale & Distribution': [
    { section: 'distribution', field: 'warehouseSpaceM2', label: 'Warehouse Space (m\u00B2)', noSum: true, labelKey: 'ind.warehouse' },
    { section: 'distribution', field: 'deliveriesCount', label: 'Deliveries Made', labelKey: 'ind.deliveries' },
    { section: 'distribution', field: 'packagingWasteKg', label: 'Packaging Waste (kg)', labelKey: 'ind.packagingWaste' },
  ],
  'Retail': [
    { section: 'retail', field: 'storeCount', label: 'Store Count', noSum: true, labelKey: 'ind.storeCount' },
    { section: 'retail', field: 'storeAreaM2', label: 'Store Area (m\u00B2)', noSum: true, labelKey: 'ind.storeArea' },
    { section: 'retail', field: 'packagingWasteKg', label: 'Packaging Waste (kg)', labelKey: 'ind.packagingWaste' },
  ],
};

/**
 * Get the industry-specific metric rows for a given industry.
 * Returns empty array if no specific metrics are defined.
 */
export function getIndustryMetrics(industry) {
  return INDUSTRY_METRICS[industry] || [];
}
