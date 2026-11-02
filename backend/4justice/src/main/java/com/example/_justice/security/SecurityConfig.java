package com.example._justice.security;

import java.util.Collection;
import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class SecurityConfig {

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration = new CorsConfiguration();

        configuration.setAllowedOrigins(List.of(
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "http://localhost:5174",
                "http://127.0.0.1:5174"
        ));

        configuration.setAllowedMethods(List.of(
                "GET", "POST", "PUT", "PATCH",
                "DELETE", "OPTIONS"
        ));

        configuration.setAllowedHeaders(List.of(
                "Authorization", "Content-Type"
        ));

        configuration.setAllowCredentials(false);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/**", configuration);

        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http) throws Exception {

        http
            .csrf(csrf -> csrf.disable())

            .cors(cors -> cors.configurationSource(
                    corsConfigurationSource()))

            .sessionManagement(session -> session
                    .sessionCreationPolicy(
                            SessionCreationPolicy.STATELESS))

            .authorizeHttpRequests(auth -> auth

                // Public registration, login and contact endpoints
                .requestMatchers(
                        "/api/customers/register",
                        "/api/customers/login",
                        "/api/lawyers/register",
                        "/api/lawyers/login",
                        "/api/admin/login",
                        "/api/contact",

                        // Public forgot-password endpoints
                        "/api/auth/forgot-password",
                        "/api/auth/verify-reset-token",
                        "/api/auth/reset-password"
                ).permitAll()

                // Admin-only endpoints
                .requestMatchers("/api/admin/**")
                .hasRole("ADMIN")

                // Lawyer case operations
                .requestMatchers(
                        HttpMethod.GET,
                        "/api/lawyers/my-cases"
                ).hasRole("LAWYER")

                .requestMatchers(
                        HttpMethod.PUT,
                        "/api/lawyers/*/availability",
                        "/api/lawyers/cases/**"
                ).hasRole("LAWYER")

                // Only admins can view the full lawyer list
                .requestMatchers(
                        HttpMethod.GET,
                        "/api/lawyers"
                ).hasRole("ADMIN")

                // Only admins can edit lawyer profiles
                .requestMatchers(
                        HttpMethod.PUT,
                        "/api/lawyers/*"
                ).hasRole("ADMIN")

                // Admins and lawyers can view individual lawyer details
                .requestMatchers(
                        HttpMethod.GET,
                        "/api/lawyers/*"
                ).hasAnyRole("ADMIN", "LAWYER")

                // Customer-only endpoints
                .requestMatchers("/api/customers/**")
                .hasRole("CUSTOMER")

                .requestMatchers("/api/cases/**")
                .hasAnyRole("ADMIN", "CUSTOMER", "LAWYER")

                // Everything else requires authentication
                .anyRequest().authenticated()
            )

            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt
                    .jwtAuthenticationConverter(
                            jwtAuthenticationConverter()
                    )
                )
            );

        return http.build();
    }

    @Bean
    public Converter<Jwt, AbstractAuthenticationToken>
            jwtAuthenticationConverter() {

        return jwt -> {

            String role = jwt.getClaimAsString("role");

            Collection<GrantedAuthority> authorities =
                    List.of(
                        new SimpleGrantedAuthority("ROLE_" + role)
                    );

            return new JwtAuthenticationToken(
                    jwt,
                    authorities,
                    jwt.getSubject()
            );
        };
    }
}