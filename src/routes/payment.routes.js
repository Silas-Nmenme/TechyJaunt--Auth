const express = require('express');
const router = express.Router();
const { makePayment, verifyPayment, handleFlutterwaveWebhook } = require('../controller/payment.controller');
const { isAuthenticated } = require('../middlewares/isAuth');

router.post('/pay/:carId', isAuthenticated, makePayment);
router.get('/callback', isAuthenticated, verifyPayment);

router.post('/webhook/flutterwave', express.raw({ type: 'application/json' }), handleFlutterwaveWebhook);


module.exports = router;
