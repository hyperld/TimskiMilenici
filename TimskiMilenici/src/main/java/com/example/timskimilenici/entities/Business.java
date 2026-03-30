package com.example.timskimilenici.entities;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "businesses")
public class Business {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    /**
     * Primary category label kept for backward compatibility with older clients.
     * New implementations should prefer {@link #categories} for multi-type support.
     */
    @Column
    private String category;

    /**
     * One business can belong to multiple categories/types (e.g. Grooming, Veterinary).
     */
    @ElementCollection
    @CollectionTable(name = "business_categories", joinColumns = @JoinColumn(name = "business_id"))
    @Column(name = "category")
    private List<String> categories;

    /** Full address (street, city, postal code, country) for display and map geocoding */
    @Column
    private String address;

    @ElementCollection
    @CollectionTable(name = "business_images", joinColumns = @JoinColumn(name = "business_id"))
    @Column(name = "image_url")
    private List<String> imageUrls;

    @Column
    private String contactPhone;

    @Column
    private String contactEmail;

    @Column
    private String mainImageUrl;

    @ManyToOne
    @JoinColumn(name = "owner_user_id", referencedColumnName = "id")
    private User owner;

    @OneToMany(mappedBy = "business", cascade = CascadeType.ALL)
    @JsonManagedReference
    private List<PetService> services;

    @OneToMany(mappedBy = "business", cascade = CascadeType.ALL)
    @JsonManagedReference
    private List<Product> products;

    @Column
    private LocalDateTime createdAt;

    @Column
    private LocalDateTime updatedAt;

    /**
     * Weekly opening hours. Keys are {@link DayOfWeek} (serialized as MONDAY, TUESDAY, ... in JSON).
     */
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "business_working_schedule", joinColumns = @JoinColumn(name = "business_id"))
    @MapKeyColumn(name = "day_of_week")
    @MapKeyEnumerated(EnumType.STRING)
    private Map<DayOfWeek, WorkingDaySlot> workingSchedule = new EnumMap<>(DayOfWeek.class);

    protected Business() {}

    public Business(String name, String description, String category, User owner) {
        this.name = name;
        this.description = description;
        this.category = category;
        this.owner = owner;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public List<String> getCategories() { return categories; }
    public void setCategories(List<String> categories) { this.categories = categories; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public User getOwner() { return owner; }
    public void setOwner(User owner) { this.owner = owner; }
    public List<PetService> getServices() { return services; }
    public void setServices(List<PetService> services) { this.services = services; }
    public List<Product> getProducts() { return products; }
    public void setProducts(List<Product> products) { this.products = products; }
    public List<String> getImageUrls() { return imageUrls; }
    public void setImageUrls(List<String> imageUrls) { this.imageUrls = imageUrls; }
    public String getContactPhone() { return contactPhone; }
    public void setContactPhone(String contactPhone) { this.contactPhone = contactPhone; }
    public String getContactEmail() { return contactEmail; }
    public void setContactEmail(String contactEmail) { this.contactEmail = contactEmail; }
    public String getMainImageUrl() { return mainImageUrl; }
    public void setMainImageUrl(String mainImageUrl) { this.mainImageUrl = mainImageUrl; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    public Map<DayOfWeek, WorkingDaySlot> getWorkingSchedule() { return workingSchedule; }
    public void setWorkingSchedule(Map<DayOfWeek, WorkingDaySlot> workingSchedule) {
        this.workingSchedule = workingSchedule != null ? workingSchedule : new EnumMap<>(DayOfWeek.class);
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
