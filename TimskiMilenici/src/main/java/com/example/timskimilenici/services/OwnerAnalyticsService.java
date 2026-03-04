package com.example.timskimilenici.services;

import com.example.timskimilenici.repositories.BookingRepository;
import com.example.timskimilenici.repositories.OrderRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.sql.Date;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
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

    public record OverviewResult(
            List<OverviewPoint> points,
            long totalBookings,
            long totalCompleted,
            long totalCancelled,
            BigDecimal totalRevenue
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

    public OverviewResult getOverview(Long ownerId, LocalDate fromDate, LocalDate toDate, Long businessId) {
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

        return new OverviewResult(points, totalBookings, totalCompleted, totalCancelled, totalRevenue);
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

