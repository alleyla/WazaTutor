const rateLimit = require('express-rate-limit');

// Rate limiter for authentication routes (login, register)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: { message: 'Too many requests from this IP, please try again after 15 minutes' },
});

// A more general rate limiter for other authenticated actions
const accountLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests from this IP, please try again after an hour' },
});

module.exports = {
    authLimiter,
    accountLimiter,
};