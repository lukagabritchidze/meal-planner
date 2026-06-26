package com.mealplanner.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.ColumnDefault;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "recipe")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Recipe {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "recipe_id")
    private Long recipeId;

    @Column(name = "recipe_title", nullable = false)
    private String recipeTitle;

    @Column(name = "recipe_category", nullable = false)
    private String recipeCategory;

    @Column(name = "cooking_duration_minutes", nullable = false)
    private Integer cookingDurationMinutes;

    @Column(name = "default_servings", nullable = false)
    @ColumnDefault("4")
    @Builder.Default
    private Integer defaultServings = 4;

    @Column(name = "is_favorited", nullable = false)
    @Builder.Default
    private Boolean isFavorited = false;

    @Column(name = "recipe_image_path")
    private String recipeImagePath;

    @Column(name = "is_gluten_free", nullable = false)
    @Builder.Default
    private Boolean isGlutenFree = false;

    @Column(name = "is_dairy_free", nullable = false)
    @Builder.Default
    private Boolean isDairyFree = false;

    @Column(name = "is_nut_free", nullable = false)
    @Builder.Default
    private Boolean isNutFree = true;

    @Column(name = "is_vegetarian", nullable = false)
    @Builder.Default
    private Boolean isVegetarian = false;

    @Column(name = "is_vegan", nullable = false)
    @Builder.Default
    private Boolean isVegan = false;

    @Column(name = "associated_holiday_tag")
    @Builder.Default
    private String associatedHolidayTag = "None";

    @Column(name = "spoonacular_id", unique = true)
    private Long spoonacularId;

    @OneToMany(mappedBy = "recipe", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<RecipeIngredient> recipeIngredients = new ArrayList<>();

    @OneToMany(mappedBy = "recipe", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("instructionStepOrder ASC")
    @Builder.Default
    private List<RecipeInstructionStep> recipeInstructionSteps = new ArrayList<>();

    @OneToMany(mappedBy = "recipe", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @JsonIgnore
    private List<MealPlan> mealPlans = new ArrayList<>();

    // Helper methods to maintain bidirectional relationships cleanly
    public void addRecipeIngredient(RecipeIngredient ingredient) {
        recipeIngredients.add(ingredient);
        ingredient.setRecipe(this);
    }

    public void removeRecipeIngredient(RecipeIngredient ingredient) {
        recipeIngredients.remove(ingredient);
        ingredient.setRecipe(null);
    }

    public void addRecipeInstructionStep(RecipeInstructionStep step) {
        recipeInstructionSteps.add(step);
        step.setRecipe(this);
    }

    public void removeRecipeInstructionStep(RecipeInstructionStep step) {
        recipeInstructionSteps.remove(step);
        step.setRecipe(null);
    }
}
