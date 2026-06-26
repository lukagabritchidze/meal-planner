package com.mealplanner.util;

/**
 * Immutable result of a measurement conversion produced by {@link com.mealplanner.service.MeasurementConverter}.
 *
 * @param convertedAmount the amount after conversion (and metric simplification, where applicable)
 * @param convertedUnit   the resulting unit (e.g. "ml", "l", "g", "kg", or the original unit when not convertible)
 */
public record ConvertedMeasurement(Double convertedAmount, String convertedUnit) {
}
