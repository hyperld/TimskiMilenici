package com.example.timskimilenici.controllers;

import com.example.timskimilenici.services.AiChatService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
public class AiChatController {

    private static final Logger log = LoggerFactory.getLogger(AiChatController.class);
    private final AiChatService aiChatService;

    public AiChatController(AiChatService aiChatService) {
        this.aiChatService = aiChatService;
    }

    @SuppressWarnings("unchecked")
    @PostMapping
    public ResponseEntity<Map<String, String>> chat(@RequestBody Map<String, Object> request) {
        String message = (String) request.get("message");
        List<Map<String, String>> history = (List<Map<String, String>>) request.get("history");
        Map<String, Object> storeContext = (Map<String, Object>) request.get("storeContext");

        if (message == null || message.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("reply", "Please provide a message."));
        }

        try {
            String reply = aiChatService.chat(message, history, storeContext);
            return ResponseEntity.ok(Map.of("reply", reply));
        } catch (Exception e) {
            log.error("AI chat error", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("reply", "Sorry, I'm having trouble right now. Please try again later."));
        }
    }
}
