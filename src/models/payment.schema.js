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
    unique: true, // Optional: useful to prevent duplicate tx_refs
    trim: true
  },
  status: {
    type: String,
    enum: ["pending", "successful", "failed"],
    default: 'pending'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  phone_number: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true
  },
  flutterwaveTransactionId: {
    type: String,
    unique: true,
    sparse: true,
    default: undefined 
  }
}, {
  timestamps: true,
  versionKey: false
});

module.exports = mongoose.model('Payment', paymentSchema);
