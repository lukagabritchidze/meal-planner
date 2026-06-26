package com.mealplanner.controller;

import com.mealplanner.entity.MealPlan;
import com.mealplanner.entity.MealSlotType;
import com.mealplanner.entity.Recipe;
import com.mealplanner.repository.MealPlanRepository;
import com.mealplanner.repository.RecipeRepository;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/meal-plans")
public class MealSchedulingPlanController {

    private final MealPlanRepository mealPlanRepository;
    private final RecipeRepository recipeRepository;

    @Autowired
    public MealSchedulingPlanController(MealPlanRepository mealPlanRepository, RecipeRepository recipeRepository) {
        this.mealPlanRepository = mealPlanRepository;
        this.recipeRepository = recipeRepository;
    }

    /**
     * Retrieves planned meals scheduled within the specified start and end dates.
     */
    @GetMapping
    public ResponseEntity<List<MealPlan>> fetchMealPlans(
            @RequestParam("startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam("endDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<MealPlan> plans = mealPlanRepository.findByPlannedDateBetween(startDate, endDate);
        return ResponseEntity.ok(plans);
    }

    /**
     * Assigns a recipe to a specific date and meal slot (Breakfast, Lunch, Dinner).
     * Replaces any existing plan in that slot.
     */
    @PostMapping
    public ResponseEntity<MealPlan> addMealPlan(@RequestBody MealPlanRequest request) {
        if (request.getPlannedDate() == null || request.getMealSlotType() == null || request.getRecipeId() == null) {
            return ResponseEntity.badRequest().build();
        }

        Optional<Recipe> recipeOpt = recipeRepository.findById(request.getRecipeId());
        if (recipeOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        MealSlotType slotType;
        try {
            slotType = MealSlotType.valueOf(request.getMealSlotType().toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }

        // Clean up any existing meal plan in the same slot on the same date to prevent duplicates
        List<MealPlan> existingPlansOnDate = mealPlanRepository.findByPlannedDateBetween(request.getPlannedDate(), request.getPlannedDate());
        for (MealPlan plan : existingPlansOnDate) {
            if (plan.getMealSlotType() == slotType) {
                mealPlanRepository.delete(plan);
            }
        }

        MealPlan mealPlan = MealPlan.builder()
                .plannedDate(request.getPlannedDate())
                .mealSlotType(slotType)
                .recipe(recipeOpt.get())
                .build();

        MealPlan savedPlan = mealPlanRepository.save(mealPlan);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedPlan);
    }

    /**
     * Removes a scheduled meal slot.
     */
    @DeleteMapping("/{mealPlanId}")
    public ResponseEntity<Void> deleteMealPlan(@PathVariable Long mealPlanId) {
        if (!mealPlanRepository.existsById(mealPlanId)) {
            return ResponseEntity.notFound().build();
        }
        mealPlanRepository.deleteById(mealPlanId);
        return ResponseEntity.noContent().build();
    }

    @Data
    public static class MealPlanRequest {
        private LocalDate plannedDate;
        private String mealSlotType;
        private Long recipeId;
    }
}
