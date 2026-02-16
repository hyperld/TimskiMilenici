package com.example.timskimilenici.services;

import com.example.timskimilenici.entities.*;
import com.example.timskimilenici.repositories.CartRepository;
import com.example.timskimilenici.repositories.OrderRepository;
import com.example.timskimilenici.repositories.ProductRepository;
import com.example.timskimilenici.repositories.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CartService {

    private final CartRepository cartRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final NotificationService notificationService;

    public CartService(CartRepository cartRepository, ProductRepository productRepository,
                       UserRepository userRepository, OrderRepository orderRepository,
                       NotificationService notificationService) {
        this.cartRepository = cartRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
        this.notificationService = notificationService;
    }

    /**
     * Get cart for user with items and products loaded. Creates cart if none exists.
     */
    @Transactional
    public Cart getOrCreateCart(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return cartRepository.findByUser_IdWithItemsAndProduct(userId)
                .orElseGet(() -> {
                    Cart cart = new Cart(user);
                    return cartRepository.save(cart);
                });
    }

    /**
     * Get cart for user (read-only). Returns empty optional if no cart.
     */
    public java.util.Optional<Cart> getCart(Long userId) {
        return cartRepository.findByUser_IdWithItemsAndProduct(userId);
    }

    /**
     * Add product to cart. Merges quantity if product already in cart.
     */
    @Transactional
    public Cart addItem(Long userId, Long productId, int quantity) {
        if (quantity <= 0) throw new IllegalArgumentException("Quantity must be positive");
        Cart cart = getOrCreateCart(userId);
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        CartItem existing = cart.getItems().stream()
                .filter(i -> i.getProduct().getId().equals(productId))
                .findFirst()
                .orElse(null);

        if (existing != null) {
            existing.setQuantity(existing.getQuantity() + quantity);
        } else {
            CartItem item = new CartItem(cart, product, quantity);
            cart.addItem(item);
        }
        return cartRepository.save(cart);
    }

    /**
     * Update quantity of a cart item. Only if it belongs to the user's cart.
     * Quantity is capped at product stock if stockQuantity is set.
     */
    @Transactional
    public Cart updateItemQuantity(Long userId, Long cartItemId, int quantity) {
        if (quantity < 1) throw new IllegalArgumentException("Quantity must be at least 1");
        Cart cart = getOrCreateCart(userId);
        CartItem item = cart.getItems().stream()
                .filter(i -> i.getId().equals(cartItemId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Cart item not found"));
        Integer maxStock = item.getProduct().getStockQuantity();
        if (maxStock != null && quantity > maxStock) {
            quantity = maxStock;
        }
        item.setQuantity(quantity);
        return cartRepository.save(cart);
    }

    /**
     * Remove a cart item by id. Only if it belongs to the user's cart.
     */
    @Transactional
    public void removeItem(Long userId, Long cartItemId) {
        Cart cart = getOrCreateCart(userId);
        cart.getItems().stream()
                .filter(i -> i.getId().equals(cartItemId))
                .findFirst()
                .ifPresent(item -> {
                    cart.removeItem(item);
                    cartRepository.save(cart);
                });
    }

    /**
     * Total number of items (sum of quantities) in the user's cart.
     */
    public int getItemCount(Long userId) {
        return cartRepository.findByUser_IdWithItemsAndProduct(userId)
                .map(c -> c.getItems().stream().mapToInt(CartItem::getQuantity).sum())
                .orElse(0);
    }

    /**
     * Checkout: validate user has address and phone, create order from cart, notify each business owner, clear cart.
     */
    @Transactional
    public Order checkout(Long userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        if (user.getAddress() == null || user.getAddress().isBlank()) {
            throw new RuntimeException("Please set your address in your profile before placing an order.");
        }
        if (user.getPhoneNumber() == null || user.getPhoneNumber().isBlank()) {
            throw new RuntimeException("Please set your phone number in your profile before placing an order.");
        }

        Cart cart = cartRepository.findByUser_IdWithItemsAndProduct(userId)
                .orElseThrow(() -> new RuntimeException("Cart not found"));
        if (cart.getItems().isEmpty()) {
            throw new RuntimeException("Your cart is empty.");
        }

        Order order = new Order(user);
        for (CartItem ci : new ArrayList<>(cart.getItems())) {
            OrderItem oi = new OrderItem(order, ci.getProduct(), ci.getQuantity(), ci.getProduct().getPrice());
            order.addItem(oi);
        }
        order = orderRepository.save(order);

        // Notify each business owner (group by business)
        cart.getItems().stream()
                .collect(Collectors.groupingBy(ci -> ci.getProduct().getBusiness().getId()))
                .forEach((businessId, items) -> {
                    if (items.isEmpty()) return;
                    var first = items.get(0);
                    User owner = first.getProduct().getBusiness().getOwner();
                    if (owner == null) return;
                    String storeName = first.getProduct().getBusiness().getName();
                    if (storeName == null || storeName.isBlank()) storeName = "your store";
                    String detail = items.stream()
                            .map(i -> i.getProduct().getName() + " (×" + i.getQuantity() + ")")
                            .collect(Collectors.joining(", "));
                    String msg = "A customer has purchased products from " + storeName + ": " + detail + ".";
                    try {
                        notificationService.notifyProductPurchase(userId, owner.getId(), msg);
                    } catch (Exception ignored) {}
                });

        cart.getItems().clear();
        cartRepository.save(cart);
        return order;
    }
}
