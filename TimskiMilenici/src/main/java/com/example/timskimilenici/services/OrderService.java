package com.example.timskimilenici.services;

import com.example.timskimilenici.entities.Order;
import com.example.timskimilenici.entities.OrderItem;
import com.example.timskimilenici.repositories.OrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class OrderService {

    private final OrderRepository orderRepository;

    public OrderService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    /** Orders that contain at least one product from this business, with user and items loaded. */
    @Transactional(readOnly = true)
    public List<Order> getOrdersByBusinessId(Long businessId) {
        List<Long> ids = orderRepository.findOrderIdsByBusinessId(businessId);
        if (ids.isEmpty()) return Collections.emptyList();
        List<Order> orders = orderRepository.findByIdInWithUserAndItems(ids);
        orders.sort(Comparator.comparing(Order::getCreatedAt).reversed());
        return orders;
    }

    /** Order items whose product belongs to the given business. */
    public static List<OrderItem> itemsForBusiness(Order order, Long businessId) {
        return order.getItems().stream()
                .filter(oi -> oi.getProduct().getBusiness().getId().equals(businessId))
                .collect(Collectors.toList());
    }
}
