const mysql = require('mysql2/promise');
require('dotenv').config();

async function killSleeps() {
    console.log('Fetching processlist...');
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'smart_food_supply'
        });
        
        const [processes] = await connection.execute('SHOW PROCESSLIST');
        console.log('Processes:', processes);
        
        for (const p of processes) {
            if (p.Id !== connection.threadId && p.User !== 'event_scheduler' && p.db === 'smart_food_supply') {
                console.log(`Killing process ${p.Id} - State: ${p.State}, Command: ${p.Command}`);
                try {
                    await connection.execute(`KILL ${p.Id}`);
                    console.log(`Killed ${p.Id}`);
                } catch (e) {
                    console.error(`Could not kill ${p.Id}`, e);
                }
            }
        }

        await connection.end();
    } catch (err) {
        console.error('Error:', err);
    }
}
killSleeps();
