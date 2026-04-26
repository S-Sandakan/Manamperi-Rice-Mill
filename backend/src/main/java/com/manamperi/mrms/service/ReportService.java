package com.manamperi.mrms.service;

import com.manamperi.mrms.entity.*;
import com.manamperi.mrms.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final SaleRepository saleRepository;

    private final PurchaseRepository purchaseRepository;
    private final ProductionBatchRepository batchRepository;
    private final BatchCostRepository batchCostRepository;
    private final StockRepository stockRepository;

    public Map<String, Object> getDailySalesReport(LocalDate date) {
        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end = date.plusDays(1).atStartOfDay();

        List<Sale> sales = saleRepository.findByDateRange(start, end);
        BigDecimal totalSales = saleRepository.getTotalSales(start, end);
        BigDecimal totalDiscounts = saleRepository.getTotalDiscounts(start, end);

        Map<String, Object> report = new LinkedHashMap<>();
        report.put("date", date.toString());
        report.put("totalTransactions", sales.size());
        report.put("grossSales", totalSales != null ? totalSales : BigDecimal.ZERO);
        report.put("totalDiscounts", totalDiscounts != null ? totalDiscounts : BigDecimal.ZERO);
        report.put("netSales", (totalSales != null ? totalSales : BigDecimal.ZERO)
                .subtract(totalDiscounts != null ? totalDiscounts : BigDecimal.ZERO));
        report.put("sales", sales.stream().map(s -> Map.of(
                "invoiceNumber", s.getInvoiceNumber(),
                "total", s.getTotal(),
                "paymentType", s.getPaymentType().name(),
                "time", s.getSaleDate().toString())).toList());

        return report;
    }

    public Map<String, Object> getMonthlySalesReport(int month, int year) {
        LocalDate start = LocalDate.of(year, month, 1);
        LocalDate end = start.plusMonths(1);
        LocalDateTime startDt = start.atStartOfDay();
        LocalDateTime endDt = end.atStartOfDay();

        List<Sale> sales = saleRepository.findByDateRange(startDt, endDt);
        BigDecimal totalSales = saleRepository.getTotalSales(startDt, endDt);
        BigDecimal totalDiscounts = saleRepository.getTotalDiscounts(startDt, endDt);

        // Daily breakdown
        Map<String, BigDecimal> dailyBreakdown = new LinkedHashMap<>();
        for (LocalDate d = start; d.isBefore(end); d = d.plusDays(1)) {
            BigDecimal daySales = saleRepository.getTotalSales(d.atStartOfDay(), d.plusDays(1).atStartOfDay());
            dailyBreakdown.put(d.toString(), daySales != null ? daySales : BigDecimal.ZERO);
        }

        Map<String, Object> report = new LinkedHashMap<>();
        report.put("month", month);
        report.put("year", year);
        report.put("totalTransactions", sales.size());
        report.put("grossSales", totalSales != null ? totalSales : BigDecimal.ZERO);
        report.put("totalDiscounts", totalDiscounts != null ? totalDiscounts : BigDecimal.ZERO);
        report.put("netSales", (totalSales != null ? totalSales : BigDecimal.ZERO)
                .subtract(totalDiscounts != null ? totalDiscounts : BigDecimal.ZERO));
        report.put("dailyBreakdown", dailyBreakdown);

        return report;
    }

    public Map<String, Object> getProductionEfficiencyReport(LocalDate startDate, LocalDate endDate) {
        if (startDate == null)
            startDate = LocalDate.now().withDayOfMonth(1);
        if (endDate == null)
            endDate = LocalDate.now();

        List<ProductionBatch> batches = batchRepository.findByDateRange(startDate, endDate);
        Double avgYield = batchRepository.getAverageYield(startDate, endDate);

        long efficient = batches.stream()
                .filter(b -> b.getEfficiency() == ProductionBatch.Efficiency.EFFICIENT).count();
        long inefficient = batches.stream()
                .filter(b -> b.getEfficiency() == ProductionBatch.Efficiency.INEFFICIENT).count();

        Map<String, Object> report = new LinkedHashMap<>();
        report.put("period", startDate + " to " + endDate);
        report.put("totalBatches", batches.size());
        report.put("efficientBatches", efficient);
        report.put("inefficientBatches", inefficient);
        report.put("averageYield", avgYield != null ? avgYield : 0.0);
        report.put("efficiencyThreshold", 64.0);
        report.put("batches", batches.stream().map(b -> Map.of(
                "batchId", b.getBatchId(),
                "veeInput", b.getVeeInputKg(),
                "sahalOutput", b.getSahalOutputKg() != null ? b.getSahalOutputKg() : BigDecimal.ZERO,
                "yieldPercentage", b.getYieldPercentage() != null ? b.getYieldPercentage() : BigDecimal.ZERO,
                "efficiency", b.getEfficiency() != null ? b.getEfficiency().name() : "N/A",
                "date", b.getBatchDate().toString())).toList());

        return report;
    }

    public Map<String, Object> getProfitAnalysisReport(LocalDate startDate, LocalDate endDate) {
        if (startDate == null)
            startDate = LocalDate.now().withDayOfMonth(1);
        if (endDate == null)
            endDate = LocalDate.now();

        // Revenue from sales
        BigDecimal totalRevenue = saleRepository.getTotalSales(startDate.atStartOfDay(),
                endDate.plusDays(1).atStartOfDay());
        BigDecimal totalDiscounts = saleRepository.getTotalDiscounts(startDate.atStartOfDay(),
                endDate.plusDays(1).atStartOfDay());

        // Costs from purchases
        BigDecimal totalPurchaseCost = purchaseRepository.getTotalPurchaseAmount(startDate, endDate);

        // Batch operational costs
        List<ProductionBatch> batches = batchRepository.findByDateRange(startDate, endDate);
        BigDecimal operationalCosts = BigDecimal.ZERO;
        for (ProductionBatch batch : batches) {
            BatchCost cost = batchCostRepository.findByBatchId(batch.getId()).orElse(null);
            if (cost != null) {
                operationalCosts = operationalCosts.add(cost.getOperationalCost());
            }
        }

        BigDecimal totalCosts = (totalPurchaseCost != null ? totalPurchaseCost : BigDecimal.ZERO)
                .add(operationalCosts);
        BigDecimal netProfit = (totalRevenue != null ? totalRevenue : BigDecimal.ZERO)
                .subtract(totalCosts)
                .subtract(totalDiscounts != null ? totalDiscounts : BigDecimal.ZERO);

        Map<String, Object> report = new LinkedHashMap<>();
        report.put("period", startDate + " to " + endDate);
        report.put("totalRevenue", totalRevenue != null ? totalRevenue : BigDecimal.ZERO);
        report.put("totalDiscounts", totalDiscounts != null ? totalDiscounts : BigDecimal.ZERO);
        report.put("purchaseCosts", totalPurchaseCost != null ? totalPurchaseCost : BigDecimal.ZERO);
        report.put("operationalCosts", operationalCosts);
        report.put("totalCosts", totalCosts);
        report.put("netProfit", netProfit);

        return report;
    }

    public List<Map<String, Object>> getStockReport() {
        return stockRepository.findAllWithProduct().stream().map(s -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("product", s.getProduct().getName());
            map.put("type", s.getProduct().getProductType().name());
            map.put("quantity", s.getQuantity());
            map.put("minQuantity", s.getMinQuantity());
            map.put("status", s.isLowStock() ? "LOW" : "OK");
            map.put("value", s.getQuantity().multiply(s.getProduct().getSellingPrice()));
            return map;
        }).toList();
    }

    public Map<String, Object> getPurchaseHistoryReport(LocalDate startDate, LocalDate endDate) {
        if (startDate == null)
            startDate = LocalDate.now().minusMonths(1);
        if (endDate == null)
            endDate = LocalDate.now();

        List<Purchase> purchases = purchaseRepository.findWithFilters(null, startDate, endDate, null, null);
        BigDecimal totalAmount = purchaseRepository.getTotalPurchaseAmount(startDate, endDate);

        Map<String, Object> report = new LinkedHashMap<>();
        report.put("period", startDate + " to " + endDate);
        report.put("totalPurchases", purchases.size());
        report.put("totalAmount", totalAmount != null ? totalAmount : BigDecimal.ZERO);
        report.put("purchases", purchases.stream().map(p -> Map.of(
                "supplier", p.getSupplier().getName(),
                "quantity", p.getVeeQuantityKg(),
                "pricePerKg", p.getPricePerKg(),
                "total", p.getTotalAmount(),
                "date", p.getPurchaseDate().toString())).toList());

        return report;
    }
}
