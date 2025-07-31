const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  car: { type: mongoose.Schema.Types.ObjectId, ref: 'Car', required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'NGN', enum: ['NGN', 'USD'] }, // e.g., NGN, USD, etc.
  status: { type: String, enum: ['paid', 'pending', 'failed'], default: 'pending' },
  tx_ref: { type: String, unique: true, required: true },
  flutterwaveTransactionId: { type: String },
  rentalStartDate: { type: Date },
  rentalEndDate: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Payment', paymentSchema);
