package com.example.timskimilenici.services;

import com.example.timskimilenici.repositories.BookingRepository;
import com.example.timskimilenici.repositories.OrderRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Date;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class OwnerAnalyticsService {

    private final BookingRepository bookingRepository;
    private final OrderRepository orderRepository;

    public OwnerAnalyticsService(BookingRepository bookingRepository, OrderRepository orderRepository) {
        this.bookingRepository = bookingRepository;
        this.orderRepository = orderRepository;
    }

    public record OverviewPoint(
            LocalDate day,
            long bookings,
            long completed,
            long cancelled,
            BigDecimal revenue
    ) {}

    public record OverviewSummary(
            Double completionRate,
            BigDecimal averageBookingValue,
            BigDecimal priorPeriodRevenue,
            Double revenueChangePercent
    ) {}

    public record OverviewResult(
            List<OverviewPoint> points,
            long totalBookings,
            long totalCompleted,
            long totalCancelled,
            BigDecimal totalRevenue,
            OverviewSummary summary
    ) {}

    public record ProductSalesRow(
            Long productId,
            String productName,
            long unitsSold,
            long ordersCount,
            BigDecimal revenue
    ) {}

    public record PeakTimeBucket(
            int dayOfWeek,
            int hour,
            long bookings
    ) {}

    public record SpecialOfferRow(
            Long itemId,
            String itemName,
            /** "service" or "product". */
            String itemType,
            Long businessId,
            String businessName,
            BigDecimal basePrice,
            BigDecimal promotionPrice,
            /** Current discount percent (0-100). */
            Double discountPercent,
            /** Bookings/orders in this period. */
            long usageCount,
            /** Revenue earned during this period from this promoted item. */
            BigDecimal promotedRevenue
    ) {}

    public record SpecialOffersResult(
            int activeOfferCount,
            long totalUsageCount,
            BigDecimal totalPromotedRevenue,
            /** Average discount percent across active offers (0-100), or null when no offers. */
            Double averageDiscountPercent,
            /** Top offers sorted by usage desc, capped by caller (default 5). */
            List<SpecialOfferRow> topOffers,
            /** Every active offer for the owner in this period. */
            List<SpecialOfferRow> offers
    ) {}

    public OverviewResult getOverview(Long ownerId, LocalDate fromDate, LocalDate toDate, Long businessId) {
        OverviewResult current = buildOverviewCore(ownerId, fromDate, toDate, businessId);
        List<OverviewPoint> points = current.points();
        long totalBookings = current.totalBookings();
        long totalCompleted = current.totalCompleted();
        long totalCancelled = current.totalCancelled();
        BigDecimal totalRevenue = current.totalRevenue();

        Double completionRate = totalBookings > 0
                ? (double) totalCompleted / (double) totalBookings
                : null;
        BigDecimal averageBookingValue = totalBookings > 0
                ? totalRevenue.divide(BigDecimal.valueOf(totalBookings), 2, RoundingMode.HALF_UP)
                : null;

        long inclusiveDays = ChronoUnit.DAYS.between(fromDate, toDate) + 1;
        LocalDate priorPeriodEnd = fromDate.minusDays(1);
        LocalDate priorPeriodStart = priorPeriodEnd.minusDays(inclusiveDays - 1);
        OverviewResult prior = buildOverviewCore(ownerId, priorPeriodStart, priorPeriodEnd, businessId);
        BigDecimal priorRevenue = prior.totalRevenue();
        Double revenueChangePercent = null;
        if (priorRevenue.compareTo(BigDecimal.ZERO) > 0) {
            revenueChangePercent = totalRevenue.subtract(priorRevenue)
                    .divide(priorRevenue, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .doubleValue();
        } else if (totalRevenue.compareTo(BigDecimal.ZERO) > 0) {
            revenueChangePercent = null;
        } else {
            revenueChangePercent = 0.0;
        }

        OverviewSummary summary = new OverviewSummary(
                completionRate,
                averageBookingValue,
                priorRevenue,
                revenueChangePercent
        );

        return new OverviewResult(points, totalBookings, totalCompleted, totalCancelled, totalRevenue, summary);
    }

    private OverviewResult buildOverviewCore(Long ownerId, LocalDate fromDate, LocalDate toDate, Long businessId) {
        LocalDateTime from = fromDate.atStartOfDay();
        LocalDateTime to = toDate.atTime(LocalTime.MAX);

        List<Object[]> rows = bookingRepository.aggregateOverviewByOwnerAndDate(ownerId, from, to, businessId);
        List<OverviewPoint> points = rows.stream()
                .map(r -> {
                    LocalDate day = ((Date) r[0]).toLocalDate();
                    BigDecimal revenue = r[4] instanceof BigDecimal ? (BigDecimal) r[4] : BigDecimal.ZERO;
                    return new OverviewPoint(
                            day,
                            ((Number) r[1]).longValue(),
                            ((Number) r[2]).longValue(),
                            ((Number) r[3]).longValue(),
                            revenue
                    );
                })
                .toList();

        long totalBookings = points.stream().mapToLong(OverviewPoint::bookings).sum();
        long totalCompleted = points.stream().mapToLong(OverviewPoint::completed).sum();
        long totalCancelled = points.stream().mapToLong(OverviewPoint::cancelled).sum();
        BigDecimal totalRevenue = points.stream()
                .map(OverviewPoint::revenue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        OverviewSummary summary = new OverviewSummary(null, null, null, null);
        return new OverviewResult(points, totalBookings, totalCompleted, totalCancelled, totalRevenue, summary);
    }

    public List<ProductSalesRow> getProductSales(Long ownerId, LocalDate fromDate, LocalDate toDate, Long businessId) {
        LocalDateTime from = fromDate.atStartOfDay();
        LocalDateTime to = toDate.atTime(LocalTime.MAX);

        List<Object[]> rows = orderRepository.aggregateProductSalesByOwner(ownerId, from, to, businessId);
        return rows.stream()
                .map(r -> new ProductSalesRow(
                        ((Number) r[0]).longValue(),
                        (String) r[1],
                        ((Number) r[2]).longValue(),
                        ((Number) r[3]).longValue(),
                        (BigDecimal) r[4]
                ))
                .toList();
    }

    public SpecialOffersResult getSpecialOffers(Long ownerId, LocalDate fromDate, LocalDate toDate, Long businessId) {
        LocalDateTime from = fromDate.atStartOfDay();
        LocalDateTime to = toDate.atTime(LocalTime.MAX);

        List<SpecialOfferRow> offers = new java.util.ArrayList<>();

        List<Object[]> serviceRows = bookingRepository.aggregatePromotedServices(ownerId, from, to, businessId);
        for (Object[] r : serviceRows) {
            BigDecimal base = r[4] instanceof BigDecimal ? (BigDecimal) r[4] : BigDecimal.ZERO;
            BigDecimal promo = r[5] instanceof BigDecimal ? (BigDecimal) r[5] : BigDecimal.ZERO;
            BigDecimal revenue = r[8] instanceof BigDecimal ? (BigDecimal) r[8] : BigDecimal.ZERO;
            offers.add(new SpecialOfferRow(
                    ((Number) r[0]).longValue(),
                    (String) r[1],
                    "service",
                    ((Number) r[2]).longValue(),
                    (String) r[3],
                    base,
                    promo,
                    computeDiscountPercent(base, promo),
                    ((Number) r[6]).longValue(),
                    revenue
            ));
        }

        List<Object[]> productRows = orderRepository.aggregatePromotedProducts(ownerId, from, to, businessId);
        for (Object[] r : productRows) {
            BigDecimal base = r[4] instanceof BigDecimal ? (BigDecimal) r[4] : BigDecimal.ZERO;
            BigDecimal promo = r[5] instanceof BigDecimal ? (BigDecimal) r[5] : BigDecimal.ZERO;
            BigDecimal revenue = r[8] instanceof BigDecimal ? (BigDecimal) r[8] : BigDecimal.ZERO;
            offers.add(new SpecialOfferRow(
                    ((Number) r[0]).longValue(),
                    (String) r[1],
                    "product",
                    ((Number) r[2]).longValue(),
                    (String) r[3],
                    base,
                    promo,
                    computeDiscountPercent(base, promo),
                    ((Number) r[7]).longValue(),
                    revenue
            ));
        }

        offers.sort((a, b) -> Long.compare(b.usageCount(), a.usageCount()));

        long totalUsage = offers.stream().mapToLong(SpecialOfferRow::usageCount).sum();
        BigDecimal totalRevenue = offers.stream()
                .map(SpecialOfferRow::promotedRevenue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Double avgDiscount = null;
        if (!offers.isEmpty()) {
            double sum = offers.stream()
                    .map(SpecialOfferRow::discountPercent)
                    .filter(java.util.Objects::nonNull)
                    .mapToDouble(Double::doubleValue)
                    .sum();
            avgDiscount = sum / offers.size();
        }

        List<SpecialOfferRow> top = offers.stream().limit(5).toList();

        return new SpecialOffersResult(
                offers.size(),
                totalUsage,
                totalRevenue,
                avgDiscount,
                top,
                offers
        );
    }

    private static Double computeDiscountPercent(BigDecimal base, BigDecimal promo) {
        if (base == null || promo == null) return null;
        if (base.compareTo(BigDecimal.ZERO) <= 0) return null;
        BigDecimal diff = base.subtract(promo);
        return diff.multiply(BigDecimal.valueOf(100))
                .divide(base, 1, RoundingMode.HALF_UP)
                .doubleValue();
    }

    public List<PeakTimeBucket> getPeakTimes(Long ownerId, LocalDate fromDate, LocalDate toDate, Long businessId) {
        LocalDateTime from = fromDate.atStartOfDay();
        LocalDateTime to = toDate.atTime(LocalTime.MAX);

        List<Object[]> rows = bookingRepository.aggregatePeakTimes(ownerId, from, to, businessId);
        return rows.stream()
                .map(r -> new PeakTimeBucket(
                        ((Number) r[0]).intValue(),
                        ((Number) r[1]).intValue(),
                        ((Number) r[2]).longValue()
                ))
                .toList();
    }
}

