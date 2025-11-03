const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const { registrationSchema, loginSchema } = require('../utils/validation');
const authenticateToken = require('../middleware/auth');

// POST /api/auth/register - User Registration
router.post('/register', async (req, res) => {
  try {
    // Validate input
    const { error, value } = registrationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: error.details[0].message 
      });
    }

    const { username, email, password } = value;

    // Check if user already exists
    const existingUserByEmail = await User.findByEmail(email);
    if (existingUserByEmail) {
      return res.status(400).json({ 
        error: 'Email already registered' 
      });
    }

    const existingUserByUsername = await User.findByUsername(username);
    if (existingUserByUsername) {
      return res.status(400).json({ 
        error: 'Username already taken' 
      });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const newUser = await User.create(username, email, passwordHash);

    // Generate JWT token
    const token = generateToken({
      userId: newUser.user_id,
      username: newUser.username,
      email: newUser.email
    });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        userId: newUser.user_id,
        username: newUser.username,
        email: newUser.email
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      error: 'An error occurred during registration' 
    });
  }
});

// POST /api/auth/login - User Login
router.post('/login', async (req, res) => {
  try {
    // Validate input
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: error.details[0].message 
      });
    }

    const { email, password } = value;

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.user_id,
      username: user.username,
      email: user.email
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        userId: user.user_id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'An error occurred during login' 
    });
  }
});

// GET /api/auth/verify - Verify JWT token
router.get('/verify', authenticateToken, (req, res) => {
  res.json({
    valid: true,
    user: {
      userId: req.user.userId,
      username: req.user.username,
      email: req.user.email
    }
  });
});

// POST /api/auth/logout - Logout (client-side token removal)
router.post('/logout', (req, res) => {
  // With JWT, logout is primarily handled client-side by removing the token
  // This endpoint can be used for additional server-side logging if needed
  res.json({ 
    message: 'Logout successful' 
  });
});

module.exports = router;
