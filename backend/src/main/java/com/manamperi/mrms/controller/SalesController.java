package com.manamperi.mrms.controller;

import com.manamperi.mrms.dto.ApiResponse;
import com.manamperi.mrms.dto.SaleRequest;
import com.manamperi.mrms.entity.Sale;
import com.manamperi.mrms.security.CustomUserDetails;
import com.manamperi.mrms.service.SalesService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/sales")
@RequiredArgsConstructor
@Tag(name = "Sales", description = "POS sales management")
public class SalesController {

    private final SalesService salesService;

    @GetMapping
    @Operation(summary = "Get all sales with optional date filter")
    public ResponseEntity<ApiResponse<List<Sale>>> getAll(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        if (startDate != null && endDate != null) {
            return ResponseEntity.ok(ApiResponse.success(
                    salesService.getByDateRange(startDate.atStartOfDay(), endDate.plusDays(1).atStartOfDay())));
        }
        return ResponseEntity.ok(ApiResponse.success(salesService.getAll()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get sale details by ID")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(salesService.getSaleDetails(id)));
    }

    @PostMapping
    @Operation(summary = "Create a new sale (POS checkout)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createSale(
            @Valid @RequestBody SaleRequest request,
            @AuthenticationPrincipal CustomUserDetails user) {
        Map<String, Object> result = salesService.createSale(request, user.getId());
        return ResponseEntity.ok(ApiResponse.success("Sale completed", result));
    }

    @PutMapping("/{id}/void")
    @Operation(summary = "Void a sale and restore stock")
    public ResponseEntity<ApiResponse<Sale>> voidSale(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal CustomUserDetails user) {
        String reason = body.getOrDefault("reason", "No reason provided");
        Sale sale = salesService.voidSale(id, reason, user.getId());
        return ResponseEntity.ok(ApiResponse.success("Sale voided, stock restored", sale));
    }
}
