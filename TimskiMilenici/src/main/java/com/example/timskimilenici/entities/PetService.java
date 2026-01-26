package com.example.timskimilenici.entities;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "pet_services")
public class PetService extends BaseItem {

    @Column(nullable = false)
    private Integer capacity;

    @Column
    private Integer durationMinutes;

    public PetService() {}

    public PetService(String name, String description, BigDecimal price, Integer capacity, Business business) {
        this.setName(name);
        this.setDescription(description);
        this.setPrice(price);
        this.setBusiness(business);
        this.capacity = capacity;
    }

    public Integer getCapacity() { return capacity; }
    public void setCapacity(Integer capacity) { this.capacity = capacity; }
    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }
}
