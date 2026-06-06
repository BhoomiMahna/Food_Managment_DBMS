const db = require('../config/db');

exports.getWholesalers = async (req, res) => {
    try {
        const { city } = req.query;
        let query = 'SELECT * FROM v_wholesaler_stock_pricing WHERE quantity_kg > 0';
        const params = [];
        if (city) {
            query += ' AND city = ?';
            params.push(city);
        }
        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.buyStock = async (req, res) => {
    try {
        const retailerId = req.user.entityId;
        const { wholesaler_stock_id, quantity, selling_price } = req.body;

        await db.query('CALL sell_stock(?, ?, ?, ?)', [wholesaler_stock_id, retailerId, quantity, selling_price]);
        res.json({ message: 'Stock purchased successfully' });
    } catch (err) {
        console.error(err);
        res.status(400).json({ message: err.message || 'Error buying stock' });
    }
};

exports.getStock = async (req, res) => {
    try {
        const retailerId = req.user.entityId;
        const [rows] = await db.query('SELECT * FROM v_retail_stock_status WHERE retailer_id = ? AND quantity_kg > 0', [retailerId]);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
