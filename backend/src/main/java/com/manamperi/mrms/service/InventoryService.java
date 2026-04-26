package com.manamperi.mrms.service;

import com.manamperi.mrms.entity.*;
import com.manamperi.mrms.exception.BadRequestException;
import com.manamperi.mrms.exception.ResourceNotFoundException;
import com.manamperi.mrms.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class InventoryService {

    private final StockRepository stockRepository;
    private final StockMovementRepository stockMovementRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public List<Map<String, Object>> getAllStock() {
        List<Stock> stocks = stockRepository.findAllWithProduct();
        return stocks.stream().map(s -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", s.getId());
            map.put("product", Map.of(
                    "id", s.getProduct().getId(),
                    "name", s.getProduct().getName(),
                    "productType", s.getProduct().getProductType().name(),
                    "packetSizeKg", s.getProduct().getPacketSizeKg() != null ? s.getProduct().getPacketSizeKg() : "",
                    "unit", s.getProduct().getUnit(),
                    "sellingPrice", s.getProduct().getSellingPrice()));
            map.put("quantity", s.getQuantity());
            map.put("minQuantity", s.getMinQuantity());
            map.put("lowStock", s.isLowStock());
            map.put("lastUpdated", s.getLastUpdated());
            return map;
        }).toList();
    }

    public List<Stock> getLowStock() {
        return stockRepository.findLowStock();
    }

    public List<StockMovement> getMovements(Long productId) {
        return stockMovementRepository.findByProductIdOrderByMovementDateDesc(productId);
    }

    /**
     * Manual stock adjustment with reason logging.
     * Quantity can be positive (add) or negative (subtract).
     */
    @Transactional
    @SuppressWarnings("null")
    public Stock adjustStock(Long productId, BigDecimal quantity, String reason, Long userId) {
        if (reason == null || reason.isBlank()) {
            throw new BadRequestException("Reason is required for manual stock adjustment");
        }

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Stock stock = stockRepository.findByProductId(productId)
                .orElseGet(() -> Stock.builder()
                        .product(product)
                        .quantity(BigDecimal.ZERO)
                        .minQuantity(BigDecimal.TEN)
                        .build());

        BigDecimal newQty = stock.getQuantity().add(quantity);
        if (newQty.compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("Adjustment would result in negative stock");
        }

        stock.setQuantity(newQty);
        stock = stockRepository.save(stock);

        // Log the adjustment
        stockMovementRepository.save(StockMovement.builder()
                .product(product)
                .movementType(StockMovement.MovementType.MANUAL_ADJUST)
                .quantity(quantity)
                .referenceType("ADJUSTMENT")
                .reason(reason)
                .performedBy(user)
                .movementDate(LocalDateTime.now())
                .build());

        return stock;
    }
}
