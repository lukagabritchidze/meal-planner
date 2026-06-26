package com.mealplanner.service;

import com.mealplanner.entity.Recipe;
import com.mealplanner.entity.RecipeIngredient;
import com.mealplanner.entity.RecipeInstructionStep;
import com.mealplanner.repository.RecipeRepository;
import com.mealplanner.util.ConvertedMeasurement;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class RecipeManagementService {

    private final RecipeRepository recipeRepository;
    private final MeasurementConverter measurementConverter;

    @Autowired
    public RecipeManagementService(RecipeRepository recipeRepository, MeasurementConverter measurementConverter) {
        this.recipeRepository = recipeRepository;
        this.measurementConverter = measurementConverter;
    }

    /**
     * Fetches all recipes in the system database.
     *
     * @return list of recipes
     */
    @Transactional(readOnly = true)
    public List<Recipe> fetchAllRecipes() {
        return recipeRepository.findAll();
    }

    /**
     * Fetches details of a single recipe by its primary identifier.
     *
     * @param recipeId the recipe ID
     * @return optional containing the recipe if found, empty otherwise
     */
    @Transactional(readOnly = true)
    public Optional<Recipe> fetchRecipeDetailsById(Long recipeId) {
        return recipeRepository.findById(recipeId);
    }

    /**
     * Creates a new manual recipe in the database, establishing correct entity links.
     *
     * @param recipe the Recipe object to save
     * @return the saved Recipe object
     */
    public Recipe createNewManualRecipe(Recipe recipe) {
        // Enforce bidirectional integrity links before cascading saving
        if (recipe.getRecipeIngredients() != null) {
            recipe.getRecipeIngredients().forEach(ingredient -> ingredient.setRecipe(recipe));
        }
        if (recipe.getRecipeInstructionSteps() != null) {
            recipe.getRecipeInstructionSteps().forEach(step -> step.setRecipe(recipe));
        }
        return recipeRepository.save(recipe);
    }

    /**
     * Deletes a recipe from the database by its ID.
     *
     * @param recipeId the recipe ID to delete
     */
    public void deleteRecipeById(Long recipeId) {
        recipeRepository.deleteById(recipeId);
    }

    /**
     * Filters recipes by category case-insensitively.
     *
     * @param recipeCategory the category filter
     * @return list of recipes matching the category
     */
    @Transactional(readOnly = true)
    public List<Recipe> fetchRecipesByCategory(String recipeCategory) {
        return recipeRepository.findRecipesByRecipeCategoryIgnoreCase(recipeCategory);
    }

    /**
     * Fetches a recipe by ID and returns a detached copy with ingredient amounts
     * scaled to the requested serving count and converted to simplified metric units.
     *
     * @param recipeId the recipe ID
     * @param requestedServings desired serving count
     * @return optional scaled recipe copy if the recipe exists
     */
    @Transactional(readOnly = true)
    public Optional<Recipe> fetchScaledRecipeById(Long recipeId, Integer requestedServings) {
        if (requestedServings == null || requestedServings < 1) {
            requestedServings = 1;
        }

        final int servings = requestedServings;

        return recipeRepository.findById(recipeId)
                .map(recipe -> createScaledRecipeCopy(recipe, servings));
    }

    private Recipe createScaledRecipeCopy(Recipe source, int requestedServings) {
        int baselineServings = source.getDefaultServings() == null || source.getDefaultServings() < 1
                ? 4
                : source.getDefaultServings();
        double scalingFactor = (double) requestedServings / baselineServings;

        Recipe scaledRecipe = Recipe.builder()
                .recipeId(source.getRecipeId())
                .recipeTitle(source.getRecipeTitle())
                .recipeCategory(source.getRecipeCategory())
                .cookingDurationMinutes(source.getCookingDurationMinutes())
                .defaultServings(requestedServings)
                .isFavorited(source.getIsFavorited())
                .recipeImagePath(source.getRecipeImagePath())
                .isGlutenFree(source.getIsGlutenFree())
                .isDairyFree(source.getIsDairyFree())
                .isNutFree(source.getIsNutFree())
                .isVegetarian(source.getIsVegetarian())
                .isVegan(source.getIsVegan())
                .associatedHolidayTag(source.getAssociatedHolidayTag())
                .spoonacularId(source.getSpoonacularId())
                .recipeIngredients(new ArrayList<>())
                .recipeInstructionSteps(new ArrayList<>())
                .build();

        if (source.getRecipeIngredients() != null) {
            for (RecipeIngredient ingredient : source.getRecipeIngredients()) {
                double scaledAmount = (ingredient.getIngredientQuantityValue() == null ? 0.0 : ingredient.getIngredientQuantityValue())
                        * scalingFactor;
                ConvertedMeasurement convertedMeasurement = measurementConverter.convert(
                        scaledAmount,
                        ingredient.getIngredientQuantityUnit()
                );

                scaledRecipe.getRecipeIngredients().add(RecipeIngredient.builder()
                        .recipeIngredientId(ingredient.getRecipeIngredientId())
                        .ingredientName(ingredient.getIngredientName())
                        .ingredientQuantityValue(convertedMeasurement.convertedAmount())
                        .ingredientQuantityUnit(convertedMeasurement.convertedUnit())
                        .build());
            }
        }

        if (source.getRecipeInstructionSteps() != null) {
            for (RecipeInstructionStep step : source.getRecipeInstructionSteps()) {
                scaledRecipe.getRecipeInstructionSteps().add(RecipeInstructionStep.builder()
                        .recipeInstructionStepId(step.getRecipeInstructionStepId())
                        .instructionStepOrder(step.getInstructionStepOrder())
                        .instructionStepDescription(step.getInstructionStepDescription())
                        .build());
            }
        }

        return scaledRecipe;
    }
}
