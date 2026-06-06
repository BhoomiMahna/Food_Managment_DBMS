const db = require('../config/db');
const fs = require('fs');
const csv = require('csv-parser');

exports.getAllAlerts = async (req, res) => {
    try {
        const userId = req.user.entityId;
        const role = req.user.role;

        const [alerts] = await db.query(
            'SELECT * FROM SYSTEM_ALERTS WHERE user_id = ? AND role = ? ORDER BY created_at DESC LIMIT 20',
            [userId, role]
        );
        
        res.json(alerts);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getPriceComparison = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT c.name as crop_name, 
                   MIN(p.price_per_kg) as min_farmer_price, 
                   MIN(ws.selling_price_per_kg) as min_wholesaler_price,
                   MIN(rs.selling_price_per_kg) as min_retail_price
            FROM CROP c
            LEFT JOIN PRODUCTION p ON c.id = p.crop_id AND p.quantity_kg > 0
            LEFT JOIN WHOLESALER_STOCK ws ON c.id = ws.crop_id AND ws.quantity_kg > 0
            LEFT JOIN RETAIL_STOCK rs ON c.id = rs.crop_id AND rs.quantity_kg > 0
            GROUP BY c.id, c.name
        `);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getCrops = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, name, category FROM CROP ORDER BY name ASC');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getCities = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT city, source FROM v_available_cities ORDER BY city ASC');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
