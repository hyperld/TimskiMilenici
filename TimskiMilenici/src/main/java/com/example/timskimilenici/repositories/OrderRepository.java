package com.example.timskimilenici.repositories;

import com.example.timskimilenici.entities.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.time.LocalDateTime;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    @Query("SELECT o.id FROM Order o JOIN o.items oi JOIN oi.product p WHERE p.business.id = :businessId ORDER BY o.createdAt DESC")
    List<Long> findOrderIdsByBusinessId(@Param("businessId") Long businessId);

    @Query("SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.user LEFT JOIN FETCH o.items oi LEFT JOIN FETCH oi.product p LEFT JOIN FETCH p.business WHERE o.id IN :ids ORDER BY o.createdAt DESC")
    List<Order> findByIdInWithUserAndItems(@Param("ids") List<Long> ids);

    @Query(value = """
            SELECT p.id                                AS product_id,
                   p.name                              AS product_name,
                   SUM(oi.quantity)                    AS units_sold,
                   COUNT(DISTINCT o.id)                AS orders_count,
                   SUM(oi.quantity * oi.price_at_order) AS revenue
            FROM orders o
            JOIN order_items oi ON oi.order_id = o.id
            JOIN products p     ON p.id = oi.product_id
            JOIN businesses b   ON b.id = p.business_id
            WHERE b.owner_user_id = :ownerId
              AND o.created_at >= :from
              AND o.created_at <= :to
              AND (:businessId IS NULL OR b.id = :businessId)
            GROUP BY p.id, p.name
            ORDER BY units_sold DESC
            """,
            nativeQuery = true)
    List<Object[]> aggregateProductSalesByOwner(@Param("ownerId") Long ownerId,
                                                @Param("from") LocalDateTime from,
                                                @Param("to") LocalDateTime to,
                                                @Param("businessId") Long businessId);
}
