const mysql = require('mysql2/promise');
require('dotenv').config();

async function check() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'smart_food_supply'
        });
        const [rows] = await connection.execute('SHOW CREATE TABLE WHOLESALER_STOCK');
        console.log(rows[0]['Create Table']);
        await connection.end();
    } catch(e) { console.error(e); }
}
check();
