package com.example.timskimilenici.services;

import com.example.timskimilenici.entities.Business;
import com.example.timskimilenici.entities.Review;
import com.example.timskimilenici.entities.User;
import com.example.timskimilenici.repositories.BusinessRepository;
import com.example.timskimilenici.repositories.ReviewRepository;
import com.example.timskimilenici.repositories.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final BusinessRepository businessRepository;
    private final UserRepository userRepository;

    public ReviewService(ReviewRepository reviewRepository,
                         BusinessRepository businessRepository,
                         UserRepository userRepository) {
        this.reviewRepository = reviewRepository;
        this.businessRepository = businessRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getReviewsForBusiness(Long businessId) {
        List<Review> reviews = reviewRepository.findByBusiness_IdOrderByCreatedAtDesc(businessId);
        // #region agent log
        try {
            long now = System.currentTimeMillis();
            String log = "{\"id\":\"log_" + now +
                    "\",\"timestamp\":" +
                    System.currentTimeMillis() +
                    ",\"location\":\"ReviewService.java:getReviewsForBusiness\"," +
                    "\"message\":\"reviews_fetched\"," +
                    "\"data\":{\"businessId\":" + businessId + ",\"count\":" + reviews.size() + "}}";
            java.nio.file.Files.writeString(
                    java.nio.file.Paths.get("c:\\\\Users\\\\nikol\\\\Desktop\\\\Timski\\\\TimskiMilenici\\\\.cursor\\\\debug.log"),
                    log + System.lineSeparator(),
                    java.nio.file.StandardOpenOption.CREATE,
                    java.nio.file.StandardOpenOption.APPEND
            );
        } catch (Exception ignored) {
        }
        // #endregion agent log
        BigDecimal sum = BigDecimal.ZERO;
        for (Review r : reviews) {
            if (r.getRating() != null) {
                sum = sum.add(r.getRating());
            }
        }
        BigDecimal avg = reviews.isEmpty()
                ? BigDecimal.ZERO
                : sum.divide(BigDecimal.valueOf(reviews.size()), 1, RoundingMode.HALF_UP);
        Map<String, Object> result = new HashMap<>();
        result.put("reviews", reviews);
        result.put("averageRating", avg);
        result.put("count", reviews.size());
        return result;
    }

    @Transactional
    public Review addReview(Long businessId, Long userId, BigDecimal rating, String comment) {
        if (rating == null
                || rating.compareTo(BigDecimal.valueOf(1.0)) < 0
                || rating.compareTo(BigDecimal.valueOf(5.0)) > 0) {
            throw new IllegalArgumentException("Rating must be between 1.0 and 5.0");
        }
        Business business = businessRepository.findById(businessId)
                .orElseThrow(() -> new IllegalArgumentException("Business not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Review review = new Review(business, user, rating.setScale(1, RoundingMode.HALF_UP), comment);
        Review saved = reviewRepository.save(review);
        // #region agent log
        try {
            long now = System.currentTimeMillis();
            String log = "{\"id\":\"log_" + now +
                    "\",\"timestamp\":" +
                    System.currentTimeMillis() +
                    ",\"location\":\"ReviewService.java:addReview\"," +
                    "\"message\":\"review_saved\"," +
                    "\"data\":{\"businessId\":" + businessId + ",\"userId\":" + userId + ",\"rating\":" + rating + "}}";
            java.nio.file.Files.writeString(
                    java.nio.file.Paths.get("c:\\\\Users\\\\nikol\\\\Desktop\\\\Timski\\\\TimskiMilenici\\\\.cursor\\\\debug.log"),
                    log + System.lineSeparator(),
                    java.nio.file.StandardOpenOption.CREATE,
                    java.nio.file.StandardOpenOption.APPEND
            );
        } catch (Exception ignored) {
        }
        // #endregion agent log
        return saved;
    }
}

