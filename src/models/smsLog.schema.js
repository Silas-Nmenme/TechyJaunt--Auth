// models/smsLog.schema.js
const mongoose = require('mongoose');

const smsLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  phoneNumber: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['sent', 'failed'], required: true },
  provider: { type: String, default: 'KudiSMS' },
  providerResponse: { type: mongoose.Schema.Types.Mixed },
  sentAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SmsLog', smsLogSchema);
