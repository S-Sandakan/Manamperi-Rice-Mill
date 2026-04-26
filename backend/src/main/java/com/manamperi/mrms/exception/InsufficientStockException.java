package com.manamperi.mrms.exception;

public class InsufficientStockException extends RuntimeException {
    public InsufficientStockException(String message) {
        super(message);
    }

    public InsufficientStockException(String productName, java.math.BigDecimal requested,
            java.math.BigDecimal available) {
        super(String.format("Insufficient stock for %s. Requested: %s, Available: %s",
                productName, requested, available));
    }
}
