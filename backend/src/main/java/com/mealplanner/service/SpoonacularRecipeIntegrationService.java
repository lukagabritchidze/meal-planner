package com.mealplanner.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.mealplanner.entity.Recipe;
import com.mealplanner.entity.RecipeIngredient;
import com.mealplanner.entity.RecipeInstructionStep;
import com.mealplanner.repository.RecipeRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Integrates with the external Spoonacular recipe API.
 *
 * <p>Each search method queries Spoonacular, converts the returned JSON into local
 * {@link Recipe} entities (persisting new ones so they can be planned and favourited),
 * and merges in any matching user-created "manual" recipes. When the remote call fails,
 * every method degrades gracefully to a local-database search so the app stays usable
 * offline / without API quota.</p>
 */
@Service
@Transactional
public class SpoonacularRecipeIntegrationService {

    private static final Logger log = LoggerFactory.getLogger(SpoonacularRecipeIntegrationService.class);

    /** Maximum number of recipes to request from Spoonacular per search. */
    private static final int MAX_SEARCH_RESULTS = 12;

    /** Cooking duration (minutes) assumed when Spoonacular does not provide one. */
    private static final int DEFAULT_COOKING_MINUTES = 30;

    private final RecipeRepository recipeRepository;
    private final RestTemplate restTemplate;

    // The API key is read from the SPOONACULAR_API_KEY environment variable so the secret
    // is not hard-coded in the repository. The fallback only exists for local development.
    private final String apiKey = System.getenv().getOrDefault("SPOONACULAR_API_KEY", "9d3c01194f0749b2b7a0c4cc8ecbe76b");
    private final String apiBaseUrl = "https://api.spoonacular.com";

    @Autowired
    public SpoonacularRecipeIntegrationService(RecipeRepository recipeRepository) {
        this.recipeRepository = recipeRepository;
        this.restTemplate = new RestTemplate();
    }

