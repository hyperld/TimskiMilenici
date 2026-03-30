package com.example.timskimilenici.services;

import com.example.timskimilenici.entities.Booking;
import com.example.timskimilenici.entities.Business;
import com.example.timskimilenici.entities.WorkingDaySlot;
import com.example.timskimilenici.repositories.BookingRepository;
import com.example.timskimilenici.repositories.BusinessRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class BusinessService {

    private static final Logger log = LoggerFactory.getLogger(BusinessService.class);
    private final BusinessRepository businessRepository;
    private final BookingRepository bookingRepository;

    public BusinessService(BusinessRepository businessRepository, BookingRepository bookingRepository) {
        this.businessRepository = businessRepository;
        this.bookingRepository = bookingRepository;
    }

    public List<Business> getAllBusinesses() {
        return businessRepository.findAll();
    }

    public Optional<Business> getBusinessById(Long id) {
        return businessRepository.findById(id);
    }

    @Transactional
    public Business saveBusiness(Business business) {
        if (business.getId() != null && business.getOwner() == null) {
            businessRepository.findById(business.getId()).ifPresent(existing -> {
                business.setOwner(existing.getOwner());
                log.debug("Preserved owner for business {} on update", business.getId());
            });
        }

        if (business.getId() != null) {
            businessRepository.findById(business.getId()).ifPresent(existing -> {
                Map<DayOfWeek, WorkingDaySlot> incoming = business.getWorkingSchedule();
                if (incoming == null || incoming.isEmpty()) {
                    business.setWorkingSchedule(existing.getWorkingSchedule());
                }
            });
        }

        // Normalize single vs multi category fields so both stay in sync.
        if (business.getCategories() == null || business.getCategories().isEmpty()) {
            if (business.getCategory() != null && !business.getCategory().isBlank()) {
                business.setCategories(List.of(business.getCategory()));
            }
        } else if (business.getCategory() == null || business.getCategory().isBlank()) {
            // Use the first category as the primary label for legacy consumers.
            business.setCategory(business.getCategories().get(0));
        }

        validateWorkingSchedule(business);
        return businessRepository.save(business);
    }

    private void validateWorkingSchedule(Business business) {
        Map<DayOfWeek, WorkingDaySlot> schedule = business.getWorkingSchedule();
        if (business.getId() == null && (schedule == null || schedule.isEmpty())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Working schedule is required");
        }
        // Legacy rows may have no schedule until owner saves hours once.
        if (schedule == null || schedule.isEmpty()) {
            return;
        }
        long enabledDays = schedule.values().stream()
                .filter(s -> s != null && s.isEnabled())
                .count();
        if (enabledDays < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least one working day must be enabled");
        }
        for (WorkingDaySlot slot : schedule.values()) {
            if (slot == null || !slot.isEnabled()) {
                continue;
            }
            String o = slot.getOpenTime();
            String c = slot.getCloseTime();
            if (o == null || c == null || o.isBlank() || c.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Open and close times are required for enabled days");
            }
            try {
                LocalTime open = LocalTime.parse(o.trim());
                LocalTime close = LocalTime.parse(c.trim());
                if (!open.isBefore(close)) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Open time must be before close time");
                }
            } catch (ResponseStatusException e) {
                throw e;
            } catch (Exception e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid working hours format (use HH:mm)");
            }
        }
    }

    public List<Business> findByCategory(String category) {
        // Support both legacy single category field and the new multi-category collection.
        List<Business> legacy = businessRepository.findByCategory(category);
        List<Business> multi = businessRepository.findByCategoriesContaining(category);

        if (legacy.isEmpty()) {
            return multi;
        }
        if (multi.isEmpty()) {
            return legacy;
        }

        // Merge without duplicates (by id).
        List<Business> combined = new java.util.ArrayList<>(legacy);
        java.util.Set<Long> seenIds = new java.util.HashSet<>();
        for (Business b : legacy) {
            if (b.getId() != null) {
                seenIds.add(b.getId());
            }
        }
        for (Business b : multi) {
            Long id = b.getId();
            if (id == null || !seenIds.contains(id)) {
                combined.add(b);
            }
        }
        return combined;
    }

    public List<Business> searchByAddress(String address) {
        return businessRepository.findByAddressContainingIgnoreCase(address);
    }

    public List<Business> getBusinessByOwnerId(Long ownerId) {
        return businessRepository.findByOwnerId(ownerId);
    }

    @Transactional
    public void deleteBusiness(Long id) {
        if (!businessRepository.existsById(id)) {
            throw new IllegalArgumentException("Business not found: " + id);
        }
        // Delete bookings that reference this business's services first (FK constraint)
        List<Booking> bookings = bookingRepository.findByServiceBusinessId(id);
        if (!bookings.isEmpty()) {
            bookingRepository.deleteAll(bookings);
        }
        businessRepository.deleteById(id);
    }
}
