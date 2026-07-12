const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'transitops_secret_key_change_me_in_production', {
    expiresIn: '7d'
  });
};

router.post('/signup', async (req, res) => {
  try {
    let { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Please provide all fields' });
    }

    // Map legacy roles to new roles
    let mappedRole = role;
    if (role === 'fleet_manager') mappedRole = 'Admin';
    else if (role === 'safety_officer') mappedRole = 'Dispatcher';
    else if (role === 'financial_analyst') mappedRole = 'Dispatcher';
    else if (role === 'driver') mappedRole = 'Driver';
    
    // Capitalize first letter to match new roles just in case
    if (mappedRole) {
      mappedRole = mappedRole.charAt(0).toUpperCase() + mappedRole.slice(1);
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    const user = await User.create({
      name,
      email,
      passwordHash: password,
      role: mappedRole
    });

    const token = generateToken(user._id);

    res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      },
      token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.status === 'Inactive') {
      return res.status(403).json({ error: 'User account is inactive' });
    }

    const token = generateToken(user._id);

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      },
      token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/me', protect, async (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
