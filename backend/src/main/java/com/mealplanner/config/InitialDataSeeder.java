package com.mealplanner.config;

import com.mealplanner.entity.Recipe;
import com.mealplanner.entity.RecipeIngredient;
import com.mealplanner.entity.RecipeInstructionStep;
import com.mealplanner.service.RecipeManagementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.ArrayList;

@Component
public class InitialDataSeeder implements CommandLineRunner {

    private final RecipeManagementService recipeManagementService;

    @Autowired
    public InitialDataSeeder(RecipeManagementService recipeManagementService) {
        this.recipeManagementService = recipeManagementService;
    }

    @Override
    public void run(String... args) throws Exception {
        // Only seed database if it is currently empty to prevent redundant entries
        if (recipeManagementService.fetchAllRecipes().isEmpty()) {
            seedInitialGourmetRecipes();
        }
    }

    private void seedInitialGourmetRecipes() {
        // ==========================================
        // RECIPE 1: Tuscan Garlic Chicken
        // ==========================================
        Recipe recipeOne = Recipe.builder()
                .recipeTitle("Tuscan Garlic Chicken")
                .recipeCategory("Poultry")
                .cookingDurationMinutes(25)
                .recipeImagePath("/chicken_tuscan.png")
                .recipeIngredients(new ArrayList<>())
                .recipeInstructionSteps(new ArrayList<>())
                .build();

        recipeOne.addRecipeIngredient(RecipeIngredient.builder()
                .ingredientName("Chicken Breasts")
                .ingredientQuantityValue(2.0)
                .ingredientQuantityUnit("pcs")
                .build());

        recipeOne.addRecipeIngredient(RecipeIngredient.builder()
                .ingredientName("Garlic Cloves")
                .ingredientQuantityValue(4.0)
                .ingredientQuantityUnit("cloves")
                .build());

        recipeOne.addRecipeIngredient(RecipeIngredient.builder()
                .ingredientName("Heavy Cream")
                .ingredientQuantityValue(1.0)
                .ingredientQuantityUnit("cup")
                .build());

        recipeOne.addRecipeIngredient(RecipeIngredient.builder()
                .ingredientName("Spinach")
                .ingredientQuantityValue(2.0)
                .ingredientQuantityUnit("cups")
                .build());

        recipeOne.addRecipeIngredient(RecipeIngredient.builder()
                .ingredientName("Cherry Tomatoes")
                .ingredientQuantityValue(1.0)
                .ingredientQuantityUnit("cup")
                .build());

        recipeOne.addRecipeInstructionStep(RecipeInstructionStep.builder()
                .instructionStepOrder(1)
                .instructionStepDescription("Season chicken breasts with salt, pepper, and garlic powder on both sides.")
                .build());

        recipeOne.addRecipeInstructionStep(RecipeInstructionStep.builder()
                .instructionStepOrder(2)
                .instructionStepDescription("Sear chicken in a hot skillet with olive oil for 6 minutes per side until golden brown, then remove and set aside.")
                .build());

        recipeOne.addRecipeInstructionStep(RecipeInstructionStep.builder()
                .instructionStepOrder(3)
                .instructionStepDescription("In the same skillet, sauté minced garlic and cherry tomatoes for 2 minutes.")
                .build());

        recipeOne.addRecipeInstructionStep(RecipeInstructionStep.builder()
                .instructionStepOrder(4)
                .instructionStepDescription("Reduce heat, pour in heavy cream, add spinach, and let it simmer until spinach wilt.")
                .build());

        recipeOne.addRecipeInstructionStep(RecipeInstructionStep.builder()
                .instructionStepOrder(5)
                .instructionStepDescription("Return chicken to the skillet, spoon the creamy sauce over top, and serve warm.")
                .build());

        recipeManagementService.createNewManualRecipe(recipeOne);

        // ==========================================
        // RECIPE 2: Creamy Avocado Pasta
        // ==========================================
        Recipe recipeTwo = Recipe.builder()
                .recipeTitle("Creamy Avocado Pasta")
                .recipeCategory("Vegetarian")
                .cookingDurationMinutes(15)
                .recipeImagePath("/avocado_pasta.png")
                .recipeIngredients(new ArrayList<>())
                .recipeInstructionSteps(new ArrayList<>())
                .build();

        recipeTwo.addRecipeIngredient(RecipeIngredient.builder()
                .ingredientName("Spaghetti Pasta")
                .ingredientQuantityValue(250.0)
                .ingredientQuantityUnit("grams")
                .build());

        recipeTwo.addRecipeIngredient(RecipeIngredient.builder()
                .ingredientName("Ripe Avocados")
                .ingredientQuantityValue(2.0)
                .ingredientQuantityUnit("pcs")
                .build());

        recipeTwo.addRecipeIngredient(RecipeIngredient.builder()
                .ingredientName("Olive Oil")
                .ingredientQuantityValue(2.0)
                .ingredientQuantityUnit("tbsp")
                .build());

        recipeTwo.addRecipeIngredient(RecipeIngredient.builder()
                .ingredientName("Lemon Juice")
                .ingredientQuantityValue(1.0)
                .ingredientQuantityUnit("tbsp")
                .build());

        recipeTwo.addRecipeIngredient(RecipeIngredient.builder()
                .ingredientName("Fresh Basil")
                .ingredientQuantityValue(0.5)
                .ingredientQuantityUnit("cup")
                .build());

        recipeTwo.addRecipeInstructionStep(RecipeInstructionStep.builder()
                .instructionStepOrder(1)
                .instructionStepDescription("Boil spaghetti in salted water according to package instructions until al dente.")
                .build());

        recipeTwo.addRecipeInstructionStep(RecipeInstructionStep.builder()
                .instructionStepOrder(2)
                .instructionStepDescription("While pasta cooks, blend avocado flesh, garlic, basil, olive oil, and lemon juice in a food processor until smooth.")
                .build());

        recipeTwo.addRecipeInstructionStep(RecipeInstructionStep.builder()
                .instructionStepOrder(3)
                .instructionStepDescription("Drain pasta, reserving half a cup of warm pasta water.")
                .build());

        recipeTwo.addRecipeInstructionStep(RecipeInstructionStep.builder()
                .instructionStepOrder(4)
                .instructionStepDescription("Toss pasta immediately with the avocado sauce, adding small splashes of pasta water to loosen if needed.")
                .build());

        recipeTwo.addRecipeInstructionStep(RecipeInstructionStep.builder()
                .instructionStepOrder(5)
                .instructionStepDescription("Garnish with cherry tomato halves and cracked black pepper.")
                .build());

        recipeManagementService.createNewManualRecipe(recipeTwo);

        // ==========================================
        // RECIPE 3: Sizzling Beef Tacos
        // ==========================================
        Recipe recipeThree = Recipe.builder()
                .recipeTitle("Sizzling Beef Tacos")
                .recipeCategory("Beef")
                .cookingDurationMinutes(20)
                .recipeImagePath("/beef_tacos.png")
                .recipeIngredients(new ArrayList<>())
                .recipeInstructionSteps(new ArrayList<>())
                .build();

        recipeThree.addRecipeIngredient(RecipeIngredient.builder()
                .ingredientName("Ground Beef")
                .ingredientQuantityValue(400.0)
                .ingredientQuantityUnit("grams")
                .build());

        recipeThree.addRecipeIngredient(RecipeIngredient.builder()
                .ingredientName("Taco Shells")
                .ingredientQuantityValue(6.0)
                .ingredientQuantityUnit("pcs")
                .build());

        recipeThree.addRecipeIngredient(RecipeIngredient.builder()
                .ingredientName("Cheddar Cheese")
                .ingredientQuantityValue(1.0)
                .ingredientQuantityUnit("cup")
                .build());

        recipeThree.addRecipeIngredient(RecipeIngredient.builder()
                .ingredientName("Shredded Lettuce")
                .ingredientQuantityValue(1.5)
                .ingredientQuantityUnit("cups")
                .build());

        recipeThree.addRecipeIngredient(RecipeIngredient.builder()
                .ingredientName("Taco Seasoning")
                .ingredientQuantityValue(1.0)
                .ingredientQuantityUnit("packet")
                .build());

        recipeThree.addRecipeInstructionStep(RecipeInstructionStep.builder()
                .instructionStepOrder(1)
                .instructionStepDescription("Brown ground beef in a skillet over medium-high heat, draining excess fat.")
                .build());

        recipeThree.addRecipeInstructionStep(RecipeInstructionStep.builder()
                .instructionStepOrder(2)
                .instructionStepDescription("Add taco seasoning and a splash of water, simmering for 5 minutes until fully coated.")
                .build());

        recipeThree.addRecipeInstructionStep(RecipeInstructionStep.builder()
                .instructionStepOrder(3)
                .instructionStepDescription("Warm the taco shells in an oven or microwave for 1-2 minutes.")
                .build());

        recipeThree.addRecipeInstructionStep(RecipeInstructionStep.builder()
                .instructionStepOrder(4)
                .instructionStepDescription("Assemble by spooning beef into the warm shells, then layering cheese and shredded lettuce.")
                .build());

        recipeManagementService.createNewManualRecipe(recipeThree);
    }
}
