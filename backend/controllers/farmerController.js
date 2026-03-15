const pool = require('../config/db');

const getAll = async (req, res) => {
    try {
        const [farmers] = await pool.query('SELECT * FROM farmers ORDER BY name');
        res.json(farmers);
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
};

const getById = async (req, res) => {
    try {
        const [farmers] = await pool.query('SELECT * FROM farmers WHERE id = ?', [req.params.id]);
        if (farmers.length === 0) return res.status(404).json({ message: 'Farmer not found.' });
        // Also get purchase history
        const [purchases] = await pool.query(
            'SELECT * FROM paddy_purchases WHERE farmer_id = ? ORDER BY purchase_date DESC',
            [req.params.id]
        );
        res.json({ ...farmers[0], purchases });
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
};

const create = async (req, res) => {
    try {
        const { name, phone, address } = req.body;
        if (!name) return res.status(400).json({ message: 'Farmer name is required.' });
        const [result] = await pool.query(
            'INSERT INTO farmers (name, phone, address) VALUES (?, ?, ?)',
            [name, phone || '', address || '']
        );
        const [newFarmer] = await pool.query('SELECT * FROM farmers WHERE id = ?', [result.insertId]);
        res.status(201).json(newFarmer[0]);
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
};

const update = async (req, res) => {
    try {
        const { name, phone, address } = req.body;
        await pool.query('UPDATE farmers SET name = ?, phone = ?, address = ? WHERE id = ?',
            [name, phone, address, req.params.id]
        );
        const [updated] = await pool.query('SELECT * FROM farmers WHERE id = ?', [req.params.id]);
        res.json(updated[0]);
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
};

const remove = async (req, res) => {
    try {
        await pool.query('DELETE FROM farmers WHERE id = ?', [req.params.id]);
        res.json({ message: 'Farmer deleted.' });
    } catch (err) {
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ message: 'Cannot delete farmer with purchase records.' });
        }
        res.status(500).json({ message: 'Server error.' });
    }
};

module.exports = { getAll, getById, create, update, remove };
