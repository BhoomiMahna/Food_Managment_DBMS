const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkUsers() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'smart_food_supply'
        });
        
        const [users] = await connection.execute('SELECT id, email, role, password_hash FROM USER_AUTH WHERE role = "WHOLESALER" LIMIT 5');
        console.log('Wholesalers:', users);
        
        const [farmers] = await connection.execute('SELECT id, email, role FROM USER_AUTH WHERE role = "FARMER" LIMIT 5');
        console.log('Farmers:', farmers);
        
        await connection.end();
    } catch(e) { console.error(e); }
}
checkUsers();
