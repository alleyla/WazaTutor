const express = require('express');
const pool = require('../db/pool');
const auth = require('../middleware/auth');
const { validate, updateAccountSchema } = require('../middleware/validation');
const { accountLimiter } = require('../middleware/rateLimiter');
const router = express.Router();

// Get user account details
router.get('/', auth, accountLimiter, async (req, res) => {
    try {
        const user = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [req.user.id]);
        if (user.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user.rows[0]);
    } catch (error) {
        console.error('Get account error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update user account details
router.put('/', auth, accountLimiter, validate(updateAccountSchema), async (req, res) => {
    const { name, email } = req.body;
    const userId = req.user.id;

    try {
        // Check if the new email is already in use by another user
        if (email) {
            const emailExists = await pool.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, userId]);
            if (emailExists.rows.length > 0) {
                return res.status(409).json({ message: 'Email is already in use.' });
            }
        }
        
        // Build the update query dynamically
        const fields = [];
        const values = [];
        let query = 'UPDATE users SET ';

        if (name) {
            fields.push('name');
            values.push(name);
        }
        if (email) {
            fields.push('email');
            values.push(email);
        }

        // Construct the SET part of the query
        query += fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
        query += ` WHERE id = $${fields.length + 1} RETURNING id, name, email`;
        values.push(userId);
        
        const updatedUser = await pool.query(query, values);

        if (updatedUser.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            message: 'Account updated successfully.',
            user: updatedUser.rows[0],
        });
    } catch (error) {
        console.error('Update account error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;