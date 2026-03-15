const pool = require('../config/db');

const getAll = async (req, res) => {
    try {
        const [purchases] = await pool.query(
            `SELECT pp.*, f.name as farmer_name, f.phone as farmer_phone
       FROM paddy_purchases pp
       JOIN farmers f ON pp.farmer_id = f.id
       ORDER BY pp.purchase_date DESC`
        );
        res.json(purchases);
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
};

const create = async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const { farmer_id, weight_kg, price_per_kg, purchase_date, notes } = req.body;
        if (!farmer_id || !weight_kg || !price_per_kg || !purchase_date) {
            return res.status(400).json({ message: 'Farmer, weight, price and date are required.' });
        }
        const total_amount = parseFloat(weight_kg) * parseFloat(price_per_kg);

        // Insert purchase
        const [result] = await conn.query(
            'INSERT INTO paddy_purchases (farmer_id, weight_kg, price_per_kg, total_amount, purchase_date, notes) VALUES (?, ?, ?, ?, ?, ?)',
            [farmer_id, weight_kg, price_per_kg, total_amount, purchase_date, notes || '']
        );

        // Update farmer total
        await conn.query(
            'UPDATE farmers SET total_paddy_supplied = total_paddy_supplied + ? WHERE id = ?',
            [weight_kg, farmer_id]
        );

        // Record stock movement
        await conn.query(
            'INSERT INTO stock_movements (item_type, item_name, movement_type, quantity_kg, reference_type, reference_id, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
            ['paddy', 'Paddy Stock', 'in', weight_kg, 'paddy_purchase', result.insertId, `Purchase from farmer #${farmer_id}`]
        );

        await conn.commit();
        const [newPurchase] = await pool.query(
            `SELECT pp.*, f.name as farmer_name FROM paddy_purchases pp
       JOIN farmers f ON pp.farmer_id = f.id WHERE pp.id = ?`,
            [result.insertId]
        );
        res.status(201).json(newPurchase[0]);
    } catch (err) {
        await conn.rollback();
        console.error('Paddy purchase error:', err);
        res.status(500).json({ message: 'Server error.' });
    } finally {
        conn.release();
    }
};

const getStats = async (req, res) => {
    try {
        const [totalPaddy] = await pool.query('SELECT COALESCE(SUM(weight_kg), 0) as total FROM paddy_purchases');
        const [todayPaddy] = await pool.query(
            'SELECT COALESCE(SUM(weight_kg), 0) as total FROM paddy_purchases WHERE purchase_date = CURDATE()'
        );
        res.json({
            total_purchased: totalPaddy[0].total,
            today_purchased: todayPaddy[0].total
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
};

module.exports = { getAll, create, getStats };
