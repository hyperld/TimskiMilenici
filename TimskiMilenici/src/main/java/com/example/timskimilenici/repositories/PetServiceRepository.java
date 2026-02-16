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

    /** Load service with business and owner (for notifications). */
    @Query("SELECT s FROM PetService s LEFT JOIN FETCH s.business b LEFT JOIN FETCH b.owner WHERE s.id = :id")
    Optional<PetService> findByIdWithBusinessAndOwner(@Param("id") Long id);
}
