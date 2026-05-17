package com.manamperi.mrms.controller;

import com.manamperi.mrms.dto.ApiResponse;
import com.manamperi.mrms.dto.ProductionBatchRequest;
import com.manamperi.mrms.entity.ProductionBatch;
import com.manamperi.mrms.security.CustomUserDetails;
import com.manamperi.mrms.service.ProductionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/production")
@RequiredArgsConstructor
@Tag(name = "Production", description = "Production batch management")
public class ProductionController {

    private final ProductionService productionService;

    @GetMapping("/batches")
    @Operation(summary = "Get all production batches")
    public ResponseEntity<ApiResponse<List<ProductionBatch>>> getAllBatches() {
        return ResponseEntity.ok(ApiResponse.success(productionService.getAllBatches()));
    }

    @GetMapping("/batches/{id}")
    @Operation(summary = "Get batch by ID")
    public ResponseEntity<ApiResponse<ProductionBatch>> getBatchById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(productionService.getBatchById(id)));
    }

    @PostMapping("/batches")
    @Operation(summary = "Record a completed production batch")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRODUCTION_MANAGER')")
    public ResponseEntity<ApiResponse<ProductionBatch>> createBatch(
            @Valid @RequestBody ProductionBatchRequest request,
            @AuthenticationPrincipal CustomUserDetails user) {
        ProductionBatch batch = productionService.createBatch(request, user.getId());
        return ResponseEntity.ok(ApiResponse.success(
                "Batch " + batch.getBatchId() + " recorded. Yield: " + batch.getYieldPercentage() + "%", batch));
    }

    @PutMapping("/batches/{id}")
    @Operation(summary = "Update a production batch")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRODUCTION_MANAGER')")
    public ResponseEntity<ApiResponse<ProductionBatch>> updateBatch(
            @PathVariable Long id,
            @Valid @RequestBody ProductionBatchRequest request) {
        ProductionBatch batch = productionService.updateBatch(id, request);
        return ResponseEntity.ok(ApiResponse.success(
                "Batch " + batch.getBatchId() + " updated. Yield: " + batch.getYieldPercentage() + "%", batch));
    }

    @DeleteMapping("/batches/{id}")
    @Operation(summary = "Delete a production batch (soft delete)")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRODUCTION_MANAGER')")
    public ResponseEntity<ApiResponse<Void>> deleteBatch(@PathVariable Long id) {
        productionService.deleteBatch(id);
        return ResponseEntity.ok(ApiResponse.success("Batch deleted successfully", null));
    }
}
