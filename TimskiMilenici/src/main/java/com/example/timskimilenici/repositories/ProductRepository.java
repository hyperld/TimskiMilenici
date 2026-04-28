package com.example.timskimilenici.repositories;

import com.example.timskimilenici.entities.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByBusinessId(Long businessId);

    @Query("SELECT p FROM Product p WHERE p.promotionPrice IS NOT NULL AND p.promotionPrice < p.originalPrice")
    List<Product> findPromotedProducts();

    /**
     * Top products globally, ranked by units sold across all orders. Products
     * with no sales fall to the bottom but are still returned so the UI can
     * fill the page when the catalogue is small. Uses a single aggregating
     * query (no per-product round trips).
     *
     * @return rows of {@code [productId, unitsSold]} ordered desc by units.
     */
    @Query(value = """
            SELECT p.id, COALESCE(SUM(oi.quantity), 0) AS units_sold
              FROM products p
              LEFT JOIN order_items oi ON oi.product_id = p.id
             GROUP BY p.id
             ORDER BY units_sold DESC, p.id ASC
             LIMIT :limit
            """, nativeQuery = true)
    List<Object[]> findTopProductIdsBySales(@Param("limit") int limit);
}
