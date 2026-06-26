package com.mealplanner.service;

import com.mealplanner.dto.DashboardStatsDto;
import com.mealplanner.dto.NutritionEstimateDto;
import com.mealplanner.dto.RecipeSummaryDto;
import com.mealplanner.dto.ShoppingListItem;
import com.mealplanner.entity.Recipe;
import com.mealplanner.repository.MealPlanRepository;
import com.mealplanner.repository.RecipeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Aggregates dashboard metrics for a given week by reusing existing repositories
 * and the shopping list aggregation service (no duplicated aggregation logic).
 */
@Service
public class DashboardStatsService {

    /**
     * Per-planned-meal nutrition heuristics. These are deliberately coarse, fixed
     * estimates used only to populate the dashboard's "weekly nutrition" visual,
     * since recipes do not store real macro data. They are not accurate values.
     */
    private static final int ESTIMATED_CALORIES_PER_MEAL = 650;
    private static final int ESTIMATED_PROTEIN_GRAMS_PER_MEAL = 30;
    private static final int ESTIMATED_CARBS_GRAMS_PER_MEAL = 75;
    private static final int ESTIMATED_FAT_GRAMS_PER_MEAL = 24;

    private static final int FAVORITE_SHORTLIST_LIMIT = 6;

    private final RecipeRepository recipeRepository;
    private final MealPlanRepository mealPlanRepository;
    private final ShoppingListService shoppingListService;

    @Autowired
    public DashboardStatsService(RecipeRepository recipeRepository,
                                 MealPlanRepository mealPlanRepository,
                                 ShoppingListService shoppingListService) {
        this.recipeRepository = recipeRepository;
        this.mealPlanRepository = mealPlanRepository;
        this.shoppingListService = shoppingListService;
    }

    /**
     * Builds the dashboard statistics for a user over the requested inclusive date range.
     *
     * @param userId the owning user's identifier
     * @param startDate inclusive start date of the week
     * @param endDate inclusive end date of the week
     * @return populated dashboard statistics
     */
    @Transactional(readOnly = true)
    public DashboardStatsDto buildWeeklyStats(Long userId, LocalDate startDate, LocalDate endDate) {
        int totalRecipes = (int) recipeRepository.count();
        int favoriteRecipes = (int) recipeRepository.countByIsFavoritedTrue();
        int plannedMeals = mealPlanRepository.findByUserIdAndPlannedDateBetween(userId, startDate, endDate).size();

        Map<String, List<ShoppingListItem>> shoppingList = shoppingListService.getShoppingList(userId, startDate, endDate);
        int distinctShoppingItems = shoppingList.values().stream().mapToInt(List::size).sum();

        NutritionEstimateDto nutrition = NutritionEstimateDto.builder()
                .calories(plannedMeals * ESTIMATED_CALORIES_PER_MEAL)
                .proteinGrams(plannedMeals * ESTIMATED_PROTEIN_GRAMS_PER_MEAL)
                .carbsGrams(plannedMeals * ESTIMATED_CARBS_GRAMS_PER_MEAL)
                .fatGrams(plannedMeals * ESTIMATED_FAT_GRAMS_PER_MEAL)
                .build();

        List<RecipeSummaryDto> favoriteShortlist = recipeRepository.findByIsFavoritedTrue().stream()
                .limit(FAVORITE_SHORTLIST_LIMIT)
                .map(this::toSummary)
                .collect(Collectors.toList());

        return DashboardStatsDto.builder()
                .totalRecipes(totalRecipes)
                .favoriteRecipes(favoriteRecipes)
                .plannedMealsThisWeek(plannedMeals)
                .distinctShoppingItems(distinctShoppingItems)
                .weeklyNutrition(nutrition)
                .favoriteRecipeShortlist(favoriteShortlist)
                .build();
    }

    private RecipeSummaryDto toSummary(Recipe recipe) {
        return RecipeSummaryDto.builder()
                .recipeId(recipe.getRecipeId())
                .recipeTitle(recipe.getRecipeTitle())
                .recipeCategory(recipe.getRecipeCategory())
                .cookingDurationMinutes(recipe.getCookingDurationMinutes())
                .recipeImagePath(recipe.getRecipeImagePath())
                .build();
    }
}
