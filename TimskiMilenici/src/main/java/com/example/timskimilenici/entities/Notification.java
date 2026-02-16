package com.example.timskimilenici.entities;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @ManyToOne
    @JoinColumn(name = "sender_id")
    @JsonIgnoreProperties({"passwordHash", "email"})
    private User sender;

    @ManyToOne
    @JoinColumn(name = "receiver_id", nullable = false)
    @JsonIgnoreProperties({"passwordHash", "email"})
    private User receiver;

    @Column(nullable = false)
    private boolean dismissed = false;

    @Column(nullable = false)
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;

    protected Notification() {}

    public Notification(String message, User sender, User receiver) {
        this.message = message;
        this.sender = sender;
        this.receiver = receiver;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public User getSender() { return sender; }
    public void setSender(User sender) { this.sender = sender; }
    public User getReceiver() { return receiver; }
    public void setReceiver(User receiver) { this.receiver = receiver; }
    public boolean isDismissed() { return dismissed; }
    public void setDismissed(boolean dismissed) { this.dismissed = dismissed; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
