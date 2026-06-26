package com.mealplanner.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfiguration {

    /**
     * Comma-separated list of allowed frontend origins.
     * Defaults to any localhost port for local development; in production this is
     * supplied via the APP_CORS_ALLOWED_ORIGINS environment variable (e.g. the Vercel domain).
     */
    @Value("${app.cors.allowed-origins:http://localhost:*}")
    private String allowedOrigins;

    /**
     * Registers CORS rules for the REST API, allowing the configured frontend origins
     * to call any endpoint under /api/**.
     *
     * @return the configured {@link WebMvcConfigurer}
     */
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        final String[] originPatterns = allowedOrigins.split("\\s*,\\s*");
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**")
                        .allowedOriginPatterns(originPatterns)
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowedHeaders("*")
                        .allowCredentials(true);
            }
        };
    }
}
