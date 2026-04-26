package com.manamperi.mrms.controller;

import com.manamperi.mrms.dto.ApiResponse;
import com.manamperi.mrms.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Reports", description = "Reporting and analytics")
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/daily-sales")
    @Operation(summary = "Get daily sales report")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDailySales(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(ApiResponse.success(reportService.getDailySalesReport(date)));
    }

    @GetMapping("/monthly-sales")
    @Operation(summary = "Get monthly sales report")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMonthlySales(
            @RequestParam int month, @RequestParam int year) {
        return ResponseEntity.ok(ApiResponse.success(reportService.getMonthlySalesReport(month, year)));
    }

    @GetMapping("/production-efficiency")
    @Operation(summary = "Get production efficiency report")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getProductionEfficiency(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(ApiResponse.success(
                reportService.getProductionEfficiencyReport(startDate, endDate)));
    }

    @GetMapping("/profit-analysis")
    @Operation(summary = "Get profit analysis report")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getProfitAnalysis(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(ApiResponse.success(
                reportService.getProfitAnalysisReport(startDate, endDate)));
    }

    @GetMapping("/stock")
    @Operation(summary = "Get stock report")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getStockReport() {
        return ResponseEntity.ok(ApiResponse.success(reportService.getStockReport()));
    }

    @GetMapping("/purchase-history")
    @Operation(summary = "Get purchase history report")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPurchaseHistory(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(ApiResponse.success(
                reportService.getPurchaseHistoryReport(startDate, endDate)));
    }
}
