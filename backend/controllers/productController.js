const pool = require('../config/db');

const getAll = async (req, res) => {
    try {
        const [products] = await pool.query('SELECT * FROM products WHERE is_active = 1 ORDER BY name');
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
};

const getById = async (req, res) => {
    try {
        const [products] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
        if (products.length === 0) return res.status(404).json({ message: 'Product not found.' });
        res.json(products[0]);
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
};

const create = async (req, res) => {
    try {
        const { name, rice_type, price_per_kg, stock_kg, low_stock_threshold, description } = req.body;
        if (!name || !rice_type || !price_per_kg) {
            return res.status(400).json({ message: 'Name, rice type and price are required.' });
        }
        const [result] = await pool.query(
            'INSERT INTO products (name, rice_type, price_per_kg, stock_kg, low_stock_threshold, description) VALUES (?, ?, ?, ?, ?, ?)',
            [name, rice_type, price_per_kg, stock_kg || 0, low_stock_threshold || 50, description || '']
        );
        const [newProduct] = await pool.query('SELECT * FROM products WHERE id = ?', [result.insertId]);
        res.status(201).json(newProduct[0]);
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
};

const update = async (req, res) => {
    try {
        const { name, rice_type, price_per_kg, stock_kg, low_stock_threshold, description } = req.body;
        await pool.query(
            'UPDATE products SET name = ?, rice_type = ?, price_per_kg = ?, stock_kg = ?, low_stock_threshold = ?, description = ? WHERE id = ?',
            [name, rice_type, price_per_kg, stock_kg, low_stock_threshold, description, req.params.id]
        );
        const [updated] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
        res.json(updated[0]);
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
};

const remove = async (req, res) => {
    try {
        await pool.query('UPDATE products SET is_active = 0 WHERE id = ?', [req.params.id]);
        res.json({ message: 'Product deleted.' });
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
};

const getLowStock = async (req, res) => {
    try {
        const [products] = await pool.query('SELECT * FROM products WHERE is_active = 1 AND stock_kg <= low_stock_threshold ORDER BY stock_kg');
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
};

module.exports = { getAll, getById, create, update, remove, getLowStock };
