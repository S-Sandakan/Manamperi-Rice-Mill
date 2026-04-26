package com.manamperi.mrms.util;

import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.manamperi.mrms.entity.Sale;
import com.manamperi.mrms.entity.SaleItem;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Component
public class PdfGenerator {

    private static final DeviceRgb PRIMARY_COLOR = new DeviceRgb(27, 94, 32);
    private static final DeviceRgb HEADER_BG = new DeviceRgb(46, 125, 50);

    /**
     * Generate PDF invoice for a sale.
     */
    public byte[] generateInvoice(Sale sale, List<SaleItem> items) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdfDoc = new PdfDocument(writer);
            Document doc = new Document(pdfDoc, PageSize.A4);
            doc.setMargins(40, 40, 40, 40);

            // Header
            Paragraph header = new Paragraph("MANAMPERI RICE MILL")
                    .setFontSize(22)
                    .setBold()
                    .setFontColor(PRIMARY_COLOR)
                    .setTextAlignment(TextAlignment.CENTER);
            doc.add(header);

            Paragraph subHeader = new Paragraph("Tax Invoice")
                    .setFontSize(14)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setFontColor(ColorConstants.GRAY);
            doc.add(subHeader);

            doc.add(new Paragraph("\n"));

            // Invoice Info
            Table infoTable = new Table(UnitValue.createPercentArray(new float[] { 1, 1 }))
                    .useAllAvailableWidth();

            infoTable.addCell(createInfoCell("Invoice Number:", sale.getInvoiceNumber()));
            infoTable.addCell(createInfoCell("Date/Time:",
                    sale.getSaleDate().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))));
            infoTable.addCell(createInfoCell("Cashier:", sale.getCashier().getFullName()));
            infoTable.addCell(createInfoCell("Payment:", sale.getPaymentType().name()));
            doc.add(infoTable);

            doc.add(new Paragraph("\n"));

            // Items Table
            Table itemsTable = new Table(UnitValue.createPercentArray(new float[] { 4, 1, 2, 2 }))
                    .useAllAvailableWidth();

            // Table header
            String[] headers = { "Product", "Qty", "Unit Price", "Total" };
            for (String h : headers) {
                Cell cell = new Cell()
                        .add(new Paragraph(h).setBold().setFontColor(ColorConstants.WHITE).setFontSize(10))
                        .setBackgroundColor(HEADER_BG)
                        .setPadding(8)
                        .setTextAlignment(TextAlignment.CENTER);
                itemsTable.addHeaderCell(cell);
            }

            // Items
            for (SaleItem item : items) {
                itemsTable.addCell(createItemCell(item.getProduct().getName(), TextAlignment.LEFT));
                itemsTable.addCell(createItemCell(item.getQuantity().toString(), TextAlignment.CENTER));
                itemsTable.addCell(createItemCell(formatCurrency(item.getUnitPrice()), TextAlignment.RIGHT));
                itemsTable.addCell(createItemCell(formatCurrency(item.getLineTotal()), TextAlignment.RIGHT));
            }
            doc.add(itemsTable);

            doc.add(new Paragraph("\n"));

            // Summary
            Table summaryTable = new Table(UnitValue.createPercentArray(new float[] { 3, 1 }))
                    .useAllAvailableWidth();

            addSummaryRow(summaryTable, "Subtotal", formatCurrency(sale.getSubtotal()));
            if (sale.getDiscountAmount().compareTo(BigDecimal.ZERO) > 0) {
                String discountLabel = "Discount";
                if (sale.getDiscountType() != null) {
                    discountLabel += " (" + sale.getDiscountType().name();
                    if (sale.getDiscountType() == Sale.DiscountType.PERCENTAGE) {
                        discountLabel += " " + sale.getDiscountValue() + "%";
                    }
                    discountLabel += ")";
                }
                addSummaryRow(summaryTable, discountLabel, "-" + formatCurrency(sale.getDiscountAmount()));
            }
            // Total row (bold, colored)
            summaryTable.addCell(new Cell()
                    .add(new Paragraph("TOTAL").setBold().setFontSize(14).setFontColor(PRIMARY_COLOR))
                    .setBorder(null).setTextAlignment(TextAlignment.RIGHT).setPadding(8));
            summaryTable.addCell(new Cell()
                    .add(new Paragraph(formatCurrency(sale.getTotal())).setBold().setFontSize(14)
                            .setFontColor(PRIMARY_COLOR))
                    .setBorder(null).setTextAlignment(TextAlignment.RIGHT).setPadding(8));
            doc.add(summaryTable);

            doc.add(new Paragraph("\n"));

            // Footer
            Paragraph footer = new Paragraph("Thank you for your business!")
                    .setFontSize(10)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setFontColor(ColorConstants.GRAY);
            doc.add(footer);

            Paragraph company = new Paragraph("Manamperi Rice Mill | ERP System v1.0")
                    .setFontSize(8)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setFontColor(ColorConstants.LIGHT_GRAY);
            doc.add(company);

            doc.close();
            return baos.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("Failed to generate PDF invoice", e);
        }
    }

    private Cell createInfoCell(String label, String value) {
        return new Cell()
                .add(new Paragraph(label).setBold().setFontSize(9).setFontColor(ColorConstants.GRAY))
                .add(new Paragraph(value).setFontSize(11))
                .setBorder(null)
                .setPadding(4);
    }

    private Cell createItemCell(String text, TextAlignment alignment) {
        return new Cell()
                .add(new Paragraph(text).setFontSize(10))
                .setTextAlignment(alignment)
                .setPadding(6);
    }

    private void addSummaryRow(Table table, String label, String value) {
        table.addCell(new Cell().add(new Paragraph(label).setFontSize(10))
                .setBorder(null).setTextAlignment(TextAlignment.RIGHT).setPadding(4));
        table.addCell(new Cell().add(new Paragraph(value).setFontSize(10))
                .setBorder(null).setTextAlignment(TextAlignment.RIGHT).setPadding(4));
    }

    private String formatCurrency(BigDecimal amount) {
        return String.format("Rs. %,.2f", amount);
    }
}
