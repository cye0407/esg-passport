// What each document type is called, and what a reader will find in it.
//
// Written as literal t() calls in a switch rather than a table of key strings, because
// the i18nCoverage guard reads the SOURCE for `t('some.key')`. A key reached through a
// variable is invisible to it, and an invisible key is one that can go missing in German
// without failing the build. Two switches is a small price for that.
//
// A document type with no label is not rendered at all rather than rendered raw.

export function documentName(t, document) {
  switch (document) {
    case 'electricityBill': return t('coverage.docElectricityBill');
    case 'fuelInvoice': return t('coverage.docFuelInvoice');
    case 'waterBill': return t('coverage.docWaterBill');
    case 'wasteManifest': return t('coverage.docWasteManifest');
    case 'hrReport': return t('coverage.docHrReport');
    case 'trainingRecord': return t('coverage.docTrainingRecord');
    case 'safetyLog': return t('coverage.docSafetyLog');
    default: return null;
  }
}

/** The figures the document carries — what the reader is actually going looking for. */
export function documentHolds(t, document) {
  switch (document) {
    case 'electricityBill': return t('doc.holdsElectricity');
    case 'fuelInvoice': return t('doc.holdsFuel');
    case 'waterBill': return t('doc.holdsWater');
    case 'wasteManifest': return t('doc.holdsWaste');
    case 'hrReport': return t('doc.holdsHr');
    case 'trainingRecord': return t('doc.holdsTraining');
    case 'safetyLog': return t('doc.holdsSafety');
    default: return null;
  }
}
