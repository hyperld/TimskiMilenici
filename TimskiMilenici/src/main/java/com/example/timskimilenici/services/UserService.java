package com.example.timskimilenici.services;

import com.example.timskimilenici.entities.Role;
import com.example.timskimilenici.entities.User;
import com.example.timskimilenici.repositories.UserRepository;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public User createUser(String email, String rawPassword, Role role, String fullName, String username, String profilePictureUrl) {
        if (userRepository.existsByUsername(username)) {
            throw new RuntimeException("Username already exists");
        }
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email already exists");
        }
        // Hash the password — NEVER store raw!
        String hashedPassword = passwordEncoder.encode(rawPassword);
        User user = new User(email, hashedPassword, role, fullName, username);
        if (profilePictureUrl != null && !profilePictureUrl.isBlank()) {
            user.setProfilePictureUrl(profilePictureUrl);
        }
        return userRepository.save(user);
    }

    public boolean checkPassword(User user, String rawPassword) {
        return passwordEncoder.matches(rawPassword, user.getPasswordHash());
    }

    public void changePassword(User user, String newRawPassword) {
        user.setPasswordHash(passwordEncoder.encode(newRawPassword));
        userRepository.save(user);
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public User getUserByIdentifier(String identifier) {
        return userRepository.findByEmailOrUsername(identifier, identifier)
                .orElseThrow(() -> new RuntimeException("User not found with email or username: " + identifier));
    }

    public User updateUserProfile(Long id, String fullName, String username, String email, String phoneNumber, String address, String profilePictureUrl) {
        User user = getUserById(id);
        
        // Check if new username/email already exists for another user
        if (username != null && !username.equals(user.getUsername()) && userRepository.existsByUsername(username)) {
            throw new RuntimeException("Username already exists");
        }
        if (email != null && !email.equals(user.getEmail()) && userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email already exists");
        }

        if (fullName != null) user.setFullName(fullName);
        if (username != null) user.setUsername(username);
        if (email != null) user.setEmail(email);
        if (phoneNumber != null) user.setPhoneNumber(phoneNumber);
        if (address != null) user.setAddress(address);
        if (profilePictureUrl != null) user.setProfilePictureUrl(profilePictureUrl.isBlank() ? null : profilePictureUrl);
        
        return userRepository.save(user);
    }

    public void updatePassword(Long id, String oldPassword, String newPassword) {
        User user = getUserById(id);
        if (!passwordEncoder.matches(oldPassword, user.getPasswordHash())) {
            throw new RuntimeException("Invalid current password");
        }
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }
}
