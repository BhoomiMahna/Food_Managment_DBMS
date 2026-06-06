const mysql = require('mysql2/promise');
require('dotenv').config();

const query = `
    CREATE PROCEDURE buy_crop(
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
        DECLARE v_harvest_date DATE;
        DECLARE v_expiry_date DATE;
        DECLARE v_deduct DECIMAL(10,2);
        
        DECLARE v_done INT DEFAULT FALSE;
        
        DECLARE cur CURSOR FOR 
            SELECT id, remaining_quantity, farmer_id, COALESCE(discounted_price, price_per_kg), harvest_date, expiry_date 
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
            FETCH cur INTO v_current_prod_id, v_current_rem_qty, v_current_farmer_id, v_current_price, v_harvest_date, v_expiry_date;
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
            INSERT INTO WHOLESALER_STOCK (wholesaler_id, crop_id, quantity_kg, harvest_date, expiry_date, purchase_price_per_kg, selling_price_per_kg, source_farmer_id)
            VALUES (p_wholesaler_id, p_crop_id, v_deduct, v_harvest_date, v_expiry_date, v_current_price, p_selling_price);
            
            SET v_remaining_to_buy = v_remaining_to_buy - v_deduct;
        END LOOP;
        
        CLOSE cur;
        
        COMMIT;
    END
`;

async function fixProc() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'smart_food_supply'
        });
        
        console.log("Dropping old procedure...");
        await connection.query('DROP PROCEDURE IF EXISTS buy_crop');
        
        console.log("Creating fixed procedure...");
        await connection.query(query);
        
        console.log("Fix complete.");
        await connection.end();
    } catch(e) { console.error(e); }
}
fixProc();
