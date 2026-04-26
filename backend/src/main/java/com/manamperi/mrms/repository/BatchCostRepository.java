package com.manamperi.mrms.repository;

import com.manamperi.mrms.entity.BatchCost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface BatchCostRepository extends JpaRepository<BatchCost, Long> {
    Optional<BatchCost> findByBatchId(Long batchId);
}
