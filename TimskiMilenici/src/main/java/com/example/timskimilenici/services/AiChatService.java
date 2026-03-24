package com.example.timskimilenici.services;

import com.example.timskimilenici.entities.Business;
import com.example.timskimilenici.entities.PetService;
import com.example.timskimilenici.entities.Product;
import com.example.timskimilenici.repositories.BusinessRepository;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class AiChatService {

    private static final String BASE_SYSTEM_PROMPT =
            "You are PawPal, a friendly AI assistant for a pet care marketplace app called PetPal. " +
            "You help users find pet stores, products, services, and answer questions about pet health and care. " +
            "Keep answers concise and helpful. Do not use markdown formatting in your responses. " +
            "When a user asks about stores, products, or services, ONLY recommend stores and items that exist on the PetPal platform (listed below). " +
            "Never invent stores or products that are not in the catalog. " +
            "If the user is browsing a specific store, prioritize information about that store.";

    private final ChatClient chatClient;
    private final BusinessRepository businessRepository;

    public AiChatService(ChatClient.Builder chatClientBuilder, BusinessRepository businessRepository) {
        this.chatClient = chatClientBuilder.build();
        this.businessRepository = businessRepository;
    }

    public String chat(String userMessage, List<Map<String, String>> history, Map<String, Object> storeContext) {
        List<Message> messages = new ArrayList<>();

        String systemPrompt = BASE_SYSTEM_PROMPT;
        systemPrompt += buildPlatformCatalog();

        if (storeContext != null && storeContext.get("name") != null) {
            systemPrompt += buildStoreContextPrompt(storeContext);
        }
        messages.add(new SystemMessage(systemPrompt));

        if (history != null) {
            for (Map<String, String> msg : history) {
                String role = msg.get("role");
                String content = msg.get("content");
                if (content == null) continue;
                if ("user".equals(role)) {
                    messages.add(new UserMessage(content));
                } else if ("assistant".equals(role)) {
                    messages.add(new AssistantMessage(content));
                }   
            }
        }

        messages.add(new UserMessage(userMessage));

        Prompt prompt = new Prompt(messages);
        return chatClient.prompt(prompt).call().content();
    }

    private String buildPlatformCatalog() {
        List<Business> allStores = businessRepository.findAll();
        if (allStores.isEmpty()) {
            return "\n\nThe PetPal platform currently has no stores listed.";
        }

        StringBuilder sb = new StringBuilder();
        sb.append("\n\n=== PetPal Platform Catalog ===\n");
        sb.append("The following stores are available on PetPal:\n");

        for (Business store : allStores) {
            sb.append("\n- Store: \"").append(store.getName()).append("\"");
            if (store.getAddress() != null && !store.getAddress().isEmpty()) {
                sb.append(" | Address: ").append(store.getAddress());
            }
            List<String> cats = store.getCategories();
            if (cats != null && !cats.isEmpty()) {
                sb.append(" | Categories: ").append(String.join(", ", cats));
            } else if (store.getCategory() != null) {
                sb.append(" | Category: ").append(store.getCategory());
            }
            if (store.getDescription() != null && !store.getDescription().isEmpty()) {
                sb.append(" | About: ").append(store.getDescription());
            }

            List<PetService> services = store.getServices();
            if (services != null && !services.isEmpty()) {
                sb.append("\n  Services: ");
                for (int i = 0; i < services.size(); i++) {
                    PetService svc = services.get(i);
                    if (i > 0) sb.append(", ");
                    sb.append(svc.getName()).append(" ($").append(svc.getPrice()).append(")");
                }
            }

            List<Product> products = store.getProducts();
            if (products != null && !products.isEmpty()) {
                sb.append("\n  Products: ");
                for (int i = 0; i < products.size(); i++) {
                    Product prod = products.get(i);
                    if (i > 0) sb.append(", ");
                    sb.append(prod.getName()).append(" ($").append(prod.getPrice()).append(")");
                }
            }
        }

        sb.append("\n=== End of Catalog ===");
        return sb.toString();
    }

    @SuppressWarnings("unchecked")
    private String buildStoreContextPrompt(Map<String, Object> ctx) {
        StringBuilder sb = new StringBuilder();
        sb.append("\n\nThe user is currently browsing the store '").append(ctx.get("name")).append("'.");

        Object desc = ctx.get("description");
        if (desc != null && !desc.toString().isEmpty()) {
            sb.append(" Description: ").append(desc).append(".");
        }

        Object address = ctx.get("address");
        if (address != null && !address.toString().isEmpty()) {
            sb.append(" Address: ").append(address).append(".");
        }

        List<Map<String, Object>> services = (List<Map<String, Object>>) ctx.get("services");
        if (services != null && !services.isEmpty()) {
            sb.append(" Services offered: ");
            for (int i = 0; i < services.size(); i++) {
                Map<String, Object> svc = services.get(i);
                if (i > 0) sb.append(", ");
                sb.append(svc.get("name")).append(" ($").append(svc.get("price")).append(")");
                if (svc.get("durationMinutes") != null) {
                    sb.append(" [").append(svc.get("durationMinutes")).append(" min]");
                }
            }
            sb.append(".");
        }

        List<Map<String, Object>> products = (List<Map<String, Object>>) ctx.get("products");
        if (products != null && !products.isEmpty()) {
            sb.append(" Products available: ");
            for (int i = 0; i < products.size(); i++) {
                Map<String, Object> prod = products.get(i);
                if (i > 0) sb.append(", ");
                sb.append(prod.get("name")).append(" ($").append(prod.get("price")).append(")");
            }
            sb.append(".");
        }

        sb.append(" Prioritize this store's information when answering questions.");
        return sb.toString();
    }
}
