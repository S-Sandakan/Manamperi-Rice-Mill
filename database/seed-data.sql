-- ============================================================
-- MRMS ERP v1.0 - Seed Data
-- ============================================================

USE ricemill_db;

-- ============================================================
-- USERS (passwords are BCrypt hashed - all passwords are: "password123")
-- ============================================================
INSERT INTO users (username, password, full_name, email, role) VALUES
('admin', '$2a$10$WVkwqAuZ3exyIG73G9wVAO/C7DGbSm/TzXyzee/Pra2wxMSYeq17W', 'System Administrator', 'admin@manamperi.lk', 'ADMIN'),
('cashier1', '$2a$10$WVkwqAuZ3exyIG73G9wVAO/C7DGbSm/TzXyzee/Pra2wxMSYeq17W', 'Nimal Perera', 'nimal@manamperi.lk', 'CASHIER'),
('prodmgr1', '$2a$10$WVkwqAuZ3exyIG73G9wVAO/C7DGbSm/TzXyzee/Pra2wxMSYeq17W', 'Kamal Silva', 'kamal@manamperi.lk', 'PRODUCTION_MANAGER');

-- ============================================================
-- SUPPLIERS
-- ============================================================
INSERT INTO suppliers (name, contact_number, address, nic) VALUES
('Sunil Fernando', '0771234567', 'No. 45, Paddy Lane, Kurunegala', '881234567V'),
('Mahinda Rajapaksa', '0712345678', 'No. 23, Rice Road, Polonnaruwa', '761234568V'),
('Anura Bandara', '0761234569', 'No. 78, Mill Street, Anuradhapura', '901234569V'),
('Chaminda Jayawardena', '0751234570', 'No. 12, Farmer Ave, Matale', '851234570V'),
('Priyantha Kumara', '0781234571', 'No. 56, Harvest Road, Dambulla', '921234571V');

-- ============================================================
-- PRODUCTS
-- ============================================================
-- Raw Material (Vee/Paddy)
INSERT INTO products (name, product_type, packet_size_kg, unit, selling_price, description) VALUES
('Raw Paddy (Vee)', 'SAHAL', NULL, 'kg', 0, 'Raw paddy - not for sale, inventory tracking only');

-- Sahal (Rice) Products - Various packet sizes
INSERT INTO products (name, product_type, packet_size_kg, unit, selling_price, description) VALUES
('Sahal 1kg Packet', 'SAHAL', 1.00, 'packet', 230.00, 'Premium rice - 1kg packet'),
('Sahal 2kg Packet', 'SAHAL', 2.00, 'packet', 450.00, 'Premium rice - 2kg packet'),
('Sahal 5kg Packet', 'SAHAL', 5.00, 'packet', 1100.00, 'Premium rice - 5kg packet'),
('Sahal 10kg Packet', 'SAHAL', 10.00, 'packet', 2150.00, 'Premium rice - 10kg packet'),
('Sahal 25kg Sack', 'SAHAL', 25.00, 'sack', 5250.00, 'Premium rice - 25kg bulk sack'),
('Sahal 50kg Sack', 'SAHAL', 50.00, 'sack', 10300.00, 'Premium rice - 50kg bulk sack');

-- Kudu (By-product)
INSERT INTO products (name, product_type, packet_size_kg, unit, selling_price, description) VALUES
('Kudu (Rice Bran)', 'KUDU', NULL, 'kg', 55.00, 'Rice bran by-product - sold per kg');

-- ============================================================
-- INITIAL STOCK
-- ============================================================
INSERT INTO stock (product_id, quantity, min_quantity) VALUES
(1, 5000.00, 500.00),   -- Raw Paddy (Vee) - 5000 kg
(2, 200.00, 50.00),     -- Sahal 1kg
(3, 150.00, 40.00),     -- Sahal 2kg
(4, 100.00, 30.00),     -- Sahal 5kg
(5, 80.00, 20.00),      -- Sahal 10kg
(6, 50.00, 15.00),      -- Sahal 25kg
(7, 30.00, 10.00),      -- Sahal 50kg
(8, 1500.00, 200.00);   -- Kudu

-- ============================================================
-- SAMPLE PURCHASES
-- ============================================================
INSERT INTO purchases (supplier_id, vee_quantity_kg, price_per_kg, total_amount, purchase_date, created_by) VALUES
(1, 2000.00, 85.00, 170000.00, '2026-04-20', 1),
(2, 3000.00, 82.00, 246000.00, '2026-04-19', 1),
(3, 1500.00, 88.00, 132000.00, '2026-04-18', 1);

