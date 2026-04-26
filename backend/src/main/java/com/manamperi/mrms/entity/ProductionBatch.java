package com.manamperi.mrms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "production_batches")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductionBatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "batch_id", nullable = false, unique = true, length = 20)
    private String batchId;

    @Column(name = "vee_input_kg", nullable = false, precision = 12, scale = 2)
    private BigDecimal veeInputKg;

    @Column(name = "sahal_output_kg", precision = 12, scale = 2)
    private BigDecimal sahalOutputKg;

    @Column(name = "kudu_output_kg", precision = 12, scale = 2)
    private BigDecimal kuduOutputKg;

    @Column(name = "yield_percentage", precision = 5, scale = 2)
    private BigDecimal yieldPercentage;

    @Enumerated(EnumType.STRING)
    private Efficiency efficiency;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default private BatchStatus status = BatchStatus.IN_PROGRESS;

    @Column(name = "batch_date", nullable = false)
    private LocalDate batchDate;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private User createdBy;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "is_active", nullable = false)
    @Builder.Default private Boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToOne(mappedBy = "batch", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private BatchCost batchCost;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum BatchStatus {
        IN_PROGRESS, COMPLETED, CANCELLED
    }

    public enum Efficiency {
        EFFICIENT, INEFFICIENT
    }
}
