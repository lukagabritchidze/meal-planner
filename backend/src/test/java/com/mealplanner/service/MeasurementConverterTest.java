package com.mealplanner.service;

import com.mealplanner.util.ConvertedMeasurement;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * Unit tests for {@link MeasurementConverter} covering volume and mass conversion,
 * metric simplification, passthrough behaviour, and boundary cases.
 */
class MeasurementConverterTest {

    private static final double DELTA = 0.001;

    private final MeasurementConverter converter = new MeasurementConverter();

    @Test
    @DisplayName("cups convert to millilitres")
    void cupsToMilliliters() {
        ConvertedMeasurement result = converter.convert(1.0, "cup");
        assertEquals("ml", result.convertedUnit());
        assertEquals(237.0, result.convertedAmount(), DELTA);
    }

    @Test
    @DisplayName("multiple cups simplify to litres")
    void cupsSimplifyToLitres() {
        ConvertedMeasurement result = converter.convert(5.0, "cups");
        assertEquals("l", result.convertedUnit());
        assertEquals(1.18, result.convertedAmount(), DELTA);
    }

    @Test
    @DisplayName("pounds convert and simplify to kilograms")
    void poundsToGrams() {
        ConvertedMeasurement result = converter.convert(3.0, "lbs");
        assertEquals("kg", result.convertedUnit());
        assertEquals(1.36, result.convertedAmount(), DELTA);
    }

    @Test
    @DisplayName("ounces convert to grams")
    void ouncesToGrams() {
        ConvertedMeasurement result = converter.convert(1.0, "oz");
        assertEquals("g", result.convertedUnit());
        assertEquals(28.0, result.convertedAmount(), DELTA);
    }

    @Test
    @DisplayName("gallon converts and simplifies to litres")
    void gallonToLitres() {
        ConvertedMeasurement result = converter.convert(1.0, "gallon");
        assertEquals("l", result.convertedUnit());
        assertEquals(3.79, result.convertedAmount(), DELTA);
    }

    @Test
    @DisplayName("teaspoon converts to millilitres")
    void teaspoonToMilliliters() {
        ConvertedMeasurement result = converter.convert(1.0, "teaspoon");
        assertEquals("ml", result.convertedUnit());
        assertEquals(5.0, result.convertedAmount(), DELTA);
    }

    @Test
    @DisplayName("already-metric millilitres pass through")
    void metricMillilitresPassthrough() {
        ConvertedMeasurement result = converter.convert(500.0, "ml");
        assertEquals("ml", result.convertedUnit());
        assertEquals(500.0, result.convertedAmount(), DELTA);
    }

    @Test
    @DisplayName("already-metric grams pass through")
    void metricGramsPassthrough() {
        ConvertedMeasurement result = converter.convert(250.0, "grams");
        assertEquals("g", result.convertedUnit());
        assertEquals(250.0, result.convertedAmount(), DELTA);
    }

    @Test
    @DisplayName("unrecognised count-based unit passes through unchanged")
    void unrecognisedUnitPassthrough() {
        ConvertedMeasurement result = converter.convert(4.0, "cloves");
        assertEquals("cloves", result.convertedUnit());
        assertEquals(4.0, result.convertedAmount(), DELTA);
    }

    @Test
    @DisplayName("exactly 1000 ml simplifies to 1 litre")
    void boundaryThousandMillilitres() {
        ConvertedMeasurement result = converter.convert(1000.0, "ml");
        assertEquals("l", result.convertedUnit());
        assertEquals(1.0, result.convertedAmount(), DELTA);
    }

    @Test
    @DisplayName("exactly 1000 g simplifies to 1 kilogram")
    void boundaryThousandGrams() {
        ConvertedMeasurement result = converter.convert(1000.0, "g");
        assertEquals("kg", result.convertedUnit());
        assertEquals(1.0, result.convertedAmount(), DELTA);
    }

    @Test
    @DisplayName("null amount or unit is returned unchanged")
    void nullInputsPassthrough() {
        ConvertedMeasurement result = converter.convert(null, "cup");
        assertEquals("cup", result.convertedUnit());
        assertEquals(null, result.convertedAmount());
    }
}
