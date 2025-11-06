const { verifyToken } = require('../utils/jwt');

function authenticateToken(req, res, next) {
    const token = req.header('x-auth-token') ||
                  req.headers['x-auth-token'];

  if (!token) {
      console.log('authenticateToken: no token', req.headers);
    return res.status(401).json({ 
      message: 'Access denied. No token provided.'
    });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded.user;
    next();
  } catch (error) {
      console.log('authenticateToken: Invalid or expired token', req.headers);
    return res.status(403).json({ 
      message: 'Invalid or expired token.'
    });
  }
}

module.exports = authenticateToken;
