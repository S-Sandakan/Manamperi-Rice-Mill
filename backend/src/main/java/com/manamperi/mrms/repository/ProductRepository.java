package com.manamperi.mrms.repository;

import com.manamperi.mrms.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByIsActiveTrue();

    List<Product> findByProductTypeAndIsActiveTrue(Product.ProductType type);

    List<Product> findByProductTypeNotAndIsActiveTrue(Product.ProductType type);
}
