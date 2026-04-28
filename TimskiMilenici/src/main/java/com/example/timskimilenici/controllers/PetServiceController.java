package com.example.timskimilenici.controllers;

import com.example.timskimilenici.entities.PetService;
import com.example.timskimilenici.repositories.PetServiceRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/services")
public class PetServiceController {

        private static final int DEFAULT_TOP_LIMIT = 12;
        private static final int MAX_TOP_LIMIT = 50;

        private final PetServiceRepository petServiceRepository;

        public PetServiceController(PetServiceRepository petServiceRepository) {
            this.petServiceRepository = petServiceRepository;
        }

        @GetMapping
        public List<PetService> getAll() {
            return petServiceRepository.findAll();
        }

        @GetMapping("/promoted")
        public List<PetService> getPromoted() {
            return petServiceRepository.findPromotedServices();
        }

        /**
         * Top services globally, ranked by booking count (cancelled bookings
         * excluded). The repository runs a single aggregating query and we
         * load only the ranked rows. Limit is capped server-side.
         */
        @GetMapping("/top")
        public List<PetService> getTop(@RequestParam(required = false) Integer limit) {
            int cap = limit == null || limit <= 0 ? DEFAULT_TOP_LIMIT : Math.min(limit, MAX_TOP_LIMIT);
            List<Object[]> ranked = petServiceRepository.findTopServiceIdsByBookings(cap);
            if (ranked.isEmpty()) return List.of();

            List<Long> ids = new ArrayList<>(ranked.size());
            for (Object[] row : ranked) {
                if (row != null && row.length >= 1 && row[0] != null) {
                    ids.add(((Number) row[0]).longValue());
                }
            }
            Map<Long, PetService> byId = new HashMap<>();
            for (PetService s : petServiceRepository.findAllById(ids)) {
                byId.put(s.getId(), s);
            }
            List<PetService> ordered = new ArrayList<>(ids.size());
            for (Long id : ids) {
                PetService s = byId.get(id);
                if (s != null) ordered.add(s);
            }
            return ordered;
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
                service.setOriginalPrice(serviceDetails.getOriginalPrice());
                service.setPromotionPrice(serviceDetails.getPromotionPrice());
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
