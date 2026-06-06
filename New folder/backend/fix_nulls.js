const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixNulls() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'smart_food_supply'
        });
        
        console.log("Setting default discounted_price for all rows...");
        await connection.execute('UPDATE PRODUCTION SET discounted_price = price_per_kg WHERE discounted_price IS NULL');
        
        console.log("Applying discounts for near-expiry crops...");
        await connection.execute('CALL apply_discount()');
        
        console.log("Fix complete.");
        await connection.end();
    } catch(e) { console.error(e); }
}
fixNulls();
