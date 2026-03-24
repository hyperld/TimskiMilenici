package com.example.timskimilenici.repositories;

import com.example.timskimilenici.entities.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByBusinessId(Long businessId);

    @Query("SELECT p FROM Product p WHERE p.promotionPrice IS NOT NULL AND p.promotionPrice < p.price")
    List<Product> findPromotedProducts();
}
