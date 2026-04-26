package com.manamperi.mrms.repository;

import com.manamperi.mrms.entity.ProductionBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductionBatchRepository extends JpaRepository<ProductionBatch, Long> {
    Optional<ProductionBatch> findByBatchId(String batchId);

    List<ProductionBatch> findByIsActiveTrueOrderByBatchDateDesc();

    List<ProductionBatch> findByStatusAndIsActiveTrue(ProductionBatch.BatchStatus status);

    @Query("SELECT COUNT(pb) FROM ProductionBatch pb WHERE pb.batchDate = :date")
    int countByBatchDate(@Param("date") LocalDate date);

    @Query("SELECT pb FROM ProductionBatch pb WHERE pb.isActive = true " +
            "AND pb.batchDate BETWEEN :startDate AND :endDate " +
            "ORDER BY pb.batchDate DESC")
    List<ProductionBatch> findByDateRange(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT AVG(pb.yieldPercentage) FROM ProductionBatch pb " +
            "WHERE pb.status = 'COMPLETED' AND pb.isActive = true " +
            "AND pb.batchDate BETWEEN :startDate AND :endDate")
    Double getAverageYield(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}
