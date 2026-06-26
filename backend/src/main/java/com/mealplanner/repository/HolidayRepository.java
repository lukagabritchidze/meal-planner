package com.mealplanner.repository;

import com.mealplanner.entity.Holiday;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface HolidayRepository extends JpaRepository<Holiday, Long> {

    /**
     * Retrieves a user's holidays sorted by date ascending.
     *
     * @param userId the owning user's identifier
     * @return the user's holidays, sorted
     */
    List<Holiday> findByUserIdOrderByDateAsc(Long userId);

    /**
     * Retrieves a user's holidays whose date falls inside a range, sorted by date ascending.
     *
     * @param userId the owning user's identifier
     * @param startDate inclusive start date
     * @param endDate inclusive end date
     * @return the user's matching holidays, sorted
     */
    List<Holiday> findByUserIdAndDateBetweenOrderByDateAsc(Long userId, LocalDate startDate, LocalDate endDate);
}
