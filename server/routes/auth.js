const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const router = express.Router();

// Register admin bootstrap (DEV ONLY)
router.post('/bootstrap', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ success: false, message: 'This route is disabled in production.' });
  }
  try {
    const exists = await User.findOne({ username: 'admin' });
    if (exists) return res.json({ success: true, message: 'Admin already exists' });

    const admin = await User.create({
      username: 'admin',
      password: 'admin123',
      role: 'admin',
      name: 'Admin User'
    });
    res.json({ success: true, user: { id: admin._id, username: admin.username } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, role: user.role, name: user.name }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '8h' });
    res.json({ success: true, token, user: { id: user._id, username: user.username, role: user.role, name: user.name } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


module.exports = router;