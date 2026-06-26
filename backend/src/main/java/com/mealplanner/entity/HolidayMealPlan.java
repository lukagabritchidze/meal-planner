package com.mealplanner.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "holiday_meal_plans")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HolidayMealPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "holiday_meal_plan_id")
    private Long holidayMealPlanId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "holiday_id", nullable = false)
    @JsonIgnore
    private Holiday holiday;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "recipe_id", nullable = false)
    private Recipe recipe;

    @Column(nullable = false)
    private String slot;

    @Column
    private Integer servings;
}
