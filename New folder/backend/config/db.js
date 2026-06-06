const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'smart_food_supply',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// SQL Logging Proxy
const originalQuery = pool.query.bind(pool);
pool.query = (...args) => {
    const sql = typeof args[0] === 'string' ? args[0] : args[0].sql;
    console.log(`\x1b[36m[SQL]\x1b[0m ${sql.replace(/\s+/g, ' ').trim()}`);
    if (args[1] && Array.isArray(args[1])) {
        console.log(`\x1b[32m[PARAMS]\x1b[0m`, args[1]);
    }
    return originalQuery(...args);
};

module.exports = pool;
