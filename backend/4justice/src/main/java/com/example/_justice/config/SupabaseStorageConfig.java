package com.example._justice.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
public class SupabaseStorageConfig {

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.secret-key}")
    private String supabaseSecretKey;

    @Bean
    public RestClient supabaseRestClient() {
        return RestClient.builder()
                .baseUrl(supabaseUrl + "/storage/v1")
                .defaultHeader("apikey", supabaseSecretKey)
                .build();
    }
}