const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  car: { type: mongoose.Schema.Types.ObjectId, ref: 'Car', required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'NGN' },
  tx_ref: { type: String, required: true },
  flutterwaveTransactionId: { type: Number },
  status: { type: String, enum: ['paid', 'pending', 'failed'], default: 'pending' },
  rentalStartDate: { type: Date },
  rentalEndDate: { type: Date },
  isTest: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
