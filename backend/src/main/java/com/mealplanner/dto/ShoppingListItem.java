package com.mealplanner.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO representing one aggregated shopping list row.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShoppingListItem {
    private Long ingredientId;
    private String name;
    private Double amount;
    private String unit;
    private String department;
    private boolean checked;
}
