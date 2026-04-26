package com.manamperi.mrms.controller;

import com.manamperi.mrms.dto.ApiResponse;
import com.manamperi.mrms.dto.PurchaseRequest;
import com.manamperi.mrms.entity.Purchase;
import com.manamperi.mrms.security.CustomUserDetails;
import com.manamperi.mrms.service.PurchaseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/purchases")
@RequiredArgsConstructor
@Tag(name = "Purchases", description = "Purchase management")
public class PurchaseController {

    private final PurchaseService purchaseService;

    @GetMapping
    @Operation(summary = "Get all purchases with optional filters")
    public ResponseEntity<ApiResponse<List<Purchase>>> getAll(
            @RequestParam(required = false) Long supplierId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice) {

        List<Purchase> purchases;
        if (supplierId != null || startDate != null || endDate != null || minPrice != null || maxPrice != null) {
            purchases = purchaseService.getFiltered(supplierId, startDate, endDate, minPrice, maxPrice);
        } else {
            purchases = purchaseService.getAll();
        }
        return ResponseEntity.ok(ApiResponse.success(purchases));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get purchase by ID")
    public ResponseEntity<ApiResponse<Purchase>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(purchaseService.getById(id)));
    }

    @PostMapping
    @Operation(summary = "Record a new purchase")
    public ResponseEntity<ApiResponse<Purchase>> create(
            @Valid @RequestBody PurchaseRequest request,
            @AuthenticationPrincipal CustomUserDetails user) {
        Purchase purchase = purchaseService.create(request, user.getId());
        return ResponseEntity.ok(ApiResponse.success("Purchase recorded successfully", purchase));
    }
}
