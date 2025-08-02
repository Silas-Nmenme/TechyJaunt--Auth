// models/smsLog.schema.js
const mongoose = require("mongoose");

const smsLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  phoneNumber: { type: String, required: true },
  message: { type: String, required: true },
  sentAt: { type: Date, default: Date.now },
  status: { type: String, enum: ["sent", "failed"], default: "sent" },
  providerResponse: { type: Object },
});

module.exports = mongoose.model("SmsLog", smsLogSchema);
