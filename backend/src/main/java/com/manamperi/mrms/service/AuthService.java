package com.manamperi.mrms.service;

import com.manamperi.mrms.dto.LoginRequest;
import com.manamperi.mrms.dto.LoginResponse;
import com.manamperi.mrms.entity.AuditLog;
import com.manamperi.mrms.entity.User;
import com.manamperi.mrms.repository.AuditLogRepository;
import com.manamperi.mrms.repository.UserRepository;
import com.manamperi.mrms.security.CustomUserDetails;
import com.manamperi.mrms.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;

    @Transactional
    @SuppressWarnings("null")
    public LoginResponse login(LoginRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));

            CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
            String token = tokenProvider.generateTokenFromUserDetails(userDetails);

            // Update last login and reset attempts
            User user = userRepository.findByUsername(request.getUsername()).orElseThrow();
            user.setLastLogin(LocalDateTime.now());
            user.setLoginAttempts(0);
            userRepository.save(user);

            // Audit log
            auditLogRepository.save(AuditLog.builder()
                    .user(user)
                    .action("LOGIN")
                    .entity("USER")
                    .entityId(user.getId())
                    .details("Successful login")
                    .build());

            return LoginResponse.builder()
                    .token(token)
                    .type("Bearer")
                    .userId(userDetails.getId())
                    .username(userDetails.getUsername())
                    .fullName(userDetails.getFullName())
                    .role(userDetails.getRole())
                    .build();

        } catch (BadCredentialsException e) {
            // Log failed attempt
            userRepository.findByUsername(request.getUsername()).ifPresent(user -> {
                user.setLoginAttempts(user.getLoginAttempts() + 1);
                userRepository.save(user);

                auditLogRepository.save(AuditLog.builder()
                        .user(user)
                        .action("LOGIN_FAILED")
                        .entity("USER")
                        .entityId(user.getId())
                        .details("Failed login attempt #" + user.getLoginAttempts())
                        .build());
            });
            throw e;
        }
    }
}
