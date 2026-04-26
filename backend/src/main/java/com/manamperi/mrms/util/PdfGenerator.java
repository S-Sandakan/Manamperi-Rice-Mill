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
import java.util.Map;

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

    /**
     * Generate generic PDF report from Map data.
     */
    public byte[] generateReportPdf(String title, Map<String, Object> data) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdfDoc = new PdfDocument(writer);
            Document doc = new Document(pdfDoc, PageSize.A4);
            doc.setMargins(40, 40, 40, 40);

            // Header
            doc.add(new Paragraph("MANAMPERI RICE MILL")
                    .setFontSize(20).setBold().setFontColor(PRIMARY_COLOR).setTextAlignment(TextAlignment.CENTER));
            doc.add(new Paragraph(title)
                    .setFontSize(14).setTextAlignment(TextAlignment.CENTER).setFontColor(ColorConstants.GRAY));
            doc.add(new Paragraph("\n"));

            // Summary Info
            Table infoTable = new Table(UnitValue.createPercentArray(new float[]{1, 1})).useAllAvailableWidth();
            
            for (Map.Entry<String, Object> entry : data.entrySet()) {
                if (!(entry.getValue() instanceof List) && !(entry.getValue() instanceof Map)) {
                    infoTable.addCell(createInfoCell(formatLabel(entry.getKey()) + ":", String.valueOf(entry.getValue())));
                }
            }
            doc.add(infoTable);
            doc.add(new Paragraph("\n"));

            // Tables for List data
            for (Map.Entry<String, Object> entry : data.entrySet()) {
                if (entry.getValue() instanceof List) {
                    List<?> list = (List<?>) entry.getValue();
                    if (!list.isEmpty() && list.get(0) instanceof Map) {
                        doc.add(new Paragraph(formatLabel(entry.getKey())).setBold().setFontSize(12).setFontColor(PRIMARY_COLOR));
                        doc.add(createDataTable((List<Map<String, Object>>) list));
                        doc.add(new Paragraph("\n"));
                    }
                }
            }

            doc.close();
            return baos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate PDF report", e);
        }
    }

    /**
     * Generate generic PDF report from List data.
     */
    public byte[] generateListReportPdf(String title, List<Map<String, Object>> data) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdfDoc = new PdfDocument(writer);
            Document doc = new Document(pdfDoc, PageSize.A4);
            doc.setMargins(40, 40, 40, 40);

            doc.add(new Paragraph("MANAMPERI RICE MILL")
                    .setFontSize(20).setBold().setFontColor(PRIMARY_COLOR).setTextAlignment(TextAlignment.CENTER));
            doc.add(new Paragraph(title)
                    .setFontSize(14).setTextAlignment(TextAlignment.CENTER).setFontColor(ColorConstants.GRAY));
            doc.add(new Paragraph("\n"));

            if (!data.isEmpty()) {
                doc.add(createDataTable(data));
            } else {
                doc.add(new Paragraph("No data available for this report.").setTextAlignment(TextAlignment.CENTER));
            }

            doc.close();
            return baos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate PDF list report", e);
        }
    }

    private Table createDataTable(List<Map<String, Object>> list) {
        if (list.isEmpty()) return new Table(1);
        
        Map<String, Object> firstRow = list.get(0);
        int cols = firstRow.size();
        Table table = new Table(cols).useAllAvailableWidth();

        // Headers
        for (String key : firstRow.keySet()) {
            table.addHeaderCell(new Cell()
                    .add(new Paragraph(formatLabel(key)).setBold().setFontColor(ColorConstants.WHITE).setFontSize(9))
                    .setBackgroundColor(HEADER_BG)
                    .setPadding(6)
                    .setTextAlignment(TextAlignment.CENTER));
        }

        // Rows
        for (Map<String, Object> row : list) {
            for (Object value : row.values()) {
                table.addCell(new Cell()
                        .add(new Paragraph(String.valueOf(value)).setFontSize(9))
                        .setPadding(4)
                        .setTextAlignment(TextAlignment.CENTER));
            }
        }
        return table;
    }

    private String formatLabel(String key) {
        String[] words = key.split("(?=\\p{Upper})");
        StringBuilder label = new StringBuilder();
        for (String word : words) {
            label.append(word.substring(0, 1).toUpperCase()).append(word.substring(1)).append(" ");
        }
        return label.toString().trim();
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
