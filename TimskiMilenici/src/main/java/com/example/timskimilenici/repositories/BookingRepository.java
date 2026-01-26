package com.example.timskimilenici.repositories;

import com.example.timskimilenici.entities.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByUserId(Long userId);
    List<Booking> findByServiceBusinessId(Long businessId);

    @Query("SELECT COUNT(b) FROM Booking b WHERE b.service.id = :serviceId AND b.bookingTime >= :start AND b.bookingTime < :end AND b.status != 'CANCELLED'")
    long countByServiceIdAndBookingTimeBetween(@Param("serviceId") Long serviceId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
