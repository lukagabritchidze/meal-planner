/**
 * Measurement conversion utility (frontend mirror of the backend MeasurementConverter).
 *
 * Unambiguous liquid-volume units (fl oz, pint, quart, gallon, ml, l) are normalised
 * to millilitres and simplified to litres at >= 1000 ml. Mass units are normalised to
 * grams and simplified to kilograms at >= 1000 g. Already-metric units pass through.
 *
 * Household "scoop" units (teaspoon, tablespoon, cup) are intentionally NOT converted:
 * they are routinely used for non-liquid ingredients too (e.g. "2 cups spinach"), so
 * turning them into millilitres is misleading. They are treated like count-based units
 * and left unchanged, as are unrecognised units.
 */

const VOLUME_TO_ML = {
  'fl oz': 29.574, 'fluid ounce': 29.574, 'fluid ounces': 29.574,
  pt: 473.176, pint: 473.176, pints: 473.176,
  qt: 946.353, quart: 946.353, quarts: 946.353,
  gal: 3785.41, gallon: 3785.41, gallons: 3785.41,
  l: 1000, liter: 1000, litre: 1000, liters: 1000, litres: 1000,
  ml: 1, milliliter: 1, millilitre: 1, milliliters: 1, millilitres: 1,
};

const MASS_TO_GRAMS = {
  oz: 28.3495, ounce: 28.3495, ounces: 28.3495,
  lb: 453.592, lbs: 453.592, pound: 453.592, pounds: 453.592,
  kg: 1000, kilogram: 1000, kilograms: 1000,
  g: 1, gram: 1, grams: 1,
};

function round(value, places) {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

/**
 * Convert an (amount, unit) pair to its simplified metric representation.
 * @param {number} amount
 * @param {string} unit
 * @returns {{ amount: number, unit: string }}
 */
export function convertToMetric(amount, unit) {
  if (amount === null || amount === undefined || unit === null || unit === undefined) {
    return { amount, unit };
  }

  const normalized = String(unit).trim().toLowerCase();

  if (Object.prototype.hasOwnProperty.call(VOLUME_TO_ML, normalized)) {
    const milliliters = amount * VOLUME_TO_ML[normalized];
    if (milliliters >= 1000) {
      return { amount: round(milliliters / 1000, 2), unit: 'l' };
    }
    return { amount: round(milliliters, 0), unit: 'ml' };
  }

  if (Object.prototype.hasOwnProperty.call(MASS_TO_GRAMS, normalized)) {
    const grams = amount * MASS_TO_GRAMS[normalized];
    if (grams >= 1000) {
      return { amount: round(grams / 1000, 2), unit: 'kg' };
    }
    return { amount: round(grams, 0), unit: 'g' };
  }

  return { amount, unit };
}

/**
 * Format an amount/unit pair into a display string. All unit formatting in the UI
 * should route through this helper rather than being assembled inline in JSX.
 * @param {number} amount
 * @param {string} unit
 * @returns {string}
 */
export function formatMeasurement(amount, unit) {
  if (amount === null || amount === undefined) {
    return unit ? String(unit) : '';
  }
  const display = Number.isInteger(amount) ? amount : round(amount, 2);
  return unit ? `${display} ${unit}` : `${display}`;
}

/**
 * Convenience helper: convert to metric and immediately format for display.
 * @param {number} amount
 * @param {string} unit
 * @returns {string}
 */
export function formatAsMetric(amount, unit) {
  const converted = convertToMetric(amount, unit);
  return formatMeasurement(converted.amount, converted.unit);
}
