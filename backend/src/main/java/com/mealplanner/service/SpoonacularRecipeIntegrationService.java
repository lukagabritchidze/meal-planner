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

@Service
@Transactional
public class SpoonacularRecipeIntegrationService {

    private static final Logger log = LoggerFactory.getLogger(SpoonacularRecipeIntegrationService.class);
    
    private final RecipeRepository recipeRepository;
    private final RestTemplate restTemplate;

    private final String apiKey = "9d3c01194f0749b2b7a0c4cc8ecbe76b";
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
                       + "&addRecipeInformation=true&fillIngredients=true&number=12";
            
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
                    .map(ing -> URLEncoder.encode(ing.trim(), StandardCharsets.UTF_8))
                    .collect(Collectors.joining(","));
            
            String url = apiBaseUrl + "/recipes/findByIngredients?apiKey=" + apiKey 
                       + "&ingredients=" + commaSeparated + "&number=12";

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

        // Merge manual user recipes matching ingredients locally
        List<Recipe> manualMatches = fetchRecipesByIngredientsLocal(ingredients).stream()
                .filter(r -> r.getSpoonacularId() == null)
                .toList();
        
        for (Recipe r : manualMatches) {
            if (results.stream().noneMatch(x -> x.getRecipeTitle().equalsIgnoreCase(r.getRecipeTitle()))) {
                results.add(r);
            }
        }

        return results;
    }

    /**
     * Searches for recipes by a holiday tag.
     */
    public List<Recipe> searchRecipesByHoliday(String holidayName) {
        List<Recipe> results = new ArrayList<>();
        try {
            String url = apiBaseUrl + "/recipes/complexSearch?apiKey=" + apiKey 
                       + "&addRecipeInformation=true&fillIngredients=true&number=12";
            
            // Map common holiday names to query tags
            String queryParam = holidayName;
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
            // Fail back to local holiday matching
            return recipeRepository.findAll().stream()
                    .filter(r -> holidayName.equalsIgnoreCase(r.getAssociatedHolidayTag()))
                    .collect(Collectors.toList());
        }

        // Merge manual recipes that might have been marked with this holiday
        List<Recipe> manualMatches = recipeRepository.findAll().stream()
                .filter(r -> r.getSpoonacularId() == null && holidayName.equalsIgnoreCase(r.getAssociatedHolidayTag()))
                .toList();

        for (Recipe r : manualMatches) {
            if (results.stream().noneMatch(x -> x.getRecipeTitle().equalsIgnoreCase(r.getRecipeTitle()))) {
                results.add(r);
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
        int cookingDuration = recipeNode.has("readyInMinutes") ? recipeNode.get("readyInMinutes").asInt(30) : 30;
        
        // Extract category from dishTypes
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
            for (JsonNode ingNode : recipeNode.get("extendedIngredients")) {
                String ingName = ingNode.get("name").asText();
                double amount = ingNode.has("amount") ? ingNode.get("amount").asDouble() : 1.0;
                String unit = ingNode.has("unit") ? ingNode.get("unit").asText("") : "";
                
                RecipeIngredient ingredient = RecipeIngredient.builder()
                        .ingredientName(ingName)
                        .ingredientQuantityValue(amount)
                        .ingredientQuantityUnit(unit)
                        .build();
                recipe.addRecipeIngredient(ingredient);
            }
        }

        // Scan ingredients for nut allergies
        boolean isNutFree = checkIsNutFree(recipe.getRecipeIngredients());
        recipe.setIsNutFree(isNutFree);

        // Map instruction steps
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

        // Fallback for plain text instructions splitting by sentence
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

    private boolean checkIsNutFree(List<RecipeIngredient> ingredients) {
        if (ingredients == null) return true;
        for (RecipeIngredient ing : ingredients) {
            String name = ing.getIngredientName().toLowerCase();
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
        List<Recipe> all = recipeRepository.findAll();
        return all.stream()
                .filter(r -> {
                    boolean matchesQuery = true;
                    if (query != null && !query.trim().isEmpty()) {
                        matchesQuery = r.getRecipeTitle().toLowerCase().contains(query.toLowerCase()) ||
                                       (r.getRecipeCategory() != null && r.getRecipeCategory().toLowerCase().contains(query.toLowerCase()));
                    }
                    boolean matchesCategory = true;
                    if (category != null && !category.trim().isEmpty() && !"All".equalsIgnoreCase(category)) {
                        matchesCategory = category.equalsIgnoreCase(r.getRecipeCategory());
                    }
                    return matchesQuery && matchesCategory;
                })
                .collect(Collectors.toList());
    }

    private List<Recipe> fetchRecipesByIngredientsLocal(List<String> ingredients) {
        List<Recipe> matching = null;
        for (String ingredient : ingredients) {
            List<Recipe> recipes = recipeRepository.findDistinctByRecipeIngredientsIngredientNameContainingIgnoreCase(ingredient.trim());
            if (matching == null) {
                matching = new ArrayList<>(recipes);
            } else {
                matching.retainAll(recipes);
            }
        }
        return matching != null ? matching : new ArrayList<>();
    }

    private List<Recipe> mergeWithLocalManualRecipes(List<Recipe> spoonRecipes, String query, String category) {
        List<Recipe> merged = new ArrayList<>(spoonRecipes);
        List<Recipe> manual = recipeRepository.findAll().stream()
                .filter(r -> r.getSpoonacularId() == null) // manual only
                .filter(r -> {
                    boolean matchesQuery = true;
                    if (query != null && !query.trim().isEmpty()) {
                        matchesQuery = r.getRecipeTitle().toLowerCase().contains(query.toLowerCase()) ||
                                       (r.getRecipeCategory() != null && r.getRecipeCategory().toLowerCase().contains(query.toLowerCase()));
                    }
                    boolean matchesCategory = true;
                    if (category != null && !category.trim().isEmpty() && !"All".equalsIgnoreCase(category)) {
                        matchesCategory = category.equalsIgnoreCase(r.getRecipeCategory());
                    }
                    return matchesQuery && matchesCategory;
                })
                .toList();

        for (Recipe r : manual) {
            if (merged.stream().noneMatch(m -> m.getRecipeTitle().equalsIgnoreCase(r.getRecipeTitle()))) {
                merged.add(r);
            }
        }
        return merged;
    }
}
