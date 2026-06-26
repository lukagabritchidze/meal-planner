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
import org.springframework.web.bind.annotation.RequestHeader;
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
     * Retrieves the authenticated user's holidays sorted by date ascending.
     *
     * @param userId owning user's identifier (from the X-User-Id header)
     * @return the user's holidays
     */
    @GetMapping
    public ResponseEntity<List<Holiday>> getAllHolidays(@RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(holidayRepository.findByUserIdOrderByDateAsc(userId));
    }

    /**
     * Retrieves the authenticated user's holidays whose dates are inside a range.
     *
     * @param userId owning user's identifier (from the X-User-Id header)
     * @param startDate inclusive start date
     * @param endDate inclusive end date
     * @return matching holidays
     */
    @GetMapping("/range")
    public ResponseEntity<List<Holiday>> getHolidaysInRange(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam("startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam("endDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(holidayRepository.findByUserIdAndDateBetweenOrderByDateAsc(userId, startDate, endDate));
    }

    /**
     * Retrieves a single holiday (owned by the user) with its planned meals.
     *
     * @param userId owning user's identifier (from the X-User-Id header)
     * @param holidayId holiday identifier
     * @return holiday if found and owned by the user, otherwise 404
     */
    @GetMapping("/{holidayId}")
    public ResponseEntity<Holiday> getHolidayById(@RequestHeader("X-User-Id") Long userId,
                                                  @PathVariable Long holidayId) {
        return holidayRepository.findById(holidayId)
                .filter(holiday -> userId.equals(holiday.getUserId()))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Creates a holiday owned by the authenticated user.
     *
     * @param userId owning user's identifier (from the X-User-Id header)
     * @param request holiday request payload
     * @return created holiday
     */
    @PostMapping
    public ResponseEntity<Holiday> createHoliday(@RequestHeader("X-User-Id") Long userId,
                                                 @RequestBody HolidayRequest request) {
        if (request.getName() == null || request.getName().trim().isEmpty() || request.getDate() == null) {
            return ResponseEntity.badRequest().build();
        }

        Holiday holiday = Holiday.builder()
                .userId(userId)
                .name(request.getName().trim())
                .date(request.getDate())
                .emoji(request.getEmoji())
                .color(request.getColor())
                .build();

        return ResponseEntity.status(HttpStatus.CREATED).body(holidayRepository.save(holiday));
    }

    /**
     * Updates an existing holiday owned by the authenticated user.
     *
     * @param userId owning user's identifier (from the X-User-Id header)
     * @param holidayId holiday identifier
     * @param request holiday request payload
     * @return updated holiday if found and owned by the user, otherwise 404
     */
    @PutMapping("/{holidayId}")
    public ResponseEntity<Holiday> updateHoliday(@RequestHeader("X-User-Id") Long userId,
                                                 @PathVariable Long holidayId,
                                                 @RequestBody HolidayRequest request) {
        return holidayRepository.findById(holidayId)
                .filter(holiday -> userId.equals(holiday.getUserId()))
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
     * Deletes a holiday (owned by the user) and all its holiday meal plans via cascade.
     *
     * @param userId owning user's identifier (from the X-User-Id header)
     * @param holidayId holiday identifier
     * @return no-content response if deleted, otherwise 404
     */
    @DeleteMapping("/{holidayId}")
    public ResponseEntity<Void> deleteHoliday(@RequestHeader("X-User-Id") Long userId,
                                              @PathVariable Long holidayId) {
        boolean ownedByUser = holidayRepository.findById(holidayId)
                .filter(holiday -> userId.equals(holiday.getUserId()))
                .isPresent();
        if (!ownedByUser) {
            return ResponseEntity.notFound().build();
        }
        holidayRepository.deleteById(holidayId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Assigns a recipe to a meal slot on a holiday owned by the authenticated user.
     *
     * @param userId owning user's identifier (from the X-User-Id header)
     * @param holidayId holiday identifier
     * @param request meal assignment request
     * @return created holiday meal plan
     */
    @PostMapping("/{holidayId}/meals")
    public ResponseEntity<HolidayMealPlan> addHolidayMeal(@RequestHeader("X-User-Id") Long userId,
                                                          @PathVariable Long holidayId,
                                                          @RequestBody HolidayMealRequest request) {
        if (request.getRecipeId() == null || request.getSlot() == null || request.getSlot().trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        return holidayRepository.findById(holidayId)
                .filter(holiday -> userId.equals(holiday.getUserId()))
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
     * Removes a single meal plan from a holiday owned by the authenticated user.
     *
     * @param userId owning user's identifier (from the X-User-Id header)
     * @param holidayId holiday identifier
     * @param mealId meal plan identifier
     * @return no-content response if deleted, otherwise 404
     */
    @DeleteMapping("/{holidayId}/meals/{mealId}")
    public ResponseEntity<Void> deleteHolidayMeal(@RequestHeader("X-User-Id") Long userId,
                                                  @PathVariable Long holidayId,
                                                  @PathVariable Long mealId) {
        boolean ownsHoliday = holidayRepository.findById(holidayId)
                .filter(holiday -> userId.equals(holiday.getUserId()))
                .isPresent();
        if (!ownsHoliday || !holidayMealPlanRepository.existsByHolidayMealPlanIdAndHolidayHolidayId(mealId, holidayId)) {
            return ResponseEntity.notFound().build();
        }
        holidayMealPlanRepository.deleteById(mealId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Generates a holiday-scoped metric shopping list for a holiday owned by the user.
     *
     * @param userId owning user's identifier (from the X-User-Id header)
     * @param holidayId holiday identifier
     * @return department-grouped shopping list for the holiday's meals
     */
    @GetMapping("/{holidayId}/shopping-list")
    public ResponseEntity<Map<String, List<ShoppingListItem>>> getHolidayShoppingList(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long holidayId) {
        boolean ownsHoliday = holidayRepository.findById(holidayId)
                .filter(holiday -> userId.equals(holiday.getUserId()))
                .isPresent();
        if (!ownsHoliday) {
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
