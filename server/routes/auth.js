const express = require('express');
const bcrypt = require('bcrypt');
const { generateToken, verifyToken } = require('../utils/jwt');
const User = require('../models/User');
const { validate, registerSchema, loginSchema } = require('../middleware/validation');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// User registration
router.post('/register', authLimiter, validate(registerSchema), async (req, res) => {
    const { name, email, password } = req.body;

    try {
        // Check if email already exists
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(409).json({ message: 'Email is already in use.' });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Create new user
        const newUser = await User.create(name, email, password_hash);

        res.status(201).json({
            message: 'User registered successfully.',
            user: newUser,
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration.' });
    }
});

// User login
router.post('/login', authLimiter, validate(loginSchema), async (req, res) => {
    const { email, password } = req.body;

    console.log('=== LOGIN ATTEMPT ===');
    console.log('Email from request:', email);
    console.log('Password from request:', password);


    try {
        // Check if user exists
        const user = await User.findByEmail(email);

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials:email.' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            console.log('FAIL: Password does not match');
            return res.status(401).json({ message: 'Invalid credentials:password wrong.' });
        }

        console.log('SUCCESS: Login successful');

        // Create and sign JWT
        const payload = {
            user: {
                id: user.id,
            },
        };

        // Use generateToken from utils/jwt.js
        const token = generateToken(payload);

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            },
            message: 'Logged in successfully.',
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
        const decoded = verifyToken(token);  // Use verifyToken from utils
        res.json({ isValid: true, id: decoded.user.id });
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