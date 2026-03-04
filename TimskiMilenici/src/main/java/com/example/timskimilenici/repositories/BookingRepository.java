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

    @Query("""
           SELECT DATE(b.bookingTime) AS day,
                  COUNT(b) AS bookings,
                  SUM(CASE WHEN b.status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed,
                  SUM(CASE WHEN b.status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled,
                  SUM(CASE WHEN b.status = 'COMPLETED' THEN COALESCE(ps.price, 0) ELSE 0 END) AS revenue
           FROM Booking b
           JOIN b.service ps
           JOIN ps.business biz
           WHERE biz.owner.id = :ownerId
             AND b.bookingTime >= :from
             AND b.bookingTime <= :to
             AND (:businessId IS NULL OR biz.id = :businessId)
           GROUP BY DATE(b.bookingTime)
           ORDER BY day ASC
           """)
    List<Object[]> aggregateOverviewByOwnerAndDate(@Param("ownerId") Long ownerId,
                                                   @Param("from") LocalDateTime from,
                                                   @Param("to") LocalDateTime to,
                                                   @Param("businessId") Long businessId);

    @Query("""
           SELECT ps.id AS serviceId,
                  ps.name AS serviceName,
                  COUNT(b) AS bookings,
                  SUM(CASE WHEN b.status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed,
                  SUM(CASE WHEN b.status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled,
                  SUM(CASE WHEN b.status = 'COMPLETED' THEN COALESCE(ps.price, 0) ELSE 0 END) AS revenue
           FROM Booking b
           JOIN b.service ps
           JOIN ps.business biz
           WHERE biz.owner.id = :ownerId
             AND b.bookingTime >= :from
             AND b.bookingTime <= :to
             AND (:businessId IS NULL OR biz.id = :businessId)
           GROUP BY ps.id, ps.name
           ORDER BY bookings DESC
           """)
    List<Object[]> aggregateServicePerformance(@Param("ownerId") Long ownerId,
                                               @Param("from") LocalDateTime from,
                                               @Param("to") LocalDateTime to,
                                               @Param("businessId") Long businessId);

    @Query(value = """
           SELECT EXTRACT(DOW FROM b.booking_time)  AS dow,
                  EXTRACT(HOUR FROM b.booking_time) AS hour,
                  COUNT(b.id)                       AS bookings
           FROM bookings b
           JOIN pet_services ps ON ps.id = b.service_id
           JOIN businesses biz  ON biz.id = ps.business_id
           WHERE biz.owner_user_id = :ownerId
             AND b.booking_time >= :from
             AND b.booking_time <= :to
             AND (:businessId IS NULL OR biz.id = :businessId)
           GROUP BY EXTRACT(DOW FROM b.booking_time), EXTRACT(HOUR FROM b.booking_time)
           """, nativeQuery = true)
    List<Object[]> aggregatePeakTimes(@Param("ownerId") Long ownerId,
                                      @Param("from") LocalDateTime from,
                                      @Param("to") LocalDateTime to,
                                      @Param("businessId") Long businessId);
}
