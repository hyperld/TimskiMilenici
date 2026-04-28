package com.example.timskimilenici.services.ai;

import com.example.timskimilenici.entities.Business;
import com.example.timskimilenici.entities.PetService;
import com.example.timskimilenici.entities.Product;
import com.example.timskimilenici.repositories.BusinessRepository;
import com.example.timskimilenici.services.BusinessService;
import com.example.timskimilenici.services.BusinessWithDistance;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * Tools the LLM can call when chatting with customers. Each tool is a thin,
 * read-only lookup against the existing services. Keep the returned payloads
 * small so the model has a tight context window.
 */
@Component
public class CustomerAiTools {

    private static final int DEFAULT_LIMIT = 10;

    /**
     * English stop words and filler terms users often type in casual product
     * queries. Dropping these lets multi-word questions like "shampoo for my
     * bichon" still match the "shampoo" product in the catalog.
     */
    private static final Set<String> STOP_WORDS = Set.of(
            "a", "an", "and", "the", "for", "to", "of", "in", "on", "with",
            "my", "your", "our", "their", "his", "her", "some", "any",
            "please", "can", "could", "would", "want", "need", "looking",
            "find", "buy", "get", "show", "me", "us", "pet", "pets"
    );

    private final BusinessRepository businessRepository;
    private final BusinessService businessService;

    public CustomerAiTools(BusinessRepository businessRepository, BusinessService businessService) {
        this.businessRepository = businessRepository;
        this.businessService = businessService;
    }

    public record StoreSummary(
            Long id,
            String name,
            String category,
            List<String> categories,
            String address,
            String description,
            String contactPhone,
            String contactEmail
    ) {}

    public record ItemHit(
            Long itemId,
            String itemName,
            String itemType,
            /** Regular (non-discounted) price of the item. */
            BigDecimal originalPrice,
            /** Price applied to the customer (equals originalPrice unless an active special offer discounts it). */
            BigDecimal currentPrice,
            Long storeId,
            String storeName
    ) {}

    public record NearbyStore(
            Long id,
            String name,
            String category,
            String address,
            Double distanceKm
    ) {}

    public record StoreDetails(
            Long id,
            String name,
            String category,
            List<String> categories,
            String address,
            String description,
            String contactPhone,
            String contactEmail,
            List<ItemHit> services,
            List<ItemHit> products
    ) {}

    @Tool(description = "List pet stores on the PetPal platform. Use when the user asks what stores are available or wants an overview. Returns a compact summary of up to 8 stores.")
    public List<StoreSummary> listStores() {
        return businessRepository.findAll().stream()
                .limit(DEFAULT_LIMIT)
                .map(CustomerAiTools::toSummary)
                .toList();
    }

    @Tool(description = "Search for pet stores whose name, category, or address matches the query. Supports multi-word queries: each meaningful word is matched independently and results are ranked by how many keywords hit. Use when the user asks 'do you have a vet', 'stores in Skopje', etc. Returns up to 10 ranked stores.")
    public List<StoreSummary> searchStores(
            @ToolParam(description = "Search query; can be one or several keywords") String query
    ) {
        List<String> tokens = tokenize(query);
        if (tokens.isEmpty()) {
            return listStores();
        }
        List<Scored<Business>> scored = new ArrayList<>();
        for (Business b : businessRepository.findAll()) {
            int score = scoreStore(b, tokens);
            if (score > 0) {
                scored.add(new Scored<>(b, score));
            }
        }
        return scored.stream()
                .sorted(Comparator.comparingInt((Scored<Business> s) -> s.score).reversed())
                .limit(DEFAULT_LIMIT)
                .map(s -> toSummary(s.value))
                .toList();
    }

