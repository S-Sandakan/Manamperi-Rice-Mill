const pool = require('../config/db');

const salesReport = async (req, res) => {
    try {
        const { from, to, period } = req.query;
        let dateFormat, groupBy;
        switch (period) {
            case 'daily': dateFormat = '%Y-%m-%d'; groupBy = 'DATE(s.sale_date)'; break;
            case 'monthly': dateFormat = '%Y-%m'; groupBy = "DATE_FORMAT(s.sale_date, '%Y-%m')"; break;
            default: dateFormat = '%Y-%m-%d'; groupBy = 'DATE(s.sale_date)';
        }

        let query = `SELECT DATE_FORMAT(s.sale_date, '${dateFormat}') as period,
                 COUNT(*) as total_sales, COALESCE(SUM(s.total_amount), 0) as revenue
                 FROM sales s`;
        const params = [];
        if (from && to) {
            query += ' WHERE DATE(s.sale_date) BETWEEN ? AND ?';
            params.push(from, to);
        }
        query += ` GROUP BY ${groupBy} ORDER BY period DESC`;

        const [report] = await pool.query(query, params);
        res.json(report);
    } catch (err) {
        console.error('Sales report error:', err);
        res.status(500).json({ message: 'Server error.' });
    }
};

const purchaseReport = async (req, res) => {
    try {
        const { from, to } = req.query;
        let query = `SELECT DATE_FORMAT(purchase_date, '%Y-%m-%d') as date,
                 COUNT(*) as purchases, COALESCE(SUM(weight_kg), 0) as total_weight,
                 COALESCE(SUM(total_amount), 0) as total_cost
                 FROM paddy_purchases`;
        const params = [];
        if (from && to) {
            query += ' WHERE purchase_date BETWEEN ? AND ?';
            params.push(from, to);
        }
        query += ' GROUP BY purchase_date ORDER BY purchase_date DESC';

        const [report] = await pool.query(query, params);
        res.json(report);
    } catch (err) {
        res.status(500).json({ message: 'Server error.' });
    }
};

const profitReport = async (req, res) => {
    try {
        const { from, to } = req.query;
        const params = [];
        let whereClause = '';
        if (from && to) {
            whereClause = ' WHERE DATE(sale_date) BETWEEN ? AND ?';
            params.push(from, to);
        }

        // Sales revenue
        const [salesRev] = await pool.query(
            `SELECT COALESCE(SUM(total_amount), 0) as total FROM sales${whereClause}`, params
        );
        // Bran revenue
        const branParams = from && to ? [from, to] : [];
        const branWhere = from && to ? ' WHERE sale_date BETWEEN ? AND ?' : '';
        const [branRev] = await pool.query(
            `SELECT COALESCE(SUM(total_amount), 0) as total FROM rice_bran_sales${branWhere}`, branParams
        );
        // Paddy cost
        const paddyWhere = from && to ? ' WHERE purchase_date BETWEEN ? AND ?' : '';
        const [paddyCost] = await pool.query(
            `SELECT COALESCE(SUM(total_amount), 0) as total FROM paddy_purchases${paddyWhere}`, branParams
        );

        const totalRevenue = parseFloat(salesRev[0].total) + parseFloat(branRev[0].total);
        const totalCost = parseFloat(paddyCost[0].total);

        res.json({
            rice_sales_revenue: parseFloat(salesRev[0].total),
            bran_sales_revenue: parseFloat(branRev[0].total),
            total_revenue: totalRevenue,
            paddy_purchase_cost: totalCost,
            gross_profit: totalRevenue - totalCost
        });
    } catch (err) {
        console.error('Profit report error:', err);
        res.status(500).json({ message: 'Server error.' });
    }
};

const dashboard = async (req, res) => {
    try {
        // Today's sales
        const [todaySales] = await pool.query(
            'SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total FROM sales WHERE DATE(sale_date) = CURDATE()'
        );
        // Total paddy
        const [totalPaddy] = await pool.query(
            'SELECT COALESCE(SUM(weight_kg), 0) as total FROM paddy_purchases'
        );
        // Rice stock
        const [riceStock] = await pool.query(
            'SELECT COALESCE(SUM(stock_kg), 0) as total FROM products WHERE is_active = 1'
        );
        // Bran stock
        const [branStock] = await pool.query('SELECT stock_kg FROM rice_bran_inventory WHERE id = 1');
        // Last 7 days sales chart
        const [chartData] = await pool.query(
            `SELECT DATE_FORMAT(sale_date, '%Y-%m-%d') as date, COALESCE(SUM(total_amount), 0) as total
       FROM sales WHERE sale_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
       GROUP BY DATE(sale_date) ORDER BY date`
        );
        // Low stock alerts
        const [lowStock] = await pool.query(
            'SELECT name, stock_kg, low_stock_threshold FROM products WHERE is_active = 1 AND stock_kg <= low_stock_threshold'
        );

        res.json({
            today_sales_count: todaySales[0].count,
            today_sales_total: todaySales[0].total,
            total_paddy_purchased: totalPaddy[0].total,
            rice_stock: riceStock[0].total,
            bran_stock: branStock[0]?.stock_kg || 0,
            sales_chart: chartData,
            low_stock_alerts: lowStock
        });
    } catch (err) {
        console.error('Dashboard error:', err);
        res.status(500).json({ message: 'Server error.' });
    }
};

module.exports = { salesReport, purchaseReport, profitReport, dashboard };
