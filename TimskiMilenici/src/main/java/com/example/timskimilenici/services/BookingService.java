package com.example.timskimilenici.services;

import com.example.timskimilenici.entities.Booking;
import com.example.timskimilenici.entities.PetService;
import com.example.timskimilenici.repositories.BookingRepository;
import com.example.timskimilenici.repositories.PetServiceRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final PetServiceRepository petServiceRepository;

    public BookingService(BookingRepository bookingRepository, PetServiceRepository petServiceRepository) {
        this.bookingRepository = bookingRepository;
        this.petServiceRepository = petServiceRepository;
    }

    public Booking createBooking(Booking booking) {
        if (!isAvailable(booking.getService().getId(), booking.getBookingTime().toLocalDate())) {
            throw new RuntimeException("Service is full for the selected date");
        }
        return bookingRepository.save(booking);
    }

    public boolean isAvailable(Long serviceId, LocalDate date) {
        PetService service = petServiceRepository.findById(serviceId)
                .orElseThrow(() -> new RuntimeException("Service not found"));

        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.atTime(LocalTime.MAX);

        long count = bookingRepository.countByServiceIdAndBookingTimeBetween(serviceId, startOfDay, endOfDay);
        return count < service.getCapacity();
    }

    public List<LocalDate> getFullDates(Long serviceId, LocalDate start, LocalDate end) {
        List<LocalDate> fullDates = new ArrayList<>();
        for (LocalDate date = start; !date.isAfter(end); date = date.plusDays(1)) {
            if (!isAvailable(serviceId, date)) {
                fullDates.add(date);
            }
        }
        return fullDates;
    }

    public List<Booking> getBookingsByUser(Long userId) {
        return bookingRepository.findByUserId(userId);
    }

    public List<Booking> getBookingsByBusiness(Long businessId) {
        return bookingRepository.findByServiceBusinessId(businessId);
    }

    public void updateBookingStatus(Long bookingId, Booking.BookingStatus status) {
        bookingRepository.findById(bookingId).ifPresent(booking -> {
            booking.setStatus(status);
            bookingRepository.save(booking);
        });
    }
}
