const db = require('../config/db');

exports.getFarmers = async (req, res) => {
    try {
        const { city } = req.query;
        // Use v_production_pricing for consistency
        let query = 'SELECT * FROM v_production_pricing WHERE quantity_kg > 0';
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
        console.log('Incoming buy request body:', req.body);
        const wholesalerId = req.user ? req.user.entityId : 1; // MOCK FOR TESTING
        const { crop_id, quantity, selling_price } = req.body;

        await db.query('CALL buy_crop(?, ?, ?, ?)', [wholesalerId, crop_id, quantity, selling_price]);
        res.json({ message: 'Stock purchased successfully' });
    } catch (err) {
        console.error(err);
        if (err.sqlState === '45000') {
            return res.status(400).json({ message: err.sqlMessage || 'Error buying stock' });
        }
        res.status(500).json({ message: 'Server error buying stock' });
    }
};

exports.getStock = async (req, res) => {
    try {
        const wholesalerId = req.user.entityId;
        const [rows] = await db.query('SELECT * FROM v_wholesaler_stock_pricing WHERE wholesaler_id = ? AND quantity_kg > 0', [wholesalerId]);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
