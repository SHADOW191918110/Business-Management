const express = require('express');
const multer = require('multer');
const Product = require('../models/Product');
const auth = require('../middleware/auth');

const router = express.Router();

// Configure multer for in-memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
});

// Create product - now handles image upload
router.post('/', auth, upload.single('productImage'), async (req, res) => {
  try {
    const productData = { ...req.body };
    
    if (req.file) {
      productData.imageData = req.file.buffer.toString('base64');
      productData.imageMimeType = req.file.mimetype;
    }

    const product = await Product.create(productData);
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Get products with optional filters
router.get('/', auth, async (req, res) => {
  try {
    const { q, category, status } = req.query;
    const filter = {};
    if (category && category !== 'all') filter.category = category;
    if (status) filter.status = status;
    if (q) filter.$text = { $search: q };

    const products = await Product.find(filter).sort({ createdAt: -1 }).limit(500);
    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update product
router.put('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Delete product
router.delete('/:id', auth, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;