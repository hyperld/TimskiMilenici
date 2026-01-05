package com.example.timskimilenici.controllers;

import com.example.timskimilenici.entities.Business;
import com.example.timskimilenici.services.BusinessService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
    public Business create(@RequestBody Business business) {
        return businessService.saveBusiness(business);
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
