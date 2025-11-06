const rateLimit = require('express-rate-limit');

/**
 * Rate Limiter Configuration
 *
 * Conditionally applies rate limiting based on environment.
 * - Development: Rate limiting disabled for easier testing
 * - Production: Strict rate limits to prevent abuse
 */

const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Creates a rate limiter with environment-aware settings
 * @param {number} windowMs - Time window in milliseconds
 * @param {number} max - Maximum requests per window
 * @param {string} message - Error message when limit is exceeded
 * @returns {Function} Rate limiting middleware
 */
const createRateLimiter = (windowMs, max, message) => {
    // Skip rate limiting entirely in development
    if (isDevelopment) {
        console.log('⚠️  Rate limiting DISABLED (development mode)');
        return (req, res, next) => next(); // No-op middleware
    }

    return rateLimit({
        windowMs,
        max,
        standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
        legacyHeaders: false, // Disable the `X-RateLimit-*` headers
        message: { message },
    });
};

/**
 * Rate limiter for authentication routes (login, register)
 * Production: 10 requests per 15 minutes
 * Development: Unlimited
 */
const authLimiter = createRateLimiter(
    15 * 60 * 1000, // 15 minutes
    10,
    'Too many authentication requests from this IP, please try again after 15 minutes'
);

/**
 * Rate limiter for account management routes
 * Production: 100 requests per hour
 * Development: Unlimited
 */
const accountLimiter = createRateLimiter(
    60 * 60 * 1000, // 1 hour
    100,
    'Too many account requests from this IP, please try again after an hour'
);

module.exports = {
    authLimiter,
    accountLimiter,
};