package com.example.timskimilenici.repositories;

import com.example.timskimilenici.entities.PetService;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PetServiceRepository extends JpaRepository<PetService, Long> {
    List<PetService> findByBusinessId(Long businessId);
}
