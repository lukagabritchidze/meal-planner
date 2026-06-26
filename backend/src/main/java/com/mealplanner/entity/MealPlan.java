package com.mealplanner.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "meal_plan")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MealPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "meal_plan_id")
    private Long mealPlanId;

    @Column(name = "planned_date", nullable = false)
    private LocalDate plannedDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "meal_slot_type", nullable = false)
    private MealSlotType mealSlotType;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "recipe_id", nullable = false)
    private Recipe recipe;
}
