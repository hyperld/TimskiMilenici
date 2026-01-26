package com.example.timskimilenici.controllers;

import com.example.timskimilenici.entities.Business;
import com.example.timskimilenici.services.BusinessService;
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
                                 @RequestParam(required = false) String location) {
        if (category != null) {
            return businessService.findByCategory(category);
        } else if (location != null) {
            return businessService.searchByLocation(location);
        }
        return businessService.getAllBusinesses();
    }
}
