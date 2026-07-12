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
      return res.status(401).json({ error: 'Not authorized' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Access denied. Requires role: ${roles.join(', ')}` });
    }

    next();
  };
};

module.exports = {
  protect,
  allowRoles
};
