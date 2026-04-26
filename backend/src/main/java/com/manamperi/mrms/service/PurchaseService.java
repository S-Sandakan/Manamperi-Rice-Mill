package com.manamperi.mrms.service;

import com.manamperi.mrms.dto.PurchaseRequest;
import com.manamperi.mrms.entity.*;
import com.manamperi.mrms.exception.ResourceNotFoundException;
import com.manamperi.mrms.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PurchaseService {

    private final PurchaseRepository purchaseRepository;
    private final SupplierRepository supplierRepository;
    private final PriceHistoryRepository priceHistoryRepository;
    private final StockRepository stockRepository;
    private final StockMovementRepository stockMovementRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public List<Purchase> getAll() {
        return purchaseRepository.findByIsActiveTrueOrderByPurchaseDateDesc();
    }

    public List<Purchase> getFiltered(Long supplierId, LocalDate startDate, LocalDate endDate,
            BigDecimal minPrice, BigDecimal maxPrice) {
        return purchaseRepository.findWithFilters(supplierId, startDate, endDate, minPrice, maxPrice);
    }

    @SuppressWarnings("null")
    public Purchase getById(Long id) {
        return purchaseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase", "id", id));
    }

    @Transactional
    @SuppressWarnings("null")
    public Purchase create(PurchaseRequest request, Long userId) {
        Supplier supplier = supplierRepository.findById(request.getSupplierId())
                .orElseThrow(() -> new ResourceNotFoundException("Supplier", "id", request.getSupplierId()));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        BigDecimal totalAmount = request.getVeeQuantityKg().multiply(request.getPricePerKg());

        // Create purchase
        Purchase purchase = Purchase.builder()
                .supplier(supplier)
                .veeQuantityKg(request.getVeeQuantityKg())
                .pricePerKg(request.getPricePerKg())
                .totalAmount(totalAmount)
                .purchaseDate(request.getPurchaseDate() != null ? request.getPurchaseDate() : LocalDate.now())
                .notes(request.getNotes())
                .createdBy(user)
                .isActive(true)
                .build();
        purchase = purchaseRepository.save(purchase);

        // Insert price history (append-only, immutable)
        PriceHistory priceHistory = PriceHistory.builder()
                .supplier(supplier)
                .pricePerKg(request.getPricePerKg())
                .effectiveDate(LocalDateTime.now())
                .recordedBy(user)
                .build();
        priceHistoryRepository.save(priceHistory);

        // Update raw paddy (Vee) stock — product ID 1 is raw paddy
        Product veeProduct = productRepository.findById(1L)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "name", "Raw Paddy"));

        Stock veeStock = stockRepository.findByProductId(veeProduct.getId())
                .orElseGet(() -> Stock.builder()
                        .product(veeProduct)
                        .quantity(BigDecimal.ZERO)
                        .minQuantity(new BigDecimal("500"))
                        .build());
        veeStock.setQuantity(veeStock.getQuantity().add(request.getVeeQuantityKg()));
        stockRepository.save(veeStock);

        // Log stock movement
        stockMovementRepository.save(StockMovement.builder()
                .product(veeProduct)
                .movementType(StockMovement.MovementType.PURCHASE_IN)
                .quantity(request.getVeeQuantityKg())
                .referenceType("PURCHASE")
                .referenceId(purchase.getId())
                .reason("Purchase from " + supplier.getName())
                .performedBy(user)
                .movementDate(LocalDateTime.now())
                .build());

        return purchase;
    }
}
