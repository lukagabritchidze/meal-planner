package com.mealplanner.controller;

import com.mealplanner.dto.ShoppingListItem;
import com.mealplanner.entity.Holiday;
import com.mealplanner.entity.HolidayMealPlan;
import com.mealplanner.entity.Recipe;
import com.mealplanner.entity.RecipeIngredient;
import com.mealplanner.repository.HolidayMealPlanRepository;
import com.mealplanner.repository.HolidayRepository;
import com.mealplanner.repository.RecipeRepository;
import com.mealplanner.service.ShoppingListService;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/holidays")
public class HolidayController {

    private final HolidayRepository holidayRepository;
    private final HolidayMealPlanRepository holidayMealPlanRepository;
    private final RecipeRepository recipeRepository;
    private final ShoppingListService shoppingListService;

    @Autowired
    public HolidayController(HolidayRepository holidayRepository,
                             HolidayMealPlanRepository holidayMealPlanRepository,
                             RecipeRepository recipeRepository,
                             ShoppingListService shoppingListService) {
        this.holidayRepository = holidayRepository;
        this.holidayMealPlanRepository = holidayMealPlanRepository;
        this.recipeRepository = recipeRepository;
        this.shoppingListService = shoppingListService;
    }

    /**
     * Retrieves all holidays sorted by date ascending.
     *
     * @return all holidays
     */
    @GetMapping
    public ResponseEntity<List<Holiday>> getAllHolidays() {
        return ResponseEntity.ok(holidayRepository.findAllByOrderByDateAsc());
    }

