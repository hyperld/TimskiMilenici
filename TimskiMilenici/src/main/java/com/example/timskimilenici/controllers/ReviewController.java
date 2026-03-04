package com.example.timskimilenici.controllers;

import com.example.timskimilenici.entities.Review;
import com.example.timskimilenici.entities.User;
import com.example.timskimilenici.services.ReviewService;
import com.example.timskimilenici.services.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    private final ReviewService reviewService;
    private final UserService userService;

    public ReviewController(ReviewService reviewService, UserService userService) {
        this.reviewService = reviewService;
        this.userService = userService;
    }

    @GetMapping("/business/{businessId}")
    public ResponseEntity<Map<String, Object>> getReviews(@PathVariable Long businessId) {
        return ResponseEntity.ok(reviewService.getReviewsForBusiness(businessId));
    }

    public record CreateReviewRequest(BigDecimal rating, String comment) {}

    @PostMapping("/business/{businessId}")
    public ResponseEntity<Review> addReview(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long businessId,
            @RequestBody CreateReviewRequest request
    ) {
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userService.getUserByIdentifier(userDetails.getUsername());
        Review created = reviewService.addReview(businessId, user.getId(), request.rating(), request.comment());
        return ResponseEntity.ok(created);
    }
}

