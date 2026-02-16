package com.example.timskimilenici.controllers;

import com.example.timskimilenici.entities.Notification;
import com.example.timskimilenici.entities.User;
import com.example.timskimilenici.services.NotificationService;
import com.example.timskimilenici.services.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final UserService userService;

    public NotificationController(NotificationService notificationService, UserService userService) {
        this.notificationService = notificationService;
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<List<Notification>> getMyNotifications(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userService.getUserByIdentifier(userDetails.getUsername());
        List<Notification> list = notificationService.getByReceiver(user.getId());
        return ResponseEntity.ok(list);
    }

    @PatchMapping("/{id}/dismiss")
    public ResponseEntity<Void> dismiss(@PathVariable Long id, @AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userService.getUserByIdentifier(userDetails.getUsername());
        notificationService.dismiss(id, user.getId());
        return ResponseEntity.noContent().build();
    }
}
