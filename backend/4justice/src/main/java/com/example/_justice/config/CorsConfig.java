
package com.example._justice.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.ArrayList;
import java.util.List;

@Configuration
public class CorsConfig {

    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration config = new CorsConfiguration();

        List<String> origins = new ArrayList<>();
        origins.add("http://localhost:5173");

        String frontendUrl = System.getenv("FRONTEND_URL");

        if (frontendUrl != null && !frontendUrl.isBlank()) {
            origins.add(frontendUrl.trim());
        }

        config.setAllowedOrigins(origins);

        config.setAllowedMethods(
            List.of("GET", "POST", "PUT", "PATCH",
                    "DELETE", "OPTIONS")
        );

        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source =
            new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/**", config);

        return new CorsFilter(source);
    }
}
