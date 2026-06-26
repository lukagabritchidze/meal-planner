package com.mealplanner.repository;

import com.mealplanner.entity.Recipe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RecipeRepository extends JpaRepository<Recipe, Long> {
    
    /**
     * Finds all recipes belonging to a specific category, ignoring character case.
     *
     * @param recipeCategory the category string
     * @return list of matching recipes
     */
    List<Recipe> findRecipesByRecipeCategoryIgnoreCase(String recipeCategory);

    /**
     * Finds a recipe by its Spoonacular ID.
     */
    java.util.Optional<Recipe> findBySpoonacularId(Long spoonacularId);

    /**
     * Finds distinct recipes whose ingredients contain the specified string.
     */
    List<Recipe> findDistinctByRecipeIngredientsIngredientNameContainingIgnoreCase(String ingredientName);
}
