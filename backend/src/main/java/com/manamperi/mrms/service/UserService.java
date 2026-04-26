package com.manamperi.mrms.service;

import com.manamperi.mrms.entity.User;
import com.manamperi.mrms.exception.BadRequestException;
import com.manamperi.mrms.exception.ResourceNotFoundException;
import com.manamperi.mrms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public List<User> getAll() {
        return userRepository.findAll();
    }

    public List<User> getAllActive() {
        return userRepository.findByIsActiveTrue();
    }

    @SuppressWarnings("null")
    public User getById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
    }

    @Transactional
    public User create(User user) {
        if (userRepository.existsByUsername(user.getUsername())) {
            throw new BadRequestException("Username '" + user.getUsername() + "' already exists");
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setIsActive(true);
        user.setLoginAttempts(0);
        return userRepository.save(user);
    }

    @Transactional
    public User update(Long id, User updated) {
        User user = getById(id);
        user.setFullName(updated.getFullName());
        user.setEmail(updated.getEmail());
        user.setRole(updated.getRole());
        if (updated.getPassword() != null && !updated.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(updated.getPassword()));
        }
        return userRepository.save(user);
    }

    @Transactional
    public User resetPassword(Long id, String newPassword) {
        User user = getById(id);
        user.setPassword(passwordEncoder.encode(newPassword));
        return userRepository.save(user);
    }

    @Transactional
    public User toggleActive(Long id) {
        User user = getById(id);
        user.setIsActive(!user.getIsActive());
        return userRepository.save(user);
    }
}
