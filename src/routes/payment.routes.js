const express = require('express');
const router = express.Router();
const {
  makePayment,
  verifyPayment,
  handleFlutterwaveWebhook
} = require('../controller/payment.controller');
const { isAuthenticated } = require('../middlewares/isAuth');

// Initiate payment for a car rental
router.post('/pay/:carId', isAuthenticated, makePayment);


// Flutterwave webhook for backend payment confirmation
router.post(
  '/webhook/flutterwave',
  express.raw({ type: 'application/json' }), // Required for Flutterwave signature validation
  handleFlutterwaveWebhook
);

module.exports = router;