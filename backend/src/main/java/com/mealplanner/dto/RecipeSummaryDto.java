package com.mealplanner.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Lightweight recipe projection for dashboard quick-access cards.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecipeSummaryDto {
    private Long recipeId;
    private String recipeTitle;
    private String recipeCategory;
    private Integer cookingDurationMinutes;
    private String recipeImagePath;
}
