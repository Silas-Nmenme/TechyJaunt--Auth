// models/Newsletter.schema.js
const mongoose = require('mongoose');
module.exports = mongoose.model('Newsletter', new mongoose.Schema({
  email: String,
  subscribedAt: { type: Date, default: Date.now }
}));