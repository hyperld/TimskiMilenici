package com.example.timskimilenici.controllers;

import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/ai-vet")
public class AiVetController {

    @PostMapping("/chat")
    public Map<String, String> chat(@RequestBody Map<String, String> message) {
        String userMessage = message.get("message");
        
        // This is a stub for the AI Vet response.
        // In a real implementation, this would call an external LLM API (OpenAI, etc.)
        String response = "AI Vet: I understand you are asking about '" + userMessage + "'. " +
                          "Please remember that I am an AI and not a licensed veterinarian. " +
                          "For urgent issues, please visit a real clinic.";
        
        return Map.of("response", response);
    }
}
