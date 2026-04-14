// ============================================
// Confidence Scoring
// ============================================

import type { ExtractedField } from '../types';

/** Fields where zero is a valid, meaningful value (not a gap) */
const ZERO_IS_VALID = new Set([
  'fatalities', 'lostTimeIncidents', 'recordableIncidents',
  'hazardousWasteKg', 'grievancesReported', 'departures',
]);

function clampScore(score: number): number {
  return Math.min(1, Math.max(0, Math.round(score * 100) / 100));
}

function bandFromScore(score: number): 'high' | 'medium' | 'low' {
  if (score >= 0.8) return 'high';
  if (score >= 0.55) return 'medium';
  return 'low';
}

/**
 * Upgrade or downgrade confidence based on simple review-oriented signals.
 * This stays intentionally lightweight for the paid reviewed-extraction workflow.
 */
export function adjustConfidence(fields: ExtractedField[]): ExtractedField[] {
  return fields.map(f => {
    let score = typeof f.score === 'number'
      ? f.score
      : f.confidence === 'high'
      ? 0.85
      : f.confidence === 'medium'
      ? 0.65
      : 0.35;
    const reasons = [...(f.reasons || [])];

    if (f.rawUnitText && f.normalizedUnit) {
      reasons.push('unit_match');
      score += 0.05;
    } else {
      reasons.push('unit_ambiguous');
      score -= 0.15;
    }

    if (f.source?.rawText) {
      reasons.push('label_adjacent');
      score += 0.05;
      if (/[A-Za-z]{3,}/.test(f.source.rawText)) {
        reasons.push('ocr_clean');
        score += 0.03;
      }
    } else {
      reasons.push('no_label_anchor');
      score -= 0.15;
    }

    // Zero is valid for safety/incident fields.
    if (f.value === 0 && ZERO_IS_VALID.has(f.field)) {
      reasons.push('zero_valid');
      score += 0.05;
    } else if (typeof f.value === 'number' && f.value === 0) {
      reasons.push('zero_suspicious');
      score -= 0.25;
    }

    if (typeof f.value === 'number' && f.value < 0) {
      reasons.push('negative_value');
      score -= 0.5;
    }

    if (f.field === 'electricityKwh' && typeof f.value === 'number') {
      if (f.value >= 100 && f.value <= 100_000_000) {
        reasons.push('plausibility_range');
        score += 0.1;
      } else {
        reasons.push('outside_plausibility');
        score -= 0.35;
      }
    }

    score = clampScore(score);

    return {
      ...f,
      score,
      reasons,
      confidence: bandFromScore(score),
    };
  });
}
