package com.manamperi.mrms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardDTO {
    private BigDecimal todaySales;
    private int todayTransactions;
    private BigDecimal monthSales;
    private int totalProducts;
    private int lowStockCount;
    private Double averageYield;
    private Map<String, BigDecimal> weeklyRevenue;
    private java.util.List<StockSummary> stockSummary;
    private java.util.List<RecentBatch> recentBatches;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StockSummary {
        private String productName;
        private String productType;
        private BigDecimal quantity;
        private BigDecimal minQuantity;
        private boolean lowStock;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecentBatch {
        private String batchId;
        private BigDecimal veeInput;
        private BigDecimal sahalOutput;
        private BigDecimal yieldPercentage;
        private String efficiency;
        private String date;
    }
}
