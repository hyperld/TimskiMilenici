package com.example.timskimilenici.services.ai;

import com.example.timskimilenici.entities.Business;
import com.example.timskimilenici.repositories.BusinessRepository;
import com.example.timskimilenici.services.OwnerAnalyticsService;
import org.springframework.ai.chat.model.ToolContext;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;

/**
 * Tools the LLM can call while chatting with an authenticated OWNER on the
 * owner dashboard. All tools scope to the owner identified by the
 * {@code ownerId} key placed in the chat's tool context by the controller,
 * so an owner can never read another owner's data through the assistant.
 */
@Component
public class OwnerAiTools {

    /** Tool-context key holding the authenticated owner's user id. */
    public static final String OWNER_ID_KEY = "ownerId";

    private final OwnerAnalyticsService analyticsService;
    private final BusinessRepository businessRepository;

    public OwnerAiTools(OwnerAnalyticsService analyticsService, BusinessRepository businessRepository) {
        this.analyticsService = analyticsService;
        this.businessRepository = businessRepository;
    }

    public record OwnerStore(Long id, String name, String category, String address, int productCount, int serviceCount) {}

    @Tool(description = "List the pet stores owned by the current user. Use to look up store IDs before calling analytics tools.")
    public List<OwnerStore> listMyStores(ToolContext toolContext) {
        Long ownerId = requireOwnerId(toolContext);
        return businessRepository.findByOwnerId(ownerId).stream()
                .map(OwnerAiTools::toOwnerStore)
                .toList();
    }

    @Tool(description = "Get an owner-scoped analytics overview: total bookings, completed, cancelled, revenue and a daily breakdown. Dates are inclusive ISO dates (YYYY-MM-DD). Pass businessId=null to aggregate across every store.")
    public OwnerAnalyticsService.OverviewResult getOverview(
            @ToolParam(description = "Start date, ISO yyyy-MM-dd. Omit or null for last 30 days.") String from,
            @ToolParam(description = "End date, ISO yyyy-MM-dd. Omit or null for today.") String to,
            @ToolParam(description = "Optional store id; null means all stores") Long businessId,
            ToolContext toolContext
    ) {
        Long ownerId = requireOwnerId(toolContext);
        LocalDate[] range = resolveRange(from, to);
        return analyticsService.getOverview(ownerId, range[0], range[1], businessId);
    }

    @Tool(description = "Get peak demand hours grouped by (day-of-week, hour-of-day) for the owner's stores. Useful for deciding staffing or running targeted promos.")
    public List<OwnerAnalyticsService.PeakTimeBucket> getPeakTimes(
            @ToolParam(description = "Start date, ISO yyyy-MM-dd. Null for last 30 days.") String from,
            @ToolParam(description = "End date, ISO yyyy-MM-dd. Null for today.") String to,
            @ToolParam(description = "Optional store id; null for all stores") Long businessId,
            ToolContext toolContext
    ) {
        Long ownerId = requireOwnerId(toolContext);
        LocalDate[] range = resolveRange(from, to);
        return analyticsService.getPeakTimes(ownerId, range[0], range[1], businessId);
    }

    @Tool(description = "Get per-product sales for the owner (units sold, orders, revenue). Helpful to identify best sellers or underperformers.")
    public List<OwnerAnalyticsService.ProductSalesRow> getProductSales(
            @ToolParam(description = "Start date, ISO yyyy-MM-dd. Null for last 30 days.") String from,
            @ToolParam(description = "End date, ISO yyyy-MM-dd. Null for today.") String to,
            @ToolParam(description = "Optional store id; null for all stores") Long businessId,
            ToolContext toolContext
    ) {
        Long ownerId = requireOwnerId(toolContext);
        LocalDate[] range = resolveRange(from, to);
        return analyticsService.getProductSales(ownerId, range[0], range[1], businessId);
    }

    @Tool(description = "Get the impact of active special offers (promotions) in the period: number of active offers, total uses, promoted revenue, average discount and a top-offers list.")
    public OwnerAnalyticsService.SpecialOffersResult getSpecialOffers(
            @ToolParam(description = "Start date, ISO yyyy-MM-dd. Null for last 30 days.") String from,
            @ToolParam(description = "End date, ISO yyyy-MM-dd. Null for today.") String to,
            @ToolParam(description = "Optional store id; null for all stores") Long businessId,
            ToolContext toolContext
    ) {
        Long ownerId = requireOwnerId(toolContext);
        LocalDate[] range = resolveRange(from, to);
        return analyticsService.getSpecialOffers(ownerId, range[0], range[1], businessId);
    }

    private static Long requireOwnerId(ToolContext toolContext) {
        if (toolContext == null || toolContext.getContext() == null) {
            throw new IllegalStateException("Owner tool invoked outside an authenticated owner session.");
        }
        Object raw = toolContext.getContext().get(OWNER_ID_KEY);
        if (raw instanceof Number n) {
            return n.longValue();
        }
        throw new IllegalStateException("Missing owner id in tool context.");
    }

    private static LocalDate[] resolveRange(String from, String to) {
        LocalDate toDate = parseOrToday(to);
        LocalDate fromDate = parseOrDefault(from, toDate.minusDays(29));
        if (fromDate.isAfter(toDate)) {
            LocalDate tmp = fromDate;
            fromDate = toDate;
            toDate = tmp;
        }
        return new LocalDate[]{fromDate, toDate};
    }

    private static LocalDate parseOrToday(String v) {
        if (v == null || v.isBlank() || "null".equalsIgnoreCase(v)) return LocalDate.now();
        try {
            return LocalDate.parse(v.trim());
        } catch (DateTimeParseException e) {
            return LocalDate.now();
        }
    }

    private static LocalDate parseOrDefault(String v, LocalDate fallback) {
        if (v == null || v.isBlank() || "null".equalsIgnoreCase(v)) return fallback;
        try {
            return LocalDate.parse(v.trim());
        } catch (DateTimeParseException e) {
            return fallback;
        }
    }

    private static OwnerStore toOwnerStore(Business b) {
        int products = b.getProducts() == null ? 0 : b.getProducts().size();
        int services = b.getServices() == null ? 0 : b.getServices().size();
        return new OwnerStore(b.getId(), b.getName(), b.getCategory(), b.getAddress(), products, services);
    }
}
