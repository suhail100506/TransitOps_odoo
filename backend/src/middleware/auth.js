const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'transitops_secret_key_change_me_in_production');
      
      req.user = await User.findById(decoded.id).select('-passwordHash');
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'NOT_AUTHORIZED', message: 'Not authorized, user not found' });
      }

      next();
    } catch (error) {
      console.error('Auth middleware verification error:', error);
      res.status(401).json({ success: false, error: 'NOT_AUTHORIZED', message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ success: false, error: 'NOT_AUTHORIZED', message: 'Not authorized, no token provided' });
  }
};

const allowRoles = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'NOT_AUTHORIZED', message: 'Not authorized' });
    }

    // Role mapping: legacy frontend role -> database role
    const roleMapping = {
      fleet_manager: 'Admin',
      safety_officer: 'Dispatcher',
      financial_analyst: 'Dispatcher',
      driver: 'Driver',
      admin: 'Admin'
    };

    // Map the allowed legacy roles to database roles
    const allowedDbRoles = roles.map(r => roleMapping[r] || r.charAt(0).toUpperCase() + r.slice(1));

    const userMappedRole = roleMapping[req.user.role] || req.user.role;

    if (allowedDbRoles.includes(userMappedRole) || userMappedRole === 'Admin') {
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
