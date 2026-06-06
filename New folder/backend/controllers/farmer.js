const db = require('../config/db');

exports.getProduction = async (req, res) => {
    try {
        const farmerId = req.user.entityId;
        const [rows] = await db.query(`
            SELECT p.crop_id, p.crop_name, 
                   MIN(p.harvest_date) as harvest_date, 
                   MIN(p.expiry_date) as expiry_date, 
                   MAX(p.price_per_kg) as original_price, 
                   MIN(p.discounted_price) as discounted_price, 
                   SUM(p.quantity_kg) AS quantity_kg,
                   MIN(p.status) as status
            FROM v_production_pricing p
            WHERE p.farmer_id = ? AND p.quantity_kg > 0
            GROUP BY p.crop_id, p.crop_name
        `, [farmerId]);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.addProduction = async (req, res) => {
    try {
        const farmerId = req.user.entityId;
        const { crop_id, quantity_kg, harvest_date, expiry_date, price_per_kg } = req.body;

        const [farmerRows] = await db.query('SELECT city FROM FARMER WHERE id = ?', [farmerId]);
        const region = farmerRows.length > 0 ? farmerRows[0].city : 'Unknown';

        await db.query(
            'CALL add_production(?, ?, ?, ?, ?, ?, ?)',
            [farmerId, crop_id, quantity_kg, harvest_date, expiry_date, price_per_kg, region]
        );

        res.status(201).json({ message: 'Production added successfully' });
    } catch (err) {
        console.error(err);
        if (err.sqlState === '45000' || err.sqlState === '23000') {
            return res.status(400).json({ message: err.sqlMessage || err.message });
        }
        res.status(500).json({ message: 'Server error' });
    }
};

exports.syncCsv = async (req, res) => {
    try {
        const farmerId = req.user.entityId;
        const { data } = req.body; 

        if (!data || !Array.isArray(data)) {
            return res.status(400).json({ message: 'Invalid CSV data format' });
        }

        const [farmerRows] = await db.query('SELECT city FROM FARMER WHERE id = ?', [farmerId]);
        const region = farmerRows.length > 0 ? farmerRows[0].city : 'Unknown';

        const connection = await db.getConnection();
        let successCount = 0;
        let errors = [];

        try {
            for (let i = 0; i < data.length; i++) {
                const row = data[i];
                try {
                    await connection.query(
                        'CALL add_production(?, ?, ?, ?, ?, ?, ?)',
                        [farmerId, row.crop_id, row.quantity_kg, row.harvest_date, row.expiry_date, row.price_per_kg, region]
                    );
                    successCount++;
                } catch (rowErr) {
                    errors.push({ row: i+1, message: rowErr.sqlMessage || rowErr.message });
                }
            }
        } finally {
            connection.release();
        }

        if (errors.length > 0) {
            return res.status(207).json({ message: `Synced ${successCount} rows. ${errors.length} failed.`, errors });
        }

        res.status(201).json({ message: `Successfully synced ${successCount} rows from CSV.` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error during sync' });
    }
};

exports.getAlerts = async (req, res) => {
    try {
        const farmerId = req.user.entityId;
        const [rows] = await db.query(
            'SELECT p.*, c.name as crop_name FROM PRODUCTION p JOIN CROP c ON p.crop_id = c.id WHERE p.farmer_id = ? AND p.expiry_date <= CURRENT_DATE() + INTERVAL 3 DAY AND p.remaining_quantity > 0', 
            [farmerId]
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
