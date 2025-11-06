const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');
const { validate, registerSchema, loginSchema } = require('../middleware/validation');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set.');
}

// User registration
router.post('/register', authLimiter, validate(registerSchema), async (req, res) => {
    const { name, email, password } = req.body;

    try {
        // Check if email already exists
        const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(409).json({ message: 'Email is already in use.' });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Insert new user
        const newUser = await pool.query(
            'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
            [name, email, password_hash]
        );

        res.status(201).json({
            message: 'User registered successfully.',
            user: newUser.rows[0],
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration.' });
    }
});

// User login
router.post('/login', authLimiter, validate(loginSchema), async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if user exists
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        // Create and sign JWT
        const payload = {
            user: {
                id: user.id,
            },
        };

        jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
            if (err) throw err;
            res.json({
                token,
                userId: user.id,
                message: 'Logged in successfully.',
            });
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login.' });
    }
});

// Verify token
router.get('/verify', (req, res) => {
    const token = req.header('x-auth-token');

    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded.user;
        res.json({ isValid: true, userId: req.user.id });
    } catch (error) {
        res.status(401).json({ message: 'Token is not valid.', isValid: false });
    }
});

// User logout (handled client-side by destroying the token)
router.post('/logout', (req, res) => {
    // Client will remove token. This endpoint is for semantics.
    res.json({ message: 'Logged out successfully.' });
});

module.exports = router;