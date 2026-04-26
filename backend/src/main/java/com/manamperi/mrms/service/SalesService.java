package com.manamperi.mrms.service;

import com.manamperi.mrms.dto.SaleRequest;
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
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SalesService {

    private final SaleRepository saleRepository;
    private final SaleItemRepository saleItemRepository;
    private final ProductRepository productRepository;
    private final StockRepository stockRepository;
    private final StockMovementRepository stockMovementRepository;
    private final UserRepository userRepository;

    public List<Sale> getAll() {
        return saleRepository.findByIsVoidFalseAndIsActiveTrueOrderBySaleDateDesc();
    }

    public List<Sale> getByDateRange(LocalDateTime start, LocalDateTime end) {
        return saleRepository.findByDateRange(start, end);
    }

    @SuppressWarnings("null")
    public Sale getById(Long id) {
        return saleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sale", "id", id));
    }

    public Map<String, Object> getSaleDetails(Long id) {
        Sale sale = getById(id);
        List<SaleItem> items = saleItemRepository.findBySaleId(id);

        Map<String, Object> details = new HashMap<>();
        details.put("id", sale.getId());
        details.put("invoiceNumber", sale.getInvoiceNumber());
        details.put("cashier", sale.getCashier().getFullName());
        details.put("subtotal", sale.getSubtotal());
        details.put("discountAmount", sale.getDiscountAmount());
        details.put("discountType", sale.getDiscountType());
        details.put("discountValue", sale.getDiscountValue());
        details.put("total", sale.getTotal());
        details.put("paymentType", sale.getPaymentType());
        details.put("saleDate", sale.getSaleDate());
        details.put("items", items.stream().map(item -> {
            Map<String, Object> m = new HashMap<>();
            m.put("productName", item.getProduct().getName());
            m.put("quantity", item.getQuantity());
            m.put("unitPrice", item.getUnitPrice());
            m.put("lineTotal", item.getLineTotal());
            return m;
        }).toList());

        return details;
    }

    /**
     * Create a new sale transaction.
     * Validates stock, deducts inventory, generates invoice number, logs movements.
     */
    @Transactional
    @SuppressWarnings("null")
    public Map<String, Object> createSale(SaleRequest request, Long userId) {
        User cashier = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        // Generate invoice number: INV-YYYYMMDD-001
        String invoiceNumber = generateInvoiceNumber();

        // Validate stock and calculate subtotal
        BigDecimal subtotal = BigDecimal.ZERO;
        List<SaleItem> saleItems = new ArrayList<>();

        for (SaleRequest.SaleItemRequest itemReq : request.getItems()) {
            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product", "id", itemReq.getProductId()));

            // Check stock
            Stock stock = stockRepository.findByProductId(product.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Stock", "product", product.getName()));

            if (stock.getQuantity().compareTo(itemReq.getQuantity()) < 0) {
                throw new InsufficientStockException(product.getName(),
                        itemReq.getQuantity(), stock.getQuantity());
            }

            // Determine the unit price to use
            BigDecimal unitPrice = product.getSellingPrice();
            if (itemReq.getCustomUnitPrice() != null) {
                unitPrice = itemReq.getCustomUnitPrice();
                
                // Update product price in DB if it changed
                if (unitPrice.compareTo(product.getSellingPrice()) != 0) {
                    product.setSellingPrice(unitPrice);
                    productRepository.save(product);
                }
            }

            BigDecimal lineTotal = unitPrice.multiply(itemReq.getQuantity());
            subtotal = subtotal.add(lineTotal);

            saleItems.add(SaleItem.builder()
                    .product(product)
                    .quantity(itemReq.getQuantity())
                    .unitPrice(unitPrice)
                    .lineTotal(lineTotal)
                    .build());
        }

        // Calculate discount
        BigDecimal discountAmount = BigDecimal.ZERO;
        Sale.DiscountType discountType = null;
        BigDecimal discountValue = request.getDiscountValue() != null ? request.getDiscountValue() : BigDecimal.ZERO;

        if (request.getDiscountType() != null && !request.getDiscountType().isEmpty()) {
            discountType = Sale.DiscountType.valueOf(request.getDiscountType());
            if (discountType == Sale.DiscountType.PERCENTAGE) {
                discountAmount = subtotal.multiply(discountValue).divide(new BigDecimal("100"), 2,
                        RoundingMode.HALF_UP);
            } else {
                discountAmount = discountValue;
            }
        }

        BigDecimal total = subtotal.subtract(discountAmount).max(BigDecimal.ZERO);

        // Create sale
        Sale sale = Sale.builder()
                .invoiceNumber(invoiceNumber)
                .cashier(cashier)
                .subtotal(subtotal)
                .discountAmount(discountAmount)
                .discountType(discountType)
                .discountValue(discountValue)
                .total(total)
                .paymentType(Sale.PaymentType.valueOf(request.getPaymentType()))
                .saleDate(LocalDateTime.now())
                .isVoid(false)
                .isActive(true)
                .build();
        sale = saleRepository.save(sale);

        // Save sale items and deduct stock
        for (SaleItem item : saleItems) {
            item.setSale(sale);
            saleItemRepository.save(item);

            // Deduct stock
            Stock stock = stockRepository.findByProductId(item.getProduct().getId()).orElseThrow();
            stock.setQuantity(stock.getQuantity().subtract(item.getQuantity()));
            stockRepository.save(stock);

            // Log movement
            stockMovementRepository.save(StockMovement.builder()
                    .product(item.getProduct())
                    .movementType(StockMovement.MovementType.SALE_OUT)
                    .quantity(item.getQuantity())
                    .referenceType("SALE")
                    .referenceId(sale.getId())
                    .reason("Sale " + invoiceNumber)
                    .performedBy(cashier)
                    .movementDate(LocalDateTime.now())
                    .build());
        }

        Map<String, Object> result = new HashMap<>();
        result.put("id", sale.getId());
        result.put("invoiceNumber", sale.getInvoiceNumber());
        result.put("total", sale.getTotal());
        result.put("itemCount", saleItems.size());

        return result;
    }

    /**
     * Void a sale — restore stock and mark as void.
     */
    @Transactional
    @SuppressWarnings("null")
    public Sale voidSale(Long saleId, String reason, Long userId) {
        Sale sale = getById(saleId);
        if (sale.getIsVoid()) {
            throw new BadRequestException("Sale is already voided");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        sale.setIsVoid(true);
        sale.setVoidReason(reason);
        sale.setVoidedBy(user);
        sale.setVoidedAt(LocalDateTime.now());

        // Restore stock
        List<SaleItem> items = saleItemRepository.findBySaleId(saleId);
        for (SaleItem item : items) {
            Stock stock = stockRepository.findByProductId(item.getProduct().getId()).orElseThrow();
            stock.setQuantity(stock.getQuantity().add(item.getQuantity()));
            stockRepository.save(stock);

            stockMovementRepository.save(StockMovement.builder()
                    .product(item.getProduct())
                    .movementType(StockMovement.MovementType.VOID_RETURN)
                    .quantity(item.getQuantity())
                    .referenceType("SALE")
                    .referenceId(saleId)
                    .reason("Void sale " + sale.getInvoiceNumber() + ": " + reason)
                    .performedBy(user)
                    .movementDate(LocalDateTime.now())
                    .build());
        }

        return saleRepository.save(sale);
    }

    private String generateInvoiceNumber() {
        String datePart = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        int count = saleRepository.countByDate(LocalDateTime.now()) + 1;
        return String.format("INV-%s-%03d", datePart, count);
    }
}
