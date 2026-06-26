package com.mealplanner.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "recipe_instruction_step")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecipeInstructionStep {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "recipe_instruction_step_id")
    private Long recipeInstructionStepId;

    @Column(name = "instruction_step_order", nullable = false)
    private Integer instructionStepOrder;

    @Column(name = "instruction_step_description", nullable = false, length = 1000)
    private String instructionStepDescription;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipe_id")
    @JsonIgnore
    private Recipe recipe;
}
