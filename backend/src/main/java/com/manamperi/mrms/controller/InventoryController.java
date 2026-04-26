package com.manamperi.mrms.controller;

import com.manamperi.mrms.dto.ApiResponse;
import com.manamperi.mrms.entity.Stock;
import com.manamperi.mrms.entity.StockMovement;
import com.manamperi.mrms.security.CustomUserDetails;
import com.manamperi.mrms.service.InventoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/inventory")
@RequiredArgsConstructor
@Tag(name = "Inventory", description = "Inventory and stock management")
public class InventoryController {

    private final InventoryService inventoryService;

    @GetMapping("/stock")
    @Operation(summary = "Get all current stock levels")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getStock() {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.getAllStock()));
    }

    @GetMapping("/low-stock")
    @Operation(summary = "Get products with low stock")
    public ResponseEntity<ApiResponse<List<Stock>>> getLowStock() {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.getLowStock()));
    }

    @GetMapping("/movements/{productId}")
    @Operation(summary = "Get stock movement history for a product")
    public ResponseEntity<ApiResponse<List<StockMovement>>> getMovements(@PathVariable Long productId) {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.getMovements(productId)));
    }

    @PostMapping("/adjust")
    @Operation(summary = "Manual stock adjustment")
    public ResponseEntity<ApiResponse<Stock>> adjustStock(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal CustomUserDetails user) {
        Long productId = Long.valueOf(body.get("productId").toString());
        BigDecimal quantity = new BigDecimal(body.get("quantity").toString());
        String reason = body.get("reason").toString();

        Stock stock = inventoryService.adjustStock(productId, quantity, reason, user.getId());
        return ResponseEntity.ok(ApiResponse.success("Stock adjusted successfully", stock));
    }
}
