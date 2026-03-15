-- Manamperi Rice Mill - Database Schema
-- MySQL

CREATE DATABASE IF NOT EXISTS manamperi_rice_mill;
USE manamperi_rice_mill;

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'staff') DEFAULT 'staff',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Seed default admin
INSERT INTO users (username, password, full_name, role)
VALUES ('admin', '$2b$10$XQEq1ZxF5g5Y5Z5Z5Z5Z5eKJ8qJ8qJ8qJ8qJ8qJ8qJ8qJ8qJ8q', 'Administrator', 'admin');
-- Password will be re-hashed at app startup via seeder

-- ============================================
-- PRODUCTS TABLE (Rice Products)
-- ============================================
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    rice_type VARCHAR(50) NOT NULL,
    price_per_kg DECIMAL(10, 2) NOT NULL,
    stock_kg DECIMAL(10, 2) DEFAULT 0.00,
    low_stock_threshold DECIMAL(10, 2) DEFAULT 50.00,
    description TEXT,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Seed example products
INSERT INTO products (name, rice_type, price_per_kg, stock_kg) VALUES
('Nadu Rice', 'Nadu', 220.00, 500.00),
('Samba Rice', 'Samba', 250.00, 400.00),
('Keeri Samba', 'Keeri Samba', 320.00, 300.00),
('Raw Rice', 'Raw', 180.00, 600.00);

-- ============================================
-- FARMERS TABLE
-- ============================================
CREATE TABLE farmers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    total_paddy_supplied DECIMAL(12, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- CUSTOMERS TABLE
-- ============================================
CREATE TABLE customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- PADDY PURCHASES TABLE
-- ============================================
CREATE TABLE paddy_purchases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    farmer_id INT NOT NULL,
    weight_kg DECIMAL(10, 2) NOT NULL,
    price_per_kg DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(12, 2) NOT NULL,
    purchase_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE RESTRICT
);

-- ============================================
-- SALES TABLE
-- ============================================
CREATE TABLE sales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_number VARCHAR(20) NOT NULL UNIQUE,
    customer_id INT,
    total_amount DECIMAL(12, 2) NOT NULL,
    cash_received DECIMAL(12, 2) NOT NULL,
    balance DECIMAL(12, 2) NOT NULL,
    sold_by INT NOT NULL,
    sale_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    FOREIGN KEY (sold_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- ============================================
-- SALE ITEMS TABLE
-- ============================================
CREATE TABLE sale_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sale_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity_kg DECIMAL(10, 2) NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(12, 2) NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);

-- ============================================
-- RICE BRAN INVENTORY
-- ============================================
CREATE TABLE rice_bran_inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    stock_kg DECIMAL(10, 2) DEFAULT 0.00,
    price_per_kg DECIMAL(10, 2) DEFAULT 0.00,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO rice_bran_inventory (stock_kg, price_per_kg) VALUES (0.00, 45.00);

-- ============================================
-- RICE BRAN SALES TABLE
-- ============================================
CREATE TABLE rice_bran_sales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    buyer_name VARCHAR(100) NOT NULL,
    weight_kg DECIMAL(10, 2) NOT NULL,
    price_per_kg DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(12, 2) NOT NULL,
    sale_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INVENTORY TABLE (Summary View)
-- ============================================
CREATE TABLE inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_type ENUM('paddy', 'rice', 'bran') NOT NULL,
    item_name VARCHAR(100) NOT NULL,
    reference_id INT,
    stock_kg DECIMAL(10, 2) DEFAULT 0.00,
    low_stock_threshold DECIMAL(10, 2) DEFAULT 100.00,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- STOCK MOVEMENTS TABLE
-- ============================================
CREATE TABLE stock_movements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_type ENUM('paddy', 'rice', 'bran') NOT NULL,
    item_name VARCHAR(100) NOT NULL,
    movement_type ENUM('in', 'out') NOT NULL,
    quantity_kg DECIMAL(10, 2) NOT NULL,
    reference_type VARCHAR(50),
    reference_id INT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_sales_date ON sales(sale_date);
CREATE INDEX idx_paddy_date ON paddy_purchases(purchase_date);
CREATE INDEX idx_bran_date ON rice_bran_sales(sale_date);
CREATE INDEX idx_stock_movements_type ON stock_movements(item_type, created_at);
CREATE INDEX idx_sales_invoice ON sales(invoice_number);