    /**
     * Searches for recipes by keyword and category from Spoonacular, saving new recipes locally.
     * Combines results with matching manual user-created recipes.
     */
    public List<Recipe> searchRecipes(String query, String category) {
        List<Recipe> results = new ArrayList<>();
        try {
            String url = apiBaseUrl + "/recipes/complexSearch?apiKey=" + apiKey 
                       + "&addRecipeInformation=true&fillIngredients=true&number=" + MAX_SEARCH_RESULTS;
            
            if (query != null && !query.trim().isEmpty()) {
                url += "&query=" + URLEncoder.encode(query, StandardCharsets.UTF_8);
            }
            if (category != null && !category.trim().isEmpty() && !"All".equalsIgnoreCase(category)) {
                // Spoonacular has type parameters (e.g. main course, breakfast)
                String mappedType = category;
                if ("Poultry".equalsIgnoreCase(category)) {
                    mappedType = "main course"; // or we can use query = chicken
                } else if ("Beef".equalsIgnoreCase(category)) {
                    mappedType = "main course";
                }
                url += "&type=" + URLEncoder.encode(mappedType.toLowerCase(), StandardCharsets.UTF_8);
            }

            ResponseEntity<JsonNode> response = restTemplate.getForEntity(url, JsonNode.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode resultsNode = response.getBody().get("results");
                if (resultsNode != null && resultsNode.isArray()) {
                    for (JsonNode recipeNode : resultsNode) {
                        Recipe recipe = saveOrGetSpoonacularRecipe(recipeNode, null);
                        results.add(recipe);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to query Spoonacular complexSearch: {}", e.getMessage());
            return fetchRecipesFromLocalDatabase(query, category);
        }

        // Merge manual user recipes matching the query
        return mergeWithLocalManualRecipes(results, query, category);
    }

    /**
     * Searches for recipes matching a list of ingredients.
     */
    public List<Recipe> searchRecipesByIngredients(List<String> ingredients) {
        if (ingredients == null || ingredients.isEmpty()) {
            return recipeRepository.findAll();
        }

        List<Recipe> results = new ArrayList<>();
        try {
            String commaSeparated = ingredients.stream()
                    .map(ingredientName -> URLEncoder.encode(ingredientName.trim(), StandardCharsets.UTF_8))
                    .collect(Collectors.joining(","));
            
            String url = apiBaseUrl + "/recipes/findByIngredients?apiKey=" + apiKey 
                       + "&ingredients=" + commaSeparated + "&number=" + MAX_SEARCH_RESULTS;

            ResponseEntity<JsonNode> response = restTemplate.getForEntity(url, JsonNode.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null && response.getBody().isArray()) {
                List<Long> idsToFetch = new ArrayList<>();
                for (JsonNode node : response.getBody()) {
                    long spoonId = node.get("id").asLong();
                    Optional<Recipe> existing = recipeRepository.findBySpoonacularId(spoonId);
                    if (existing.isPresent()) {
                        results.add(existing.get());
                    } else {
                        idsToFetch.add(spoonId);
                    }
                }

                // If we need to fetch details for new recipes, fetch them in bulk
                if (!idsToFetch.isEmpty()) {
                    String idsJoined = idsToFetch.stream().map(String::valueOf).collect(Collectors.joining(","));
                    String bulkUrl = apiBaseUrl + "/recipes/informationBulk?apiKey=" + apiKey 
                                   + "&ids=" + idsJoined + "&includeNutrition=false";

                    ResponseEntity<JsonNode> bulkResponse = restTemplate.getForEntity(bulkUrl, JsonNode.class);
                    if (bulkResponse.getStatusCode().is2xxSuccessful() && bulkResponse.getBody() != null && bulkResponse.getBody().isArray()) {
                        for (JsonNode recipeNode : bulkResponse.getBody()) {
                            Recipe recipe = saveOrGetSpoonacularRecipe(recipeNode, null);
                            results.add(recipe);
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to query Spoonacular findByIngredients: {}", e.getMessage());
            // Fall back to local search
            return fetchRecipesByIngredientsLocal(ingredients);
        }

        // Merge in manually-created recipes that also match these ingredients, skipping
        // any whose title already appears in the Spoonacular results (avoids duplicates).
        List<Recipe> manualMatches = fetchRecipesByIngredientsLocal(ingredients).stream()
                .filter(recipe -> recipe.getSpoonacularId() == null)
                .toList();
        
        for (Recipe manualRecipe : manualMatches) {
            boolean alreadyListed = results.stream()
                    .anyMatch(existing -> existing.getRecipeTitle().equalsIgnoreCase(manualRecipe.getRecipeTitle()));
            if (!alreadyListed) {
                results.add(manualRecipe);
            }
        }

        // Enforce strict AND logic: every requested ingredient must be present in the recipe
        return results.stream().filter(recipe -> {
            for (String reqIng : ingredients) {
                String reqLower = reqIng.trim().toLowerCase();
                boolean hasIng = recipe.getRecipeIngredients().stream()
                        .anyMatch(ri -> ri.getIngredientName().toLowerCase().contains(reqLower));
                if (!hasIng) {
                    return false;
                }
            }
            return true;
        }).collect(Collectors.toList());
    }

    /**
     * Searches for recipes by a holiday tag.
     */
    public List<Recipe> searchRecipesByHoliday(String holidayName) {
        List<Recipe> results = new ArrayList<>();
        try {
            String url = apiBaseUrl + "/recipes/complexSearch?apiKey=" + apiKey 
                       + "&addRecipeInformation=true&fillIngredients=true&number=" + MAX_SEARCH_RESULTS;
            
            // Map common holiday names to dedicated query/cuisine tags for better matches.
            if ("Christmas".equalsIgnoreCase(holidayName)) {
                url += "&query=christmas&cuisine=european";
            } else if ("Easter".equalsIgnoreCase(holidayName)) {
                url += "&query=easter";
            } else if ("Thanksgiving".equalsIgnoreCase(holidayName)) {
                url += "&query=thanksgiving";
            } else {
                url += "&query=" + URLEncoder.encode(holidayName, StandardCharsets.UTF_8);
            }

            ResponseEntity<JsonNode> response = restTemplate.getForEntity(url, JsonNode.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode resultsNode = response.getBody().get("results");
                if (resultsNode != null && resultsNode.isArray()) {
                    for (JsonNode recipeNode : resultsNode) {
                        Recipe recipe = saveOrGetSpoonacularRecipe(recipeNode, holidayName);
                        results.add(recipe);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to query Spoonacular holiday search: {}", e.getMessage());
            // Fall back to local holiday matching
            return recipeRepository.findAll().stream()
                    .filter(recipe -> holidayName.equalsIgnoreCase(recipe.getAssociatedHolidayTag()))
                    .collect(Collectors.toList());
        }

        // Merge in manually-created recipes tagged with this holiday, skipping titles
        // already present in the Spoonacular results.
        List<Recipe> manualMatches = recipeRepository.findAll().stream()
                .filter(recipe -> recipe.getSpoonacularId() == null && holidayName.equalsIgnoreCase(recipe.getAssociatedHolidayTag()))
                .toList();

        for (Recipe manualRecipe : manualMatches) {
            boolean alreadyListed = results.stream()
                    .anyMatch(existing -> existing.getRecipeTitle().equalsIgnoreCase(manualRecipe.getRecipeTitle()));
            if (!alreadyListed) {
                results.add(manualRecipe);
            }
        }

        return results;
    }

    /**
     * Parses a single Spoonacular recipe JSON node, constructs a local Recipe entity with
     * allergen warnings and holiday tags, and saves it in the database.
     */
    public Recipe saveOrGetSpoonacularRecipe(JsonNode recipeNode, String holidayTag) {
        long spoonId = recipeNode.get("id").asLong();
        Optional<Recipe> existingRecipe = recipeRepository.findBySpoonacularId(spoonId);
        
        if (existingRecipe.isPresent()) {
            Recipe recipe = existingRecipe.get();
            // If a holiday tag is newly provided, update it
            if (holidayTag != null && !"None".equalsIgnoreCase(holidayTag) && 
                (recipe.getAssociatedHolidayTag() == null || "None".equalsIgnoreCase(recipe.getAssociatedHolidayTag()))) {
                recipe.setAssociatedHolidayTag(holidayTag);
                return recipeRepository.save(recipe);
            }
            return recipe;
        }

        String title = recipeNode.get("title").asText();
        String imagePath = recipeNode.has("image") && !recipeNode.get("image").isNull() 
                ? recipeNode.get("image").asText() 
                : "";
        int cookingDuration = recipeNode.has("readyInMinutes")
                ? recipeNode.get("readyInMinutes").asInt(DEFAULT_COOKING_MINUTES)
                : DEFAULT_COOKING_MINUTES;
        
        // Derive our single category from Spoonacular's list of dish types. We take the
        // first dish type that maps to one of our categories (meal slots win over course
        // types), then stop, so e.g. a "breakfast, main course" recipe is filed as Breakfast.
        String category = "Other";
        if (recipeNode.has("dishTypes") && recipeNode.get("dishTypes").isArray()) {
            for (JsonNode typeNode : recipeNode.get("dishTypes")) {
                String type = typeNode.asText().toLowerCase();
                if (type.contains("breakfast")) {
                    category = "Breakfast";
                    break;
                } else if (type.contains("lunch")) {
                    category = "Lunch";
                    break;
                } else if (type.contains("dinner") || type.contains("main course") || type.contains("main dish")) {
                    category = "Dinner";
                    break;
                } else if (type.contains("salad") || type.contains("soup") || type.contains("appetizer") || type.contains("starter")) {
                    category = "Appetizer";
                    break;
                } else if (type.contains("dessert") || type.contains("sweet")) {
                    category = "Dessert";
                    break;
                }
            }
        }

        // Allergen boolean mapping
        boolean isGlutenFree = recipeNode.has("glutenFree") && recipeNode.get("glutenFree").asBoolean(false);
        boolean isDairyFree = recipeNode.has("dairyFree") && recipeNode.get("dairyFree").asBoolean(false);
        boolean isVegetarian = recipeNode.has("vegetarian") && recipeNode.get("vegetarian").asBoolean(false);
        boolean isVegan = recipeNode.has("vegan") && recipeNode.get("vegan").asBoolean(false);

        Recipe recipe = Recipe.builder()
                .recipeTitle(title)
                .recipeCategory(category)
                .cookingDurationMinutes(cookingDuration)
                .recipeImagePath(imagePath)
                .isGlutenFree(isGlutenFree)
                .isDairyFree(isDairyFree)
                .isVegetarian(isVegetarian)
                .isVegan(isVegan)
                .associatedHolidayTag(holidayTag != null ? holidayTag : "None")
                .spoonacularId(spoonId)
                .recipeIngredients(new ArrayList<>())
                .recipeInstructionSteps(new ArrayList<>())
                .build();

        // Map ingredients
        if (recipeNode.has("extendedIngredients") && recipeNode.get("extendedIngredients").isArray()) {
            for (JsonNode ingredientNode : recipeNode.get("extendedIngredients")) {
                String ingredientName = ingredientNode.get("name").asText();
                double amount = ingredientNode.has("amount") ? ingredientNode.get("amount").asDouble() : 1.0;
                String unit = ingredientNode.has("unit") ? ingredientNode.get("unit").asText("") : "";
                
                RecipeIngredient ingredient = RecipeIngredient.builder()
                        .ingredientName(ingredientName)
                        .ingredientQuantityValue(amount)
                        .ingredientQuantityUnit(unit)
                        .build();
                recipe.addRecipeIngredient(ingredient);
            }
        }

        // Scan ingredients for nut allergies
        boolean isNutFree = checkIsNutFree(recipe.getRecipeIngredients());
        recipe.setIsNutFree(isNutFree);

        // Map structured instruction steps. Spoonacular returns "analyzedInstructions" as a
        // list of instruction groups; index 0 is the main set of steps for the recipe.
        if (recipeNode.has("analyzedInstructions") && recipeNode.get("analyzedInstructions").isArray() && recipeNode.get("analyzedInstructions").size() > 0) {
            JsonNode stepsNode = recipeNode.get("analyzedInstructions").get(0).get("steps");
            if (stepsNode != null && stepsNode.isArray()) {
                for (JsonNode stepNode : stepsNode) {
                    RecipeInstructionStep step = RecipeInstructionStep.builder()
                            .instructionStepOrder(stepNode.get("number").asInt())
                            .instructionStepDescription(stepNode.get("step").asText())
                            .build();
                    recipe.addRecipeInstructionStep(step);
                }
            }
        }

        // Fallback when there are no structured steps: take the free-text "instructions",
        // strip any HTML tags, then split into one step per sentence (on ". ").
        if (recipe.getRecipeInstructionSteps().isEmpty() && recipeNode.has("instructions") && !recipeNode.get("instructions").isNull()) {
            String instructionsText = recipeNode.get("instructions").asText().replaceAll("<[^>]*>", "");
            String[] sentences = instructionsText.split("\\.\\s+");
            int order = 1;
            for (String sentence : sentences) {
                if (!sentence.trim().isEmpty()) {
                    RecipeInstructionStep step = RecipeInstructionStep.builder()
                            .instructionStepOrder(order++)
                            .instructionStepDescription(sentence.trim())
                            .build();
                    recipe.addRecipeInstructionStep(step);
                }
            }
        }

        // Default instruction step if empty
        if (recipe.getRecipeInstructionSteps().isEmpty()) {
            recipe.addRecipeInstructionStep(RecipeInstructionStep.builder()
                    .instructionStepOrder(1)
                    .instructionStepDescription("Follow standard preparation steps for " + title + ".")
                    .build());
        }

        return recipeRepository.save(recipe);
    }

    /**
     * Heuristically determines whether a recipe is nut-free by scanning ingredient names.
     * Returns false as soon as a tree-nut indicator is found.
     */
    private boolean checkIsNutFree(List<RecipeIngredient> ingredients) {
        if (ingredients == null) return true;
        for (RecipeIngredient ingredient : ingredients) {
            String name = ingredient.getIngredientName().toLowerCase();
            // "coconut" contains "nut" but is not a tree nut, so it is explicitly excluded.
            if (name.contains("nut") && !name.contains("coconut")) {
                return false;
            }
            if (name.contains("almond") || name.contains("cashew") || name.contains("pecan") || name.contains("pistachio")) {
                return false;
            }
        }
        return true;
    }

    private List<Recipe> fetchRecipesFromLocalDatabase(String query, String category) {
        List<Recipe> allRecipes = recipeRepository.findAll();
        return allRecipes.stream()
                .filter(recipe -> {
                    boolean matchesQuery = true;
                    if (query != null && !query.trim().isEmpty()) {
                        matchesQuery = recipe.getRecipeTitle().toLowerCase().contains(query.toLowerCase()) ||
                                       (recipe.getRecipeCategory() != null && recipe.getRecipeCategory().toLowerCase().contains(query.toLowerCase()));
                    }
                    boolean matchesCategory = true;
                    if (category != null && !category.trim().isEmpty() && !"All".equalsIgnoreCase(category)) {
                        matchesCategory = category.equalsIgnoreCase(recipe.getRecipeCategory());
                    }
                    return matchesQuery && matchesCategory;
                })
                .collect(Collectors.toList());
    }

    private List<Recipe> fetchRecipesByIngredientsLocal(List<String> ingredients) {
        if (ingredients == null || ingredients.isEmpty()) {
            return new ArrayList<>();
        }
        
        // Start with recipes that match the first ingredient to reduce the dataset
        List<Recipe> matching = new ArrayList<>(recipeRepository.findDistinctByRecipeIngredientsIngredientNameContainingIgnoreCase(ingredients.get(0).trim()));
        
        // Filter to ensure ALL remaining ingredients are present
        return matching.stream().filter(recipe -> {
            for (int i = 1; i < ingredients.size(); i++) {
                String reqLower = ingredients.get(i).trim().toLowerCase();
                boolean hasIng = recipe.getRecipeIngredients().stream()
                        .anyMatch(ri -> ri.getIngredientName().toLowerCase().contains(reqLower));
                if (!hasIng) {
                    return false;
                }
            }
            return true;
        }).collect(Collectors.toList());
    }

    private List<Recipe> mergeWithLocalManualRecipes(List<Recipe> spoonRecipes, String query, String category) {
        List<Recipe> merged = new ArrayList<>(spoonRecipes);
        List<Recipe> manualMatches = recipeRepository.findAll().stream()
                .filter(recipe -> recipe.getSpoonacularId() == null) // manual recipes only
                .filter(recipe -> {
                    boolean matchesQuery = true;
                    if (query != null && !query.trim().isEmpty()) {
                        matchesQuery = recipe.getRecipeTitle().toLowerCase().contains(query.toLowerCase()) ||
                                       (recipe.getRecipeCategory() != null && recipe.getRecipeCategory().toLowerCase().contains(query.toLowerCase()));
                    }
                    boolean matchesCategory = true;
                    if (category != null && !category.trim().isEmpty() && !"All".equalsIgnoreCase(category)) {
                        matchesCategory = category.equalsIgnoreCase(recipe.getRecipeCategory());
                    }
                    return matchesQuery && matchesCategory;
                })
                .toList();

        for (Recipe manualRecipe : manualMatches) {
            boolean alreadyListed = merged.stream()
                    .anyMatch(existing -> existing.getRecipeTitle().equalsIgnoreCase(manualRecipe.getRecipeTitle()));
            if (!alreadyListed) {
                merged.add(manualRecipe);
            }
        }
        return merged;
    }
}
