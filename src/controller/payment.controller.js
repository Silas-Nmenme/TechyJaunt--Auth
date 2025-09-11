// src/controllers/payment.controller.js
const axios = require('axios');
const Flutterwave = require('flutterwave-node-v3');
const Payment = require('../models/payment.schema.js');
const Car = require('../models/car.schema.js');
const User = require('../models/user.schema.js');
const sendSms = require('../utils/sendSms.js');
const sendEmail = require('../utils/sendEmail.js');
const fs = require('fs').promises;
const path = require('path');

const flw = new Flutterwave(process.env.FLW_PUBLIC_KEY, process.env.FLW_SECRET_KEY);

// Format date nicely
const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

// Calculate number of days between dates
const calculateDays = (startDate, endDate) => {
  if (!startDate || !endDate) return 1;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  return Math.max(1, days);
};

// Calculate total amount
const calculateTotal = (pricePerDay, startDate, endDate) => {
  if (!pricePerDay) return 0;
  const days = calculateDays(startDate, endDate);
  return pricePerDay * days;
};

// Generate receipt HTML from template
const generateReceiptHtml = async (user, cars, payment, txRef, transactionId) => {
  let html = await fs.readFile(path.join(__dirname, '../../templates/receipt.html'), 'utf8');

  // Build car details HTML as a table
  let carDetailsHtml = '<table class="table table-striped">';
  carDetailsHtml += '<thead><tr><th>Car</th><th>Rental Start</th><th>Rental End</th><th>Total Paid</th></tr></thead>';
  carDetailsHtml += '<tbody>';
  for (let i = 0; i < cars.length; i++) {
    const car = cars[i];
    const carAmount = calculateTotal(car.price, payment.startDate, payment.endDate);
    carDetailsHtml += `<tr>`;
    carDetailsHtml += `<td>${car.make} ${car.model} (${car.year})</td>`;
    carDetailsHtml += `<td>${formatDate(payment.startDate)}</td>`;
    carDetailsHtml += `<td>${formatDate(payment.endDate)}</td>`;
    carDetailsHtml += `<td>₦${carAmount}</td>`;
    carDetailsHtml += `</tr>`;
  }
  carDetailsHtml += '</tbody></table>';

  html = html.replace(/{{customer_name}}/g, user.name || '');
  html = html.replace(/{{customer_email}}/g, user.email || '');
  html = html.replace(/{{customer_phone}}/g, user.phoneNumber || '');
  html = html.replace(/{{car_details}}/g, carDetailsHtml);
  html = html.replace(/{{tx_ref}}/g, txRef);
  html = html.replace(/{{transaction_id}}/g, transactionId || '');
  html = html.replace(/{{total_amount}}/g, payment.amount);
  return html;
};

