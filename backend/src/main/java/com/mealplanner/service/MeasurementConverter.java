package com.mealplanner.service;

import com.mealplanner.util.ConvertedMeasurement;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * Converts ingredient measurements to the metric system.
 *
 * <p>Unambiguous liquid-volume units (fluid ounce, pint, quart, gallon, millilitre,
 * litre) are normalised to millilitres and simplified to litres when the result
 * reaches 1000 ml. Mass units are normalised to grams and simplified to kilograms
 * when the result reaches 1000 g. Units that are already metric pass through
 * unchanged.</p>
 *
 * <p>Household "scoop" units (teaspoon, tablespoon, cup) are intentionally NOT
 * converted: in everyday recipes they are used for solids and produce as well as
 * liquids (e.g. "2 cups spinach", "1 cup shredded cheese"), so turning them into
 * millilitres is misleading. They are therefore treated like count-based units
 * (e.g. "cloves", "pcs", "pinch") and returned untouched.</p>
 */
@Component
public class MeasurementConverter {

    private static final Map<String, Double> VOLUME_TO_ML = new HashMap<>();
    private static final Map<String, Double> MASS_TO_GRAMS = new HashMap<>();

    static {
        // Unambiguous liquid-volume variants -> millilitres.
        // Note: teaspoon/tablespoon/cup are deliberately excluded (see class Javadoc),
        // because they are commonly used to measure non-liquid ingredients too.
        registerAll(VOLUME_TO_ML, 29.574, "fl oz", "fluid ounce", "fluid ounces");
        registerAll(VOLUME_TO_ML, 473.176, "pt", "pint", "pints");
        registerAll(VOLUME_TO_ML, 946.353, "qt", "quart", "quarts");
        registerAll(VOLUME_TO_ML, 3785.41, "gal", "gallon", "gallons");
        registerAll(VOLUME_TO_ML, 1000.0, "l", "liter", "litre", "liters", "litres");
        registerAll(VOLUME_TO_ML, 1.0, "ml", "milliliter", "millilitre", "milliliters", "millilitres");

        // Mass variants -> grams
        registerAll(MASS_TO_GRAMS, 28.3495, "oz", "ounce", "ounces");
        registerAll(MASS_TO_GRAMS, 453.592, "lb", "lbs", "pound", "pounds");
        registerAll(MASS_TO_GRAMS, 1000.0, "kg", "kilogram", "kilograms");
        registerAll(MASS_TO_GRAMS, 1.0, "g", "gram", "grams");
    }

    private static void registerAll(Map<String, Double> target, double multiplier, String... variants) {
        for (String variant : variants) {
            target.put(variant, multiplier);
        }
    }

    /**
     * Converts an (amount, unit) pair to its simplified metric representation.
     *
     * @param amount the source amount; may be {@code null}
     * @param unit   the source unit; may be {@code null}
     * @return a {@link ConvertedMeasurement} with the converted amount and unit, or the
     * original values when the unit is not recognised as a volume or mass unit
     */
    public ConvertedMeasurement convert(Double amount, String unit) {
        if (amount == null || unit == null) {
            return new ConvertedMeasurement(amount, unit);
        }

        String normalized = unit.trim().toLowerCase();

        Double volumeMultiplier = VOLUME_TO_ML.get(normalized);
        if (volumeMultiplier != null) {
            double milliliters = amount * volumeMultiplier;
            if (milliliters >= 1000.0) {
                return new ConvertedMeasurement(round(milliliters / 1000.0, 2), "l");
            }
            return new ConvertedMeasurement(round(milliliters, 0), "ml");
        }

        Double massMultiplier = MASS_TO_GRAMS.get(normalized);
        if (massMultiplier != null) {
            double grams = amount * massMultiplier;
            if (grams >= 1000.0) {
                return new ConvertedMeasurement(round(grams / 1000.0, 2), "kg");
            }
            return new ConvertedMeasurement(round(grams, 0), "g");
        }

        // Unrecognised / count-based unit: leave unchanged.
        return new ConvertedMeasurement(amount, unit);
    }

    /**
     * Rounds a value to a fixed number of decimal places using half-up rounding.
     *
     * @param value  the value to round
     * @param places the number of decimal places (0 or more)
     * @return the rounded value
     */
    private double round(double value, int places) {
        double factor = Math.pow(10, places);
        return Math.round(value * factor) / factor;
    }
}
