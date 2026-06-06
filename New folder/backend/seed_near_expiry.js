const mysql = require('mysql2/promise');
require('dotenv').config();

async function seedNearExpiry() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'smart_food_supply'
    });

    try {
        console.log('Seeding near-expiry data for testing...');

        // 1. Add near-expiry production for Farmers
        // Get some farmer IDs and crop IDs
        const [farmers] = await connection.execute('SELECT id, city FROM FARMER LIMIT 5');
        const [crops] = await connection.execute('SELECT id FROM CROP LIMIT 5');

        if (farmers.length === 0 || crops.length === 0) {
            console.error('No farmers or crops found. Run main seed first.');
            return;
        }

        const today = new Date();
        const nearExpiry = new Date(today);
        nearExpiry.setDate(today.getDate() + 5); // 5 days from now (50% discount)
        
        const matureExpiry = new Date(today);
        matureExpiry.setDate(today.getDate() + 15); // 15 days from now (30% discount)

        const formattedNear = nearExpiry.toISOString().split('T')[0];
        const formattedMature = matureExpiry.toISOString().split('T')[0];
        const formattedHarvest = today.toISOString().split('T')[0];

        for (const farmer of farmers) {
            for (const crop of crops) {
                // Add one near expiry
                await connection.execute(
                    'INSERT IGNORE INTO PRODUCTION (farmer_id, crop_id, quantity_kg, remaining_quantity, harvest_date, expiry_date, price_per_kg, region) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    [farmer.id, crop.id, 100, 100, formattedHarvest, formattedNear, 10.00, farmer.city]
                );
                // Add one mature expiry
                await connection.execute(
                    'INSERT IGNORE INTO PRODUCTION (farmer_id, crop_id, quantity_kg, remaining_quantity, harvest_date, expiry_date, price_per_kg, region) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    [farmer.id, crop.id, 200, 200, formattedHarvest, formattedMature, 20.00, farmer.city]
                );
            }
        }

        // 2. Add near-expiry stock for Wholesalers
        const [wholesalers] = await connection.execute('SELECT id FROM WHOLESALER LIMIT 3');
        for (const w of wholesalers) {
            for (const crop of crops) {
                await connection.execute(
                    'INSERT IGNORE INTO WHOLESALER_STOCK (wholesaler_id, crop_id, quantity_kg, harvest_date, expiry_date, purchase_price_per_kg, selling_price_per_kg) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [w.id, crop.id, 50, formattedHarvest, formattedNear, 5.00, 8.00]
                );
            }
        }

        console.log('✅ Near-expiry data seeded successfully!');
    } catch (err) {
        console.error('❌ Error seeding near-expiry data:', err);
    } finally {
        await connection.end();
    }
}

seedNearExpiry();
