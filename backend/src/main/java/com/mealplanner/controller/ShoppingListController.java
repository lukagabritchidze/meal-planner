package com.mealplanner.controller;

import com.mealplanner.dto.ShoppingListItem;
import com.mealplanner.entity.ShoppingListCheckedState;
import com.mealplanner.service.ShoppingListService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/shopping-list")
public class ShoppingListController {

    private final ShoppingListService shoppingListService;

    @Autowired
    public ShoppingListController(ShoppingListService shoppingListService) {
        this.shoppingListService = shoppingListService;
    }

    /**
     * Retrieves a metric, aggregated shopping list for the authenticated user's
     * scheduled meals in a date range.
     *
     * @param userId owning user's identifier (from the X-User-Id header)
     * @param startDate inclusive start date
     * @param endDate inclusive end date
     * @return department-grouped shopping list rows
     */
    @GetMapping
    public ResponseEntity<Map<String, List<ShoppingListItem>>> getShoppingList(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam("startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam("endDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(shoppingListService.getShoppingList(userId, startDate, endDate));
    }

    /**
     * Toggles persisted checked state for an item. The optional {@code date} query
     * parameter anchors the state to the selected week; when omitted, the current
     * week's Monday is used.
     *
     * @param ingredientId ingredient identifier
     * @param date optional selected week anchor date
     * @return updated checked state row
     */
    @PutMapping("/item/{ingredientId}/toggle")
    public ResponseEntity<ShoppingListCheckedState> toggleShoppingListItem(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long ingredientId,
            @RequestParam(value = "date", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        LocalDate anchorDate = date != null
                ? date
                : LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        return ResponseEntity.ok(shoppingListService.toggleCheckedState(userId, ingredientId, anchorDate));
    }

    /**
     * Clears all checked item states for a selected week/date range.
     *
     * @param startDate inclusive start date
     * @param endDate inclusive end date
     * @return no-content response on success
     */
    @DeleteMapping("/checked")
    public ResponseEntity<Void> clearCheckedItems(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam("startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam("endDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        shoppingListService.clearCheckedStates(userId, startDate, endDate);
        return ResponseEntity.noContent().build();
    }
}
