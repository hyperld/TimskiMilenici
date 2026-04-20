package com.example.timskimilenici.controllers;

import com.example.timskimilenici.entities.User;
import com.example.timskimilenici.services.OwnerAnalyticsService;
import com.example.timskimilenici.services.UserService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/owner/analytics")
public class OwnerAnalyticsController {

    private final OwnerAnalyticsService ownerAnalyticsService;
    private final UserService userService;

    public OwnerAnalyticsController(OwnerAnalyticsService ownerAnalyticsService, UserService userService) {
        this.ownerAnalyticsService = ownerAnalyticsService;
        this.userService = userService;
    }

    @GetMapping("/overview")
    public ResponseEntity<OwnerAnalyticsService.OverviewResult> getOverview(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) Long businessId
    ) {
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userService.getUserByIdentifier(userDetails.getUsername());

        LocalDate toDate = to != null ? to : LocalDate.now();
        LocalDate fromDate = from != null ? from : toDate.minusDays(29);

        var result = ownerAnalyticsService.getOverview(user.getId(), fromDate, toDate, businessId);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/services")
    public ResponseEntity<List<OwnerAnalyticsService.ProductSalesRow>> getServicePerformance(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) Long businessId
    ) {
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userService.getUserByIdentifier(userDetails.getUsername());

        LocalDate toDate = to != null ? to : LocalDate.now();
        LocalDate fromDate = from != null ? from : toDate.minusDays(29);

        var rows = ownerAnalyticsService.getProductSales(user.getId(), fromDate, toDate, businessId);
        return ResponseEntity.ok(rows);
    }

    @GetMapping("/special-offers")
    public ResponseEntity<OwnerAnalyticsService.SpecialOffersResult> getSpecialOffers(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) Long businessId
    ) {
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userService.getUserByIdentifier(userDetails.getUsername());

        LocalDate toDate = to != null ? to : LocalDate.now();
        LocalDate fromDate = from != null ? from : toDate.minusDays(29);

        var result = ownerAnalyticsService.getSpecialOffers(user.getId(), fromDate, toDate, businessId);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/peak-times")
    public ResponseEntity<List<OwnerAnalyticsService.PeakTimeBucket>> getPeakTimes(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) Long businessId
    ) {
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userService.getUserByIdentifier(userDetails.getUsername());

        LocalDate toDate = to != null ? to : LocalDate.now();
        LocalDate fromDate = from != null ? from : toDate.minusDays(29);

        var buckets = ownerAnalyticsService.getPeakTimes(user.getId(), fromDate, toDate, businessId);
        return ResponseEntity.ok(buckets);
    }
}

