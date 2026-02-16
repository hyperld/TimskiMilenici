package com.example.timskimilenici.repositories;

import com.example.timskimilenici.entities.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    @Query("SELECT o.id FROM Order o JOIN o.items oi JOIN oi.product p WHERE p.business.id = :businessId ORDER BY o.createdAt DESC")
    List<Long> findOrderIdsByBusinessId(@Param("businessId") Long businessId);

    @Query("SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.user LEFT JOIN FETCH o.items oi LEFT JOIN FETCH oi.product p LEFT JOIN FETCH p.business WHERE o.id IN :ids ORDER BY o.createdAt DESC")
    List<Order> findByIdInWithUserAndItems(@Param("ids") List<Long> ids);
}
