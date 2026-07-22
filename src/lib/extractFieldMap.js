// Single source of truth: extractor field name → Passport data location.
//
// Two consumers read this:
//   1. Data.jsx (handleBillExtracted) — writes each extracted value to
//      `${section}.${field}` in the store. An extracted field with NO entry
//      here is skipped (`if (!mapping) continue`).
//   2. BillDrop.jsx — filters the review dialog to ONLY fields present here,
//      so a user is never shown a checkbox that silently does nothing on Apply.
//
// Keep those two behaviors in lockstep: if a field can be stored, add it here;
// if it can't, leaving it out means it won't be offered. No fake-door checkboxes.
//
// NOTE on femalePercent: the extractor can derive it, but the store has no
// femalePercent field — female share is computed from femaleEmployees/
// totalEmployees at bridge time (dataBridge.js). So it is intentionally absent
// here, and BillDrop will not present it as an applicable field.
export const EXTRACT_FIELD_MAP = {
  electricityKwh: { section: 'energy', field: 'electricityKwh' },
  naturalGasKwh: { section: 'energy', field: 'naturalGasKwh' },
  renewablePercent: { section: 'energy', field: 'renewablePercent' },
  dieselLiters: { section: 'energy', field: 'vehicleFuelLiters' },
  petrolLiters: { section: 'energy', field: 'vehicleFuelLiters' },
  waterM3: { section: 'water', field: 'consumptionM3' },
  totalWasteKg: { section: 'waste', field: 'totalKg' },
  hazardousWasteKg: { section: 'waste', field: 'hazardousKg' },
  recycledWasteKg: { section: 'waste', field: 'recycledKg' },
  recyclingRate: { section: 'waste', field: 'recyclingRate' },
  totalEmployees: { section: 'workforce', field: 'totalEmployees' },
  femaleEmployees: { section: 'workforce', field: 'femaleEmployees' },
  maleEmployees: { section: 'workforce', field: 'maleEmployees' },
  newHires: { section: 'workforce', field: 'newHires' },
  turnoverRate: { section: 'workforce', field: 'turnoverRate' },
  trainingHours: { section: 'training', field: 'trainingHours' },
  recordableIncidents: { section: 'healthSafety', field: 'recordableIncidents' },
  lostTimeIncidents: { section: 'healthSafety', field: 'lostTimeIncidents' },
  hoursWorked: { section: 'healthSafety', field: 'hoursWorked' },
  departures: { section: 'workforce', field: 'departures' },
};
