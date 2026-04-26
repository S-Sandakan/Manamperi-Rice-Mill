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
import java.util.Map;

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
    @Operation(summary = "Create a new production batch")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRODUCTION_MANAGER')")
    public ResponseEntity<ApiResponse<ProductionBatch>> createBatch(
            @Valid @RequestBody ProductionBatchRequest request,
            @AuthenticationPrincipal CustomUserDetails user) {
        ProductionBatch batch = productionService.createBatch(request, user.getId());
        return ResponseEntity.ok(ApiResponse.success("Batch created: " + batch.getBatchId(), batch));
    }

    @PutMapping("/batches/{id}/complete")
    @Operation(summary = "Complete a production batch with output quantities")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRODUCTION_MANAGER')")
    public ResponseEntity<ApiResponse<ProductionBatch>> completeBatch(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        java.math.BigDecimal sahalOutput = new java.math.BigDecimal(body.get("sahalOutputKg").toString());
        java.math.BigDecimal kuduOutput = new java.math.BigDecimal(body.get("kuduOutputKg").toString());
        ProductionBatch batch = productionService.completeBatch(id, sahalOutput, kuduOutput);
        return ResponseEntity
                .ok(ApiResponse.success("Batch completed. Yield: " + batch.getYieldPercentage() + "%", batch));
    }
}
