const mysql = require('mysql2/promise');
require('dotenv').config();

async function testConnection() {
    console.log('Testing connection...');
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'smart_food_supply'
        });
        console.log('Connected!');
        const [rows] = await connection.execute('SELECT 1 as val');
        console.log('Result:', rows);
        
        // Let's check for locks
        const [locks] = await connection.execute('SHOW OPEN TABLES WHERE In_use > 0');
        console.log('Active locks:', locks);

        await connection.end();
    } catch (err) {
        console.error('Error:', err);
    }
}
testConnection();
