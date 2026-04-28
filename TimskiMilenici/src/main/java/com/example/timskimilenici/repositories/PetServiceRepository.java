package com.example.timskimilenici.repositories;

import com.example.timskimilenici.entities.PetService;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PetServiceRepository extends JpaRepository<PetService, Long> {
    List<PetService> findByBusinessId(Long businessId);

    @Query("SELECT s FROM PetService s WHERE s.promotionPrice IS NOT NULL AND s.promotionPrice < s.originalPrice")
    List<PetService> findPromotedServices();

    /** Load service with business and owner (for notifications). */
    @Query("SELECT s FROM PetService s LEFT JOIN FETCH s.business b LEFT JOIN FETCH b.owner WHERE s.id = :id")
    Optional<PetService> findByIdWithBusinessAndOwner(@Param("id") Long id);

    /**
     * Top services globally, ranked by booking count. Cancelled bookings do
     * not count toward popularity. Services with no bookings still appear
     * (sorted to the bottom) so the UI doesn't end up empty when the
     * catalogue is small. One aggregating query, no N+1.
     *
     * @return rows of {@code [serviceId, bookingsCount]} ordered desc by count.
     */
    @Query(value = """
            SELECT s.id,
                   COALESCE(SUM(CASE WHEN b.status <> 'CANCELLED' THEN 1 ELSE 0 END), 0) AS bookings_count
              FROM pet_services s
              LEFT JOIN bookings b ON b.service_id = s.id
             GROUP BY s.id
             ORDER BY bookings_count DESC, s.id ASC
             LIMIT :limit
            """, nativeQuery = true)
    List<Object[]> findTopServiceIdsByBookings(@Param("limit") int limit);
}
