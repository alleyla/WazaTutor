const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { updateAccountSchema } = require('../utils/validation');
const authenticateToken = require('../middleware/auth');

// All routes in this file are protected
router.use(authenticateToken);

// GET /api/account - Get user account information
router.get('/', async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    res.json({
      user: {
        userId: user.user_id,
        username: user.username,
        email: user.email,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }
    });
  } catch (error) {
    console.error('Get account error:', error);
    res.status(500).json({ 
      error: 'An error occurred while fetching account information' 
    });
  }
});

// PUT /api/account - Update user account information
router.put('/', async (req, res) => {
  try {
    // Validate input
    const { error, value } = updateAccountSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: error.details[0].message 
      });
    }

    // Check if username is being updated and if it's already taken
    if (value.username) {
      const existingUser = await User.findByUsername(value.username);
      if (existingUser && existingUser.user_id !== req.user.userId) {
        return res.status(400).json({ 
          error: 'Username already taken' 
        });
      }
    }

    // Check if email is being updated and if it's already taken
    if (value.email) {
      const existingUser = await User.findByEmail(value.email);
      if (existingUser && existingUser.user_id !== req.user.userId) {
        return res.status(400).json({ 
          error: 'Email already registered' 
        });
      }
    }

    // Update user
    const updatedUser = await User.update(req.user.userId, value);

    res.json({
      message: 'Account updated successfully',
      user: {
        userId: updatedUser.user_id,
        username: updatedUser.username,
        email: updatedUser.email,
        updatedAt: updatedUser.updated_at
      }
    });
  } catch (error) {
    console.error('Update account error:', error);
    res.status(500).json({ 
      error: 'An error occurred while updating account information' 
    });
  }
});

module.exports = router;
