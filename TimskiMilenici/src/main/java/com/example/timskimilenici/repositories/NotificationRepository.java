package com.example.timskimilenici.repositories;

import com.example.timskimilenici.entities.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByReceiverIdAndDismissedFalseOrderByCreatedAtDesc(Long receiverId);

    List<Notification> findByReceiverIdOrderByCreatedAtDesc(Long receiverId);
}
