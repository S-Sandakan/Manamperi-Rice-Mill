const pool = require('../config/db');

const createSale = async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const { customer_id, items, cash_received } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'At least one item is required.' });
        }

        // Generate invoice number
        const [lastSale] = await conn.query('SELECT id FROM sales ORDER BY id DESC LIMIT 1');
        const nextId = lastSale.length > 0 ? lastSale[0].id + 1 : 1;
        const invoice_number = `INV-${String(nextId).padStart(6, '0')}`;

        // Calculate total
        let total_amount = 0;
        for (const item of items) {
            total_amount += parseFloat(item.quantity_kg) * parseFloat(item.unit_price);
        }
        const balance = parseFloat(cash_received) - total_amount;

        // Insert sale
        const [saleResult] = await conn.query(
            'INSERT INTO sales (invoice_number, customer_id, total_amount, cash_received, balance, sold_by) VALUES (?, ?, ?, ?, ?, ?)',
            [invoice_number, customer_id || null, total_amount, cash_received, balance, req.user.id]
        );

        // Insert sale items and update stock
        for (const item of items) {
            const subtotal = parseFloat(item.quantity_kg) * parseFloat(item.unit_price);
            await conn.query(
                'INSERT INTO sale_items (sale_id, product_id, quantity_kg, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)',
                [saleResult.insertId, item.product_id, item.quantity_kg, item.unit_price, subtotal]
            );

            // Deduct stock
            await conn.query(
                'UPDATE products SET stock_kg = stock_kg - ? WHERE id = ?',
                [item.quantity_kg, item.product_id]
            );

            // Record stock movement
            const [prod] = await conn.query('SELECT name FROM products WHERE id = ?', [item.product_id]);
            await conn.query(
                'INSERT INTO stock_movements (item_type, item_name, movement_type, quantity_kg, reference_type, reference_id, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
                ['rice', prod[0].name, 'out', item.quantity_kg, 'sale', saleResult.insertId, `Sale ${invoice_number}`]
            );
        }

        await conn.commit();

        // Return full sale with items
        const [sale] = await pool.query('SELECT * FROM sales WHERE id = ?', [saleResult.insertId]);
        const [saleItems] = await pool.query(
            `SELECT si.*, p.name as product_name FROM sale_items si
       JOIN products p ON si.product_id = p.id WHERE si.sale_id = ?`,
            [saleResult.insertId]
        );

        res.status(201).json({ ...sale[0], items: saleItems });
    } catch (err) {
        await conn.rollback();
        console.error('Sale error:', err);
        res.status(500).json({ message: 'Server error.' });
    } finally {
        conn.release();
    }
};

const getAll = async (req, res) => {
    try {
        const { date, from, to } = req.query;
        let query = `SELECT s.*, u.full_name as cashier_name, c.name as customer_name
                 FROM sales s
                 LEFT JOIN users u ON s.sold_by = u.id
                 LEFT JOIN customers c ON s.customer_id = c.id`;
        const params = [];

        if (date) {
            query += ' WHERE DATE(s.sale_date) = ?';
            params.push(date);
        } else if (from && to) {
            query += ' WHERE DATE(s.sale_date) BETWEEN ? AND ?';
            params.push(from, to);
        }

        query += ' ORDER BY s.sale_date DESC';
        const [sales] = await pool.query(query, params);
        res.json(sales);
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
};

const getById = async (req, res) => {
    try {
        const [sale] = await pool.query(
            `SELECT s.*, u.full_name as cashier_name, c.name as customer_name
       FROM sales s
       LEFT JOIN users u ON s.sold_by = u.id
       LEFT JOIN customers c ON s.customer_id = c.id
       WHERE s.id = ?`,
            [req.params.id]
        );
        if (sale.length === 0) return res.status(404).json({ message: 'Sale not found.' });

        const [items] = await pool.query(
            `SELECT si.*, p.name as product_name FROM sale_items si
       JOIN products p ON si.product_id = p.id WHERE si.sale_id = ?`,
            [req.params.id]
        );

        res.json({ ...sale[0], items });
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
};

const getTodayStats = async (req, res) => {
    try {
        const [todaySales] = await pool.query(
            'SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total FROM sales WHERE DATE(sale_date) = CURDATE()'
        );
        res.json(todaySales[0]);
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
};

module.exports = { createSale, getAll, getById, getTodayStats };
