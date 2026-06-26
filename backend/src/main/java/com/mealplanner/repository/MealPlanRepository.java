package com.mealplanner.repository;

import com.mealplanner.entity.MealPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface MealPlanRepository extends JpaRepository<MealPlan, Long> {
    
    /**
     * Retrieves a user's planned meals scheduled between start and end dates.
     *
     * @param userId the owning user's identifier
     * @param startDate the start date
     * @param endDate the end date
     * @return list of the user's matching meal plans
     */
    List<MealPlan> findByUserIdAndPlannedDateBetween(Long userId, LocalDate startDate, LocalDate endDate);

    /**
     * Same as {@link #findByUserIdAndPlannedDateBetween} but eagerly loads each recipe's
     * ingredients so shopping-list aggregation works outside an extended persistence context.
     */
    @Query("""
            SELECT DISTINCT mp FROM MealPlan mp
            JOIN FETCH mp.recipe r
            LEFT JOIN FETCH r.recipeIngredients
            WHERE mp.userId = :userId AND mp.plannedDate BETWEEN :startDate AND :endDate
            """)
    List<MealPlan> findByUserIdAndPlannedDateBetweenWithIngredients(
            @Param("userId") Long userId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);
}
