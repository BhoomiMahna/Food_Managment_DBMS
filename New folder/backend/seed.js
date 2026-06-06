const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const db = require('./config/db');
require('dotenv').config();

const dataDir = path.join(__dirname, 'data');

// ================= USER HELPER =================
const getOrCreateUser = async (connection, email, role) => {
    const [existing] = await connection.query(
        `SELECT id FROM USER_AUTH WHERE email = ?`,
        [email]
    );

    if (existing.length > 0) return existing[0].id;

    const [auth] = await connection.query(
        `INSERT INTO USER_AUTH (email, password_hash, role)
         VALUES (?, ?, ?)`,
        [email, 'password_hash', role]
    );

    return auth.insertId;
};

// ================= MAIN CSV PROCESS =================
const processCSV = (fileName, type) => {
    return new Promise((resolve, reject) => {
        const filePath = path.join(dataDir, fileName);

        if (!fs.existsSync(filePath)) {
            console.log(`Skipping ${fileName}`);
            return resolve();
        }

        const results = [];

        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', async () => {

                const connection = await db.getConnection();
                await connection.beginTransaction();

                try {
                    console.log(`\n📥 Importing ${fileName} (${results.length} rows)`);

                    for (const row of results) {

                        // ================= CROP =================
                        if (type === 'CROP') {
                            if (!row.crop_name) continue;

                            await connection.query(
                                `INSERT INTO CROP (id, name, category, base_price_per_kg, shelf_life_days)
                                 VALUES (?, ?, ?, ?, ?)
                                 ON DUPLICATE KEY UPDATE name=VALUES(name)`,
                                [
                                    parseInt(row.crop_id),
                                    row.crop_name,
                                    row.harvest_month || 'General',
                                    parseFloat(row.min_price) || 0,
                                    30
                                ]
                            );
                        }

                        // ================= FARMER =================
                        else if (type === 'FARMER') {
                            if (!row.farmer_name) continue;

                            const email = `farmer_${row.farmer_id}@demo.com`;
                            const userId = await getOrCreateUser(connection, email, 'FARMER');

                            await connection.query(
                                `INSERT INTO FARMER (user_id, name, city, state, contact)
                                 VALUES (?, ?, ?, ?, ?)`,
                                [
                                    userId,
                                    row.farmer_name,
                                    row.location || 'Unknown',
                                    row.state_origin || 'Unknown',
                                    row.contact_no || null
                                ]
                            );
                        }

                        // ================= WHOLESALER =================
                        else if (type === 'WHOLESALER') {
                            if (!row.wholesaler_name) continue;

                            const email = `wholesaler_${row.wholesaler_id}@demo.com`;
                            const userId = await getOrCreateUser(connection, email, 'WHOLESALER');

                            await connection.query(
                                `INSERT INTO WHOLESALER (user_id, name, city, state, contact)
                                 VALUES (?, ?, ?, ?, ?)`,
                                [
                                    userId,
                                    row.wholesaler_name,
                                    row.location || 'Unknown',
                                    row.location || 'Unknown',
                                    row.contact_no || null
                                ]
                            );
                        }

                        // ================= RETAILER =================
                        else if (type === 'RETAILER') {
                            if (!row.name) continue;

                            const email = `retailer_${row.retailer_id}@demo.com`;
                            const userId = await getOrCreateUser(connection, email, 'RETAILER');

                            await connection.query(
                                `INSERT INTO RETAILER (user_id, name, city, state, contact)
                                 VALUES (?, ?, ?, ?, ?)`,
                                [
                                    userId,
                                    row.name,
                                    row.location || 'Unknown',
                                    row.location || 'Unknown',
                                    row.contact || null
                                ]
                            );
                        }

                        // ================= WHOLESALER STOCK =================
                        else if (type === 'WHOLESALER_STOCK') {

                            // 🔥 CRITICAL FIX: map invalid crop IDs (5001+) → valid (101–115)
                            const cropId = (parseInt(row.farmer_crop_id) % 15) + 101;

                            await connection.query(
                                `INSERT INTO WHOLESALER_STOCK 
                                (wholesaler_id, crop_id, quantity_kg, harvest_date, expiry_date, purchase_price_per_kg, selling_price_per_kg)
                                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                                [
                                    parseInt(row.wholesaler_id),
                                    cropId,
                                    parseFloat(row.quantity_kg),
                                    row.purchase_date,
                                    row.expiry_date,
                                    parseFloat(row.purchase_price),
                                    parseFloat(row.purchase_price) * 1.2
                                ]
                            );
                        }

                        // ================= RETAIL STOCK =================
                        else if (type === 'RETAIL_STOCK') {

                            await connection.query(
                                `INSERT INTO RETAIL_STOCK
                                (retailer_id, crop_id, quantity_kg, harvest_date, expiry_date, purchase_price_per_kg, selling_price_per_kg)
                                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                                [
                                    parseInt(row.retailer_id),
                                    parseInt(row.crop_id),
                                    parseFloat(row.quantity_kg),
                                    new Date(), // fallback harvest
                                    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                                    parseFloat(row.cost_price),
                                    parseFloat(row.selling_price)
                                ]
                            );
                        }
                    }

                    await connection.commit();
                    console.log(`✅ Done: ${fileName}`);
                    resolve();

                } catch (err) {
                    await connection.rollback();
                    console.error(`❌ Error in ${fileName}:`, err);
                    reject(err);
                } finally {
                    connection.release();
                }
            });
    });
};

// ================= RUNNER =================
const seedDatabase = async () => {
    try {
        console.log('🚀 Starting seeding...');

        await processCSV('Crop.csv', 'CROP');
        await processCSV('farmers.csv', 'FARMER');
        await processCSV('WHOLESALER_INFO.csv', 'WHOLESALER');
        await processCSV('retailers.csv', 'RETAILER');
        await processCSV('WHOLESALER_STOCK.csv', 'WHOLESALER_STOCK');
        await processCSV('retail_stock.csv', 'RETAIL_STOCK');

        console.log('\n🎉 ALL DATA SEEDED SUCCESSFULLY');
        process.exit(0);

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

seedDatabase();