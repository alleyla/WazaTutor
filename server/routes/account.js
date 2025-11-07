const express = require('express');
const auth = require('../middleware/auth');
const { validate, updateAccountSchema } = require('../middleware/validation');
const { accountLimiter } = require('../middleware/rateLimiter');
const router = express.Router();
const User = require('../models/User');

// Get user account details
router.get('/', auth, accountLimiter, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Return only safe user data (exclude password_hash)
        res.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                created_at: user.created_at,
                updated_at: user.updated_at
            }
        });

    } catch (error) {
        console.error('Get account error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update user account details
router.put('/', auth, accountLimiter, validate(updateAccountSchema), async (req, res) => {
    const { name, email } = req.body;

    try {
        // Check if the new email is already in use by another user
        if (email) {
            const existingUser = await User.findByEmail(email);
            if (existingUser && existingUser.id !== req.user.id) {
                return res.status(400).json({
                    message: 'Email already registered with another account'
                });
            }
        }

        const updatedUser = await User.update(req.user.id, { name, email });
        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        //Return only safe user data
        res.json({
            message: 'Account updated successfully.',
            user: {
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                created_at: updatedUser.created_at,
                updated_at: updatedUser.updated_at
            }
        });
    } catch (error) {
        console.error('Update account error:', error);
        const status = error.status || 500;
        res.status(status).json({ message: error.message || 'Server error' });
    }
});

module.exports = router;