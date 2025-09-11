// src/controllers/payment.controller.js
const axios = require('axios');
const Flutterwave = require('flutterwave-node-v3');
const Payment = require('../models/payment.schema.js');
const Car = require('../models/car.schema.js');
const User = require('../models/user.schema.js');
const sendSms = require('../utils/sendSms.js');
const sendEmail = require('../utils/sendEmail.js');

const flw = new Flutterwave(process.env.FLW_PUBLIC_KEY, process.env.FLW_SECRET_KEY);

// Format date nicely
const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

// Initiate Flutterwave Payment
exports.makePayment = async (req, res) => {
  try {
    const carId = req.params.carId;
    const { email, phone_number, startDate, endDate, userId: userIdFromBody } = req.body;

    // Prefer authenticated user (req.user), fallback to passed userId for dev
    const userId = req.user && req.user._id ? req.user._id : userIdFromBody;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized. User not logged in.' });
    }

    if (!email || !phone_number || !startDate || !endDate) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const car = await Car.findById(carId);
    if (!car) return res.status(404).json({ message: 'Car not found.' });

    const tx_ref = `tx-${Date.now()}-${userId}`;

    // Save pending payment
    const paymentData = {
      user: userId,
      car: carId,
      amount: car.price,
      currency: 'NGN',
      tx_ref,
      status: 'pending',
      email,
      phone_number,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    };

    await Payment.create(paymentData);

    // Flutterwave payload
    const payload = {
      tx_ref,
      amount: car.price,
      currency: 'NGN',
      redirect_url:
        process.env.FLW_REDIRECT_URL ||
        'https://techyjaunt-auth-go43.onrender.com/api/payment/flutterwave/callback',
      customer: {
        email,
        phonenumber: phone_number,
        name: req.user && req.user.name ? req.user.name : 'Customer',
      },
      customizations: {
        title: 'Car Rental Payment',
        description: `Payment for ${car.make} ${car.model}`,
        logo: process.env.SITE_LOGO || 'https://example.com/logo.png',
      },
    };

    // Call Flutterwave API
    const response = await axios.post('https://api.flutterwave.com/v3/payments', payload, {
      headers: {
        Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.data && response.data.status === 'success') {
      return res.status(200).json({ redirectLink: response.data.data.link });
    } else {
      console.error('Unexpected Flutterwave response:', response.data);
      return res.status(500).json({ message: 'Payment initiation failed.' });
    }
  } catch (error) {
    console.error('Payment Error:', error.message || error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// Flutterwave Webhook Handler
exports.handleFlutterwaveWebhook = async (req, res) => {
  try {
    const event = req.body;

    if (!event?.data?.tx_ref) {
      return res.status(400).json({ message: 'Invalid webhook data' });
    }

    const txRef = event.data.tx_ref;
    const flutterwaveId = event.data.id;

    const payment = await Payment.findOne({ tx_ref: txRef });
    if (!payment) return res.status(404).json({ message: 'Payment record not found' });

    if (payment.status === 'successful') {
      return res.status(200).json({ message: 'Payment already processed' });
    }

    if (event.data.status === 'successful' && event.data.amount >= payment.amount) {
      // Mark payment successful
      payment.status = 'successful';
      payment.flutterwaveTransactionId = flutterwaveId;
      await payment.save();

      // Update car
      const car = await Car.findById(payment.car);
      if (car) {
        car.isRented = true;
        car.rentedBy = payment.user;
        car.startDate = payment.startDate;
        car.endDate = payment.endDate;
        car.totalPrice = payment.amount;
        car.status = 'approved';
        await car.save();
      }

      // Notify user
      const user = await User.findById(payment.user);
      if (user) {
        const sms = `Hi ${user.name}, your payment for ${car.make} ${car.model} was successful.\nRef: ${txRef}\nAmount: ₦${payment.amount}`;
        if (user.phoneNumber) {
          await sendSms(user.phoneNumber, sms, user._id);
        }

        const emailHtml = `
          <h2>Payment Confirmation</h2>
          <p>Dear ${user.name},</p>
          <p>Your payment for the ${car.make} ${car.model} was successful.</p>
          <p><strong>Transaction Ref:</strong> ${txRef}</p>
          <p><strong>Amount:</strong> ₦${payment.amount}</p>
          <p><strong>Rental Period:</strong> ${formatDate(payment.startDate)} to ${formatDate(payment.endDate)}</p>
          <p>Thank you for choosing us!</p>
        `;
        if (user.email) {
          await sendEmail(user.email, 'Rental Payment Confirmation', emailHtml);
        }
      }

      return res.status(200).json({ message: 'Payment processed and car rented' });
    } else {
      payment.status = 'failed';
      await payment.save();
      return res.status(200).json({ message: 'Payment failed or amount mismatch' });
    }
  } catch (error) {
    console.error('Flutterwave webhook error:', error.message || error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Flutterwave Callback Handler for User Redirection
exports.handleCallback = async (req, res) => {
  try {
    const { tx_ref } = req.query;
    if (!tx_ref) {
      return res.redirect('https://silascarrentals.netlify.app/payment-failed.html');
    }

    const payment = await Payment.findOne({ tx_ref });
    if (!payment) {
      return res.redirect('https://silascarrentals.netlify.app/payment-failed.html');
    }

    // Verify with Flutterwave
    const response = await axios.get(`https://api.flutterwave.com/v3/transactions/${tx_ref}/verify`, {
      headers: {
        Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
      },
    });

    const transaction = response.data.data;

    if (transaction && transaction.status === 'successful' && transaction.amount >= payment.amount) {
      // Update payment if not already
      if (payment.status !== 'successful') {
        payment.status = 'successful';
        payment.flutterwaveTransactionId = transaction.id;
        await payment.save();

        // Update car
        const car = await Car.findById(payment.car);
        if (car) {
          car.isRented = true;
          car.rentedBy = payment.user;
          car.startDate = payment.startDate;
          car.endDate = payment.endDate;
          car.totalPrice = payment.amount;
          car.status = 'approved';
          await car.save();
        }

        // Notify user
        const user = await User.findById(payment.user);
        if (user) {
          const sms = `Hi ${user.name}, your payment for ${car.make} ${car.model} was successful.\nRef: ${tx_ref}\nAmount: ₦${payment.amount}`;
          if (user.phoneNumber) {
            await sendSms(user.phoneNumber, sms, user._id);
          }

          const emailHtml = `
            <h2>Payment Confirmation</h2>
            <p>Dear ${user.name},</p>
            <p>Your payment for the ${car.make} ${car.model} was successful.</p>
            <p><strong>Transaction Ref:</strong> ${tx_ref}</p>
            <p><strong>Amount:</strong> ₦${payment.amount}</p>
            <p><strong>Rental Period:</strong> ${formatDate(payment.startDate)} to ${formatDate(payment.endDate)}</p>
            <p>Thank you for choosing us!</p>
          `;
          if (user.email) {
            await sendEmail(user.email, 'Rental Payment Confirmation', emailHtml);
          }
        }
      }

      return res.redirect('https://silascarrentals.netlify.app/payment-success.html');
    } else {
      // Update payment to failed if not already
      if (payment.status !== 'failed') {
        payment.status = 'failed';
        await payment.save();
      }

      return res.redirect('https://silascarrentals.netlify.app/payment-failed.html');
    }
  } catch (error) {
    console.error('Callback error:', error.message || error);
    return res.redirect('https://silascarrentals.netlify.app/payment-failed.html');
  }
};
