package com.mealplanner.repository;

import com.mealplanner.entity.Holiday;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface HolidayRepository extends JpaRepository<Holiday, Long> {

    /**
     * Retrieves all holidays sorted by date ascending.
     *
     * @return sorted holidays
     */
    List<Holiday> findAllByOrderByDateAsc();

    /**
     * Retrieves holidays whose date falls inside a range, sorted by date ascending.
     *
     * @param startDate inclusive start date
     * @param endDate inclusive end date
     * @return sorted matching holidays
     */
    List<Holiday> findByDateBetweenOrderByDateAsc(LocalDate startDate, LocalDate endDate);
}
