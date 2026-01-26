package com.example.timskimilenici.controllers;

import com.example.timskimilenici.entities.Booking;
import com.example.timskimilenici.services.BookingService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping
    public Booking create(@RequestBody Booking booking) {
        return bookingService.createBooking(booking);
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

    @PatchMapping("/{id}/status")
    public void updateStatus(@PathVariable Long id, @RequestParam Booking.BookingStatus status) {
        bookingService.updateBookingStatus(id, status);
    }
}
