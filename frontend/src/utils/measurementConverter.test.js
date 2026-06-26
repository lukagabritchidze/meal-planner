import { convertToMetric } from './measurementConverter.js';

describe('convertToMetric', () => {
  test('cups pass through unchanged (household scoop unit, not liquid)', () => {
    const result = convertToMetric(2, 'cups');
    expect(result.unit).toBe('cups');
    expect(result.amount).toBe(2);
  });

  test('tablespoons pass through unchanged (household scoop unit)', () => {
    const result = convertToMetric(3, 'tbsp');
    expect(result.unit).toBe('tbsp');
    expect(result.amount).toBe(3);
  });

  test('fluid ounces convert and simplify to litres', () => {
    const result = convertToMetric(40, 'fl oz');
    expect(result.unit).toBe('l');
    expect(result.amount).toBeCloseTo(1.18, 3);
  });

  test('pounds convert and simplify to kilograms', () => {
    const result = convertToMetric(3, 'lbs');
    expect(result.unit).toBe('kg');
    expect(result.amount).toBeCloseTo(1.36, 3);
  });

  test('ounces convert to grams', () => {
    const result = convertToMetric(1, 'oz');
    expect(result.unit).toBe('g');
    expect(result.amount).toBeCloseTo(28, 3);
  });

  test('gallon converts and simplifies to litres', () => {
    const result = convertToMetric(1, 'gallon');
    expect(result.unit).toBe('l');
    expect(result.amount).toBeCloseTo(3.79, 3);
  });

  test('teaspoon passes through unchanged (household scoop unit)', () => {
    const result = convertToMetric(1, 'teaspoon');
    expect(result.unit).toBe('teaspoon');
    expect(result.amount).toBe(1);
  });

  test('already-metric millilitres pass through', () => {
    const result = convertToMetric(500, 'ml');
    expect(result.unit).toBe('ml');
    expect(result.amount).toBeCloseTo(500, 3);
  });

  test('already-metric grams pass through', () => {
    const result = convertToMetric(250, 'grams');
    expect(result.unit).toBe('g');
    expect(result.amount).toBeCloseTo(250, 3);
  });

  test('unrecognised count-based unit passes through unchanged', () => {
    const result = convertToMetric(4, 'cloves');
    expect(result.unit).toBe('cloves');
    expect(result.amount).toBe(4);
  });

  test('exactly 1000 ml simplifies to 1 litre', () => {
    const result = convertToMetric(1000, 'ml');
    expect(result.unit).toBe('l');
    expect(result.amount).toBeCloseTo(1, 3);
  });

  test('exactly 1000 g simplifies to 1 kilogram', () => {
    const result = convertToMetric(1000, 'g');
    expect(result.unit).toBe('kg');
    expect(result.amount).toBeCloseTo(1, 3);
  });
});