    @Tool(description = "Get detailed information about a single store, including its services and products. Use after `searchStores` to show the user what a specific store offers.")
    public StoreDetails getStoreDetails(
            @ToolParam(description = "Exact or partial store name") String storeName
    ) {
        if (storeName == null || storeName.isBlank()) return null;
        String q = storeName.trim().toLowerCase(Locale.ROOT);
        Business match = businessRepository.findAll().stream()
                .filter(b -> b.getName() != null && b.getName().toLowerCase(Locale.ROOT).contains(q))
                .findFirst()
                .orElse(null);
        if (match == null) return null;

        List<ItemHit> services = match.getServices() == null ? List.of() :
                match.getServices().stream()
                        .limit(DEFAULT_LIMIT)
                        .map(s -> toServiceHit(s, match))
                        .toList();
        List<ItemHit> products = match.getProducts() == null ? List.of() :
                match.getProducts().stream()
                        .limit(DEFAULT_LIMIT)
                        .map(p -> toProductHit(p, match))
                        .toList();

        return new StoreDetails(
                match.getId(),
                match.getName(),
                match.getCategory(),
                match.getCategories(),
                match.getAddress(),
                match.getDescription(),
                match.getContactPhone(),
                match.getContactEmail(),
                services,
                products
        );
    }

    @Tool(description = "Search for products across all stores. Multi-word queries are tokenized and each meaningful keyword is matched against product name, description, and the owning store's name/category — so a question like 'shampoo for my bichon' still finds the 'shampoo' product. Results are ranked by how many keywords hit. Returns up to 10 matches with the store that carries each product.")
    public List<ItemHit> searchProducts(
            @ToolParam(description = "Product keywords, e.g. 'shampoo', 'dog food', 'flea collar'") String query
    ) {
        List<String> tokens = tokenize(query);
        if (tokens.isEmpty()) return List.of();
        List<Scored<ItemHit>> scored = new ArrayList<>();
        for (Business b : businessRepository.findAll()) {
            if (b.getProducts() == null) continue;
            for (Product p : b.getProducts()) {
                int score = scoreProduct(p, b, tokens);
                if (score > 0) scored.add(new Scored<>(toProductHit(p, b), score));
            }
        }
        return scored.stream()
                .sorted(Comparator.comparingInt((Scored<ItemHit> s) -> s.score).reversed())
                .limit(DEFAULT_LIMIT)
                .map(s -> s.value)
                .toList();
    }

    @Tool(description = "Search for pet services across all stores (grooming, boarding, vet, training, etc). Multi-word queries are tokenized and matched against service name, description, and the store that offers it, so casual phrasing still works. Results are ranked by keyword overlap. Returns up to 10 matches.")
    public List<ItemHit> searchServices(
            @ToolParam(description = "Service keywords, e.g. 'grooming', 'nail trim', 'vet checkup'") String query
    ) {
        List<String> tokens = tokenize(query);
        if (tokens.isEmpty()) return List.of();
        List<Scored<ItemHit>> scored = new ArrayList<>();
        for (Business b : businessRepository.findAll()) {
            if (b.getServices() == null) continue;
            for (PetService s : b.getServices()) {
                int score = scoreService(s, b, tokens);
                if (score > 0) scored.add(new Scored<>(toServiceHit(s, b), score));
            }
        }
        return scored.stream()
                .sorted(Comparator.comparingInt((Scored<ItemHit> sc) -> sc.score).reversed())
                .limit(DEFAULT_LIMIT)
                .map(s -> s.value)
                .toList();
    }

    @Tool(description = "Find pet stores near a latitude/longitude within a given radius in kilometers, sorted by distance. Use only when the user has shared their location or provided coordinates.")
    public List<NearbyStore> findNearbyStores(
            @ToolParam(description = "Latitude in decimal degrees") double latitude,
            @ToolParam(description = "Longitude in decimal degrees") double longitude,
            @ToolParam(description = "Search radius in kilometers; 10 if the user did not say") double radiusKm
    ) {
        double r = radiusKm <= 0 ? 10 : radiusKm;
        List<BusinessWithDistance> results = businessService.findNearby(latitude, longitude, r, DEFAULT_LIMIT);
        return results.stream()
                .map(bw -> new NearbyStore(
                        bw.getBusiness().getId(),
                        bw.getBusiness().getName(),
                        bw.getBusiness().getCategory(),
                        bw.getBusiness().getAddress(),
                        bw.getDistanceKm()
                ))
                .toList();
    }

