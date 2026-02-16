package com.example.timskimilenici.services;

import com.example.timskimilenici.entities.Booking;
import com.example.timskimilenici.entities.Notification;
import com.example.timskimilenici.entities.User;
import com.example.timskimilenici.entities.PetService;
import com.example.timskimilenici.repositories.BookingRepository;
import com.example.timskimilenici.repositories.NotificationRepository;
import com.example.timskimilenici.repositories.PetServiceRepository;
import com.example.timskimilenici.repositories.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final PetServiceRepository petServiceRepository;

    public NotificationService(NotificationRepository notificationRepository,
                              UserRepository userRepository,
                              BookingRepository bookingRepository,
                              PetServiceRepository petServiceRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.bookingRepository = bookingRepository;
        this.petServiceRepository = petServiceRepository;
    }

    /**
     * Create a notification. senderId can be null (e.g. system).
     */
    @Transactional
    public Notification createNotification(String message, Long senderId, Long receiverId) {
        User sender = senderId != null ? userRepository.findById(senderId).orElse(null) : null;
        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new RuntimeException("Receiver user not found"));
        Notification n = new Notification(message, sender, receiver);
        return notificationRepository.save(n);
    }

    public List<Notification> getByReceiver(Long receiverId) {
        return notificationRepository.findByReceiverIdAndDismissedFalseOrderByCreatedAtDesc(receiverId);
    }

    @Transactional
    public void dismiss(Long notificationId, Long userId) {
        Optional<Notification> opt = notificationRepository.findById(notificationId);
        if (opt.isEmpty()) return;
        Notification n = opt.get();
        if (!n.getReceiver().getId().equals(userId)) return;
        n.setDismissed(true);
        notificationRepository.save(n);
    }

    /** Notify business owner that a new booking was made at their store. Uses two queries so business/owner load correctly (single multi-join was leaving business null). */
    @Transactional
    public void notifyBookingCreated(Long bookingId) {
        Booking b = bookingRepository.findByIdWithServiceAndUser(bookingId).orElse(null);
        if (b == null) {
            log.warn("notifyBookingCreated: booking id={} not found", bookingId);
            return;
        }
        if (b.getService() == null || b.getUser() == null) {
            log.warn("notifyBookingCreated: booking id={} missing service or user", bookingId);
            return;
        }
        Long serviceId = b.getService().getId();
        PetService service = petServiceRepository.findByIdWithBusinessAndOwner(serviceId).orElse(null);
        if (service == null || service.getBusiness() == null || service.getBusiness().getOwner() == null) {
            log.warn("notifyBookingCreated: service id={} not found or missing business/owner", serviceId);
            return;
        }
        User owner = service.getBusiness().getOwner();
        String storeName = service.getBusiness().getName();
        if (storeName == null || storeName.isBlank()) storeName = "your store";
        String customerName = b.getUser().getFullName() != null ? b.getUser().getFullName() : b.getUser().getUsername();
        if (customerName == null) customerName = "a customer";
        String msg = "A new booking has been made at " + storeName + " by " + customerName + ".";
        createNotification(msg, b.getUser().getId(), owner.getId());
        log.info("notifyBookingCreated: created notification for owner id={} (booking id={})", owner.getId(), bookingId);
    }

    /** Notify the customer that the business cancelled their booking. */
    @Transactional
    public void notifyBookingCancelledByBusiness(Long bookingId) {
        Booking b = bookingRepository.findByIdWithServiceBusinessOwnerAndUser(bookingId).orElse(null);
        if (b == null || b.getUser() == null) return;
        String msg = "Your booking has been cancelled by the business.";
        createNotification(msg, null, b.getUser().getId());
    }

    /** Notify the business owner that the user cancelled a booking. */
    @Transactional
    public void notifyBookingCancelledByUser(Long bookingId) {
        Booking b = bookingRepository.findByIdWithServiceBusinessOwnerAndUser(bookingId).orElse(null);
        if (b == null) return;
        if (b.getService() == null || b.getService().getBusiness() == null || b.getService().getBusiness().getOwner() == null) return;
        if (b.getUser() == null) return;
        User owner = b.getService().getBusiness().getOwner();
        String msg = "A customer has cancelled their booking.";
        createNotification(msg, b.getUser().getId(), owner.getId());
    }

    /** Notify business when a user buys products (call when purchase logic is added). */
    @Transactional
    public void notifyProductPurchase(Long buyerUserId, Long businessOwnerId, String detailMessage) {
        String msg = detailMessage != null ? detailMessage : "A customer has purchased products.";
        createNotification(msg, buyerUserId, businessOwnerId);
    }

    /** Notify user/business that they received a message (call when messaging is added). */
    @Transactional
    public void notifyMessageReceived(Long senderId, Long receiverId) {
        createNotification("You have received a message.", senderId, receiverId);
    }
}
