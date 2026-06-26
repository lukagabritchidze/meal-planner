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
     * Finds a user's checked state for a specific ingredient in the selected week.
     *
     * @param userId the owning user's identifier
     * @param ingredientId ingredient identifier
     * @param date selected week anchor date
     * @return optional checked state
     */
    Optional<ShoppingListCheckedState> findByUserIdAndIngredientIdAndDate(Long userId, Long ingredientId, LocalDate date);

    /**
     * Retrieves a user's checked states whose date falls in a selected range.
     *
     * @param userId the owning user's identifier
     * @param startDate inclusive start date
     * @param endDate inclusive end date
     * @return checked state rows in range
     */
    List<ShoppingListCheckedState> findByUserIdAndDateBetween(Long userId, LocalDate startDate, LocalDate endDate);

    /**
     * Removes a user's checked states whose date falls in a selected range.
     *
     * @param userId the owning user's identifier
     * @param startDate inclusive start date
     * @param endDate inclusive end date
     */
    void deleteByUserIdAndDateBetween(Long userId, LocalDate startDate, LocalDate endDate);
}
