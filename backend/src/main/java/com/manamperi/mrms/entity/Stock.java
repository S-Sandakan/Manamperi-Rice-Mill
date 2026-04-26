package com.manamperi.mrms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "stock")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Stock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", nullable = false, unique = true)
    private Product product;

    @Column(nullable = false, precision = 12, scale = 2)
    @Builder.Default private BigDecimal quantity = BigDecimal.ZERO;

    @Column(name = "min_quantity", nullable = false, precision = 12, scale = 2)
    @Builder.Default private BigDecimal minQuantity = BigDecimal.TEN;

    @Column(name = "last_updated")
    private LocalDateTime lastUpdated;

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        lastUpdated = LocalDateTime.now();
    }

    public boolean isLowStock() {
        return quantity.compareTo(minQuantity) <= 0;
    }
}
