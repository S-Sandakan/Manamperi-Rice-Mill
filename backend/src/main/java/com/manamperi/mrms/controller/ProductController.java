package com.manamperi.mrms.controller;

import com.manamperi.mrms.dto.ApiResponse;
import com.manamperi.mrms.entity.Product;
import com.manamperi.mrms.repository.ProductRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/products")
@RequiredArgsConstructor
@Tag(name = "Products", description = "Product management")
public class ProductController {

    private final ProductRepository productRepository;

    @GetMapping
    @Operation(summary = "Get all active products")
    public ResponseEntity<ApiResponse<List<Product>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(productRepository.findByIsActiveTrue()));
    }

    @GetMapping("/saleable")
    @Operation(summary = "Get all saleable products (excludes raw paddy)")
    public ResponseEntity<ApiResponse<List<Product>>> getSaleable() {
        List<Product> all = productRepository.findByIsActiveTrue();
        List<Product> saleable = all.stream()
                .filter(p -> p.getSellingPrice().doubleValue() > 0)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(saleable));
    }

    @PostMapping
    @Operation(summary = "Create a new product")
    public ResponseEntity<ApiResponse<Product>> create(@RequestBody Product product) {
        product.setIsActive(true);
        return ResponseEntity.ok(ApiResponse.success("Product created", productRepository.save(product)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a product")
    @SuppressWarnings("null")
    public ResponseEntity<ApiResponse<Product>> update(@PathVariable Long id, @RequestBody Product updated) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new com.manamperi.mrms.exception.ResourceNotFoundException("Product", "id", id));
        product.setName(updated.getName());
        product.setSellingPrice(updated.getSellingPrice());
        product.setPacketSizeKg(updated.getPacketSizeKg());
        product.setUnit(updated.getUnit());
        product.setDescription(updated.getDescription());
        return ResponseEntity.ok(ApiResponse.success("Product updated", productRepository.save(product)));
    }
}
