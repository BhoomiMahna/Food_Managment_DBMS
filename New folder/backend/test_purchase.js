const db = require('./config/db');

async function test() {
    try {
        const [users] = await db.query('SELECT * FROM USER_AUTH WHERE role="WHOLESALER" LIMIT 1');
        const [farmer] = await db.query('SELECT * FROM USER_AUTH WHERE role="FARMER" LIMIT 1');
        console.log('Wholesaler:', users[0].email);
        console.log('Farmer:', farmer[0].email);

        const wholesalerId = users[0].id; // Wait, WHOLESALER table uses user_id
        
        const [wRows] = await db.query('SELECT id FROM WHOLESALER WHERE user_id = ?', [wholesalerId]);
        const wId = wRows[0].id;
        
        // Buy crop_id 101, qty 10, selling_price 35
        console.log('Buying crop...');
        await db.query('CALL buy_crop(?, ?, ?, ?)', [wId, 101, 10, 35]);
        console.log('Buy success!');
    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}
test();
