-- ============================================================
-- Manamperi Rice Mill Management System (MRMS) - ERP v1.0
-- Complete MySQL 8.0 Database Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS ricemill_db;
USE ricemill_db;

-- ============================================================
-- 1. USERS TABLE
-- ============================================================
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    role ENUM('ADMIN', 'CASHIER', 'PRODUCTION_MANAGER') NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login DATETIME,
    login_attempts INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_username (username),
    INDEX idx_users_role (role),
    INDEX idx_users_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 2. SUPPLIERS TABLE
-- ============================================================
CREATE TABLE suppliers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    contact_number VARCHAR(20),
    address TEXT,
    nic VARCHAR(20),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_suppliers_name (name),
    INDEX idx_suppliers_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 3. PURCHASES TABLE
-- ============================================================
CREATE TABLE purchases (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    supplier_id BIGINT NOT NULL,
    vee_quantity_kg DECIMAL(12,2) NOT NULL,
    price_per_kg DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(14,2) NOT NULL,
    purchase_date DATE NOT NULL,
    notes TEXT,
    created_by BIGINT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_purchases_supplier (supplier_id),
    INDEX idx_purchases_date (purchase_date),
    INDEX idx_purchases_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. PRICE HISTORY TABLE (IMMUTABLE - append only)
-- ============================================================
CREATE TABLE price_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    supplier_id BIGINT NOT NULL,
    price_per_kg DECIMAL(10,2) NOT NULL,
    effective_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    recorded_by BIGINT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (recorded_by) REFERENCES users(id),
    INDEX idx_price_history_supplier (supplier_id),
    INDEX idx_price_history_date (effective_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Trigger to prevent updates on price_history (immutability)
DELIMITER //
CREATE TRIGGER prevent_price_history_update
BEFORE UPDATE ON price_history
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Price history records are immutable and cannot be updated.';
END//

CREATE TRIGGER prevent_price_history_delete
BEFORE DELETE ON price_history
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Price history records are immutable and cannot be deleted.';
END//
DELIMITER ;

-- ============================================================
-- 5. PRODUCTION BATCHES TABLE
-- ============================================================
CREATE TABLE production_batches (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    batch_id VARCHAR(20) NOT NULL UNIQUE,
    vee_input_kg DECIMAL(12,2) NOT NULL,
    sahal_output_kg DECIMAL(12,2),
    kudu_output_kg DECIMAL(12,2),
    yield_percentage DECIMAL(5,2),
    efficiency ENUM('EFFICIENT', 'INEFFICIENT') DEFAULT NULL,
    status ENUM('IN_PROGRESS', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'IN_PROGRESS',
    batch_date DATE NOT NULL,
    notes TEXT,
    created_by BIGINT NOT NULL,
    completed_at DATETIME,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_batches_batch_id (batch_id),
    INDEX idx_batches_date (batch_date),
    INDEX idx_batches_status (status),
    INDEX idx_batches_efficiency (efficiency)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 6. BATCH COSTS TABLE
-- ============================================================
CREATE TABLE batch_costs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    batch_id BIGINT NOT NULL,
    vee_cost DECIMAL(14,2) NOT NULL DEFAULT 0,
    operational_cost DECIMAL(14,2) NOT NULL DEFAULT 0,
    total_cost DECIMAL(14,2) NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (batch_id) REFERENCES production_batches(id),
    UNIQUE INDEX idx_batch_costs_batch (batch_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 7. PRODUCTS TABLE
-- ============================================================
CREATE TABLE products (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    product_type ENUM('SAHAL', 'KUDU') NOT NULL,
    packet_size_kg DECIMAL(6,2),
    unit VARCHAR(10) NOT NULL DEFAULT 'kg',
    selling_price DECIMAL(10,2) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_products_type (product_type),
    INDEX idx_products_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 8. STOCK TABLE
-- ============================================================
CREATE TABLE stock (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT NOT NULL,
    quantity DECIMAL(12,2) NOT NULL DEFAULT 0,
    min_quantity DECIMAL(12,2) NOT NULL DEFAULT 10,
    last_updated DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id),
    UNIQUE INDEX idx_stock_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 9. SALES TABLE
-- ============================================================
CREATE TABLE sales (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    invoice_number VARCHAR(20) NOT NULL UNIQUE,
    cashier_id BIGINT NOT NULL,
    subtotal DECIMAL(14,2) NOT NULL,
    discount_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
    discount_type ENUM('PERCENTAGE', 'FIXED') DEFAULT NULL,
    discount_value DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(14,2) NOT NULL,
    payment_type ENUM('CASH', 'CREDIT') NOT NULL DEFAULT 'CASH',
    sale_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_void BOOLEAN NOT NULL DEFAULT FALSE,
    void_reason TEXT,
    voided_by BIGINT,
    voided_at DATETIME,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cashier_id) REFERENCES users(id),
    FOREIGN KEY (voided_by) REFERENCES users(id),
    INDEX idx_sales_invoice (invoice_number),
    INDEX idx_sales_date (sale_date),
    INDEX idx_sales_cashier (cashier_id),
    INDEX idx_sales_void (is_void)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 10. SALE ITEMS TABLE
-- ============================================================
CREATE TABLE sale_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    sale_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    line_total DECIMAL(14,2) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sale_id) REFERENCES sales(id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    INDEX idx_sale_items_sale (sale_id),
    INDEX idx_sale_items_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 11. STOCK MOVEMENTS TABLE
-- ============================================================
CREATE TABLE stock_movements (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT NOT NULL,
    movement_type ENUM('PURCHASE_IN', 'PRODUCTION_IN', 'PRODUCTION_OUT', 'SALE_OUT', 'VOID_RETURN', 'MANUAL_ADJUST') NOT NULL,
    quantity DECIMAL(12,2) NOT NULL,
    reference_type VARCHAR(50),
    reference_id BIGINT,
    reason TEXT,
    performed_by BIGINT NOT NULL,
    movement_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (performed_by) REFERENCES users(id),
    INDEX idx_movements_product (product_id),
    INDEX idx_movements_type (movement_type),
    INDEX idx_movements_date (movement_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 12. AUDIT LOGS TABLE
-- ============================================================
CREATE TABLE audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT,
    action VARCHAR(50) NOT NULL,
    entity VARCHAR(50) NOT NULL,
    entity_id BIGINT,
    details TEXT,
    ip_address VARCHAR(45),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_audit_user (user_id),
    INDEX idx_audit_action (action),
    INDEX idx_audit_entity (entity, entity_id),
    INDEX idx_audit_date (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================

-- Current stock levels with product info
CREATE OR REPLACE VIEW v_stock_levels AS
SELECT 
    p.id AS product_id,
    p.name AS product_name,
    p.product_type,
    p.packet_size_kg,
    p.unit,
    p.selling_price,
    COALESCE(s.quantity, 0) AS current_stock,
    COALESCE(s.min_quantity, 10) AS min_quantity,
    CASE WHEN COALESCE(s.quantity, 0) <= COALESCE(s.min_quantity, 10) THEN TRUE ELSE FALSE END AS is_low_stock
FROM products p
LEFT JOIN stock s ON p.id = s.product_id
WHERE p.is_active = TRUE;

-- Daily sales summary
CREATE OR REPLACE VIEW v_daily_sales AS
SELECT 
    DATE(sale_date) AS sale_day,
    COUNT(*) AS total_transactions,
    SUM(subtotal) AS gross_sales,
    SUM(discount_amount) AS total_discounts,
    SUM(total) AS net_sales
FROM sales
WHERE is_void = FALSE AND is_active = TRUE
GROUP BY DATE(sale_date);

-- Latest price per supplier
CREATE OR REPLACE VIEW v_latest_prices AS
SELECT ph1.*
FROM price_history ph1
INNER JOIN (
    SELECT supplier_id, MAX(effective_date) AS max_date
    FROM price_history
    GROUP BY supplier_id
) ph2 ON ph1.supplier_id = ph2.supplier_id AND ph1.effective_date = ph2.max_date;

-- ============================================================
-- RAW MATERIAL (VEE) STOCK TRACKING
-- We use a special product entry for raw Vee
-- ============================================================
