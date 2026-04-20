package com.example.timskimilenici.controllers;

import com.example.timskimilenici.entities.Role;
import com.example.timskimilenici.entities.User;
import com.example.timskimilenici.services.AiChatService;
import com.example.timskimilenici.services.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
public class AiChatController {

    private static final Logger log = LoggerFactory.getLogger(AiChatController.class);
    private final AiChatService aiChatService;
    private final UserService userService;

    public AiChatController(AiChatService aiChatService, UserService userService) {
        this.aiChatService = aiChatService;
        this.userService = userService;
    }

    @SuppressWarnings("unchecked")
    @PostMapping
    public ResponseEntity<Map<String, String>> chat(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, Object> request
    ) {
        String message = (String) request.get("message");
        List<Map<String, String>> history = (List<Map<String, String>>) request.get("history");
        Map<String, Object> storeContext = (Map<String, Object>) request.get("storeContext");
        String rawMode = request.get("mode") instanceof String s ? s : null;

        if (message == null || message.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("reply", "Please provide a message."));
        }

        AiChatService.ChatMode mode = AiChatService.ChatMode.CUSTOMER;
        Long ownerUserId = null;
        if ("owner".equalsIgnoreCase(rawMode)) {
            if (userDetails == null) {
                return ResponseEntity.status(401).body(Map.of("reply", "Sign in as an owner to use dashboard chat."));
            }
            User user = userService.getUserByIdentifier(userDetails.getUsername());
            if (user == null || !hasOwnerRole(user)) {
                return ResponseEntity.status(403).body(Map.of("reply", "Owner dashboard chat is restricted to store owners."));
            }
            mode = AiChatService.ChatMode.OWNER;
            ownerUserId = user.getId();
        }

        try {
            String reply = aiChatService.chat(message, history, storeContext, mode, ownerUserId);
            return ResponseEntity.ok(Map.of("reply", reply));
        } catch (Exception e) {
            log.error("AI chat error", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("reply", "Sorry, I'm having trouble right now. Please try again later."));
        }
    }

    private static boolean hasOwnerRole(User user) {
        return user.getRole() == Role.OWNER;
    }
}