// Initiate Flutterwave Payment
exports.makePayment = async (req, res) => {
  try {
    let { carIds, email, phone_number, startDate, endDate, userId: userIdFromBody } = req.body;

    // Prefer authenticated user (req.user), fallback to passed userId for dev
    const userId = req.user && req.user._id ? req.user._id : userIdFromBody;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized. User not logged in.' });
    }

    // Allow carIds to be a single ID or an array of IDs
    if (!carIds) {
      return res.status(400).json({ message: 'All fields are required, carIds must be provided.' });
    }
    if (!Array.isArray(carIds)) {
      carIds = [carIds];
    }
    if (carIds.length === 0 || !email || !phone_number || !startDate || !endDate) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const cars = await Car.find({ _id: { $in: carIds } });
    if (cars.length !== carIds.length) {
      return res.status(404).json({ message: 'One or more cars not found.' });
    }

    // Calculate total amount
    const totalAmount = cars.reduce((sum, car) => sum + calculateTotal(car.price, startDate, endDate), 0);

    const tx_ref = `tx-${Date.now()}-${userId}`;

    // Save pending payment
    const paymentData = {
      user: userId,
      cars: carIds,
      amount: totalAmount,
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
      amount: totalAmount,
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
        description: `Payment for ${cars.length} car(s) rental`,
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

      // Update cars
      const cars = await Car.find({ _id: { $in: payment.cars } });
      for (const car of cars) {
        car.isRented = true;
        car.rentedBy = payment.user;
        car.startDate = payment.startDate;
        car.endDate = payment.endDate;
        car.totalPrice = calculateTotal(car.price, payment.startDate, payment.endDate);
        car.status = 'approved';
        await car.save();
      }

      // Notify user
      const user = await User.findById(payment.user);
      if (user) {
        const carList = cars.map(c => `${c.make} ${c.model}`).join(', ');
        const sms = `Hi ${user.name}, your payment for ${carList} was successful.\nRef: ${txRef}\nAmount: ₦${payment.amount}`;
        if (user.phoneNumber) {
          await sendSms(user.phoneNumber, sms, user._id);
        }

        const emailHtml = await generateReceiptHtml(user, cars, payment, txRef, flutterwaveId);
        if (user.email) {
          await sendEmail(user.email, 'Rental Payment Confirmation', emailHtml);
        }
      }

      return res.status(200).json({ message: 'Payment processed and cars rented' });
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
      console.log('Callback: No tx_ref provided');
      return res.redirect('https://silascarrentals.netlify.app/payment-success.htm');
    }

    const payment = await Payment.findOne({ tx_ref });
    if (!payment) {
      console.log('Callback: Payment record not found for tx_ref:', tx_ref);
      return res.redirect('https://silascarrentals.netlify.app/payment-success.htm');
    }

    // Verify with Flutterwave using tx_ref to get transaction details
    const response = await axios.get(`https://api.flutterwave.com/v3/transactions?tx_ref=${tx_ref}`, {
      headers: {
        Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
      },
    });

    console.log('Callback: Flutterwave response for tx_ref:', tx_ref, response.data);

    const transactions = response.data.data;
    console.log('Callback: Transactions array:', transactions);

    if (!transactions || transactions.length === 0) {
      console.log('Callback: No transaction found for tx_ref:', tx_ref);
      if (payment.status !== 'failed') {
        payment.status = 'failed';
        await payment.save();
      }
      return res.redirect('https://silascarrentals.netlify.app/payment-success.htm');
    }

    const transaction = transactions[0]; // Assuming the first one is the relevant transaction
    console.log('Callback: Transaction details:', transaction);

    if (transaction && (transaction.status === 'successful' || transaction.status === 'completed' || transaction.status === 'success') && transaction.amount >= payment.amount) {
      console.log('Callback: Payment successful for tx_ref:', tx_ref);
      // Update payment if not already
      if (payment.status !== 'successful') {
        payment.status = 'successful';
        payment.flutterwaveTransactionId = transaction.id;
        await payment.save();

        // Update cars
        const cars = await Car.find({ _id: { $in: payment.cars } });
        for (const car of cars) {
          car.isRented = true;
          car.rentedBy = payment.user;
          car.startDate = payment.startDate;
          car.endDate = payment.endDate;
          car.totalPrice = calculateTotal(car.price, payment.startDate, payment.endDate);
          car.status = 'approved';
          await car.save();
        }

        // Notify user
        const user = await User.findById(payment.user);
        if (user) {
          const carList = cars.map(c => `${c.make} ${c.model}`).join(', ');
          const sms = `Hi ${user.name}, your payment for ${carList} was successful.\nRef: ${tx_ref}\nAmount: ₦${payment.amount}`;
          if (user.phoneNumber) {
            await sendSms(user.phoneNumber, sms, user._id);
          }

          const emailHtml = await generateReceiptHtml(user, cars, payment, tx_ref, transaction.id);
          if (user.email) {
            await sendEmail(user.email, 'Rental Payment Confirmation', emailHtml);
          }
        }
      }

      return res.redirect('https://silascarrentals.netlify.app/payment-success.htm');
    } else {
      // Update payment to failed if not already
      if (payment.status !== 'failed') {
        // payment.status = 'failed';
        await payment.save();
      }

      return res.redirect('https://silascarrentals.netlify.app/payment-success.htm');
    }
  } catch (error) {
    console.error('Callback error:', error.message || error);
    return res.redirect('https://silascarrentals.netlify.app/payment-success.htm');
  }
};
