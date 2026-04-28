package com.example.timskimilenici.repositories;

import com.example.timskimilenici.entities.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    // Use nested property path: business.id
    List<Review> findByBusiness_IdOrderByCreatedAtDesc(Long businessId);

    /**
     * Aggregate review counts and average rating for every business that has at
     * least one review. Returns rows of {@code [businessId, averageRating, count]}.
     * Issued as a single batch query so paint-time hydration of the "ratings on
     * every store card" use-case stays at O(1) database round trips.
     */
    @Query("""
           SELECT r.business.id, AVG(r.rating), COUNT(r)
             FROM Review r
            GROUP BY r.business.id
           """)
    List<Object[]> aggregateRatingsByBusiness();
}

