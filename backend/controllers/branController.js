const pool = require('../config/db');

const getStock = async (req, res) => {
    try {
        const [stock] = await pool.query('SELECT * FROM rice_bran_inventory WHERE id = 1');
        res.json(stock[0] || { stock_kg: 0, price_per_kg: 0 });
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
};

const updateStock = async (req, res) => {
    try {
        const { stock_kg, price_per_kg } = req.body;
        await pool.query('UPDATE rice_bran_inventory SET stock_kg = ?, price_per_kg = ? WHERE id = 1',
            [stock_kg, price_per_kg]
        );
        // Record stock movement
        await pool.query(
            'INSERT INTO stock_movements (item_type, item_name, movement_type, quantity_kg, reference_type, notes) VALUES (?, ?, ?, ?, ?, ?)',
            ['bran', 'Rice Bran', 'in', stock_kg, 'manual_update', 'Stock update']
        );
        res.json({ message: 'Stock updated.', stock_kg, price_per_kg });
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
};

const addStock = async (req, res) => {
    try {
        const { quantity_kg } = req.body;
        await pool.query('UPDATE rice_bran_inventory SET stock_kg = stock_kg + ? WHERE id = 1', [quantity_kg]);
        await pool.query(
            'INSERT INTO stock_movements (item_type, item_name, movement_type, quantity_kg, reference_type, notes) VALUES (?, ?, ?, ?, ?, ?)',
            ['bran', 'Rice Bran', 'in', quantity_kg, 'production', 'Bran from milling']
        );
        const [stock] = await pool.query('SELECT * FROM rice_bran_inventory WHERE id = 1');
        res.json(stock[0]);
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
};

const createSale = async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const { buyer_name, weight_kg, price_per_kg, sale_date, notes } = req.body;
        if (!buyer_name || !weight_kg || !price_per_kg || !sale_date) {
            return res.status(400).json({ message: 'Buyer name, weight, price and date are required.' });
        }
        const total_amount = parseFloat(weight_kg) * parseFloat(price_per_kg);

        // Check stock
        const [stock] = await conn.query('SELECT stock_kg FROM rice_bran_inventory WHERE id = 1');
        if (stock[0].stock_kg < weight_kg) {
            return res.status(400).json({ message: 'Insufficient bran stock.' });
        }

        // Insert sale
        const [result] = await conn.query(
            'INSERT INTO rice_bran_sales (buyer_name, weight_kg, price_per_kg, total_amount, sale_date, notes) VALUES (?, ?, ?, ?, ?, ?)',
            [buyer_name, weight_kg, price_per_kg, total_amount, sale_date, notes || '']
        );

        // Deduct stock
        await conn.query('UPDATE rice_bran_inventory SET stock_kg = stock_kg - ? WHERE id = 1', [weight_kg]);

        // Record stock movement
        await conn.query(
            'INSERT INTO stock_movements (item_type, item_name, movement_type, quantity_kg, reference_type, reference_id, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
            ['bran', 'Rice Bran', 'out', weight_kg, 'bran_sale', result.insertId, `Sold to ${buyer_name}`]
        );

        await conn.commit();
        const [newSale] = await pool.query('SELECT * FROM rice_bran_sales WHERE id = ?', [result.insertId]);
        res.status(201).json(newSale[0]);
    } catch (err) {
        await conn.rollback();
        res.status(500).json({ message: 'Server error.' });
    } finally {
        conn.release();
    }
};

const getSales = async (req, res) => {
    try {
        const [sales] = await pool.query('SELECT * FROM rice_bran_sales ORDER BY sale_date DESC');
        res.json(sales);
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
};

module.exports = { getStock, updateStock, addStock, createSale, getSales };
