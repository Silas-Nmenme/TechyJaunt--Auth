const axios = require('axios');
const Flutterwave = require('flutterwave-node-v3');
const Payment = require('../models/payment.schema.js');
const Car = require('../models/car.schema.js');
const User = require('../models/user.schema.js');
const crypto = require('crypto');
const sendSms = require('../utils/sendSms.js');

const flw = new Flutterwave(process.env.FLW_PUBLIC_KEY, process.env.FLW_SECRET_KEY);

// Format NG date
function formatDate(date) {
  return new Date(date).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// MAKE PAYMENT 
exports.makePayment = async (req, res) => {
  try {
    const carId = req.params.carId;
    const { email, phone_number, startDate, endDate } = req.body;

    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'Unauthorized. User not logged in.' });
    }

    const car = await Car.findById(carId);
    if (!car) return res.status(404).json({ message: 'Car not found.' });

    const tx_ref = `tx-${Date.now()}-${req.user._id}`;

    const payload = {
      tx_ref,
      amount: car.price,
      currency: 'NGN',
      redirect_url: process.env.FLW_REDIRECT_URL || "http://localhost:4500/api/payment/flutterwave/callback",
      customer: {
        email,
        phonenumber: phone_number,
        name: req.user.name || "Customer"
      },
      meta: {
        userId: req.user._id.toString(),
        carId: carId.toString(),
        startDate,
        endDate
      },
      customizations: {
        title: 'Car Rental Payment',
        description: `Payment for ${car.make} ${car.model}`,
        logo: '../logo/car logo.webp' 
      }
    };

    const response = await axios.post('https://api.flutterwave.com/v3/payments', payload, {
      headers: {
        Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.status === 'success') {
      return res.status(200).json({ redirectLink: response.data.data.link });
    } else {
      return res.status(500).json({ message: 'Payment initiation failed.' });
    }

  } catch (error) {
    console.error("Payment Error:", error.message);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// FLUTTERWAVE WEBHOOK 
exports.handleFlutterwaveWebhook = async (req, res) => {
  try {
    const flutterwaveSignature = req.headers['verif-hash'];
    const hash = crypto
      .createHmac('sha256', process.env.FLW_WEBHOOK_SECRET)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (!flutterwaveSignature || flutterwaveSignature !== hash) {
      return res.status(401).json({ message: 'Invalid webhook signature.' });
    }

    const { event, data } = req.body;
    if (event !== 'charge.completed' || data.status !== 'successful') {
      return res.status(200).json({ message: 'No action taken. Event not successful charge.' });
    }

    const meta = data.meta || {};
    if (!meta.userId || !meta.carId) {
      return res.status(400).json({ message: 'Invalid metadata.' });
    }

    const existing = await Payment.findOne({ tx_ref: data.tx_ref });
    if (!existing) {
      const rentalStart = new Date(meta.startDate || Date.now());
      const rentalEnd = new Date(meta.endDate || Date.now());

      const newPayment = await Payment.create({
        user: meta.userId,
        car: meta.carId,
        amount: data.amount,
        currency: data.currency,
        tx_ref: data.tx_ref,
        flutterwaveTransactionId: data.id,
        status: 'paid',
        rentalStartDate: rentalStart,
        rentalEndDate: rentalEnd
      });

      const car = await Car.findById(meta.carId);
      if (car) {
        car.isRented = true;
        car.rentedBy = meta.userId;
        car.status = 'approved';
        car.startDate = rentalStart;
        car.endDate = rentalEnd;
        car.totalPrice = data.amount;
        await car.save();
      }

      const user = await User.findById(meta.userId);
      if (user?.phoneNumber) {
        const sms = `Hi ${user.name}, your payment for ${car.make} ${car.model} was successful.\nRef: ${data.tx_ref}\nAmount: ₦${data.amount}`;
        await sendSms(user.phoneNumber, sms, user._id);
      }
    }

    return res.status(200).json({ message: 'Webhook processed successfully.' });
  } catch (err) {
    console.error("Webhook Error:", err.message);
    return res.status(500).json({ message: 'Webhook processing failed.' });
  }
};
