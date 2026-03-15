const pool = require('../config/db');

const getDashboard = async (req, res) => {
    try {
        // Rice stock
        const [riceStock] = await pool.query(
            'SELECT COALESCE(SUM(stock_kg), 0) as total FROM products WHERE is_active = 1'
        );
        // Paddy stock (total purchased minus total milled — simplified as total purchased)
        const [paddyStock] = await pool.query(
            `SELECT COALESCE(SUM(CASE WHEN movement_type = 'in' THEN quantity_kg ELSE -quantity_kg END), 0) as total
       FROM stock_movements WHERE item_type = 'paddy'`
        );
        // Bran stock
        const [branStock] = await pool.query('SELECT stock_kg FROM rice_bran_inventory WHERE id = 1');
        // Low stock products
        const [lowStock] = await pool.query(
            'SELECT id, name, stock_kg, low_stock_threshold FROM products WHERE is_active = 1 AND stock_kg <= low_stock_threshold'
        );
        // Recent movements
        const [movements] = await pool.query(
            'SELECT * FROM stock_movements ORDER BY created_at DESC LIMIT 20'
        );

        res.json({
            rice_stock: riceStock[0].total,
            paddy_stock: paddyStock[0].total,
            bran_stock: branStock[0]?.stock_kg || 0,
            low_stock_alerts: lowStock,
            recent_movements: movements
        });
    } catch (err) {
        console.error('Inventory error:', err);
        res.status(500).json({ message: 'Server error.' });
    }
};

const getMovements = async (req, res) => {
    try {
        const { type, from, to } = req.query;
        let query = 'SELECT * FROM stock_movements';
        const params = [];
        const conditions = [];

        if (type) { conditions.push('item_type = ?'); params.push(type); }
        if (from && to) { conditions.push('DATE(created_at) BETWEEN ? AND ?'); params.push(from, to); }

        if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
        query += ' ORDER BY created_at DESC LIMIT 100';

        const [movements] = await pool.query(query, params);
        res.json(movements);
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
};

module.exports = { getDashboard, getMovements };
