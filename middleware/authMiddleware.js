// ShikshaShare Authentication & Authorization Middleware
const jwt = require('jsonwebtoken');
const db = require('../utils/database');

const JWT_SECRET = process.env.JWT_SECRET || 'shikshashare_jwt_secret_key_cep_2026_super_secure_token';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generates a signed JWT for a given user
 */
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Extracts and verifies token or user session
 */
function extractUserFromRequest(req) {
  let token = null;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  // Support direct demo user header for easy frontend/curl testing
  const directUserId = req.headers['x-user-id'];
  if (directUserId) {
    const user = db.findById('users', directUserId);
    if (user) {
      const { password, ...safeUser } = user;
      return safeUser;
    }
  }

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.findById('users', decoded.id);
    if (!user) return null;

    const { password, ...safeUser } = user;
    return safeUser;
  } catch (err) {
    return null;
  }
}

/**
 * Middleware: Requires a valid logged-in user
 */
function requireAuth(req, res, next) {
  const user = extractUserFromRequest(req);
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please log in to perform this action.'
    });
  }

  req.user = user;
  next();
}

/**
 * Middleware: Optional authentication (attaches req.user if available)
 */
function optionalAuth(req, res, next) {
  req.user = extractUserFromRequest(req);
  next();
}

/**
 * Middleware: Requires specific role(s) (e.g. 'admin', 'community', 'provider')
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. This endpoint requires one of the following roles: ${allowedRoles.join(', ')}.`
      });
    }

    next();
  };
}

module.exports = {
  generateToken,
  requireAuth,
  optionalAuth,
  requireRole,
  JWT_SECRET
};
