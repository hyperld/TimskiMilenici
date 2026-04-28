package com.example.timskimilenici.services;

import com.example.timskimilenici.entities.Booking;
import com.example.timskimilenici.entities.Business;
import com.example.timskimilenici.entities.WorkingDaySlot;
import com.example.timskimilenici.repositories.BookingRepository;
import com.example.timskimilenici.repositories.BusinessRepository;
import com.example.timskimilenici.repositories.ReviewRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

@Service
public class BusinessService {

    private static final Logger log = LoggerFactory.getLogger(BusinessService.class);
    private static final double EARTH_RADIUS_KM = 6371.0088;

    private final BusinessRepository businessRepository;
    private final BookingRepository bookingRepository;
    private final ReviewRepository reviewRepository;
    private final MapboxGeocodingService geocoder;

    public BusinessService(BusinessRepository businessRepository,
                           BookingRepository bookingRepository,
                           ReviewRepository reviewRepository,
                           MapboxGeocodingService geocoder) {
        this.businessRepository = businessRepository;
        this.bookingRepository = bookingRepository;
        this.reviewRepository = reviewRepository;
        this.geocoder = geocoder;
    }

    public List<Business> getAllBusinesses() {
        List<Business> all = businessRepository.findAll();
        hydrateRatings(all);
        return all;
    }

    public Optional<Business> getBusinessById(Long id) {
        Optional<Business> b = businessRepository.findById(id);
        b.ifPresent(business -> hydrateRatings(List.of(business)));
        return b;
    }

    /**
     * Top businesses by average review rating. Reviews-light businesses keep
     * their natural rating (no smoothing) but the tie-breaker pushes
     * highly-rated stores with more reviews above ones with a single 5★.
     * Businesses without any reviews are appended at the bottom so the
     * "Top Stores" tile is never empty on a fresh deployment. The whole thing
     * runs on top of the existing aggregate query (one DB call) plus an
     * in-memory sort, so it stays cheap even when the catalogue grows.
     */
    public List<Business> getTopBusinesses(Integer limit) {
        List<Business> all = businessRepository.findAll();
        hydrateRatings(all);
        all.sort((a, b) -> {
            double ar = a.getAverageRating() != null ? a.getAverageRating() : -1;
            double br = b.getAverageRating() != null ? b.getAverageRating() : -1;
            int cmp = Double.compare(br, ar);
            if (cmp != 0) return cmp;
            long ac = a.getReviewCount() != null ? a.getReviewCount() : 0;
            long bc = b.getReviewCount() != null ? b.getReviewCount() : 0;
            cmp = Long.compare(bc, ac);
            if (cmp != 0) return cmp;
            String an = a.getName() != null ? a.getName() : "";
            String bn = b.getName() != null ? b.getName() : "";
            return an.compareToIgnoreCase(bn);
        });
        if (limit != null && limit > 0 && all.size() > limit) {
            return new ArrayList<>(all.subList(0, limit));
        }
        return all;
    }

    /**
     * Populate the transient {@code averageRating} / {@code reviewCount} fields
     * on every supplied business in a single batch query. Cheaper than fetching
     * reviews per business and avoids N+1 round trips on the listing screens.
     */
    public void hydrateRatings(Collection<Business> businesses) {
        if (businesses == null || businesses.isEmpty()) return;
        Map<Long, double[]> aggregates = new HashMap<>();
        for (Object[] row : reviewRepository.aggregateRatingsByBusiness()) {
            if (row == null || row.length < 3 || row[0] == null) continue;
            Long id = ((Number) row[0]).longValue();
            double avg = row[1] instanceof Number ? ((Number) row[1]).doubleValue() : 0.0;
            long count = row[2] instanceof Number ? ((Number) row[2]).longValue() : 0L;
            aggregates.put(id, new double[]{avg, count});
        }
        for (Business b : businesses) {
            double[] agg = b.getId() != null ? aggregates.get(b.getId()) : null;
            if (agg != null) {
                b.setAverageRating(agg[0]);
                b.setReviewCount((long) agg[1]);
            } else {
                b.setAverageRating(0.0);
                b.setReviewCount(0L);
            }
        }
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
        applyGeocodingIfNeeded(business);
        return businessRepository.save(business);
    }

