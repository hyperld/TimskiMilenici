package com.example.timskimilenici.repositories;

import com.example.timskimilenici.entities.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    // Use nested property path: business.id
    List<Review> findByBusiness_IdOrderByCreatedAtDesc(Long businessId);
}

