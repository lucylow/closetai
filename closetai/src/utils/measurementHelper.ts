/**
 * Body measurement approximation utilities.
 * Used when Perfect Corp API is unavailable or for client-side fallbacks.
 */

export interface BodyMeasurements {
  height?: number;
  weight?: number;
  bust?: number;
  chest?: number;
  waist?: number;
  hips?: number;
  shoulder?: number;
  inseam?: number;
}

/** Typical proportions for approximation (height in cm, others derived) */
const TYPICAL_RATIOS: Record<keyof BodyMeasurements, number> = {
  height: 1,
  weight: 0.38, // kg per cm (rough)
  bust: 0.52,
  chest: 0.53,
  waist: 0.42,
  hips: 0.56,
  shoulder: 0.25,
  inseam: 0.46,
};

/**
 * Approximate body measurements from height using typical proportions.
 * Useful when only height is known or as a fallback.
 */
export function approximateFromHeight(heightCm: number): BodyMeasurements {
  return {
    height: heightCm,
    weight: Math.round(heightCm * TYPICAL_RATIOS.weight),
    bust: Math.round(heightCm * TYPICAL_RATIOS.bust),
    chest: Math.round(heightCm * TYPICAL_RATIOS.chest),
    waist: Math.round(heightCm * TYPICAL_RATIOS.waist),
    hips: Math.round(heightCm * TYPICAL_RATIOS.hips),
    shoulder: Math.round(heightCm * TYPICAL_RATIOS.shoulder),
    inseam: Math.round(heightCm * TYPICAL_RATIOS.inseam),
  };
}

/**
 * Format measurement for display (e.g., "88 cm", "72 cm").
 */
export function formatMeasurement(value: number | undefined, unit = "cm"): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${Math.round(value)} ${unit}`;
}

/**
 * Get size suggestion based on measurements (simplified).
 */
export function getSizeSuggestion(measurements: BodyMeasurements): string {
  const waist = measurements.waist ?? 75;
  const bust = measurements.bust ?? measurements.chest ?? 88;
  const hips = measurements.hips ?? 95;

  if (waist < 68 && bust < 86 && hips < 92) return "XS";
  if (waist < 74 && bust < 92 && hips < 98) return "S";
  if (waist < 80 && bust < 98 && hips < 104) return "M";
  if (waist < 86 && bust < 104 && hips < 110) return "L";
  return "XL";
}
