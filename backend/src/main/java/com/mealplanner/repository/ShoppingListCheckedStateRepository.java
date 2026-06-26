package com.mealplanner.repository;

import com.mealplanner.entity.ShoppingListCheckedState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ShoppingListCheckedStateRepository extends JpaRepository<ShoppingListCheckedState, Long> {

    /**
     * Finds checked state for a specific ingredient in the selected week.
     *
     * @param ingredientId ingredient identifier
     * @param date selected week anchor date
     * @return optional checked state
     */
    Optional<ShoppingListCheckedState> findByIngredientIdAndDate(Long ingredientId, LocalDate date);

    /**
     * Retrieves checked states whose date falls in a selected range.
     *
     * @param startDate inclusive start date
     * @param endDate inclusive end date
     * @return checked state rows in range
     */
    List<ShoppingListCheckedState> findByDateBetween(LocalDate startDate, LocalDate endDate);

    /**
     * Removes checked states whose date falls in a selected range.
     *
     * @param startDate inclusive start date
     * @param endDate inclusive end date
     */
    void deleteByDateBetween(LocalDate startDate, LocalDate endDate);
}
