package com.mealplanner.config;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

public class PasswordHasher {

    private static final String SALT = "PlateWiseSecureSalt123!";

    /**
     * Hashes a raw password string using SHA-256 and a pre-defined cryptographic salt.
     *
     * @param password raw password string
     * @return hex encoded password hash
     */
    public static String hashPassword(String password) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            String saltedPassword = password + SALT;
            byte[] hash = digest.digest(saltedPassword.getBytes());
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not found", e);
        }
    }

    /**
     * Checks if a raw password matches the stored hashed password.
     *
     * @param password raw input password
     * @param hashedPassword stored hashed password
     * @return true if matches, false otherwise
     */
    public static boolean verifyPassword(String password, String hashedPassword) {
        if (password == null || hashedPassword == null) {
            return false;
        }
        return hashPassword(password).equals(hashedPassword);
    }
}
