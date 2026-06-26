package com.mealplanner.controller;

import com.mealplanner.dto.DashboardStatsDto;
import com.mealplanner.service.DashboardStatsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

/**
 * Exposes aggregated dashboard statistics for the active week.
 */
@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardStatsService dashboardStatsService;

    @Autowired
    public DashboardController(DashboardStatsService dashboardStatsService) {
        this.dashboardStatsService = dashboardStatsService;
    }

    /**
     * Returns dashboard statistics for the inclusive date range.
     *
     * @param startDate inclusive start date (YYYY-MM-DD)
     * @param endDate inclusive end date (YYYY-MM-DD)
     * @return populated dashboard statistics
     */
    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsDto> getDashboardStats(
            @RequestParam("startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam("endDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(dashboardStatsService.buildWeeklyStats(startDate, endDate));
    }
}
