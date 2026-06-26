package com.mealplanner.repository;

import com.mealplanner.entity.MealPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface MealPlanRepository extends JpaRepository<MealPlan, Long> {
    
    /**
     * Retrieves all planned meals scheduled between start and end dates.
     *
     * @param startDate the start date
     * @param endDate the end date
     * @return list of matching meal plans
     */
    List<MealPlan> findByPlannedDateBetween(LocalDate startDate, LocalDate endDate);
}
