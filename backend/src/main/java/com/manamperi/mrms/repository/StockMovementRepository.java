package com.manamperi.mrms.repository;

import com.manamperi.mrms.entity.StockMovement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface StockMovementRepository extends JpaRepository<StockMovement, Long> {
    List<StockMovement> findByProductIdOrderByMovementDateDesc(Long productId);

    List<StockMovement> findAllByOrderByMovementDateDesc();
}
