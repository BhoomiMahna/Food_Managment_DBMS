const mysql = require('mysql2/promise');
require('dotenv').config();

const queries = [
    `ALTER TABLE PRODUCTION ADD COLUMN remaining_quantity DECIMAL(10,2) NOT NULL DEFAULT 0`,
    `ALTER TABLE PRODUCTION ADD COLUMN discounted_price DECIMAL(10,2)`,
    `ALTER TABLE PRODUCTION ADD COLUMN region VARCHAR(100)`,
    `UPDATE PRODUCTION SET remaining_quantity = quantity_kg WHERE remaining_quantity = 0`,
    `ALTER TABLE PRODUCTION ADD UNIQUE KEY idx_prod_unique (farmer_id, crop_id, harvest_date, expiry_date)`,
    
    `CREATE TABLE IF NOT EXISTS TRANSACTIONS (
        transaction_id INT AUTO_INCREMENT PRIMARY KEY,
        wholesaler_id INT NOT NULL,
        farmer_id INT NOT NULL,
        crop_id INT NOT NULL,
        quantity DECIMAL(10,2) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        transaction_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (wholesaler_id) REFERENCES WHOLESALER(id),
        FOREIGN KEY (farmer_id) REFERENCES FARMER(id),
        FOREIGN KEY (crop_id) REFERENCES CROP(id)
    )`,
    `CREATE INDEX idx_production_region ON PRODUCTION(region)`,
    `CREATE INDEX idx_production_expiry_date ON PRODUCTION(expiry_date)`,
    `DROP TRIGGER IF EXISTS trg_auto_discount_production_insert`,
    `CREATE TRIGGER trg_auto_discount_production_insert
    BEFORE INSERT ON PRODUCTION
    FOR EACH ROW
    BEGIN
        IF NEW.expiry_date <= CURRENT_DATE() + INTERVAL 3 DAY THEN
            SET NEW.discounted_price = NEW.price_per_kg * 0.8;
        ELSE
            SET NEW.discounted_price = NEW.price_per_kg;
        END IF;
    END`,
    `DROP TRIGGER IF EXISTS trg_auto_discount_production_update`,
    `CREATE TRIGGER trg_auto_discount_production_update
    BEFORE UPDATE ON PRODUCTION
    FOR EACH ROW
    BEGIN
        IF NEW.expiry_date <= CURRENT_DATE() + INTERVAL 3 DAY THEN
            SET NEW.discounted_price = NEW.price_per_kg * 0.8;
        ELSE
            SET NEW.discounted_price = NEW.price_per_kg;
        END IF;
    END`,
    `DROP FUNCTION IF EXISTS check_stock`,
    `CREATE FUNCTION check_stock(p_crop_id INT) RETURNS DECIMAL(10,2)
    DETERMINISTIC
    BEGIN
        DECLARE total_qty DECIMAL(10,2);
        SELECT COALESCE(SUM(remaining_quantity), 0) INTO total_qty
        FROM PRODUCTION
        WHERE crop_id = p_crop_id;
        RETURN total_qty;
    END`,
    `DROP PROCEDURE IF EXISTS add_production`,
    `CREATE PROCEDURE add_production(
        IN p_farmer_id INT,
        IN p_crop_id INT,
        IN p_quantity DECIMAL(10,2),
        IN p_harvest_date DATE,
        IN p_expiry_date DATE,
        IN p_price DECIMAL(10,2),
        IN p_region VARCHAR(100)
    )
    BEGIN
        DECLARE v_crop_exists INT;

        -- Validations
        IF p_crop_id IS NULL THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'crop_id cannot be NULL';
        END IF;

        IF p_quantity <= 0 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'quantity must be greater than 0';
        END IF;

        SELECT COUNT(*) INTO v_crop_exists FROM CROP WHERE id = p_crop_id;
        IF v_crop_exists = 0 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid crop_id: Crop does not exist';
        END IF;

        -- Insert (trigger handles discounted_price)
        INSERT IGNORE INTO PRODUCTION (farmer_id, crop_id, quantity_kg, remaining_quantity, harvest_date, expiry_date, price_per_kg, region)
        VALUES (p_farmer_id, p_crop_id, p_quantity, p_quantity, p_harvest_date, p_expiry_date, p_price, p_region);
    END`,
    `DROP PROCEDURE IF EXISTS get_available_crops`,
    `CREATE PROCEDURE get_available_crops(IN p_region VARCHAR(100))
    BEGIN
        IF p_region IS NULL OR p_region = '' THEN
            SELECT c.id AS crop_id, c.name AS crop_name, SUM(p.remaining_quantity) AS quantity, p.farmer_id, f.name AS farmer_name, p.region, p.price_per_kg AS original_price, MIN(p.discounted_price) AS discounted_price,
                   CASE WHEN MIN(p.expiry_date) <= CURRENT_DATE() + INTERVAL 3 DAY THEN 'Near Expiry' ELSE 'Fresh' END AS expiry_status
            FROM PRODUCTION p
            JOIN CROP c ON p.crop_id = c.id
            JOIN FARMER f ON p.farmer_id = f.id
            WHERE p.remaining_quantity > 0
            GROUP BY p.crop_id, p.farmer_id, c.name, f.name, p.region, p.price_per_kg;
        ELSE
            SELECT c.id AS crop_id, c.name AS crop_name, SUM(p.remaining_quantity) AS quantity, p.farmer_id, f.name AS farmer_name, p.region, p.price_per_kg AS original_price, MIN(p.discounted_price) AS discounted_price,
                   CASE WHEN MIN(p.expiry_date) <= CURRENT_DATE() + INTERVAL 3 DAY THEN 'Near Expiry' ELSE 'Fresh' END AS expiry_status
            FROM PRODUCTION p
            JOIN CROP c ON p.crop_id = c.id
            JOIN FARMER f ON p.farmer_id = f.id
            WHERE p.remaining_quantity > 0 AND p.region = p_region
            GROUP BY p.crop_id, p.farmer_id, c.name, f.name, p.region, p.price_per_kg;
        END IF;
    END`,
    `DROP PROCEDURE IF EXISTS buy_crop`,
    `CREATE PROCEDURE buy_crop(
        IN p_wholesaler_id INT,
        IN p_crop_id INT,
        IN p_quantity DECIMAL(10,2),
        IN p_selling_price DECIMAL(10,2)
    )
    BEGIN
        DECLARE v_available DECIMAL(10,2);
        DECLARE v_remaining_to_buy DECIMAL(10,2) DEFAULT p_quantity;
        DECLARE v_current_prod_id INT;
        DECLARE v_current_rem_qty DECIMAL(10,2);
        DECLARE v_current_farmer_id INT;
        DECLARE v_current_price DECIMAL(10,2);
        DECLARE v_deduct DECIMAL(10,2);
        
        DECLARE v_done INT DEFAULT FALSE;
        
        DECLARE cur CURSOR FOR 
            SELECT id, remaining_quantity, farmer_id, discounted_price 
            FROM PRODUCTION 
            WHERE crop_id = p_crop_id AND remaining_quantity > 0 
            ORDER BY expiry_date ASC
            FOR UPDATE;
            
        DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;
        
        -- Handle unexpected errors (rollback on failure)
        DECLARE EXIT HANDLER FOR SQLEXCEPTION
        BEGIN
            ROLLBACK;
            RESIGNAL;
        END;

        -- Validations
        IF p_crop_id IS NULL THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'crop_id cannot be null';
        END IF;
        IF p_quantity <= 0 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'quantity must be > 0';
        END IF;

        START TRANSACTION;

        -- Check total stock with lock
        SELECT COALESCE(SUM(remaining_quantity), 0) INTO v_available FROM PRODUCTION WHERE crop_id = p_crop_id FOR UPDATE;
        
        IF v_available < p_quantity THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insufficient stock';
        END IF;

        OPEN cur;
        
        read_loop: LOOP
            FETCH cur INTO v_current_prod_id, v_current_rem_qty, v_current_farmer_id, v_current_price;
            IF v_done OR v_remaining_to_buy <= 0 THEN
                LEAVE read_loop;
            END IF;
            
            IF v_current_rem_qty <= v_remaining_to_buy THEN
                SET v_deduct = v_current_rem_qty;
            ELSE
                SET v_deduct = v_remaining_to_buy;
            END IF;
            
            -- Deduct stock
            UPDATE PRODUCTION SET remaining_quantity = remaining_quantity - v_deduct WHERE id = v_current_prod_id;
            
            -- Insert into TRANSACTIONS
            INSERT INTO TRANSACTIONS (wholesaler_id, farmer_id, crop_id, quantity, price)
            VALUES (p_wholesaler_id, v_current_farmer_id, p_crop_id, v_deduct, v_current_price);
            
            -- Insert into WHOLESALER_STOCK
            INSERT INTO WHOLESALER_STOCK (wholesaler_id, crop_id, quantity_kg, purchase_date, expiry_date, purchase_price, selling_price)
            VALUES (p_wholesaler_id, p_crop_id, v_deduct, CURRENT_DATE(), CURRENT_DATE() + INTERVAL 30 DAY, v_current_price, p_selling_price);
            
            SET v_remaining_to_buy = v_remaining_to_buy - v_deduct;
        END LOOP;
        
        CLOSE cur;
        
        COMMIT;
    END`,
    `DROP PROCEDURE IF EXISTS apply_discount`,
    `CREATE PROCEDURE apply_discount()
    BEGIN
        UPDATE PRODUCTION 
        SET discounted_price = price_per_kg * 0.8
        WHERE expiry_date <= CURRENT_DATE() + INTERVAL 3 DAY;
    END`
];

async function runUpdates() {
    console.log('Connecting to database...');
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'smart_food_supply',
        multipleStatements: false
    });

    try {
        for (let i = 0; i < queries.length; i++) {
            console.log(`Executing query ${i+1}/${queries.length}...`);
            try {
                await pool.query(queries[i]);
            } catch (err) {
                if (err.code === 'ER_DUP_FIELDNAME') {
                    console.log('Column already exists, skipping...');
                } else if (err.code === 'ER_DUP_KEYNAME') {
                    console.log('Index already exists, skipping...');
                } else if (err.code === 'ER_DUP_ENTRY') {
                    console.log('Duplicate entry for key, skipping...');
                } else {
                    console.error('Error executing query:', err.message);
                    // continue execution for next queries
                }
            }
        }
        console.log('Schema updates executed successfully!');
    } catch (err) {
        console.error('Fatal Error:', err);
    } finally {
        await pool.end();
    }
}

runUpdates();
