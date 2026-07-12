const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const rateLimiter = require('../middleware/rateLimiter');

const router = express.Router();

// Limit sensitive auth actions to 10 requests per 15 minutes
const authLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many auth attempts from this IP, please try again after 15 minutes.'
});

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'transitops_secret_key_change_me_in_production', {
    expiresIn: '30d'
  });
};

// @route   POST api/auth/signup
// @desc    Register a new user
// router.post('/signup', authLimiter, async (req, res) => {
router.post('/signup', authLimiter, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Please provide all fields' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    const user = await User.create({
      name,
      email,
      passwordHash: password, // Pre-save hook hashes this
      role
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

// @route   POST api/auth/login
// @desc    Authenticate user and get token
router.post('/login', authLimiter, async (req, res) => {
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

// @route   GET api/auth/me
// @desc    Get current user profile
router.get('/me', protect, async (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
