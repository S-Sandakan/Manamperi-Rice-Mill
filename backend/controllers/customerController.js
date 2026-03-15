const pool = require('../config/db');

const getAll = async (req, res) => {
    try {
        const [customers] = await pool.query('SELECT * FROM customers ORDER BY name');
        res.json(customers);
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
};

const getById = async (req, res) => {
    try {
        const [customers] = await pool.query('SELECT * FROM customers WHERE id = ?', [req.params.id]);
        if (customers.length === 0) return res.status(404).json({ message: 'Customer not found.' });
        // Also get purchase history
        const [sales] = await pool.query(
            `SELECT s.*, GROUP_CONCAT(CONCAT(p.name, ' (', si.quantity_kg, 'kg)') SEPARATOR ', ') as items
       FROM sales s
       JOIN sale_items si ON s.id = si.sale_id
       JOIN products p ON si.product_id = p.id
       WHERE s.customer_id = ?
       GROUP BY s.id
       ORDER BY s.sale_date DESC`,
            [req.params.id]
        );
        res.json({ ...customers[0], sales });
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
};

const create = async (req, res) => {
    try {
        const { name, phone, address } = req.body;
        if (!name) return res.status(400).json({ message: 'Customer name is required.' });
        const [result] = await pool.query(
            'INSERT INTO customers (name, phone, address) VALUES (?, ?, ?)',
            [name, phone || '', address || '']
        );
        const [newCustomer] = await pool.query('SELECT * FROM customers WHERE id = ?', [result.insertId]);
        res.status(201).json(newCustomer[0]);
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
};

const update = async (req, res) => {
    try {
        const { name, phone, address } = req.body;
        await pool.query('UPDATE customers SET name = ?, phone = ?, address = ? WHERE id = ?',
            [name, phone, address, req.params.id]
        );
        const [updated] = await pool.query('SELECT * FROM customers WHERE id = ?', [req.params.id]);
        res.json(updated[0]);
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
};

const remove = async (req, res) => {
    try {
        await pool.query('DELETE FROM customers WHERE id = ?', [req.params.id]);
        res.json({ message: 'Customer deleted.' });
    } catch (err) {
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ message: 'Cannot delete customer with sale records.' });
        }
        res.status(500).json({ message: 'Server error.' });
    }
};

module.exports = { getAll, getById, create, update, remove };
