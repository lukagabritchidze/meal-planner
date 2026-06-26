package com.mealplanner.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Prevents shared caches from serving one user's meal plans, shopping lists,
 * holidays, or dashboard stats to another user. Responses vary by X-User-Id.
 */
@Component
public class UserScopedCacheControlFilter extends OncePerRequestFilter {

    private static final List<String> USER_SCOPED_PATH_PREFIXES = List.of(
            "/api/meal-plans",
            "/api/shopping-list",
            "/api/holidays",
            "/api/dashboard"
    );

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        filterChain.doFilter(request, response);

        String path = request.getRequestURI();
        if (USER_SCOPED_PATH_PREFIXES.stream().anyMatch(path::startsWith)) {
            response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
            response.setHeader("Pragma", "no-cache");
            response.setHeader("Vary", "X-User-Id");
        }
    }
}
