const express = require('express');
const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/dashboard', auth, async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0,0,0,0);
    const end = new Date();
    end.setHours(23,59,59,999);

    const todayTx = await Transaction.find({ createdAt: { $gte: start, $lte: end } });
    const todaySales = todayTx.reduce((sum, t) => sum + t.total, 0);

    const totalProducts = await Product.countDocuments({});
    const totalCustomers = await Customer.countDocuments({});

    res.json({ success: true, data: { todaySales, todayTransactions: todayTx.length, totalProducts, totalCustomers, recent: todayTx.slice(0, 20) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;