const express = require('express');
const Customer = require('../models/Customer');
const auth = require('../middleware/auth');

const router = express.Router();

// Create customer
router.post('/', auth, async (req, res) => {
  try {
    const customer = await Customer.create(req.body);
    res.json({ success: true, data: customer });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Get customers
router.get('/', auth, async (req, res) => {
  try {
    const { q } = req.query;
    const filter = q ? { $text: { $search: q } } : {};
    const customers = await Customer.find(filter).sort({ createdAt: -1 }).limit(500);
    res.json({ success: true, data: customers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update customer
router.put('/:id', auth, async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: customer });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Delete customer (Updated for consistency)
router.delete('/:id', auth, async (req, res) => {
  try {
    await Customer.findByIdAndDelete(req.params.id);
    res.json({ success: true }); // Now matches other delete routes
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;