package com.manamperi.mrms.repository;

import com.manamperi.mrms.entity.Purchase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface PurchaseRepository extends JpaRepository<Purchase, Long> {
    List<Purchase> findByIsActiveTrueOrderByPurchaseDateDesc();

    @Query("SELECT p FROM Purchase p WHERE p.isActive = true " +
            "AND (:supplierId IS NULL OR p.supplier.id = :supplierId) " +
            "AND (:startDate IS NULL OR p.purchaseDate >= :startDate) " +
            "AND (:endDate IS NULL OR p.purchaseDate <= :endDate) " +
            "AND (:minPrice IS NULL OR p.pricePerKg >= :minPrice) " +
            "AND (:maxPrice IS NULL OR p.pricePerKg <= :maxPrice) " +
            "ORDER BY p.purchaseDate DESC")
    List<Purchase> findWithFilters(
            @Param("supplierId") Long supplierId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice);

    @Query("SELECT SUM(p.totalAmount) FROM Purchase p WHERE p.isActive = true " +
            "AND p.purchaseDate BETWEEN :startDate AND :endDate")
    BigDecimal getTotalPurchaseAmount(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}
