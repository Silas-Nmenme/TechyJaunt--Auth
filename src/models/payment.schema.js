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
  },
  flutterwaveTransactionId: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ["pending", "successful", "failed"],
    default: 'pending'
  },
  rentalStartDate: {
    type: Date,
    required: true
  },
  rentalEndDate: {
    type: Date,
    required: true
  },

}, {
  timestamps: true,
  versionKey: false
});

module.exports = mongoose.model('Payment', paymentSchema);
