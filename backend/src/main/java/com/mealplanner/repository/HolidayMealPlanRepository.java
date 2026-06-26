package com.mealplanner.repository;

import com.mealplanner.entity.HolidayMealPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HolidayMealPlanRepository extends JpaRepository<HolidayMealPlan, Long> {

    /**
     * Retrieves holiday meal plans for a holiday.
     *
     * @param holidayId holiday identifier
     * @return matching holiday meal plans
     */
    List<HolidayMealPlan> findByHolidayHolidayId(Long holidayId);

    /**
     * Retrieves holiday meal plans for a specific holiday slot.
     *
     * @param holidayId holiday identifier
     * @param slot holiday meal slot
     * @return matching holiday meal plans in that slot
     */
    List<HolidayMealPlan> findByHolidayHolidayIdAndSlotIgnoreCase(Long holidayId, String slot);

    /**
     * Checks whether a meal plan belongs to a holiday.
     *
     * @param holidayMealPlanId meal plan identifier
     * @param holidayId holiday identifier
     * @return true when the meal plan belongs to the holiday
     */
    boolean existsByHolidayMealPlanIdAndHolidayHolidayId(Long holidayMealPlanId, Long holidayId);
}
