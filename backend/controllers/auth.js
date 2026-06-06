const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

exports.signup = async (req, res) => {
    try {
        const { email, password, role, name, city, state, contact } = req.body;

        if (!email || !password || !role || !name) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const validRoles = ['FARMER', 'WHOLESALER', 'RETAILER', 'ADMIN'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            const [authResult] = await connection.query(
                'INSERT INTO USER_AUTH (email, password_hash, role) VALUES (?, ?, ?)',
                [email, hashedPassword, role]
            );

            const userId = authResult.insertId;

            if (role === 'FARMER') {
                await connection.query(
                    'INSERT INTO FARMER (user_id, name, city, state, contact) VALUES (?, ?, ?, ?, ?)',
                    [userId, name, city, state, contact]
                );
            } else if (role === 'WHOLESALER') {
                await connection.query(
                    'INSERT INTO WHOLESALER (user_id, name, city, state, contact) VALUES (?, ?, ?, ?, ?)',
                    [userId, name, city, state, contact]
                );
            } else if (role === 'RETAILER') {
                await connection.query(
                    'INSERT INTO RETAILER (user_id, name, city, state, contact) VALUES (?, ?, ?, ?, ?)',
                    [userId, name, city, state, contact]
                );
            }

            await connection.commit();
            res.status(201).json({ message: 'User created successfully' });
        } catch (err) {
            await connection.rollback();
            console.error(err);
            if (err.code === 'ER_DUP_ENTRY') {
                res.status(409).json({ message: 'Email already exists' });
            } else {
                res.status(500).json({ message: 'Error creating user' });
            }
        } finally {
            connection.release();
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const [users] = await db.query('SELECT * FROM USER_AUTH WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = users[0];
        let isMatch = false;
        if (user.password_hash === 'password_hash' && password === 'password123') {
            isMatch = true; // Fallback for the dummy seeded users
        } else {
            isMatch = await bcrypt.compare(password, user.password_hash);
        }

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        let entityId = null;
        let name = '';

        if (user.role === 'FARMER') {
            const [entity] = await db.query('SELECT id, name FROM FARMER WHERE user_id = ?', [user.id]);
            if(entity.length > 0) { entityId = entity[0].id; name = entity[0].name; }
        } else if (user.role === 'WHOLESALER') {
            const [entity] = await db.query('SELECT id, name FROM WHOLESALER WHERE user_id = ?', [user.id]);
            if(entity.length > 0) { entityId = entity[0].id; name = entity[0].name; }
        } else if (user.role === 'RETAILER') {
            const [entity] = await db.query('SELECT id, name FROM RETAILER WHERE user_id = ?', [user.id]);
            if(entity.length > 0) { entityId = entity[0].id; name = entity[0].name; }
        }

        const token = jwt.sign(
            { userId: user.id, role: user.role, entityId, email: user.email, name },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ token, role: user.role, entityId, name });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
