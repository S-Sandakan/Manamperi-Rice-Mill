package com.manamperi.mrms.repository;

import com.manamperi.mrms.entity.Stock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface StockRepository extends JpaRepository<Stock, Long> {
    Optional<Stock> findByProductId(Long productId);

    @Query("SELECT s FROM Stock s JOIN FETCH s.product p WHERE p.isActive = true")
    List<Stock> findAllWithProduct();

    @Query("SELECT s FROM Stock s JOIN FETCH s.product p WHERE p.isActive = true AND s.quantity <= s.minQuantity")
    List<Stock> findLowStock();
}
