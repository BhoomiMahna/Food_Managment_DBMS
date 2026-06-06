const db = require('./config/db');

async function test() {
    try {
        const res = await db.query("INSERT INTO PRODUCTION (farmer_id, crop_id, quantity_kg, harvest_date, expiry_date, price_per_kg) VALUES (1660, 101, 400, '2026-04-15', '2026-06-15', 30)");
        console.log("Success:", res);
    } catch (e) {
        console.error("Error:", e);
    } finally {
        process.exit(0);
    }
}
test();
