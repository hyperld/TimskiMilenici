package com.example.timskimilenici.controllers;

import com.example.timskimilenici.entities.Booking;
import com.example.timskimilenici.services.BookingService;
import com.example.timskimilenici.services.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private static final Logger log = LoggerFactory.getLogger(BookingController.class);
    private final BookingService bookingService;
    private final NotificationService notificationService;

    public BookingController(BookingService bookingService, NotificationService notificationService) {
        this.bookingService = bookingService;
        this.notificationService = notificationService;
    }

    @PostMapping
    public Booking create(@RequestBody Booking booking) {
        Booking saved = bookingService.createBooking(booking);
        log.info("Booking created id={}, calling notifyBookingCreated", saved.getId());
        try {
            notificationService.notifyBookingCreated(saved.getId());
            log.info("notifyBookingCreated completed for booking id={}", saved.getId());
        } catch (Exception e) {
            log.warn("notifyBookingCreated failed for booking id={}: {}", saved.getId(), e.getMessage(), e);
        }
        return saved;
    }

    @GetMapping("/full-dates/{serviceId}")
    public List<LocalDate> getFullDates(
            @PathVariable Long serviceId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        return bookingService.getFullDates(serviceId, start, end);
    }

    @GetMapping("/user/{userId}")
    public List<Booking> getByUser(@PathVariable Long userId) {
        return bookingService.getBookingsByUser(userId);
    }

    @GetMapping("/business/{businessId}")
    public List<Booking> getByBusiness(@PathVariable Long businessId) {
        return bookingService.getBookingsByBusiness(businessId);
    }

    /**
     * Get bookings for a store (business). Optional: single date or date range.
     * GET /api/bookings/store/{storeId}?date=YYYY-MM-DD
     * GET /api/bookings/store/{storeId}?start=YYYY-MM-DD&end=YYYY-MM-DD
     */
    @GetMapping("/store/{storeId}")
    public List<Booking> getByStore(
            @PathVariable Long storeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        if (date != null) {
            return bookingService.getBookingsByStoreAndDate(storeId, date);
        }
        if (start != null && end != null) {
            return bookingService.getBookingsByStoreInRange(storeId, start, end);
        }
        return bookingService.getBookingsByBusiness(storeId);
    }

    @PatchMapping("/{id}/status")
    public void updateStatus(@PathVariable Long id, @RequestParam Booking.BookingStatus status) {
        bookingService.updateBookingStatus(id, status);
    }

    /**
     * Delete a booking (e.g. when store owner dismisses it).
     * DELETE /api/bookings/{id}
     */
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        bookingService.deleteBooking(id);
    }
}
