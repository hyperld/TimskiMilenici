package com.example.timskimilenici.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Optional;

/**
 * Server-side geocoding via the Mapbox Places API.
 * Converts a free-form address string into [longitude, latitude].
 */
@Service
public class MapboxGeocodingService {

    private static final Logger log = LoggerFactory.getLogger(MapboxGeocodingService.class);
    private static final String ENDPOINT =
            "https://api.mapbox.com/geocoding/v5/mapbox.places/";

    private final String token;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public MapboxGeocodingService(@Value("${mapbox.token:}") String token) {
        this.token = token == null ? "" : token.trim();
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Geocode an address to coordinates. Returns empty on any failure so callers
     * can proceed without coordinates rather than failing the whole save.
     */
    public Optional<double[]> geocode(String address) {
        if (token.isEmpty()) {
            log.debug("Mapbox token is not configured; skipping geocode for '{}'.", address);
            return Optional.empty();
        }
        if (address == null || address.isBlank()) {
            return Optional.empty();
        }

        try {
            String encoded = URLEncoder.encode(address.trim(), StandardCharsets.UTF_8);
            String url = ENDPOINT + encoded + ".json?access_token=" + token + "&limit=1";
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(6))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                log.warn("Mapbox geocode returned HTTP {} for '{}'.", response.statusCode(), address);
                return Optional.empty();
            }

            JsonNode root = objectMapper.readTree(response.body());
            JsonNode features = root.path("features");
            if (!features.isArray() || features.isEmpty()) {
                return Optional.empty();
            }
            JsonNode center = features.get(0).path("center");
            if (!center.isArray() || center.size() < 2) {
                return Optional.empty();
            }
            double lng = center.get(0).asDouble();
            double lat = center.get(1).asDouble();
            return Optional.of(new double[]{lng, lat});
        } catch (Exception e) {
            log.warn("Mapbox geocode failed for '{}': {}", address, e.getMessage());
            return Optional.empty();
        }
    }
}
