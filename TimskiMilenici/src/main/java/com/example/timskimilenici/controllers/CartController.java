package com.example.timskimilenici.controllers;

import com.example.timskimilenici.entities.Cart;
import com.example.timskimilenici.entities.User;
import com.example.timskimilenici.services.CartService;
import com.example.timskimilenici.services.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    private final CartService cartService;
    private final UserService userService;

    public CartController(CartService cartService, UserService userService) {
        this.cartService = cartService;
        this.userService = userService;
    }

    private Long currentUserId(UserDetails userDetails) {
        if (userDetails == null) return null;
        User user = userService.getUserByIdentifier(userDetails.getUsername());
        return user.getId();
    }

    @GetMapping
    public ResponseEntity<Cart> getCart(@AuthenticationPrincipal UserDetails userDetails) {
        Long userId = currentUserId(userDetails);
        if (userId == null) return ResponseEntity.status(401).build();
        Cart cart = cartService.getOrCreateCart(userId);
        return ResponseEntity.ok(cart);
    }

    @GetMapping("/count")
    public ResponseEntity<Map<String, Integer>> getItemCount(@AuthenticationPrincipal UserDetails userDetails) {
        Long userId = currentUserId(userDetails);
        if (userId == null) return ResponseEntity.status(401).build();
        int count = cartService.getItemCount(userId);
        return ResponseEntity.ok(Map.of("count", count));
    }

    @PostMapping("/items")
    public ResponseEntity<Cart> addItem(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, Object> body) {
        Long userId = currentUserId(userDetails);
        if (userId == null) return ResponseEntity.status(401).build();
        Long productId = Long.valueOf(body.get("productId").toString());
        int quantity = body.containsKey("quantity") ? Integer.parseInt(body.get("quantity").toString()) : 1;
        Cart cart = cartService.addItem(userId, productId, quantity);
        return ResponseEntity.ok(cart);
    }

    @PatchMapping("/items/{cartItemId}")
    public ResponseEntity<Cart> updateItemQuantity(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long cartItemId,
            @RequestBody Map<String, Object> body) {
        Long userId = currentUserId(userDetails);
        if (userId == null) return ResponseEntity.status(401).build();
        int quantity = body.containsKey("quantity") ? Integer.parseInt(body.get("quantity").toString()) : 1;
        try {
            Cart cart = cartService.updateItemQuantity(userId, cartItemId, quantity);
            return ResponseEntity.ok(cart);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/items/{cartItemId}")
    public ResponseEntity<Void> removeItem(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long cartItemId) {
        Long userId = currentUserId(userDetails);
        if (userId == null) return ResponseEntity.status(401).build();
        cartService.removeItem(userId, cartItemId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/checkout")
    public ResponseEntity<?> checkout(@AuthenticationPrincipal UserDetails userDetails) {
        Long userId = currentUserId(userDetails);
        if (userId == null) return ResponseEntity.status(401).build();
        try {
            var order = cartService.checkout(userId);
            return ResponseEntity.ok(java.util.Map.of("message", "Order confirmed", "orderId", order.getId()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        }
    }
}
