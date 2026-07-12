const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect, allowRoles } = require('../middleware/auth');
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
// @desc    Register a new user (DISABLED)
router.post('/signup', authLimiter, (req, res) => {
  return res.status(403).json({ error: 'Public registration is disabled. Please contact your system administrator.' });
});

// @route   POST api/auth/create-user
// @desc    Admin provisions a new user
router.post('/create-user', protect, allowRoles(['admin']), async (req, res) => {
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

    res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
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

// @route   PUT api/auth/profile
// @desc    Update own profile (name and/or password)
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, password } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (name) {
      user.name = name;
    }

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }
      user.passwordHash = password; // Pre-save hook will re-hash
    }

    if (!name && !password) {
      return res.status(400).json({ error: 'Provide at least one field to update (name or password)' });
    }

    await user.save();

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   PATCH api/auth/users/:id/status
// @desc    Manager-only: activate or deactivate a user account
router.patch('/users/:id/status', protect, allowRoles(['fleet_manager']), async (req, res) => {
  try {
    const { status } = req.body;

    if (!['Active', 'Inactive'].includes(status)) {
      return res.status(400).json({ error: 'Status must be Active or Inactive' });
    }

    // Prevent manager from deactivating themselves
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ error: 'You cannot change your own account status' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET api/auth/users
// @desc    Admin lists all users
router.get('/users', protect, allowRoles(['admin']), async (req, res) => {
  try {
    const users = await User.find({}).select('-passwordHash').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   PUT api/auth/users/:id
// @desc    Admin updates a user (name, email, role, status)
router.put('/users/:id', protect, allowRoles(['admin']), async (req, res) => {
  try {
    const { name, email, role, status } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent admin from deactivating or demoting themselves
    if (user._id.toString() === req.user._id.toString()) {
      if (status === 'Inactive') {
        return res.status(400).json({ error: 'Cannot deactivate your own administrator account.' });
      }
      if (role && role !== 'admin') {
        return res.status(400).json({ error: 'Cannot change your own role from administrator.' });
      }
    }

    if (name) user.name = name;
    if (email) {
      const emailExists = await User.findOne({ email, _id: { $ne: req.params.id } });
      if (emailExists) {
        return res.status(400).json({ error: 'Email already in use by another account' });
      }
      user.email = email;
    }
    if (role) user.role = role;
    if (status) user.status = status;

    await user.save();

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   DELETE api/auth/users/:id
// @desc    Admin deletes a user
router.delete('/users/:id', protect, allowRoles(['admin']), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot delete your own administrator account.' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User account deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
