package com.mealplanner.controller;

import com.mealplanner.entity.Recipe;
import com.mealplanner.service.RecipeManagementService;
import com.mealplanner.service.SpoonacularRecipeIntegrationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recipes")
public class RecipeRestController {

    private final RecipeManagementService recipeManagementService;
    private final SpoonacularRecipeIntegrationService spoonacularRecipeIntegrationService;

    @Autowired
    public RecipeRestController(RecipeManagementService recipeManagementService,
                                SpoonacularRecipeIntegrationService spoonacularRecipeIntegrationService) {
        this.recipeManagementService = recipeManagementService;
        this.spoonacularRecipeIntegrationService = spoonacularRecipeIntegrationService;
    }

    /**
     * Searches recipes from Spoonacular and local DB using keyword and category filters.
     */
    @GetMapping("/search")
    public ResponseEntity<List<Recipe>> searchRecipes(
            @RequestParam(value = "query", required = false) String query,
            @RequestParam(value = "category", required = false) String category) {
        List<Recipe> results = spoonacularRecipeIntegrationService.searchRecipes(query, category);
        return ResponseEntity.ok(results);
    }

    /**
     * Searches recipes based on matching ingredients.
     */
    @GetMapping("/search/ingredients")
    public ResponseEntity<List<Recipe>> searchRecipesByIngredients(
            @RequestParam("ingredients") List<String> ingredients) {
        List<Recipe> results = spoonacularRecipeIntegrationService.searchRecipesByIngredients(ingredients);
        return ResponseEntity.ok(results);
    }

    /**
     * Searches holiday collections from Spoonacular.
     */
    @GetMapping("/search/holiday")
    public ResponseEntity<List<Recipe>> searchRecipesByHoliday(
            @RequestParam("holidayName") String holidayName) {
        List<Recipe> results = spoonacularRecipeIntegrationService.searchRecipesByHoliday(holidayName);
        return ResponseEntity.ok(results);
    }

    /**
     * Fetches a list of all available recipes, optionally filtered by category.
     *
     * @param recipeCategory optional category string for filtering
     * @return response entity containing the list of recipes
     */
    @GetMapping
    public ResponseEntity<List<Recipe>> fetchAllRecipes(
            @RequestParam(value = "category", required = false) String recipeCategory) {
        
        List<Recipe> recipesList;
        if (recipeCategory != null && !recipeCategory.trim().isEmpty()) {
            recipesList = recipeManagementService.fetchRecipesByCategory(recipeCategory);
        } else {
            recipesList = recipeManagementService.fetchAllRecipes();
        }
        return ResponseEntity.ok(recipesList);
    }

    /**
     * Fetches details of a single recipe by its primary identifier.
     *
     * @param recipeId the ID of the recipe
     * @return response entity with recipe if found, otherwise 404
     */
    @GetMapping("/{recipeId}")
    public ResponseEntity<Recipe> fetchRecipeDetailsById(@PathVariable Long recipeId) {
        return recipeManagementService.fetchRecipeDetailsById(recipeId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Fetches a recipe with ingredient amounts scaled to the requested servings
     * and converted to simplified metric units.
     *
     * @param recipeId the ID of the recipe
     * @param servings requested number of servings
     * @return response entity with scaled recipe if found, otherwise 404
     */
    @GetMapping("/{recipeId}/scaled")
    public ResponseEntity<Recipe> fetchScaledRecipeDetailsById(
            @PathVariable Long recipeId,
            @RequestParam("servings") Integer servings) {
        return recipeManagementService.fetchScaledRecipeById(recipeId, servings)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Creates and saves a new manual recipe into the database.
     *
     * @param recipe the Recipe entity payload
     * @return response entity containing the saved recipe resource
     */
    @PostMapping
    public ResponseEntity<Recipe> createNewManualRecipe(@RequestBody Recipe recipe) {
        if (recipe.getRecipeTitle() == null || recipe.getRecipeTitle().trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        Recipe createdRecipe = recipeManagementService.createNewManualRecipe(recipe);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdRecipe);
    }

    /**
     * Deletes a recipe from the database.
     *
     * @param recipeId the recipe ID to delete
     * @return response entity signaling execution
     */
    @DeleteMapping("/{recipeId}")
    public ResponseEntity<Void> deleteRecipeById(@PathVariable Long recipeId) {
        if (recipeManagementService.fetchRecipeDetailsById(recipeId).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        recipeManagementService.deleteRecipeById(recipeId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Toggles the favorited status of a recipe.
     *
     * @param recipeId the recipe ID to toggle
     * @return response entity containing the updated recipe
     */
    @PutMapping("/{recipeId}/toggle-favorite")
    public ResponseEntity<Recipe> toggleRecipeFavoriteStatus(@PathVariable Long recipeId) {
        return recipeManagementService.fetchRecipeDetailsById(recipeId)
                .map(recipe -> {
                    recipe.setIsFavorited(!recipe.getIsFavorited());
                    Recipe updatedRecipe = recipeManagementService.createNewManualRecipe(recipe);
                    return ResponseEntity.ok(updatedRecipe);
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
