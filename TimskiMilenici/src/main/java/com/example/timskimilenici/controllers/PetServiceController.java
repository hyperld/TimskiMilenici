package com.example.timskimilenici.controllers;

import com.example.timskimilenici.entities.PetService;
import com.example.timskimilenici.repositories.PetServiceRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/services")
public class PetServiceController {

        private final PetServiceRepository petServiceRepository;

        public PetServiceController(PetServiceRepository petServiceRepository) {
            this.petServiceRepository = petServiceRepository;
        }

        @GetMapping("/business/{businessId}")
        public List<PetService> getByBusiness(@PathVariable Long businessId) {
            return petServiceRepository.findByBusinessId(businessId);
        }

        @GetMapping("/{id}")
        public ResponseEntity<PetService> getById(@PathVariable Long id) {
            return petServiceRepository.findById(id)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        }

        @PostMapping
        @PreAuthorize("hasRole('OWNER')")
        public PetService create(@RequestBody PetService service) {
            return petServiceRepository.save(service);
        }

        @PutMapping("/{id}")
        @PreAuthorize("hasRole('OWNER')")
        public ResponseEntity<PetService> update(@PathVariable Long id, @RequestBody PetService serviceDetails) {
            return petServiceRepository.findById(id).map(service -> {
                service.setName(serviceDetails.getName());
                service.setDescription(serviceDetails.getDescription());
                service.setPrice(serviceDetails.getPrice());
                service.setCapacity(serviceDetails.getCapacity());
                service.setDurationMinutes(serviceDetails.getDurationMinutes());
                return ResponseEntity.ok(petServiceRepository.save(service));
            }).orElse(ResponseEntity.notFound().build());
        }

        @DeleteMapping("/{id}")
        @PreAuthorize("hasRole('OWNER')")
        public ResponseEntity<Void> delete(@PathVariable Long id) {
            if (petServiceRepository.existsById(id)) {
                petServiceRepository.deleteById(id);
                return ResponseEntity.noContent().build();
            }
            return ResponseEntity.notFound().build();
        }
    }
