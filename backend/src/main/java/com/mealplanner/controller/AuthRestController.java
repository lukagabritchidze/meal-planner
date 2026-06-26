package com.mealplanner.controller;

import com.mealplanner.entity.User;
import com.mealplanner.repository.UserRepository;
import com.mealplanner.config.PasswordHasher;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthRestController {

    private final UserRepository userRepository;

    @Autowired
    public AuthRestController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Registers a new user with an email and password.
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        if (request.getName() == null || request.getName().trim().isEmpty() ||
            request.getEmail() == null || request.getEmail().trim().isEmpty() ||
            request.getPassword() == null || request.getPassword().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "All fields are required."));
        }

        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "Email is already registered."));
        }

        // Hashing password
        String hashedPassword = PasswordHasher.hashPassword(request.getPassword());

        User newUser = User.builder()
                .name(request.getName().trim())
                .email(email)
                .password(hashedPassword)
                .build();

        User savedUser = userRepository.save(newUser);

        // Map to response user info (excluding password hash)
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "id", savedUser.getId(),
                "name", savedUser.getName(),
                "email", savedUser.getEmail()
        ));
    }

    /**
     * Authenticates a user by validating their email and password.
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        if (request.getEmail() == null || request.getEmail().trim().isEmpty() ||
            request.getPassword() == null || request.getPassword().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email and password are required."));
        }

        String email = request.getEmail().trim().toLowerCase();
        Optional<User> userOptional = userRepository.findByEmail(email);

        if (userOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid email or password."));
        }

        User user = userOptional.get();
        if (!PasswordHasher.verifyPassword(request.getPassword(), user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid email or password."));
        }

        return ResponseEntity.ok(Map.of(
                "id", user.getId(),
                "name", user.getName(),
                "email", user.getEmail()
        ));
    }

    // Static helper classes for request data binding
    public static class RegisterRequest {
        private String name;
        private String email;
        private String password;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    public static class LoginRequest {
        private String email;
        private String password;

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }
}
