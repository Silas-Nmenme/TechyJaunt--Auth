// src/routes/payment.routes.js
const express = require('express');
const router = express.Router();
const {
  makePayment,
  handleFlutterwaveWebhook,
  handleCallback
} = require('../controller/payment.controller');
const { isAuthenticated } = require('../middlewares/isAuth');

// Initiate payment for car rental(s)
// Matches frontend: /api/payment/pay

router.post('/pay', isAuthenticated, makePayment);


// Flutterwave webhook for payment confirmation
router.post(
  '/webhook/flutterwave',
  express.raw({ type: 'application/json' }),
  handleFlutterwaveWebhook
);

// Flutterwave callback for user redirection
router.get('/flutterwave/callback', handleCallback);

module.exports = router;
