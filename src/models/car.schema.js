const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
  make: {
    type: String,
    required: true,
    trim: true
  },
  model: {
    type: String,
    required: true,
    trim: true
  },
  year: {
    type: Number,
    required: true,
    min: 1886
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  color: {
    type: String,
    trim: true
  },
  brand: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  image: {
    type: String,
    default: null
  },

  startDate: {
    type: Date,
    default: null
  },
  endDate: {
    type: Date,
    default: null
  },
  totalPrice: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'not-rented'],
    default: 'not-rented'
  },
  isRented: {
    type: Boolean,
    default: false
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  rentedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true,
  versionKey: false
});

// Auto-calculate totalPrice based on rental duration before save
carSchema.pre('save', function (next) {
  this.isAvailable = !this.isRented;

  if (this.startDate && this.endDate && this.price) {
    const diffTime = Math.abs(this.endDate - this.startDate);
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    this.totalPrice = days * this.price;
  }

  next();
});

const Car = mongoose.model('Car', carSchema);
module.exports = Car;
