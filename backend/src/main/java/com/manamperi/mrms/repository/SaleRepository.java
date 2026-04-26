package com.manamperi.mrms.repository;

import com.manamperi.mrms.entity.Sale;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SaleRepository extends JpaRepository<Sale, Long> {
    Optional<Sale> findByInvoiceNumber(String invoiceNumber);

    List<Sale> findByIsVoidFalseAndIsActiveTrueOrderBySaleDateDesc();

    @Query("SELECT s FROM Sale s WHERE s.isVoid = false AND s.isActive = true " +
            "AND s.saleDate BETWEEN :start AND :end ORDER BY s.saleDate DESC")
    List<Sale> findByDateRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(s) FROM Sale s WHERE s.isVoid = false AND s.isActive = true " +
            "AND FUNCTION('DATE', s.saleDate) = FUNCTION('DATE', :date)")
    int countByDate(@Param("date") LocalDateTime date);

    @Query("SELECT COALESCE(SUM(s.total), 0) FROM Sale s WHERE s.isVoid = false AND s.isActive = true " +
            "AND s.saleDate BETWEEN :start AND :end")
    BigDecimal getTotalSales(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COALESCE(SUM(s.discountAmount), 0) FROM Sale s WHERE s.isVoid = false AND s.isActive = true " +
            "AND s.saleDate BETWEEN :start AND :end")
    BigDecimal getTotalDiscounts(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
