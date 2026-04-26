package com.manamperi.mrms.controller;

import com.manamperi.mrms.dto.ApiResponse;
import com.manamperi.mrms.entity.PriceHistory;
import com.manamperi.mrms.entity.Supplier;
import com.manamperi.mrms.repository.PriceHistoryRepository;
import com.manamperi.mrms.service.SupplierService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/suppliers")
@RequiredArgsConstructor
@Tag(name = "Suppliers", description = "Supplier management")
public class SupplierController {

    private final SupplierService supplierService;
    private final PriceHistoryRepository priceHistoryRepository;

    @GetMapping
    @Operation(summary = "Get all active suppliers")
    public ResponseEntity<ApiResponse<List<Supplier>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(supplierService.getAllActive()));
    }

    @PostMapping
    @Operation(summary = "Create a new supplier")
    public ResponseEntity<ApiResponse<Supplier>> create(@RequestBody Supplier supplier) {
        return ResponseEntity.ok(ApiResponse.success("Supplier created", supplierService.create(supplier)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a supplier")
    public ResponseEntity<ApiResponse<Supplier>> update(@PathVariable Long id, @RequestBody Supplier supplier) {
        return ResponseEntity.ok(ApiResponse.success("Supplier updated", supplierService.update(id, supplier)));
    }

    @GetMapping("/{id}/price-history")
    @Operation(summary = "Get price history for a supplier")
    public ResponseEntity<ApiResponse<List<PriceHistory>>> getPriceHistory(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(
                priceHistoryRepository.findBySupplierIdOrderByEffectiveDateDesc(id)));
    }
}
