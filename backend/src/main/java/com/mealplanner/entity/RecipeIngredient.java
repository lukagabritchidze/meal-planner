package com.mealplanner.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "recipe_ingredient")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecipeIngredient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "recipe_ingredient_id")
    private Long recipeIngredientId;

    @Column(name = "ingredient_name", nullable = false)
    private String ingredientName;

    @Column(name = "ingredient_quantity_value", nullable = false)
    private Double ingredientQuantityValue;

    @Column(name = "ingredient_quantity_unit", nullable = false)
    private String ingredientQuantityUnit;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipe_id")
    @JsonIgnore
    private Recipe recipe;
}
