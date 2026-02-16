package com.example.timskimilenici.services;

import com.example.timskimilenici.entities.Booking;
import com.example.timskimilenici.entities.PetService;
import com.example.timskimilenici.repositories.BookingRepository;
import com.example.timskimilenici.repositories.PetServiceRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class BookingService {

    private static final Logger log = LoggerFactory.getLogger(BookingService.class);
    private final BookingRepository bookingRepository;
    private final PetServiceRepository petServiceRepository;
    private final NotificationService notificationService;

    public BookingService(BookingRepository bookingRepository, PetServiceRepository petServiceRepository,
                          NotificationService notificationService) {
        this.bookingRepository = bookingRepository;
        this.petServiceRepository = petServiceRepository;
        this.notificationService = notificationService;
    }

    @Transactional
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

    public List<Booking> getBookingsByStoreAndDate(Long businessId, LocalDate date) {
        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end = date.atTime(LocalTime.MAX);
        return bookingRepository.findByService_Business_IdAndBookingTimeBetween(businessId, start, end);
    }

    public List<Booking> getBookingsByStoreInRange(Long businessId, LocalDate startDate, LocalDate endDate) {
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(LocalTime.MAX);
        return bookingRepository.findByService_Business_IdAndBookingTimeBetween(businessId, start, end);
    }

    @Transactional
    public void updateBookingStatus(Long bookingId, Booking.BookingStatus status) {
        bookingRepository.findById(bookingId).ifPresent(booking -> {
            booking.setStatus(status);
            bookingRepository.save(booking);
            if (status == Booking.BookingStatus.CANCELLED) {
                try {
                    notificationService.notifyBookingCancelledByUser(bookingId);
                } catch (Exception e) {
                    // do not fail status update if notification fails
                }
            }
        });
    }

    /**
     * Delete a booking (e.g. when store owner dismisses it). Notifies the user that the business cancelled.
     */
    @Transactional
    public void deleteBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        try {
            notificationService.notifyBookingCancelledByBusiness(bookingId);
        } catch (Exception e) {
            // do not fail delete if notification fails
        }
        bookingRepository.deleteById(bookingId);
    }
}
