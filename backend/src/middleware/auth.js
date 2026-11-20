const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'shahyog_kart_jwt_super_secret_key_2026_secure_key';

// Verify JWT token from Authorization Bearer header
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token missing or invalid.'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    // Fetch latest user details from DB to ensure user is active & get current status
    const users = await query('SELECT id, name, email, role, phone, status, organization_name FROM users WHERE id = ?', [decoded.id]);
    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User account no longer exists.'
      });
    }

    req.user = users[0];
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid authentication token.' });
  }
};

// Optional auth (for guests or logged-in users)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      const users = await query('SELECT id, name, email, role, phone, status, organization_name FROM users WHERE id = ?', [decoded.id]);
      if (users.length > 0) {
        req.user = users[0];
      }
    }
  } catch (e) {
    // Ignore and proceed as unauthenticated
  }
  next();
};

// Authorize specific roles
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized. Please log in.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Role '${req.user.role}' cannot access this resource.`
      });
    }
    next();
  };
};

// Require verified status for partner roles (seller, ngo, delivery)
const requireVerified = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized.' });
  }

  // Customers and Admins don't need partner verification
  if (['customer', 'admin'].includes(req.user.role)) {
    return next();
  }

  if (req.user.status === 'pending') {
    return res.status(403).json({
      success: false,
      isPendingVerification: true,
      message: 'Your account is currently under review by Shahyog Kart admins. You will be able to perform these actions once approved.'
    });
  }

  if (req.user.status === 'rejected') {
    return res.status(403).json({
      success: false,
      isRejected: true,
      message: 'Your verification request was rejected. Please contact administrator support.'
    });
  }

  next();
};

module.exports = {
  authenticate,
  optionalAuth,
  authorize,
  requireVerified
};
