
package com.example._justice.service;

import java.nio.charset.StandardCharsets;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriUtils;

@Service
public class SupabaseStorageService {

    private final RestClient supabaseRestClient;

    @Value("${supabase.bucket}")
    private String bucket;

    public SupabaseStorageService(RestClient supabaseRestClient) {
        this.supabaseRestClient = supabaseRestClient;
    }

    // Upload a document to Supabase Storage
    public void uploadFile(String objectPath, byte[] fileBytes, String contentType) {

        String encodedPath = UriUtils.encodePath(objectPath, StandardCharsets.UTF_8);

        supabaseRestClient.post()
                .uri("/object/{bucket}/" + encodedPath, bucket)
                .contentType(MediaType.parseMediaType(contentType))
                .header("x-upsert", "false")
                .body(fileBytes)
                .retrieve()
                .toBodilessEntity();
    }

    // Download a document from Supabase Storage
    public byte[] downloadFile(String objectPath) {

        String encodedPath = UriUtils.encodePath(objectPath, StandardCharsets.UTF_8);

        return supabaseRestClient.get()
                .uri("/object/{bucket}/" + encodedPath, bucket)
                .retrieve()
                .body(byte[].class);
    }

    // Delete a document from Supabase Storage
   // Delete a document from Supabase Storage
public void deleteFile(String objectPath) {

    String encodedPath = UriUtils.encodePath(
            objectPath,
            StandardCharsets.UTF_8
    );

    supabaseRestClient.delete()
            .uri("/object/" + bucket + "/" + encodedPath)
            .retrieve()
            .toBodilessEntity();
}
}
