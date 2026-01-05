package com.example.timskimilenici.entities;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "pet_services")
public class PetService {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private BigDecimal price;

    @ManyToOne
    @JoinColumn(name = "business_id", nullable = false)
    private Business business;

    protected PetService() {}

    public PetService(String name, String description, BigDecimal price, Business business) {
        this.name = name;
        this.description = description;
        this.price = price;
        this.business = business;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public Business getBusiness() { return business; }
    public void setBusiness(Business business) { this.business = business; }
}
