const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  car: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Car',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'NGN',
    trim: true
  },
  tx_ref: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  flutterwaveTransactionId: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['paid', 'failed', 'pending'],
    default: 'paid'
  },
  rentalStartDate: {
    type: Date,
    required: true
  },
  rentalEndDate: {
    type: Date,
    required: true
  },
  notes: {
    type: String,
    trim: true,
    default: null
  }
}, {
  timestamps: true,
  versionKey: false
});

module.exports = mongoose.model('Payment', paymentSchema);
