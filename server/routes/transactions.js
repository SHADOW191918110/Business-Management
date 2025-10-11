const express = require('express');
const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');
const router = express.Router();

// Create transaction (sale)
router.post('/', auth, async (req, res) => {
  try {
    const { items, taxRate, paymentMethod, amountReceived, customer } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No items in transaction' });
    }

    // Compute totals and update stock atomically-like
    let subtotal = 0;
    const populatedItems = [];

    for (const it of items) {
      const product = await Product.findById(it.product);
      if (!product) throw new Error('Product not found');
      if (product.stock < it.quantity) throw new Error(`Insufficient stock for ${product.name}`);

      const lineSubtotal = product.price * it.quantity;
      subtotal += lineSubtotal;

      populatedItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: it.quantity,
        subtotal: lineSubtotal
      });
    }

    const taxAmount = +(subtotal * (taxRate ?? 18) / 100).toFixed(2);
    const total = +(subtotal + taxAmount).toFixed(2);

    // Deduct stock
    for (const it of items) {
      await Product.findByIdAndUpdate(it.product, { $inc: { stock: -it.quantity } });
    }

    const change = paymentMethod === 'cash' ? +((amountReceived || 0) - total).toFixed(2) : 0;

    const trx = await Transaction.create({
      items: populatedItems,
      subtotal,
      taxRate: taxRate ?? 18,
      taxAmount,
      total,
      paymentMethod,
      amountReceived,
      change,
      customer: customer || null,
      cashier: req.user.id
    });

    res.json({ success: true, data: trx });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Get transactions (today, recent)
router.get('/', auth, async (req, res) => {
  try {
    const { scope } = req.query; // 'today' | 'recent'
    let filter = {};
    if (scope === 'today') {
      const start = new Date();
      start.setHours(0,0,0,0);
      const end = new Date();
      end.setHours(23,59,59,999);
      filter = { createdAt: { $gte: start, $lte: end } };
    }
    const tx = await Transaction.find(filter).sort({ createdAt: -1 }).limit(200);
    res.json({ success: true, data: tx });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});router.post('/', auth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { items } = req.body;
    // ... (your existing validation)

    for (const it of items) {
      const product = await Product.findById(it.product).session(session);
      if (!product || product.stock < it.quantity) {
        throw new Error(`Insufficient stock for ${product.name}`);
      }
    }

    // All checks passed, now perform updates
    for (const it of items) {
      await Product.findByIdAndUpdate(it.product, { $inc: { stock: -it.quantity } }, { session });
    }

    const trx = await Transaction.create([req.body], { session });

    await session.commitTransaction();
    res.json({ success: true, data: trx[0] });

  } catch (err) {
    await session.abortTransaction();
    res.status(400).json({ success: false, message: err.message });
  } finally {
    session.endSession();
  }
});

module.exports = router;