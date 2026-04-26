package com.manamperi.mrms.service;

import com.manamperi.mrms.entity.Supplier;
import com.manamperi.mrms.exception.ResourceNotFoundException;
import com.manamperi.mrms.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SupplierService {

    private final SupplierRepository supplierRepository;

    public List<Supplier> getAllActive() {
        return supplierRepository.findByIsActiveTrue();
    }

    @SuppressWarnings("null")
    public Supplier getById(Long id) {
        return supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier", "id", id));
    }

    @Transactional
    public Supplier create(Supplier supplier) {
        supplier.setIsActive(true);
        return supplierRepository.save(supplier);
    }

    @Transactional
    public Supplier update(Long id, Supplier updated) {
        Supplier supplier = getById(id);
        supplier.setName(updated.getName());
        supplier.setContactNumber(updated.getContactNumber());
        supplier.setAddress(updated.getAddress());
        supplier.setNic(updated.getNic());
        return supplierRepository.save(supplier);
    }

    @Transactional
    public void deactivate(Long id) {
        Supplier supplier = getById(id);
        supplier.setIsActive(false);
        supplierRepository.save(supplier);
    }
}
