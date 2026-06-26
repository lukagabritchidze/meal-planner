package com.mealplanner.service;

import com.mealplanner.dto.ShoppingListItem;
import com.mealplanner.entity.MealPlan;
import com.mealplanner.entity.RecipeIngredient;
import com.mealplanner.entity.ShoppingListCheckedState;
import com.mealplanner.repository.MealPlanRepository;
import com.mealplanner.repository.ShoppingListCheckedStateRepository;
import com.mealplanner.util.ConvertedMeasurement;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Builds aggregated, department-grouped shopping lists from scheduled meal plans.
 */
@Service
@Transactional
public class ShoppingListService {

    private static final Logger log = LoggerFactory.getLogger(ShoppingListService.class);

    private static final List<String> DEPARTMENT_ORDER = List.of("Produce", "Dairy", "Meat", "Pantry", "Other");

    private final MealPlanRepository mealPlanRepository;
    private final ShoppingListCheckedStateRepository checkedStateRepository;
    private final MeasurementConverter measurementConverter;
    private final Map<String, List<String>> departmentKeywords;

    @Autowired
    public ShoppingListService(MealPlanRepository mealPlanRepository,
                               ShoppingListCheckedStateRepository checkedStateRepository,
                               MeasurementConverter measurementConverter,
                               Map<String, List<String>> shoppingDepartmentKeywords) {
        this.mealPlanRepository = mealPlanRepository;
        this.checkedStateRepository = checkedStateRepository;
        this.measurementConverter = measurementConverter;
        this.departmentKeywords = shoppingDepartmentKeywords;
    }

    /**
     * Aggregates a user's recipe ingredients from meal plans in the requested date range.
     *
     * @param userId the owning user's identifier
     * @param startDate inclusive start date
     * @param endDate inclusive end date
     * @return department-grouped shopping list items
     */
    @Transactional(readOnly = true)
    public Map<String, List<ShoppingListItem>> getShoppingList(Long userId, LocalDate startDate, LocalDate endDate) {
        List<MealPlan> mealPlans = mealPlanRepository.findByUserIdAndPlannedDateBetweenWithIngredients(
                userId, startDate, endDate);
        Set<Long> checkedIngredientIds = loadCheckedIngredientIds(userId, startDate, endDate);

        Map<String, AggregatedIngredient> aggregation = new LinkedHashMap<>();

        for (MealPlan mealPlan : mealPlans) {
            if (mealPlan.getRecipe() == null || mealPlan.getRecipe().getRecipeIngredients() == null) {
                continue;
            }

            for (RecipeIngredient ingredient : mealPlan.getRecipe().getRecipeIngredients()) {
                if (ingredient.getIngredientName() == null) {
                    continue;
                }

                ConvertedMeasurement converted = measurementConverter.convert(
                        ingredient.getIngredientQuantityValue(),
                        ingredient.getIngredientQuantityUnit()
                );

                String key = createAggregationKey(ingredient.getIngredientName(), converted.convertedUnit());
                AggregatedIngredient existing = aggregation.get(key);
                if (existing == null) {
                    aggregation.put(key, new AggregatedIngredient(
                            ingredient.getRecipeIngredientId(),
                            ingredient.getIngredientName().trim(),
                            converted.convertedAmount() == null ? 0.0 : converted.convertedAmount(),
                            converted.convertedUnit()
                    ));
                } else {
                    existing.amount += converted.convertedAmount() == null ? 0.0 : converted.convertedAmount();
                    // Keep the smallest source id as this aggregated row's stable identity, so the
                    // "checked" state persists consistently even as recipes are added or removed.
                    if (ingredient.getRecipeIngredientId() != null
                            && (existing.ingredientId == null || ingredient.getRecipeIngredientId() < existing.ingredientId)) {
                        existing.ingredientId = ingredient.getRecipeIngredientId();
                    }
                }
            }
        }

        Map<String, List<ShoppingListItem>> groupedItems = new LinkedHashMap<>();
        DEPARTMENT_ORDER.forEach(department -> groupedItems.put(department, new ArrayList<>()));

        for (AggregatedIngredient ingredient : aggregation.values()) {
            ConvertedMeasurement simplified = measurementConverter.convert(ingredient.amount, ingredient.unit);
            String department = resolveDepartment(ingredient.name);
            ShoppingListItem item = ShoppingListItem.builder()
                    .ingredientId(ingredient.ingredientId)
                    .name(ingredient.name)
                    .amount(simplified.convertedAmount())
                    .unit(simplified.convertedUnit())
                    .department(department)
                    .checked(ingredient.ingredientId != null && checkedIngredientIds.contains(ingredient.ingredientId))
                    .build();
            groupedItems.computeIfAbsent(department, key -> new ArrayList<>()).add(item);
        }

        groupedItems.values().forEach(items -> items.sort(
                Comparator.comparing(ShoppingListItem::isChecked)
                        .thenComparing(ShoppingListItem::getName, String.CASE_INSENSITIVE_ORDER)
        ));

        groupedItems.entrySet().removeIf(entry -> entry.getValue().isEmpty());
        return groupedItems;
    }

