const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'transitops_secret_key_change_me_in_production');

      // Get user from database (exclude password hash)
      req.user = await User.findById(decoded.id).select('-passwordHash');

      if (!req.user) {
        return res.status(401).json({ error: 'Not authorized, user not found' });
      }

      if (req.user.status === 'Inactive') {
        return res.status(403).json({ error: 'User account is inactive' });
      }

      next();
    } catch (error) {
      console.error('Auth middleware verification error:', error);
      res.status(401).json({ error: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ error: 'Not authorized, no token provided' });
  }
};

const allowRoles = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'NOT_AUTHORIZED', message: 'Not authorized' });
    }

    const userRole = req.user.role ? req.user.role.toLowerCase() : '';

    // Superuser bypass: admin or Admin
    if (userRole === 'admin') {
      return next();
    }

    // Check allowed roles case-insensitively
    const allowed = roles.some(role => {
      const r = role.toLowerCase();
      if (r === userRole) return true;
      if (userRole === 'dispatcher' && ['driver', 'safety_officer', 'financial_analyst'].includes(r)) return true;
      if (userRole === 'fleet_manager' && r === 'admin') return true;
      return false;
    });

    // Mapped role check
    const roleMapping = {
      fleet_manager: 'admin',
      safety_officer: 'dispatcher',
      financial_analyst: 'dispatcher',
      driver: 'driver',
      admin: 'admin'
    };
    const mappedUserRole = roleMapping[userRole] || userRole;
    const allowedMapped = roles.some(role => {
      const r = role.toLowerCase();
      const mappedR = roleMapping[r] || r;
      return mappedUserRole === mappedR;
    });

<<<<<<< HEAD
    // Map the allowed legacy roles to database roles
    const allowedDbRoles = roles.map(r => roleMapping[r] || r.charAt(0).toUpperCase() + r.slice(1));

    const userMappedRole = roleMapping[req.user.role] || req.user.role;

    if (allowedDbRoles.includes(userMappedRole) || userMappedRole === 'Admin') {
=======
    if (allowed || allowedMapped) {
>>>>>>> 0f10f848b7351d3b79020799b8d04759cd86f4a8
      return next();
    }

    return res.status(403).json({
      success: false,
      error: 'FORBIDDEN',
      message: `Access denied. Required roles: ${roles.join(', ')}`
    });
  };
};

module.exports = { protect, allowRoles };
