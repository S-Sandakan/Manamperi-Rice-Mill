package com.manamperi.mrms.service;

import com.manamperi.mrms.dto.ProductionBatchRequest;
import com.manamperi.mrms.entity.*;
import com.manamperi.mrms.exception.BadRequestException;
import com.manamperi.mrms.exception.InsufficientStockException;
import com.manamperi.mrms.exception.ResourceNotFoundException;
import com.manamperi.mrms.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductionService {

    private static final BigDecimal EFFICIENCY_THRESHOLD = new BigDecimal("64.00");

    private final ProductionBatchRepository batchRepository;
    private final BatchCostRepository batchCostRepository;
    private final StockRepository stockRepository;
    private final StockMovementRepository stockMovementRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public List<ProductionBatch> getAllBatches() {
        return batchRepository.findByIsActiveTrueOrderByBatchDateDesc();
    }

    @SuppressWarnings("null")
    public ProductionBatch getBatchById(Long id) {
        return batchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ProductionBatch", "id", id));
    }

    public List<ProductionBatch> getBatchesByDateRange(LocalDate start, LocalDate end) {
        return batchRepository.findByDateRange(start, end);
    }

    /**
     * Create a new production batch (IN_PROGRESS state).
     * Validates that sufficient Vee stock is available.
     */
    @Transactional
    @SuppressWarnings("null")
    public ProductionBatch createBatch(ProductionBatchRequest request, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        LocalDate batchDate = request.getBatchDate() != null ? request.getBatchDate() : LocalDate.now();

        // Validate Vee stock
        Product veeProduct = productRepository.findById(1L)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "name", "Raw Paddy"));
        Stock veeStock = stockRepository.findByProductId(veeProduct.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Stock", "product", "Raw Paddy"));

        if (veeStock.getQuantity().compareTo(request.getVeeInputKg()) < 0) {
            throw new InsufficientStockException("Raw Paddy (Vee)",
                    request.getVeeInputKg(), veeStock.getQuantity());
        }

        // Generate batch ID: BATCH-YYYYMMDD-001
        String batchId = generateBatchId(batchDate);

        ProductionBatch batch = ProductionBatch.builder()
                .batchId(batchId)
                .veeInputKg(request.getVeeInputKg())
                .status(ProductionBatch.BatchStatus.IN_PROGRESS)
                .batchDate(batchDate)
                .notes(request.getNotes())
                .createdBy(user)
                .isActive(true)
                .build();
        batch = batchRepository.save(batch);

        // Create batch cost record
        BigDecimal veeCost = calculateVeeCost(request.getVeeInputKg());
        BigDecimal opCost = request.getOperationalCost() != null ? request.getOperationalCost() : BigDecimal.ZERO;

        BatchCost batchCost = BatchCost.builder()
                .batch(batch)
                .veeCost(veeCost)
                .operationalCost(opCost)
                .totalCost(veeCost.add(opCost))
                .build();
        batchCostRepository.save(batchCost);

        return batch;
    }

    /**
     * Complete a production batch with output quantities.
     * CRITICAL: Calculates yield, updates efficiency, adjusts stock.
     */
    @Transactional
    @SuppressWarnings("null")
    public ProductionBatch completeBatch(Long batchId, BigDecimal sahalOutputKg, BigDecimal kuduOutputKg) {
        ProductionBatch batch = getBatchById(batchId);

        if (batch.getStatus() != ProductionBatch.BatchStatus.IN_PROGRESS) {
            throw new BadRequestException("Batch " + batch.getBatchId() + " is not in progress");
        }

        // Critical yield calculation: Yield % = (Sahal Output / Vee Input) × 100
        BigDecimal yieldPercentage = sahalOutputKg
                .divide(batch.getVeeInputKg(), 4, RoundingMode.HALF_UP)
                .multiply(new BigDecimal("100"))
                .setScale(2, RoundingMode.HALF_UP);

        ProductionBatch.Efficiency efficiency = yieldPercentage.compareTo(EFFICIENCY_THRESHOLD) >= 0
                ? ProductionBatch.Efficiency.EFFICIENT
                : ProductionBatch.Efficiency.INEFFICIENT;

        batch.setSahalOutputKg(sahalOutputKg);
        batch.setKuduOutputKg(kuduOutputKg);
        batch.setYieldPercentage(yieldPercentage);
        batch.setEfficiency(efficiency);
        batch.setStatus(ProductionBatch.BatchStatus.COMPLETED);
        batch.setCompletedAt(LocalDateTime.now());

        User user = batch.getCreatedBy();

        // ===== STOCK ADJUSTMENTS =====
        // 1. Deduct Vee stock
        Product veeProduct = productRepository.findById(1L).orElseThrow();
        Stock veeStock = stockRepository.findByProductId(veeProduct.getId()).orElseThrow();

        if (veeStock.getQuantity().compareTo(batch.getVeeInputKg()) < 0) {
            throw new InsufficientStockException("Raw Paddy (Vee)",
                    batch.getVeeInputKg(), veeStock.getQuantity());
        }
        veeStock.setQuantity(veeStock.getQuantity().subtract(batch.getVeeInputKg()));
        stockRepository.save(veeStock);

        stockMovementRepository.save(StockMovement.builder()
                .product(veeProduct)
                .movementType(StockMovement.MovementType.PRODUCTION_OUT)
                .quantity(batch.getVeeInputKg())
                .referenceType("BATCH")
                .referenceId(batch.getId())
                .reason("Batch " + batch.getBatchId() + " - Vee consumed")
                .performedBy(user)
                .movementDate(LocalDateTime.now())
                .build());

        // 2. Increase Sahal stock — distribute across Sahal products based on kg
        // For simplicity, we add to a bulk Sahal product (first SAHAL product that
        // isn't Vee)
        List<Product> sahalProducts = productRepository.findByProductTypeAndIsActiveTrue(Product.ProductType.SAHAL);
        // Find the bulk/generic sahal product or use the largest one
        for (Product sp : sahalProducts) {
            if (sp.getId() != 1L) { // Not raw paddy
                Stock sahalStock = stockRepository.findByProductId(sp.getId())
                        .orElseGet(() -> Stock.builder().product(sp).quantity(BigDecimal.ZERO)
                                .minQuantity(BigDecimal.TEN).build());
                // Add proportional stock based on packet size
                if (sp.getPacketSizeKg() != null && sp.getPacketSizeKg().compareTo(BigDecimal.ZERO) > 0) {
                    BigDecimal additionalPackets = sahalOutputKg.divide(sp.getPacketSizeKg(), 0, RoundingMode.FLOOR);
                    if (additionalPackets.compareTo(BigDecimal.ZERO) > 0) {
                        sahalStock.setQuantity(sahalStock.getQuantity().add(additionalPackets));
                        stockRepository.save(sahalStock);

                        stockMovementRepository.save(StockMovement.builder()
                                .product(sp)
                                .movementType(StockMovement.MovementType.PRODUCTION_IN)
                                .quantity(additionalPackets)
                                .referenceType("BATCH")
                                .referenceId(batch.getId())
                                .reason("Batch " + batch.getBatchId() + " - Sahal produced")
                                .performedBy(user)
                                .movementDate(LocalDateTime.now())
                                .build());
                        // Only add to the largest packet product to avoid double counting
                        break;
                    }
                }
            }
        }

        // 3. Increase Kudu stock
        List<Product> kuduProducts = productRepository.findByProductTypeAndIsActiveTrue(Product.ProductType.KUDU);
        if (!kuduProducts.isEmpty()) {
            Product kuduProduct = kuduProducts.get(0);
            Stock kuduStock = stockRepository.findByProductId(kuduProduct.getId())
                    .orElseGet(() -> Stock.builder().product(kuduProduct).quantity(BigDecimal.ZERO)
                            .minQuantity(new BigDecimal("200")).build());
            kuduStock.setQuantity(kuduStock.getQuantity().add(kuduOutputKg));
            stockRepository.save(kuduStock);

            stockMovementRepository.save(StockMovement.builder()
                    .product(kuduProduct)
                    .movementType(StockMovement.MovementType.PRODUCTION_IN)
                    .quantity(kuduOutputKg)
                    .referenceType("BATCH")
                    .referenceId(batch.getId())
                    .reason("Batch " + batch.getBatchId() + " - Kudu by-product")
                    .performedBy(user)
                    .movementDate(LocalDateTime.now())
                    .build());
        }

        return batchRepository.save(batch);
    }

    private String generateBatchId(LocalDate date) {
        String datePart = date.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        int count = batchRepository.countByBatchDate(date) + 1;
        return String.format("BATCH-%s-%03d", datePart, count);
    }

    private BigDecimal calculateVeeCost(BigDecimal veeInputKg) {
        // Calculate based on latest average purchase price
        // Simple approach: use average of recent prices
        return veeInputKg.multiply(new BigDecimal("85.00")); // Fallback default
    }

    public Double getAverageYield(LocalDate start, LocalDate end) {
        return batchRepository.getAverageYield(start, end);
    }
}
