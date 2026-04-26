package com.manamperi.mrms.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class ProductionBatchRequest {
    @NotNull(message = "Vee input quantity is required")
    @DecimalMin(value = "0.01", message = "Input quantity must be greater than 0")
    private BigDecimal veeInputKg;

    private BigDecimal sahalOutputKg;
    private BigDecimal kuduOutputKg;

    @DecimalMin(value = "0", message = "Operational cost must be non-negative")
    private BigDecimal operationalCost;

    private LocalDate batchDate;
    private String notes;
}
