const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function applyOverhaul() {
    console.log('--- Database Overhaul Process Started ---');
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'smart_food_supply',
        multipleStatements: true // Crucial for multi-query files
    });

    try {
        const sqlPath = path.join(__dirname, '../database/schema_updates.sql');
        console.log(`Reading SQL from: ${sqlPath}`);
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Executing SQL batch...');
        await connection.query(sql);

        console.log('✅ SUCCESS: Database overhaul applied successfully!');
    } catch (err) {
        console.error('❌ ERROR applying overhaul:');
        console.error(err.message);
        if (err.sql) {
            console.error('Offending SQL around: ', err.sql.substring(0, 100) + '...');
        }
    } finally {
        await connection.end();
        console.log('--- Database Process Finished ---');
    }
}

applyOverhaul();
