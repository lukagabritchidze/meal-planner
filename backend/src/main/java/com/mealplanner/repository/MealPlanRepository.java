package com.mealplanner.repository;

import com.mealplanner.entity.MealPlan;
import org.springframework.data.jpa.repository.JpaRepository;
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
}
