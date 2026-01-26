package com.example.timskimilenici.entities;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "products")
public class Product extends BaseItem {

    @Column(nullable = false)
    private Integer stockQuantity;

    public Product() {}

    public Product(String name, String description, BigDecimal price, Integer stockQuantity, Business business) {
        this.setName(name);
        this.setDescription(description);
        this.setPrice(price);
        this.setBusiness(business);
        this.stockQuantity = stockQuantity;
    }

    public Integer getStockQuantity() { return stockQuantity; }
    public void setStockQuantity(Integer stockQuantity) { this.stockQuantity = stockQuantity; }
}
