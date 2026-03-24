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

    @Column(nullable = false)
    private BigDecimal price;

    @Column(name = "promotion_price")
    private BigDecimal promotionPrice;

    @ManyToOne
    @JoinColumn(name = "business_id", nullable = false)
    @JsonBackReference
    private Business business;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) {
        if (price == null || price.signum() <= 0) {
            throw new IllegalArgumentException("Price must be positive.");
        }
        this.price = price;
        validatePromotionPrice(this.promotionPrice, this.price);
    }
    public BigDecimal getPromotionPrice() { return promotionPrice; }
    public void setPromotionPrice(BigDecimal promotionPrice) {
        if (promotionPrice != null && promotionPrice.signum() <= 0) {
            throw new IllegalArgumentException("Promotion price must be positive.");
        }
        validatePromotionPrice(promotionPrice, this.price);
        this.promotionPrice = promotionPrice;
    }
    public Business getBusiness() { return business; }
    public void setBusiness(Business business) { this.business = business; }

    @JsonProperty("effectivePrice")
    public BigDecimal getEffectivePrice() {
        return hasValidPromotion() ? promotionPrice : price;
    }

    @JsonProperty("onSale")
    public boolean hasValidPromotion() {
        return promotionPrice != null && price != null && promotionPrice.compareTo(price) < 0;
    }

    private void validatePromotionPrice(BigDecimal promo, BigDecimal basePrice) {
        if (promo != null && basePrice != null && promo.compareTo(basePrice) >= 0) {
            throw new IllegalArgumentException("Promotion price must be lower than base price.");
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
