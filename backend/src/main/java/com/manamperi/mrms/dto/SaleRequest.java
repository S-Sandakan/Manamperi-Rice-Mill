package com.manamperi.mrms.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class SaleRequest {
    @NotEmpty(message = "Sale must have at least one item")
    @Valid
    private List<SaleItemRequest> items;

    private String discountType; // PERCENTAGE or FIXED
    private BigDecimal discountValue;

    @NotBlank(message = "Payment type is required")
    private String paymentType; // CASH or CREDIT

    @Data
    public static class SaleItemRequest {
        @NotNull(message = "Product ID is required")
        private Long productId;

        @NotNull(message = "Quantity is required")
        @DecimalMin(value = "0.01", message = "Quantity must be greater than 0")
        private BigDecimal quantity;

        @DecimalMin(value = "0.00", message = "Custom unit price cannot be negative")
        private BigDecimal customUnitPrice;
    }
}
