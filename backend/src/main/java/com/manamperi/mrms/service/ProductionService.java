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
     * Create a completed production batch in a single step.
     * This is the main workflow: after milling is physically done,
     * the user enters vee input, sahal output, kudu output, and rice bran output.
     * 
     * The system:
     * 1. Validates sufficient Vee stock
     * 2. Creates a COMPLETED batch with yield calculation
     * 3. Deducts Vee from stock
     * 4. Adds Sahal, Kudu output to stock
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

        // Validate output doesn't exceed input
        BigDecimal totalOutput = request.getSahalOutputKg()
                .add(request.getKuduOutputKg())
                .add(request.getRiceBranOutputKg() != null ? request.getRiceBranOutputKg() : BigDecimal.ZERO);
        if (totalOutput.compareTo(request.getVeeInputKg()) > 0) {
            throw new BadRequestException("Total output (" + totalOutput + " kg) cannot exceed Vee input (" + request.getVeeInputKg() + " kg)");
        }

        // Calculate yield: (Sahal Output / Vee Input) × 100
        BigDecimal yieldPercentage = request.getSahalOutputKg()
                .divide(request.getVeeInputKg(), 4, RoundingMode.HALF_UP)
                .multiply(new BigDecimal("100"))
                .setScale(2, RoundingMode.HALF_UP);

        ProductionBatch.Efficiency efficiency = yieldPercentage.compareTo(EFFICIENCY_THRESHOLD) >= 0
                ? ProductionBatch.Efficiency.EFFICIENT
                : ProductionBatch.Efficiency.INEFFICIENT;

        // Generate batch ID: BATCH-YYYYMMDD-001
        String batchId = generateBatchId(batchDate);

        // Create batch as COMPLETED directly
        ProductionBatch batch = ProductionBatch.builder()
                .batchId(batchId)
                .veeInputKg(request.getVeeInputKg())
                .sahalOutputKg(request.getSahalOutputKg())
                .kuduOutputKg(request.getKuduOutputKg())
                .riceBranOutputKg(request.getRiceBranOutputKg())
                .yieldPercentage(yieldPercentage)
                .efficiency(efficiency)
                .status(ProductionBatch.BatchStatus.COMPLETED)
                .batchDate(batchDate)
                .completedAt(LocalDateTime.now())
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

        // ===== STOCK ADJUSTMENTS =====

        // 1. Deduct Vee stock
        veeStock.setQuantity(veeStock.getQuantity().subtract(request.getVeeInputKg()));
        stockRepository.save(veeStock);

        stockMovementRepository.save(StockMovement.builder()
                .product(veeProduct)
                .movementType(StockMovement.MovementType.PRODUCTION_OUT)
                .quantity(request.getVeeInputKg())
                .referenceType("BATCH")
                .referenceId(batch.getId())
                .reason("Batch " + batch.getBatchId() + " - Vee consumed")
                .performedBy(user)
                .movementDate(LocalDateTime.now())
                .build());

        // 2. Increase Sahal stock
        List<Product> sahalProducts = productRepository.findByProductTypeAndIsActiveTrue(Product.ProductType.SAHAL);
        for (Product sp : sahalProducts) {
            if (sp.getId() != 1L) {
                Stock sahalStock = stockRepository.findByProductId(sp.getId())
                        .orElseGet(() -> Stock.builder().product(sp).quantity(BigDecimal.ZERO)
                                .minQuantity(BigDecimal.TEN).build());
                if (sp.getPacketSizeKg() != null && sp.getPacketSizeKg().compareTo(BigDecimal.ZERO) > 0) {
                    BigDecimal additionalPackets = request.getSahalOutputKg().divide(sp.getPacketSizeKg(), 0, RoundingMode.FLOOR);
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
            kuduStock.setQuantity(kuduStock.getQuantity().add(request.getKuduOutputKg()));
            stockRepository.save(kuduStock);

            stockMovementRepository.save(StockMovement.builder()
                    .product(kuduProduct)
                    .movementType(StockMovement.MovementType.PRODUCTION_IN)
                    .quantity(request.getKuduOutputKg())
                    .referenceType("BATCH")
                    .referenceId(batch.getId())
                    .reason("Batch " + batch.getBatchId() + " - Kudu by-product")
                    .performedBy(user)
                    .movementDate(LocalDateTime.now())
                    .build());
        }

        return batch;
    }

    private String generateBatchId(LocalDate date) {
        String datePart = date.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        int count = batchRepository.countByBatchDate(date) + 1;
        return String.format("BATCH-%s-%03d", datePart, count);
    }

    private BigDecimal calculateVeeCost(BigDecimal veeInputKg) {
        return veeInputKg.multiply(new BigDecimal("85.00"));
    }

    public Double getAverageYield(LocalDate start, LocalDate end) {
        return batchRepository.getAverageYield(start, end);
    }

    /**
     * Update a production batch's output data and recalculate yield/efficiency.
     */
    @Transactional
    @SuppressWarnings("null")
    public ProductionBatch updateBatch(Long batchId, ProductionBatchRequest request) {
        ProductionBatch batch = getBatchById(batchId);

        // Validate output doesn't exceed input
        BigDecimal veeInput = request.getVeeInputKg();
        BigDecimal totalOutput = request.getSahalOutputKg()
                .add(request.getKuduOutputKg())
                .add(request.getRiceBranOutputKg() != null ? request.getRiceBranOutputKg() : BigDecimal.ZERO);
        if (totalOutput.compareTo(veeInput) > 0) {
            throw new BadRequestException("Total output (" + totalOutput + " kg) cannot exceed Vee input (" + veeInput + " kg)");
        }

        // Recalculate yield
        BigDecimal yieldPercentage = request.getSahalOutputKg()
                .divide(veeInput, 4, RoundingMode.HALF_UP)
                .multiply(new BigDecimal("100"))
                .setScale(2, RoundingMode.HALF_UP);

        ProductionBatch.Efficiency efficiency = yieldPercentage.compareTo(EFFICIENCY_THRESHOLD) >= 0
                ? ProductionBatch.Efficiency.EFFICIENT
                : ProductionBatch.Efficiency.INEFFICIENT;

        // Update batch fields
        batch.setVeeInputKg(veeInput);
        batch.setSahalOutputKg(request.getSahalOutputKg());
        batch.setKuduOutputKg(request.getKuduOutputKg());
        batch.setRiceBranOutputKg(request.getRiceBranOutputKg());
        batch.setYieldPercentage(yieldPercentage);
        batch.setEfficiency(efficiency);
        batch.setBatchDate(request.getBatchDate() != null ? request.getBatchDate() : batch.getBatchDate());
        batch.setNotes(request.getNotes());

        return batchRepository.save(batch);
    }

    /**
     * Soft-delete a production batch (set isActive = false).
     */
    @Transactional
    public void deleteBatch(Long batchId) {
        ProductionBatch batch = getBatchById(batchId);
        batch.setIsActive(false);
        batchRepository.save(batch);
    }
}
