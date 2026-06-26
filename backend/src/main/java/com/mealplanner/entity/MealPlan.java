package com.mealplanner.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import org.hibernate.annotations.ColumnDefault;

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

    /**
     * Identifier of the user who owns this planned meal. Every meal plan is private
     * to a single user so that planners are never shared across accounts.
     */
    @Column(name = "user_id", nullable = false)
    @ColumnDefault("1")
    private Long userId;

    @Column(name = "planned_date", nullable = false)
    private LocalDate plannedDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "meal_slot_type", nullable = false)
    private MealSlotType mealSlotType;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "recipe_id", nullable = false)
    private Recipe recipe;
}