    /**
     * Retrieves all holidays whose dates are inside a range.
     *
     * @param startDate inclusive start date
     * @param endDate inclusive end date
     * @return matching holidays
     */
    @GetMapping("/range")
    public ResponseEntity<List<Holiday>> getHolidaysInRange(
            @RequestParam("startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam("endDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(holidayRepository.findByDateBetweenOrderByDateAsc(startDate, endDate));
    }

    /**
     * Retrieves a single holiday with its planned meals.
     *
     * @param holidayId holiday identifier
     * @return holiday if found, otherwise 404
     */
    @GetMapping("/{holidayId}")
    public ResponseEntity<Holiday> getHolidayById(@PathVariable Long holidayId) {
        return holidayRepository.findById(holidayId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Creates a holiday.
     *
     * @param request holiday request payload
     * @return created holiday
     */
    @PostMapping
    public ResponseEntity<Holiday> createHoliday(@RequestBody HolidayRequest request) {
        if (request.getName() == null || request.getName().trim().isEmpty() || request.getDate() == null) {
            return ResponseEntity.badRequest().build();
        }

        Holiday holiday = Holiday.builder()
                .name(request.getName().trim())
                .date(request.getDate())
                .emoji(request.getEmoji())
                .color(request.getColor())
                .build();

        return ResponseEntity.status(HttpStatus.CREATED).body(holidayRepository.save(holiday));
    }

    /**
     * Updates an existing holiday.
     *
     * @param holidayId holiday identifier
     * @param request holiday request payload
     * @return updated holiday if found, otherwise 404
     */
    @PutMapping("/{holidayId}")
    public ResponseEntity<Holiday> updateHoliday(@PathVariable Long holidayId, @RequestBody HolidayRequest request) {
        return holidayRepository.findById(holidayId)
                .map(holiday -> {
                    if (request.getName() != null && !request.getName().trim().isEmpty()) {
                        holiday.setName(request.getName().trim());
                    }
                    if (request.getDate() != null) {
                        holiday.setDate(request.getDate());
                    }
                    holiday.setEmoji(request.getEmoji());
                    holiday.setColor(request.getColor());
                    return ResponseEntity.ok(holidayRepository.save(holiday));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Deletes a holiday and all holiday meal plans via cascade.
     *
     * @param holidayId holiday identifier
     * @return no-content response if deleted, otherwise 404
     */
    @DeleteMapping("/{holidayId}")
    public ResponseEntity<Void> deleteHoliday(@PathVariable Long holidayId) {
        if (!holidayRepository.existsById(holidayId)) {
            return ResponseEntity.notFound().build();
        }
        holidayRepository.deleteById(holidayId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Assigns a recipe to a holiday meal slot.
     *
     * @param holidayId holiday identifier
     * @param request meal assignment request
     * @return created holiday meal plan
     */
    @PostMapping("/{holidayId}/meals")
    public ResponseEntity<HolidayMealPlan> addHolidayMeal(@PathVariable Long holidayId,
                                                          @RequestBody HolidayMealRequest request) {
        if (request.getRecipeId() == null || request.getSlot() == null || request.getSlot().trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        return holidayRepository.findById(holidayId)
                .flatMap(holiday -> recipeRepository.findById(request.getRecipeId())
                        .map(recipe -> {
                            holidayMealPlanRepository.deleteAll(
                                    holidayMealPlanRepository.findByHolidayHolidayIdAndSlotIgnoreCase(holidayId, request.getSlot().trim())
                            );
                            HolidayMealPlan mealPlan = HolidayMealPlan.builder()
                                    .holiday(holiday)
                                    .recipe(recipe)
                                    .slot(request.getSlot().trim())
                                    .servings(request.getServings())
                                    .build();
                            return ResponseEntity.status(HttpStatus.CREATED).body(holidayMealPlanRepository.save(mealPlan));
                        }))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Removes a single holiday meal plan.
     *
     * @param holidayId holiday identifier
     * @param mealId meal plan identifier
     * @return no-content response if deleted, otherwise 404
     */
    @DeleteMapping("/{holidayId}/meals/{mealId}")
    public ResponseEntity<Void> deleteHolidayMeal(@PathVariable Long holidayId, @PathVariable Long mealId) {
        if (!holidayMealPlanRepository.existsByHolidayMealPlanIdAndHolidayHolidayId(mealId, holidayId)) {
            return ResponseEntity.notFound().build();
        }
        holidayMealPlanRepository.deleteById(mealId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Generates a holiday-scoped metric shopping list.
     *
     * @param holidayId holiday identifier
     * @return department-grouped shopping list for the holiday's meals
     */
    @GetMapping("/{holidayId}/shopping-list")
    public ResponseEntity<Map<String, List<ShoppingListItem>>> getHolidayShoppingList(@PathVariable Long holidayId) {
        if (!holidayRepository.existsById(holidayId)) {
            return ResponseEntity.notFound().build();
        }

        List<RecipeIngredient> scaledIngredients = new ArrayList<>();
        for (HolidayMealPlan mealPlan : holidayMealPlanRepository.findByHolidayHolidayId(holidayId)) {
            Recipe recipe = mealPlan.getRecipe();
            if (recipe == null || recipe.getRecipeIngredients() == null) {
                continue;
            }
            int defaultServings = recipe.getDefaultServings() == null || recipe.getDefaultServings() < 1
                    ? 4
                    : recipe.getDefaultServings();
            int requestedServings = mealPlan.getServings() == null || mealPlan.getServings() < 1
                    ? defaultServings
                    : mealPlan.getServings();
            double factor = (double) requestedServings / defaultServings;

            for (RecipeIngredient ingredient : recipe.getRecipeIngredients()) {
                scaledIngredients.add(RecipeIngredient.builder()
                        .recipeIngredientId(ingredient.getRecipeIngredientId())
                        .ingredientName(ingredient.getIngredientName())
                        .ingredientQuantityValue((ingredient.getIngredientQuantityValue() == null ? 0.0 : ingredient.getIngredientQuantityValue()) * factor)
                        .ingredientQuantityUnit(ingredient.getIngredientQuantityUnit())
                        .build());
            }
        }

        return ResponseEntity.ok(shoppingListService.aggregateIngredients(scaledIngredients));
    }

    @Data
    public static class HolidayRequest {
        private String name;
        private LocalDate date;
        private String emoji;
        private String color;
    }

    @Data
    public static class HolidayMealRequest {
        private Long recipeId;
        private String slot;
        private Integer servings;
    }
}
