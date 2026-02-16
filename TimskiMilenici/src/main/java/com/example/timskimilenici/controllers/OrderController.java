package com.example.timskimilenici.controllers;

import com.example.timskimilenici.entities.Order;
import com.example.timskimilenici.entities.OrderItem;
import com.example.timskimilenici.entities.User;
import com.example.timskimilenici.services.BusinessService;
import com.example.timskimilenici.services.OrderService;
import com.example.timskimilenici.services.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;
    private final BusinessService businessService;
    private final UserService userService;

    public OrderController(OrderService orderService, BusinessService businessService, UserService userService) {
        this.orderService = orderService;
        this.businessService = businessService;
        this.userService = userService;
    }

    private Long currentUserId(UserDetails userDetails) {
        if (userDetails == null) return null;
        User user = userService.getUserByIdentifier(userDetails.getUsername());
        return user == null ? null : user.getId();
    }

    /**
     * List orders that contain at least one product from this business.
     * Only the business owner can call this. Each order includes user (phone, address) and only items from this store.
     */
    @GetMapping("/business/{businessId}")
    public ResponseEntity<?> getOrdersByBusiness(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long businessId) {
        Long userId = currentUserId(userDetails);
        if (userId == null) return ResponseEntity.status(401).build();
        return businessService.getBusinessById(businessId)
                .filter(b -> b.getOwner() != null && b.getOwner().getId().equals(userId))
                .map(b -> {
                    List<Order> orders = orderService.getOrdersByBusinessId(businessId);
                    List<Map<String, Object>> list = orders.stream()
                            .map(o -> toOrderSummary(o, businessId))
                            .collect(Collectors.toList());
                    return ResponseEntity.<List<Map<String, Object>>>ok(list);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    private Map<String, Object> toOrderSummary(Order order, Long businessId) {
        List<OrderItem> storeItems = OrderService.itemsForBusiness(order, businessId);
        User u = order.getUser();
        Map<String, Object> userMap = new LinkedHashMap<>();
        userMap.put("fullName", u.getFullName());
        userMap.put("phoneNumber", u.getPhoneNumber() != null ? u.getPhoneNumber() : "");
        userMap.put("address", u.getAddress() != null ? u.getAddress() : "");

        List<Map<String, Object>> itemsList = storeItems.stream()
                .map(oi -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("productName", oi.getProduct().getName());
                    m.put("quantity", oi.getQuantity());
                    m.put("priceAtOrder", oi.getPriceAtOrder());
                    return m;
                })
                .collect(Collectors.toList());

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("orderId", order.getId());
        out.put("createdAt", order.getCreatedAt());
        out.put("user", userMap);
        out.put("items", itemsList);
        return out;
    }
}
