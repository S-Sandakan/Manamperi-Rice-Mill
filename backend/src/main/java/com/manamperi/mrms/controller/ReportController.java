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

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

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
    private final com.manamperi.mrms.util.PdfGenerator pdfGenerator;

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

    @GetMapping("/{type}/pdf")
    @Operation(summary = "Export report as PDF")
    public ResponseEntity<byte[]> exportPdf(
            @PathVariable String type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        byte[] pdfBytes;
        String title = type.replace("-", " ").toUpperCase() + " REPORT";
        
        if (type.equals("daily-sales")) {
            pdfBytes = pdfGenerator.generateReportPdf(title, reportService.getDailySalesReport(date != null ? date : LocalDate.now()));
        } else if (type.equals("monthly-sales")) {
            pdfBytes = pdfGenerator.generateReportPdf(title, reportService.getMonthlySalesReport(month != null ? month : LocalDate.now().getMonthValue(), year != null ? year : LocalDate.now().getYear()));
        } else if (type.equals("production-efficiency")) {
            pdfBytes = pdfGenerator.generateReportPdf(title, reportService.getProductionEfficiencyReport(startDate, endDate));
        } else if (type.equals("profit-analysis")) {
            pdfBytes = pdfGenerator.generateReportPdf(title, reportService.getProfitAnalysisReport(startDate, endDate));
        } else if (type.equals("stock")) {
            // Need to cast to Object and then to the specific map if using generateListReportPdf, 
            // but generateListReportPdf takes List<Map<String,Object>>.
            // Actually getStockReport returns List<Map<String, Object>> directly.
            pdfBytes = pdfGenerator.generateListReportPdf(title, reportService.getStockReport());
        } else if (type.equals("purchase-history")) {
            pdfBytes = pdfGenerator.generateReportPdf(title, reportService.getPurchaseHistoryReport(startDate, endDate));
        } else {
            throw new IllegalArgumentException("Unknown report type: " + type);
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + type + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }
}
