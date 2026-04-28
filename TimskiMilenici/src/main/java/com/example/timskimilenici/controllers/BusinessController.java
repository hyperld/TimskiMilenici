package com.example.timskimilenici.controllers;

import com.example.timskimilenici.entities.Business;
import com.example.timskimilenici.services.BusinessService;
import com.example.timskimilenici.services.BusinessWithDistance;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/businesses")
public class BusinessController {

    private final BusinessService businessService;

    public BusinessController(BusinessService businessService) {
        this.businessService = businessService;
    }

    @GetMapping
    public List<Business> getAll() {
        return businessService.getAllBusinesses();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Business> getById(@PathVariable Long id) {
        return businessService.getBusinessById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<?> create(@RequestBody Business business) {
        return ResponseEntity.ok(businessService.saveBusiness(business));
    }

    @GetMapping("/my-business/{ownerId}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<List<Business>> getByOwnerId(@PathVariable Long ownerId) {
        return ResponseEntity.ok(businessService.getBusinessByOwnerId(ownerId));
    }

    @GetMapping("/search")
    public List<Business> search(@RequestParam(required = false) String category,
                                 @RequestParam(required = false) String address) {
        if (category != null) {
            return businessService.findByCategory(category);
        } else if (address != null) {
            return businessService.searchByAddress(address);
        }
        return businessService.getAllBusinesses();
    }

    /**
     * Return businesses within {@code radiusKm} of the supplied coordinates,
     * sorted by ascending distance. Each row includes a {@code distanceKm}
     * field. Invalid coordinates yield an empty list.
     */
    /**
     * Top stores ranked by their average review rating (then by review volume,
     * then alphabetically). The aggregate runs as a single batch query so this
     * endpoint stays cheap regardless of how many stores exist.
     */
    @GetMapping("/top")
    public List<Business> top(@RequestParam(required = false) Integer limit) {
        return businessService.getTopBusinesses(limit);
    }

    @GetMapping("/nearby")
    public List<BusinessWithDistance> nearby(@RequestParam double lat,
                                             @RequestParam double lng,
                                             @RequestParam(defaultValue = "10") double radiusKm,
                                             @RequestParam(required = false) Integer limit) {
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            return List.of();
        }
        return businessService.findNearby(lat, lng, radiusKm, limit);
    }

    /**
     * Admin-style hook to fill in lat/lng for every existing business that
     * still has null coordinates. Owners only so it's not trivially DoS'd.
     */
    @PostMapping("/backfill-coordinates")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<Map<String, Object>> backfillCoordinates() {
        int updated = businessService.backfillMissingCoordinates();
        Map<String, Object> body = new HashMap<>();
        body.put("updated", updated);
        return ResponseEntity.ok(body);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            businessService.deleteBusiness(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
