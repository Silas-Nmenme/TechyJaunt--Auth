// src/routes/payment.routes.js
const express = require('express');
const router = express.Router();
const {
  makePayment,
  handleFlutterwaveWebhook
} = require('../controller/payment.controller');
const { isAuthenticated } = require('../middlewares/isAuth');

// ============================
// Initiate payment for a car rental
// Matches frontend: /api/payment/pay/:carId
// ============================
router.post('/pay/:carId', isAuthenticated, makePayment);

// ============================
// Flutterwave webhook for payment confirmation
// ============================
router.post(
  '/webhook/flutterwave',
  express.raw({ type: 'application/json' }), // Keep raw body for signature validation
  handleFlutterwaveWebhook
);

module.exports = router;