    private static boolean matchesName(String value, String queryLower) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(queryLower);
    }

    /**
     * Tokenize a user query into lowercase keywords, skipping stop words and
     * tokens that are too short to be useful. Falls back to the raw single
     * word when everything gets stripped (e.g. "cat" alone).
     */
    private static List<String> tokenize(String query) {
        if (query == null || query.isBlank()) return List.of();
        String[] raw = query.toLowerCase(Locale.ROOT).split("[^\\p{L}\\p{N}]+");
        List<String> tokens = new ArrayList<>();
        for (String t : raw) {
            if (t.length() < 2) continue;
            if (STOP_WORDS.contains(t)) continue;
            tokens.add(t);
        }
        if (tokens.isEmpty()) {
            for (String t : raw) {
                if (!t.isBlank()) tokens.add(t);
            }
        }
        return tokens;
    }

    private static int scoreStore(Business b, List<String> tokens) {
        if (b == null) return 0;
        int score = 0;
        for (String t : tokens) {
            if (matchesName(b.getName(), t)) score += 3;
            else if (matchesName(b.getCategory(), t)) score += 2;
            else if (matchesName(b.getAddress(), t)) score += 2;
            else if (matchesName(b.getDescription(), t)) score += 1;
            else if (b.getCategories() != null && b.getCategories().stream().anyMatch(c -> matchesName(c, t))) score += 2;
        }
        return score;
    }

    private static int scoreProduct(Product p, Business b, List<String> tokens) {
        if (p == null) return 0;
        int score = 0;
        for (String t : tokens) {
            if (matchesName(p.getName(), t)) score += 4;
            else if (matchesName(p.getDescription(), t)) score += 2;
            else if (b != null && matchesName(b.getName(), t)) score += 2;
            else if (b != null && matchesName(b.getCategory(), t)) score += 1;
            else if (b != null && b.getCategories() != null
                    && b.getCategories().stream().anyMatch(c -> matchesName(c, t))) score += 1;
        }
        return score;
    }

    private static int scoreService(PetService s, Business b, List<String> tokens) {
        if (s == null) return 0;
        int score = 0;
        for (String t : tokens) {
            if (matchesName(s.getName(), t)) score += 4;
            else if (matchesName(s.getDescription(), t)) score += 2;
            else if (b != null && matchesName(b.getName(), t)) score += 2;
            else if (b != null && matchesName(b.getCategory(), t)) score += 1;
            else if (b != null && b.getCategories() != null
                    && b.getCategories().stream().anyMatch(c -> matchesName(c, t))) score += 1;
        }
        return score;
    }

    private static final class Scored<T> {
        final T value;
        final int score;
        Scored(T value, int score) {
            this.value = value;
            this.score = score;
        }
    }

    private static StoreSummary toSummary(Business b) {
        return new StoreSummary(
                b.getId(),
                b.getName(),
                b.getCategory(),
                b.getCategories(),
                b.getAddress(),
                b.getDescription(),
                b.getContactPhone(),
                b.getContactEmail()
        );
    }

    private static ItemHit toServiceHit(PetService s, Business b) {
        return new ItemHit(
                s.getId(),
                s.getName(),
                "service",
                s.getOriginalPrice(),
                s.getCurrentPrice(),
                b.getId(),
                b.getName()
        );
    }

    private static ItemHit toProductHit(Product p, Business b) {
        return new ItemHit(
                p.getId(),
                p.getName(),
                "product",
                p.getOriginalPrice(),
                p.getCurrentPrice(),
                b.getId(),
                b.getName()
        );
    }
}
