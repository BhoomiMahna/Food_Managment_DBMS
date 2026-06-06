const db = require('./config/db');

async function test() {
    try {
        const [users] = await db.query('SELECT * FROM USER_AUTH WHERE role="RETAILER" LIMIT 1');
        console.log('Retailer:', users[0].email);

        const rId = users[0].id;
        
        const [rRows] = await db.query('SELECT id FROM RETAILER WHERE user_id = ?', [rId]);
        const retailId = rRows[0].id;

        // Find a wholesaler stock to buy
        const [wsRows] = await db.query('SELECT * FROM WHOLESALER_STOCK WHERE quantity_kg > 0 LIMIT 1');
        const wsId = wsRows[0].id;
        
        // Buy
        console.log('Buying stock from wholesaler_stock_id:', wsId);
        await db.query('CALL sell_stock(?, ?, ?, ?)', [wsId, retailId, 5, 40]);
        console.log('Retail Buy success!');
    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}
test();
