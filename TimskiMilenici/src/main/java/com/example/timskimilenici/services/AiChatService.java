package com.example.timskimilenici.services;

import com.example.timskimilenici.services.ai.CustomerAiTools;
import com.example.timskimilenici.services.ai.OwnerAiTools;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class AiChatService {

    public enum ChatMode { CUSTOMER, OWNER }

    private static final String CUSTOMER_SYSTEM_PROMPT =
            "You are PawPal, a friendly AI assistant for the PetPal pet-care marketplace. " +
            "You help shoppers discover pet stores, products and services and answer general pet-care questions. " +
            "Keep answers short, warm and free of markdown formatting. " +
            "Whenever the user asks about stores, products, services, or what is nearby, you MUST use the provided tools to look up real data before answering; never invent store names, prices, or inventory. " +
            "Search smart: extract the product or service keyword from the user's sentence (e.g. 'shampoo for my bichon' -> query 'shampoo'; 'dog food for my puppy' -> 'dog food'; 'somewhere to groom my cat' -> call searchServices with 'grooming'). " +
            "If a keyword search returns nothing, retry with a broader or alternative term (e.g. try 'shampoo', then 'bath', then 'grooming'; try the singular of a word; try a parent category) before telling the user nothing was found. " +
            "Always combine searchProducts AND searchServices when the user's request could be either, and consider searchStores when they mention a type of shop. " +
            "If tools still return no results after reasonable retries, say so honestly and suggest related searches. " +
            "When recommending items, always name the store that carries them.";

    private static final String OWNER_SYSTEM_PROMPT =
            "You are PawPal for Owners, an AI co-pilot inside the PetPal owner dashboard. " +
            "The current user is an authenticated store owner. Help them understand their own analytics, manage their stores, and draft store copy (names, descriptions, marketing blurbs, promotion ideas). " +
            "Keep answers concise, actionable, and free of markdown formatting. " +
            "Use the owner tools to fetch real data before quoting any numbers. Never invent revenue, bookings, or store details. " +
            "When the owner asks 'how am I doing' or about a time period, call getOverview (and getPeakTimes or getSpecialOffers if relevant) and summarize the key highlights with one or two suggestions. " +
            "Dates are ISO yyyy-MM-dd; if the owner says 'this month' or 'last 7 days', resolve the range yourself before calling a tool. " +
            "If asked to write a description or promo, answer directly without a tool call.";

    private final ChatClient chatClient;
    private final CustomerAiTools customerAiTools;
    private final OwnerAiTools ownerAiTools;

    public AiChatService(ChatClient.Builder chatClientBuilder,
                         CustomerAiTools customerAiTools,
                         OwnerAiTools ownerAiTools) {
        this.chatClient = chatClientBuilder.build();
        this.customerAiTools = customerAiTools;
        this.ownerAiTools = ownerAiTools;
    }

    public String chat(String userMessage,
                       List<Map<String, String>> history,
                       Map<String, Object> storeContext,
                       ChatMode mode,
                       Long ownerUserId) {
        List<Message> messages = new ArrayList<>();

        String systemPrompt = mode == ChatMode.OWNER ? OWNER_SYSTEM_PROMPT : CUSTOMER_SYSTEM_PROMPT;
        if (mode == ChatMode.CUSTOMER && storeContext != null && storeContext.get("name") != null) {
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

        ChatClient.ChatClientRequestSpec spec = chatClient.prompt().messages(messages);

        if (mode == ChatMode.OWNER) {
            if (ownerUserId == null) {
                throw new IllegalStateException("Owner chat requires an authenticated owner user id.");
            }
            spec = spec
                    .tools(ownerAiTools, customerAiTools)
                    .toolContext(Map.of(OwnerAiTools.OWNER_ID_KEY, ownerUserId));
        } else {
            spec = spec.tools(customerAiTools);
        }

        return spec.call().content();
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
                sb.append(svc.get("name")).append(" ($").append(svc.get("currentPrice")).append(")");
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
                sb.append(prod.get("name")).append(" ($").append(prod.get("currentPrice")).append(")");
            }
            sb.append(".");
        }

        sb.append(" Prioritize this store's information when answering questions. " +
                "If the user asks about something the store does not carry, fall back to tools to look up other stores.");
        return sb.toString();
    }
}