-- ============================================================
-- PRICE HISTORY
-- ============================================================
INSERT INTO price_history (supplier_id, price_per_kg, effective_date, recorded_by) VALUES
(1, 85.00, '2026-04-20 08:00:00', 1),
(2, 82.00, '2026-04-19 09:00:00', 1),
(3, 88.00, '2026-04-18 10:00:00', 1),
(1, 80.00, '2026-04-01 08:00:00', 1),
(2, 78.00, '2026-04-01 09:00:00', 1);

-- ============================================================
-- SAMPLE PRODUCTION BATCH
-- ============================================================
INSERT INTO production_batches (batch_id, vee_input_kg, sahal_output_kg, kudu_output_kg, yield_percentage, efficiency, status, batch_date, created_by, completed_at) VALUES
('BATCH-20260420-001', 2000.00, 1320.00, 380.00, 66.00, 'EFFICIENT', 'COMPLETED', '2026-04-20', 3, '2026-04-20 16:00:00'),
('BATCH-20260419-001', 1500.00, 930.00, 290.00, 62.00, 'INEFFICIENT', 'COMPLETED', '2026-04-19', 3, '2026-04-19 15:30:00');

INSERT INTO batch_costs (batch_id, vee_cost, operational_cost, total_cost) VALUES
(1, 170000.00, 15000.00, 185000.00),
(2, 123000.00, 12000.00, 135000.00);

-- ============================================================
-- STOCK MOVEMENTS FOR SAMPLE DATA
-- ============================================================
INSERT INTO stock_movements (product_id, movement_type, quantity, reference_type, reference_id, reason, performed_by) VALUES
(1, 'PURCHASE_IN', 2000.00, 'PURCHASE', 1, 'Purchase from Sunil Fernando', 1),
(1, 'PURCHASE_IN', 3000.00, 'PURCHASE', 2, 'Purchase from Mahinda Rajapaksa', 1),
(1, 'PURCHASE_IN', 1500.00, 'PURCHASE', 3, 'Purchase from Anura Bandara', 1),
(1, 'PRODUCTION_OUT', 2000.00, 'BATCH', 1, 'Batch BATCH-20260420-001', 3),
(1, 'PRODUCTION_OUT', 1500.00, 'BATCH', 2, 'Batch BATCH-20260419-001', 3);

-- ============================================================
-- SAMPLE SALES
-- ============================================================
INSERT INTO sales (invoice_number, cashier_id, subtotal, discount_amount, discount_type, discount_value, total, payment_type, sale_date) VALUES
('INV-20260421-001', 2, 2750.00, 0.00, NULL, 0, 2750.00, 'CASH', '2026-04-21 10:30:00'),
('INV-20260421-002', 2, 5400.00, 270.00, 'PERCENTAGE', 5.00, 5130.00, 'CASH', '2026-04-21 14:15:00'),
('INV-20260422-001', 2, 10300.00, 300.00, 'FIXED', 300.00, 10000.00, 'CREDIT', '2026-04-22 09:45:00');

INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, line_total) VALUES
(1, 2, 5, 230.00, 1150.00),
(1, 4, 2, 1100.00, 2200.00),
(1, 8, 10, 55.00, 550.00),
(2, 5, 2, 2150.00, 4300.00),
(2, 4, 2, 1100.00, 2200.00),
(3, 7, 1, 10300.00, 10300.00);

-- Sale stock movements
INSERT INTO stock_movements (product_id, movement_type, quantity, reference_type, reference_id, reason, performed_by) VALUES
(2, 'SALE_OUT', 5, 'SALE', 1, 'Sale INV-20260421-001', 2),
(4, 'SALE_OUT', 2, 'SALE', 1, 'Sale INV-20260421-001', 2),
(8, 'SALE_OUT', 10, 'SALE', 1, 'Sale INV-20260421-001', 2),
(5, 'SALE_OUT', 2, 'SALE', 2, 'Sale INV-20260421-002', 2),
(4, 'SALE_OUT', 2, 'SALE', 2, 'Sale INV-20260421-002', 2),
(7, 'SALE_OUT', 1, 'SALE', 3, 'Sale INV-20260422-001', 2);