    /**
     * Geocode the business address into lat/lng when the address changed or
     * no coordinates have been persisted yet. Failures are swallowed so a save
     * never fails because of a geocoder outage.
     */
    private void applyGeocodingIfNeeded(Business business) {
        String address = business.getAddress();
        if (address == null || address.isBlank()) {
            return;
        }

        boolean needsGeocode = business.getLatitude() == null || business.getLongitude() == null;
        if (!needsGeocode && business.getId() != null) {
            // Re-geocode when the address string has changed.
            Business existing = businessRepository.findById(business.getId()).orElse(null);
            if (existing != null && !Objects.equals(existing.getAddress(), address)) {
                needsGeocode = true;
            }
        }
        if (!needsGeocode) {
            return;
        }

        geocoder.geocode(address).ifPresent(coords -> {
            business.setLongitude(coords[0]);
            business.setLatitude(coords[1]);
            log.debug("Geocoded business '{}' → ({}, {}).", business.getName(), coords[1], coords[0]);
        });
    }

    /**
     * Fill lat/lng for every persisted business that still has a blank
     * coordinate. Safe to call repeatedly. Returns the number of rows updated.
     */
    @Transactional
    public int backfillMissingCoordinates() {
        List<Business> all = businessRepository.findAll();
        int updated = 0;
        for (Business b : all) {
            if (b.getAddress() == null || b.getAddress().isBlank()) continue;
            if (b.getLatitude() != null && b.getLongitude() != null) continue;
            Optional<double[]> coords = geocoder.geocode(b.getAddress());
            if (coords.isPresent()) {
                b.setLongitude(coords.get()[0]);
                b.setLatitude(coords.get()[1]);
                businessRepository.save(b);
                updated++;
            }
        }
        if (updated > 0) {
            log.info("Backfilled coordinates for {} business row(s).", updated);
        }
        return updated;
    }

    /**
     * Find businesses within a given radius (km) of the supplied coordinates.
     * Uses a cheap bounding-box pre-filter in memory (could be pushed to SQL later)
     * and refines with the Haversine formula.
     */
    public List<BusinessWithDistance> findNearby(double lat, double lng, double radiusKm, Integer limit) {
        // Cap at ~half the earth's circumference so callers can request
        // "distance to every geocoded store" with a sentinel huge radius.
        double effectiveRadius = radiusKm <= 0 ? 10 : Math.min(radiusKm, 20037);
        double latDelta = Math.toDegrees(effectiveRadius / EARTH_RADIUS_KM);
        // Avoid division by zero at the poles.
        double cosLat = Math.max(Math.cos(Math.toRadians(lat)), 0.000001);
        double lngDelta = latDelta / cosLat;

        double minLat = lat - latDelta;
        double maxLat = lat + latDelta;
        double minLng = lng - lngDelta;
        double maxLng = lng + lngDelta;

        List<Business> candidates =
                businessRepository.findByLatitudeBetweenAndLongitudeBetween(minLat, maxLat, minLng, maxLng);

        List<Business> matchedBusinesses = new ArrayList<>();
        List<BusinessWithDistance> results = new ArrayList<>();
        for (Business b : candidates) {
            if (b.getLatitude() == null || b.getLongitude() == null) continue;
            double d = haversineKm(lat, lng, b.getLatitude(), b.getLongitude());
            if (d <= effectiveRadius) {
                matchedBusinesses.add(b);
                results.add(new BusinessWithDistance(b, d));
            }
        }
        hydrateRatings(matchedBusinesses);
        results.sort(Comparator.comparingDouble(BusinessWithDistance::getDistanceKm));
        if (limit != null && limit > 0 && results.size() > limit) {
            return results.subList(0, limit);
        }
        return results;
    }

    private static double haversineKm(double lat1, double lng1, double lat2, double lng2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double rLat1 = Math.toRadians(lat1);
        double rLat2 = Math.toRadians(lat2);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return EARTH_RADIUS_KM * c;
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

        List<Business> combined;
        if (legacy.isEmpty()) {
            combined = multi;
        } else if (multi.isEmpty()) {
            combined = legacy;
        } else {
            // Merge without duplicates (by id).
            combined = new java.util.ArrayList<>(legacy);
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
        }
        hydrateRatings(combined);
        return combined;
    }

    public List<Business> searchByAddress(String address) {
        List<Business> results = businessRepository.findByAddressContainingIgnoreCase(address);
        hydrateRatings(results);
        return results;
    }

    public List<Business> getBusinessByOwnerId(Long ownerId) {
        List<Business> results = businessRepository.findByOwnerId(ownerId);
        hydrateRatings(results);
        return results;
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
