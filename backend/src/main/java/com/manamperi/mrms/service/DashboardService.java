package com.manamperi.mrms.service;

import com.manamperi.mrms.dto.DashboardDTO;
import com.manamperi.mrms.entity.ProductionBatch;
import com.manamperi.mrms.entity.Stock;
import com.manamperi.mrms.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final SaleRepository saleRepository;
    private final StockRepository stockRepository;
    private final ProductRepository productRepository;
    private final ProductionBatchRepository batchRepository;

    public DashboardDTO getDashboardData() {
        LocalDate today = LocalDate.now();
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = today.plusDays(1).atStartOfDay();
        LocalDateTime startOfMonth = today.withDayOfMonth(1).atStartOfDay();

        // Today's sales
        BigDecimal todaySales = saleRepository.getTotalSales(startOfDay, endOfDay);
        int todayTx = saleRepository.countByDate(LocalDateTime.now());

        // Month sales
        BigDecimal monthSales = saleRepository.getTotalSales(startOfMonth, endOfDay);

        // Products and stock
        int totalProducts = productRepository.findByIsActiveTrue().size();
        List<Stock> lowStockList = stockRepository.findLowStock();

        // Average yield for the month
        Double avgYield = batchRepository.getAverageYield(today.withDayOfMonth(1), today);

        // Weekly revenue (last 7 days)
        Map<String, BigDecimal> weeklyRevenue = new LinkedHashMap<>();
        String[] dayNames = { "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun" };
        for (int i = 6; i >= 0; i--) {
            LocalDate d = today.minusDays(i);
            BigDecimal rev = saleRepository.getTotalSales(d.atStartOfDay(), d.plusDays(1).atStartOfDay());
            weeklyRevenue.put(dayNames[d.getDayOfWeek().getValue() - 1], rev != null ? rev : BigDecimal.ZERO);
        }

        // Stock summary
        List<DashboardDTO.StockSummary> stockSummary = stockRepository.findAllWithProduct().stream()
                .map(s -> DashboardDTO.StockSummary.builder()
                        .productName(s.getProduct().getName())
                        .productType(s.getProduct().getProductType().name())
                        .quantity(s.getQuantity())
                        .minQuantity(s.getMinQuantity())
                        .lowStock(s.isLowStock())
                        .build())
                .toList();

        // Recent batches
        List<ProductionBatch> recentBatches = batchRepository.findByIsActiveTrueOrderByBatchDateDesc();
        List<DashboardDTO.RecentBatch> recent = recentBatches.stream()
                .limit(5)
                .map(b -> DashboardDTO.RecentBatch.builder()
                        .batchId(b.getBatchId())
                        .veeInput(b.getVeeInputKg())
                        .sahalOutput(b.getSahalOutputKg())
                        .yieldPercentage(b.getYieldPercentage())
                        .efficiency(b.getEfficiency() != null ? b.getEfficiency().name() : null)
                        .date(b.getBatchDate().toString())
                        .build())
                .toList();

        return DashboardDTO.builder()
                .todaySales(todaySales != null ? todaySales : BigDecimal.ZERO)
                .todayTransactions(todayTx)
                .monthSales(monthSales != null ? monthSales : BigDecimal.ZERO)
                .totalProducts(totalProducts)
                .lowStockCount(lowStockList.size())
                .averageYield(avgYield != null ? avgYield : 0.0)
                .weeklyRevenue(weeklyRevenue)
                .stockSummary(stockSummary)
                .recentBatches(recent)
                .build();
    }
}
