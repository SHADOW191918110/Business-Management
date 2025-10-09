const express = require('express');
const Product = require('../models/Product');
const auth = require('../middleware/auth');

const router = express.Router();

// Simple inventory KPIs & stock adjustment
router.get('/kpis', auth, async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments({});
    const lowStock = await Product.countDocuments({ stock: { $lte: 5 } });
    const outOfStock = await Product.countDocuments({ stock: { $lte: 0 } });
    res.json({ success: true, data: { totalProducts, lowStock, outOfStock } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/adjust/:id', auth, async (req, res) => {
  try {
    const { delta } = req.body; // e.g., +5 or -2
    const updated = await Product.findByIdAndUpdate(req.params.id, { $inc: { stock: delta } }, { new: true });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;