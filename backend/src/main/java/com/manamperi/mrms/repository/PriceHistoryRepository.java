package com.manamperi.mrms.repository;

import com.manamperi.mrms.entity.PriceHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PriceHistoryRepository extends JpaRepository<PriceHistory, Long> {
    List<PriceHistory> findBySupplierIdOrderByEffectiveDateDesc(Long supplierId);

    @Query("SELECT ph FROM PriceHistory ph WHERE ph.supplier.id = :supplierId " +
            "ORDER BY ph.effectiveDate DESC LIMIT 1")
    Optional<PriceHistory> findLatestBySupplier(@Param("supplierId") Long supplierId);

    List<PriceHistory> findAllByOrderByEffectiveDateDesc();
}
