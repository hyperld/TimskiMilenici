package com.example.timskimilenici.repositories;

import com.example.timskimilenici.entities.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByUserId(Long userId);
    List<Booking> findByServiceBusinessId(Long businessId);
    List<Booking> findByService_Business_IdAndBookingTimeBetween(Long businessId, LocalDateTime start, LocalDateTime end);

    @Query("SELECT COUNT(b) FROM Booking b WHERE b.service.id = :serviceId AND b.bookingTime >= :start AND b.bookingTime < :end AND b.status != 'CANCELLED'")
    long countByServiceIdAndBookingTimeBetween(@Param("serviceId") Long serviceId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    /** Load booking with service and user only (for notification; business/owner loaded via separate query). */
    @Query("SELECT b FROM Booking b LEFT JOIN FETCH b.service LEFT JOIN FETCH b.user WHERE b.id = :id")
    Optional<Booking> findByIdWithServiceAndUser(@Param("id") Long id);

    /** Load booking with service, business, owner and user (for cancel notifications). */
    @Query("SELECT b FROM Booking b " +
           "LEFT JOIN FETCH b.service s LEFT JOIN FETCH s.business bus LEFT JOIN FETCH bus.owner " +
           "LEFT JOIN FETCH b.user " +
           "WHERE b.id = :id")
    Optional<Booking> findByIdWithServiceBusinessOwnerAndUser(@Param("id") Long id);
}
