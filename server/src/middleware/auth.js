const { verifyAccessToken } = require('../utils/jwt');
const logger = require('../config/logger');

/**
 * Middleware to authenticate requests using JWT access token
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    logger.warn({ err: err.message }, 'Invalid access token');
    return res.status(401).json({ error: 'Invalid or expired access token' });
  }
}

/**
 * Middleware to restrict access to specific roles
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

module.exports = { authenticate, authorize };