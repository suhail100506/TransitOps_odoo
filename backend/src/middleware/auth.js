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

module.exports = { protect };