    private Set<Long> loadCheckedIngredientIds(Long userId, LocalDate startDate, LocalDate endDate) {
        try {
            return checkedStateRepository.findByUserIdAndDateBetween(userId, startDate, endDate)
                    .stream()
                    .filter(state -> Boolean.TRUE.equals(state.getChecked()))
                    .map(ShoppingListCheckedState::getIngredientId)
                    .collect(Collectors.toSet());
        } catch (Exception exception) {
            log.warn(
                    "Could not load shopping-list checked states for user {} ({} to {}); continuing without them",
                    userId,
                    startDate,
                    endDate,
                    exception
            );
            return Collections.emptySet();
        }
    }

    /**
     * Toggles a user's persisted checked state for one shopping list item.
     *
     * @param userId the owning user's identifier
     * @param ingredientId ingredient identifier
     * @param date selected week anchor date
     * @return the updated checked state
     */
    public ShoppingListCheckedState toggleCheckedState(Long userId, Long ingredientId, LocalDate date) {
        ShoppingListCheckedState state = checkedStateRepository.findByUserIdAndIngredientIdAndDate(userId, ingredientId, date)
                .orElseGet(() -> ShoppingListCheckedState.builder()
                        .userId(userId)
                        .ingredientId(ingredientId)
                        .date(date)
                        .checked(false)
                        .build());
        state.setChecked(!Boolean.TRUE.equals(state.getChecked()));
        return checkedStateRepository.save(state);
    }

    /**
     * Clears a user's checked states in the requested date range.
     *
     * @param userId the owning user's identifier
     * @param startDate inclusive start date
     * @param endDate inclusive end date
     */
    public void clearCheckedStates(Long userId, LocalDate startDate, LocalDate endDate) {
        checkedStateRepository.deleteByUserIdAndDateBetween(userId, startDate, endDate);
    }

    /**
     * Converts a flat list of recipe ingredients into an aggregated department map.
     * Used by holiday-scoped shopping list generation where there is no date range.
     *
     * @param ingredients ingredients to aggregate
     * @return department-grouped shopping list items
     */
    @Transactional(readOnly = true)
    public Map<String, List<ShoppingListItem>> aggregateIngredients(List<RecipeIngredient> ingredients) {
        Map<String, AggregatedIngredient> aggregation = new LinkedHashMap<>();

        for (RecipeIngredient ingredient : ingredients) {
            ConvertedMeasurement converted = measurementConverter.convert(
                    ingredient.getIngredientQuantityValue(),
                    ingredient.getIngredientQuantityUnit()
            );
            String key = createAggregationKey(ingredient.getIngredientName(), converted.convertedUnit());
            aggregation.compute(key, (ignored, existing) -> {
                if (existing == null) {
                    return new AggregatedIngredient(
                            ingredient.getRecipeIngredientId(),
                            ingredient.getIngredientName().trim(),
                            converted.convertedAmount() == null ? 0.0 : converted.convertedAmount(),
                            converted.convertedUnit()
                    );
                }
                existing.amount += converted.convertedAmount() == null ? 0.0 : converted.convertedAmount();
                return existing;
            });
        }

        Map<String, List<ShoppingListItem>> groupedItems = new LinkedHashMap<>();
        DEPARTMENT_ORDER.forEach(department -> groupedItems.put(department, new ArrayList<>()));
        for (AggregatedIngredient ingredient : aggregation.values()) {
            ConvertedMeasurement simplified = measurementConverter.convert(ingredient.amount, ingredient.unit);
            String department = resolveDepartment(ingredient.name);
            groupedItems.computeIfAbsent(department, key -> new ArrayList<>()).add(ShoppingListItem.builder()
                    .ingredientId(ingredient.ingredientId)
                    .name(ingredient.name)
                    .amount(simplified.convertedAmount())
                    .unit(simplified.convertedUnit())
                    .department(department)
                    .checked(false)
                    .build());
        }
        groupedItems.values().forEach(items -> items.sort(
                Comparator.comparing(ShoppingListItem::getName, String.CASE_INSENSITIVE_ORDER)
        ));
        groupedItems.entrySet().removeIf(entry -> entry.getValue().isEmpty());
        return groupedItems;
    }

    /**
     * Builds the key used to merge duplicate ingredients. Two ingredients are combined only
     * when both their name and unit match, so "200 g flour" and "1 cup flour" stay separate.
     * Format is {@code "name|unit"}, both lower-cased and trimmed.
     */
    private String createAggregationKey(String name, String unit) {
        return name.trim().toLowerCase(Locale.ROOT) + "|" + (unit == null ? "" : unit.trim().toLowerCase(Locale.ROOT));
    }

    /**
     * Resolves a supermarket department for an ingredient by matching configured keywords.
     * Falls back to "Produce" (fresh fruit/veg) when no keyword matches, since unmatched
     * whole-food ingredients are most often produce.
     */
    private String resolveDepartment(String ingredientName) {
        String normalizedName = ingredientName.toLowerCase(Locale.ROOT);
        for (Map.Entry<String, List<String>> entry : departmentKeywords.entrySet()) {
            boolean matches = entry.getValue().stream()
                    .anyMatch(keyword -> normalizedName.contains(keyword.toLowerCase(Locale.ROOT)));
            if (matches) {
                return entry.getKey();
            }
        }
        return "Produce";
    }

    /** Mutable accumulator used while merging duplicate ingredients into a single shopping row. */
    private static class AggregatedIngredient {
        private Long ingredientId;
        private final String name;
        private double amount;
        private final String unit;

        private AggregatedIngredient(Long ingredientId, String name, double amount, String unit) {
            this.ingredientId = ingredientId;
            this.name = name;
            this.amount = amount;
            this.unit = unit;
        }
    }
}
