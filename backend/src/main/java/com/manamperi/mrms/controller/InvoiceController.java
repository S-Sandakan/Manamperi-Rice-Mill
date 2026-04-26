package com.manamperi.mrms.controller;

import com.manamperi.mrms.entity.Sale;
import com.manamperi.mrms.entity.SaleItem;
import com.manamperi.mrms.repository.SaleItemRepository;
import com.manamperi.mrms.repository.SaleRepository;
import com.manamperi.mrms.exception.ResourceNotFoundException;
import com.manamperi.mrms.util.PdfGenerator;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/invoices")
@RequiredArgsConstructor
@Tag(name = "Invoices", description = "Invoice PDF generation")
public class InvoiceController {

    private final SaleRepository saleRepository;
    private final SaleItemRepository saleItemRepository;
    private final PdfGenerator pdfGenerator;

    @GetMapping("/{id}/pdf")
    @Operation(summary = "Generate PDF invoice for a sale")
    @SuppressWarnings("null")
    public ResponseEntity<byte[]> getInvoicePdf(@PathVariable Long id) {
        Sale sale = saleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sale", "id", id));
        List<SaleItem> items = saleItemRepository.findBySaleId(id);

        byte[] pdf = pdfGenerator.generateInvoice(sale, items);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + sale.getInvoiceNumber() + ".pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }
}
