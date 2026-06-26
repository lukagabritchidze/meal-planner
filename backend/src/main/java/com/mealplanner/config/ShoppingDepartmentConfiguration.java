package com.mealplanner.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;
import java.util.Map;

@Configuration
public class ShoppingDepartmentConfiguration {

    /**
     * Provides department keyword mappings for shopping list categorisation.
     *
     * @return a map of department names to ingredient keyword fragments
     */
    @Bean
    public Map<String, List<String>> shoppingDepartmentKeywords() {
        return Map.of(
                "Dairy", List.of("milk", "cheese", "yogurt", "butter", "cream"),
                "Meat", List.of("chicken", "beef", "pork", "fish", "shrimp", "salmon", "turkey"),
                "Pantry", List.of(
                        "flour", "sugar", "oil", "vinegar", "salt", "pepper", "spice",
                        "cumin", "paprika", "cinnamon", "pasta", "rice", "can",
                        "canned", "broth", "stock", "baking"
                )
        );
    }
}
