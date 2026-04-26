package com.manamperi.mrms.controller;

import com.manamperi.mrms.dto.ApiResponse;
import com.manamperi.mrms.entity.User;
import com.manamperi.mrms.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Users", description = "User management (Admin only)")
public class UserController {

    private final UserService userService;

    @GetMapping
    @Operation(summary = "Get all users")
    public ResponseEntity<ApiResponse<List<User>>> getAll() {
        List<User> users = userService.getAll();
        // Strip passwords from response
        users.forEach(u -> u.setPassword(null));
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    @PostMapping
    @Operation(summary = "Create a new user")
    public ResponseEntity<ApiResponse<User>> create(@RequestBody User user) {
        User created = userService.create(user);
        created.setPassword(null);
        return ResponseEntity.ok(ApiResponse.success("User created", created));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a user")
    public ResponseEntity<ApiResponse<User>> update(@PathVariable Long id, @RequestBody User user) {
        User updated = userService.update(id, user);
        updated.setPassword(null);
        return ResponseEntity.ok(ApiResponse.success("User updated", updated));
    }

    @PutMapping("/{id}/password")
    @Operation(summary = "Reset user password")
    public ResponseEntity<ApiResponse<String>> resetPassword(@PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String newPassword = body.get("newPassword");
        userService.resetPassword(id, newPassword);
        return ResponseEntity.ok(ApiResponse.success("Password reset successful", null));
    }

    @PutMapping("/{id}/toggle-active")
    @Operation(summary = "Toggle user active status")
    public ResponseEntity<ApiResponse<User>> toggleActive(@PathVariable Long id) {
        User user = userService.toggleActive(id);
        user.setPassword(null);
        return ResponseEntity.ok(ApiResponse.success("Status updated", user));
    }
}
