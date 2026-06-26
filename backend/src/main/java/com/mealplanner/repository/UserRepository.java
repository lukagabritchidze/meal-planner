package com.mealplanner.repository;

import com.mealplanner.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    /**
     * Finds a user by their registered email address.
     *
     * @param email user's email
     * @return an Optional container holding the User if found
     */
    Optional<User> findByEmail(String email);
}
