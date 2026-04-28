package com.example.timskimilenici.entities;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.math.BigDecimal;

@MappedSuperclass
public abstract class BaseItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    /**
     * The regular price of the item. Mapped to the legacy {@code price} column
     * so existing rows keep working without a database migration.
     */
    @Column(name = "price", nullable = false)
    private BigDecimal originalPrice;

    /**
     * Optional discounted price set when a special offer is active for this
     * item. When present and lower than {@link #originalPrice}, it becomes the
     * {@link #getCurrentPrice() current price} that is displayed and applied
     * everywhere (cart, checkout, analytics, etc.).
     */
    @Column(name = "promotion_price")
    private BigDecimal promotionPrice;

    @ManyToOne
    @JoinColumn(name = "business_id", nullable = false)
    @JsonBackReference
    private Business business;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public BigDecimal getOriginalPrice() { return originalPrice; }
    public void setOriginalPrice(BigDecimal originalPrice) {
        if (originalPrice == null || originalPrice.signum() <= 0) {
            throw new IllegalArgumentException("Original price must be positive.");
        }
        this.originalPrice = originalPrice;
        validatePromotionPrice(this.promotionPrice, this.originalPrice);
    }

    public BigDecimal getPromotionPrice() { return promotionPrice; }
    public void setPromotionPrice(BigDecimal promotionPrice) {
        if (promotionPrice != null && promotionPrice.signum() <= 0) {
            throw new IllegalArgumentException("Promotion price must be positive.");
        }
        validatePromotionPrice(promotionPrice, this.originalPrice);
        this.promotionPrice = promotionPrice;
    }

    public Business getBusiness() { return business; }
    public void setBusiness(Business business) { this.business = business; }

    /**
     * The price that is displayed and applied everywhere. Equals
     * {@link #originalPrice} unless an active special offer (a valid
     * {@link #promotionPrice}) discounts it below the original.
     */
    @JsonProperty("currentPrice")
    public BigDecimal getCurrentPrice() {
        return hasSpecialOffer() ? promotionPrice : originalPrice;
    }

    /** True when an active special offer makes {@link #getCurrentPrice()} lower than {@link #originalPrice}. */
    @JsonProperty("onSale")
    public boolean hasSpecialOffer() {
        return promotionPrice != null
                && originalPrice != null
                && promotionPrice.compareTo(originalPrice) < 0;
    }

    private void validatePromotionPrice(BigDecimal promo, BigDecimal basePrice) {
        if (promo != null && basePrice != null && promo.compareTo(basePrice) >= 0) {
            throw new IllegalArgumentException("Promotion price must be lower than the original price.");
        }
    }

    @JsonProperty("businessId")
    public Long resolveBusinessId() {
        return business != null ? business.getId() : null;
    }

    @JsonProperty("businessName")
    public String resolveBusinessName() {
        return business != null ? business.getName() : null;
    }
}
