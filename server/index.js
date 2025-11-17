require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const authRoutes = require('./routes/auth');
const accountRoutes = require('./routes/account');
const userProgressRoutes = require('./routes/userProgress');
const worksheetRoutes = require('./routes/worksheets');

const app = express();
const PORT = process.env.SERVER_PORT || 3002;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Security middleware
app.use(helmet());

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const accountLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to specific routes
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/login', authLimiter);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/account', accountLimiter, accountRoutes);
app.use('/api/progress', userProgressRoutes);
app.use('/api/worksheets', worksheetRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Optional informational endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'WazaTutor API Server',
    version: '1.0.0',
    env: NODE_ENV,
  });
});

// In production, serve the React app from build/ on the same origin as the API
if (NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, '..', 'build');
  app.use(express.static(buildPath));

  // For any non-API GET request, serve index.html so React Router can handle it
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// 404 for unmatched routes (API)
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`WazaTutor API server is running on port ${PORT}`);
  console.log(`Environment: ${NODE_ENV}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

module.exports = app;