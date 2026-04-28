package com.example.timskimilenici.controllers;

import com.example.timskimilenici.entities.Product;
import com.example.timskimilenici.repositories.ProductRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private static final int DEFAULT_TOP_LIMIT = 12;
    private static final int MAX_TOP_LIMIT = 50;

    private final ProductRepository productRepository;

    public ProductController(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @GetMapping
    public List<Product> getAll() {
        return productRepository.findAll();
    }

    @GetMapping("/promoted")
    public List<Product> getPromoted() {
        return productRepository.findPromotedProducts();
    }

    /**
     * Top products globally, ranked by total units sold across every order.
     * The repository runs a single aggregating query (one DB round trip) and
     * we then load only the matching {@link Product} rows in their ranked
     * order. Limit is capped server-side so a malicious client can't ask for
     * an unbounded scan.
     */
    @GetMapping("/top")
    public List<Product> getTop(@RequestParam(required = false) Integer limit) {
        int cap = limit == null || limit <= 0 ? DEFAULT_TOP_LIMIT : Math.min(limit, MAX_TOP_LIMIT);
        List<Object[]> ranked = productRepository.findTopProductIdsBySales(cap);
        if (ranked.isEmpty()) return List.of();

        List<Long> ids = new ArrayList<>(ranked.size());
        for (Object[] row : ranked) {
            if (row != null && row.length >= 1 && row[0] != null) {
                ids.add(((Number) row[0]).longValue());
            }
        }
        Map<Long, Product> byId = new HashMap<>();
        for (Product p : productRepository.findAllById(ids)) {
            byId.put(p.getId(), p);
        }
        // Preserve the ranked order from the aggregate query.
        List<Product> ordered = new ArrayList<>(ids.size());
        for (Long id : ids) {
            Product p = byId.get(id);
            if (p != null) ordered.add(p);
        }
        return ordered;
    }

    @GetMapping("/business/{businessId}")
    public List<Product> getByBusiness(@PathVariable Long businessId) {
        return productRepository.findByBusinessId(businessId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getById(@PathVariable Long id) {
        return productRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasRole('OWNER')")
    public Product create(@RequestBody Product product) {
        return productRepository.save(product);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<Product> update(@PathVariable Long id, @RequestBody Product productDetails) {
        return productRepository.findById(id).map(product -> {
            product.setName(productDetails.getName());
            product.setDescription(productDetails.getDescription());
            product.setOriginalPrice(productDetails.getOriginalPrice());
            product.setPromotionPrice(productDetails.getPromotionPrice());
            product.setStockQuantity(productDetails.getStockQuantity());
            return ResponseEntity.ok(productRepository.save(product));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (productRepository.existsById(id)) {
            productRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
