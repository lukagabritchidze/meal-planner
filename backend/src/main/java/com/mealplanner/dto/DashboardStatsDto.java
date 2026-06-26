package com.mealplanner.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Aggregated statistics shown on the dashboard landing page for a given week.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardStatsDto {
    private int totalRecipes;
    private int favoriteRecipes;
    private int plannedMealsThisWeek;
    private int distinctShoppingItems;
    private NutritionEstimateDto weeklyNutrition;
    private List<RecipeSummaryDto> favoriteRecipeShortlist;
}
