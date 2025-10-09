const mongoose = require('mongoose');

const TransactionItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  subtotal: { type: Number, required: true }
}, { _id: false });

const TransactionSchema = new mongoose.Schema({
  items: [TransactionItemSchema],
  subtotal: { type: Number, required: true },
  taxRate: { type: Number, default: 18 },
  taxAmount: { type: Number, required: true },
  total: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['cash', 'card', 'upi'], required: true },
  amountReceived: { type: Number },
  change: { type: Number, default: 0 },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  cashier: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', TransactionSchema);