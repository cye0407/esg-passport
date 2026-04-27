// ============================================
// Extractor Registry — auto-detect document type and route
// ============================================

import type { ExtractionResult, ExtractionConfig, DocumentType, DocumentTypeDetection, Issue } from '../types';
import { parsePdf } from '../parsers/pdf';
import { extractEnergy } from './energy';
import { extractWaste } from './waste';
import { extractWorkforce } from './workforce';
import { extractFuel } from './fuel';

/**
 * Auto-detect document type from text content.
 */
function detectDocumentType(text: string): DocumentTypeDetection {
  const lower = text.toLowerCase();

  // Score each type by keyword density
  const scores: Record<DocumentType, number> = {
    electricity_bill: 0,
    gas_invoice: 0,
    water_bill: 0,
    waste_manifest: 0,
    payroll_summary: 0,
    unknown: 0,
  };

  // Energy — electricity specific (exclude generic "kwh" from gas)
  const elecWords = lower.match(/\b(electricity|strom|électricité|stromrechnung|power\s*consumption|stromabrechnung|strommix)\b/g);
  scores.electricity_bill = (elecWords || []).length;

  // Gas
  const gasWords = lower.match(/\b(natural\s*gas|erdgas|gaz\s*naturel|gasverbrauch|gasrechnung|facture\s*de\s*gaz|gasabrechnung)\b/g);
  scores.gas_invoice = (gasWords || []).length;

  // Fuel — diesel, petrol, fleet
  const fuelWords = lower.match(/\b(diesel|benzin|petrol|gasoline|fleet|flotte|flottenabrechnung|tankstelle|fuel|aral|zapfs[aä]ule|beleg-nr|preis\s*je\s*liter)\b/g);
  const fuelScore = (fuelWords || []).length;

  // Water — specific terms, not just "wasser" which appears in "abwasser"
  const waterWords = lower.match(/\b(wasserrechnung|wasserverbrauch|wasserbezug|water\s*(?:bill|consumption|withdrawal|usage)|trinkwasser|consommation\s*d'eau)\b/g);
  scores.water_bill = (waterWords || []).length;

  // Waste
  const wasteWords = lower.match(/\b(waste|abfall|déchets|recycling|hazardous|entsorgung|disposal|manifest|sonderabfall|gesamtmenge)\b/g);
  scores.waste_manifest = (wasteWords || []).length;

  // Workforce
  const hrWords = lower.match(/\b(employee|mitarbeiter|headcount|payroll|salary|personalbestand|personalbericht|training\s*hours|schulungsstunden|turnover|fluktuation|fte|personnel|effectif)\b/g);
  scores.payroll_summary = (hrWords || []).length;

  // Fuel uses gas_invoice type but needs separate detection
  if (fuelScore > 0 && fuelScore >= scores.gas_invoice) {
    scores.gas_invoice = fuelScore;
  }

  // Find the highest scoring type
  const ranked = (Object.entries(scores) as [DocumentType, number][])
    .sort((a, b) => b[1] - a[1]);
  const [bestType, bestScore] = ranked[0];
  const [runnerUpType, runnerUpScore] = ranked[1];
  const finalType = bestScore >= 2 ? bestType : 'unknown';

  return {
    type: finalType,
    score: bestScore,
    runnerUp: runnerUpType,
    runnerUpScore,
  };
}

/**
 * Route to the right extractor based on document type.
 */
function extractByType(text: string, docType: DocumentType, config?: ExtractionConfig): ExtractionResult {
  switch (docType) {
    case 'electricity_bill':
      return extractEnergy(text, config);
    case 'gas_invoice': {
      // Could be gas utility or fleet fuel — try both, return best
      const gasResult = extractEnergy(text, config);
      const fuelResult = extractFuel(text, config);
      return fuelResult.fields.length > gasResult.fields.length ? fuelResult : gasResult;
    }
    case 'water_bill':
      return extractEnergy(text, config); // water patterns in generic matcher
    case 'waste_manifest':
      return extractWaste(text, config);
    case 'payroll_summary':
      return extractWorkforce(text, config);
    default:
      return extractBestEffort(text, config);
  }
}

/**
 * Try all extractors and return the best result.
 */
function extractBestEffort(text: string, config?: ExtractionConfig): ExtractionResult {
  const results = [
    extractEnergy(text, config),
    extractWaste(text, config),
    extractWorkforce(text, config),
    extractFuel(text, config),
  ];

  // Return the result with the most extracted fields
  results.sort((a, b) => b.fields.length - a.fields.length);
  return results[0];
}

function attachDetection(result: ExtractionResult, detection: DocumentTypeDetection): ExtractionResult {
  const issues: Issue[] = [...(result.issues || [])];
  const warnings = [...(result.warnings || [])];
  const margin = detection.score - (detection.runnerUpScore || 0);

  if (detection.type === 'unknown' || detection.score < 3 || margin <= 1) {
    const message = detection.type === 'unknown'
      ? 'Document type is uncertain; review the extracted fields carefully.'
      : `Document type detection was close: ${detection.type} (${detection.score}) vs ${detection.runnerUp} (${detection.runnerUpScore || 0}).`;
    issues.push({
      code: 'document_type_uncertain',
      message,
    });
    warnings.push(message);
  }

  return {
    ...result,
    issues,
    warnings,
    documentDetection: detection,
  };
}

/**
 * Process a document buffer (PDF) and extract ESG data.
 * Auto-detects document type and routes to the right extractor.
 */
export async function extractFromPdf(
  buffer: Buffer,
  config?: ExtractionConfig,
): Promise<ExtractionResult> {
  const doc = await parsePdf(buffer);
  const detection = config?.forceType
    ? { type: config.forceType, score: 999, runnerUp: undefined, runnerUpScore: undefined }
    : detectDocumentType(doc.fullText);
  const result = extractByType(doc.fullText, detection.type, config);
  return attachDetection(result, detection);
}

/**
 * Process raw text and extract ESG data.
 * Auto-detects document type and routes to the right extractor.
 */
export function extractFromText(
  text: string,
  config?: ExtractionConfig,
): ExtractionResult {
  const detection = config?.forceType
    ? { type: config.forceType, score: 999, runnerUp: undefined, runnerUpScore: undefined }
    : detectDocumentType(text);
  const result = extractByType(text, detection.type, config);
  return attachDetection(result, detection);
}
