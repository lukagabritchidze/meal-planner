package com.mealplanner.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

/**
 * Persisted checked/unchecked state for shopping list items within a selected week.
 */
@Entity
@Table(
        name = "shopping_list_checked_state",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "ingredient_id", "state_date"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShoppingListCheckedState {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "shopping_list_checked_state_id")
    private Long shoppingListCheckedStateId;

    /**
     * Identifier of the user who owns this checked state, so one shopper's ticked-off
     * items never appear on another user's list.
     */
    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "ingredient_id", nullable = false)
    private Long ingredientId;

    @Column(name = "state_date", nullable = false)
    private LocalDate date;

    @Column(name = "checked", nullable = false)
    private Boolean checked;
}
