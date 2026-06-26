package com.mealplanner.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Rough, clearly-labeled weekly nutrition estimate.
 * <p>
 * These figures are NOT precise nutritional data. Because recipes carry no
 * per-ingredient macro information, the dashboard derives a transparent
 * estimate from the number of planned meals using fixed per-meal heuristics
 * (see {@code DashboardStatsService}). Treat the values as a ballpark only.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NutritionEstimateDto {
    private int calories;
    private int proteinGrams;
    private int carbsGrams;
    private int fatGrams;
}
