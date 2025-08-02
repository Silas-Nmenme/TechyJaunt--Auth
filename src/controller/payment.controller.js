const axios = require('axios');
const Flutterwave = require('flutterwave-node-v3');
const Payment = require('../models/payment.schema.js');
const Car = require('../models/car.schema.js');
const User = require('../models/user.schema.js');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const flw = new Flutterwave(process.env.FLW_PUBLIC_KEY, process.env.FLW_SECRET_KEY);

// Make payment
exports.makePayment = async (req, res) => {
  const carId = req.params.carId;

  if (!req.user || !req.user._id || !req.user.email) {
    return res.status(401).json({ message: 'User authentication failed.' });
  }

  const userId = req.user._id;
  const { email, phone_number, startDate, endDate } = req.body;

  try {
    const car = await Car.findById(carId);
    if (!car) return res.status(404).json({ message: 'Car not found.' });

    // Temporary price for testing
    car.price = 10;

    const tx_ref = `tx-${Date.now()}-${userId}`;

    const payload = {
      tx_ref,
      amount: car.price,
      currency: 'NGN',
      redirect_url: `https://techyjaunt-auth-go43.onrender.com`, 
      customer: {
        email,
        phonenumber: phone_number,
        name: req.user.name || "Customer"
      },
      meta: {
        carId: carId.toString(),
        userId: userId.toString(),
        startDate,
        endDate
      },
      customizations: {
        title: 'Car Rental Payment',
        description: `Payment for renting ${car.make} ${car.model}`,
        logo: '../logo/car logo.webp',
      }
    };

    const response = await axios.post(
      'https://api.flutterwave.com/v3/payments',
      payload,
      {
        headers: {
          Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.status === 'success') {
      res.status(200).json({ redirectLink: response.data.data.link });
    } else {
      res.status(500).json({ message: 'Payment initiation failed.' });
    }
  } catch (err) {
    console.error('Flutterwave payment error:', err?.response?.data || err.message);
    res.status(500).json({
      message: 'Payment error.',
      error: err?.response?.data?.message || err.message
    });
  }
};

exports.verifyPayment = async (req, res) => {
  const { transaction_id } = req.query;

  if (!transaction_id) {
    return res.status(400).json({ message: 'Missing transaction_id in query.' });
  }

  const txId = Number(transaction_id);
  if (isNaN(txId)) {
    return res.status(400).json({ message: 'Invalid transaction ID. Must be a number.' });
  }

  try {
    const response = await flw.Transaction.verify({ id: txId });

    if (response.data.status !== 'successful') {
      return res.redirect('/failed');
    }

    const txRef = response.data.tx_ref;
    const meta = response.data.meta || {};

    if (!meta.userId || !meta.carId) {
      console.error('Missing userId or carId in meta');
      return res.status(400).json({ message: 'Invalid payment metadata.' });
    }

    // Convert date strings to actual Date objects
    const rentalStart = meta.startDate ? new Date(meta.startDate) : new Date();
    const rentalEnd = meta.endDate ? new Date(meta.endDate) : null;
    const isTest = response.data.amount <= 10;

    // Store payment in DB
    let payment = await Payment.findOne({ tx_ref: txRef });
    if (!payment) {
      payment = await Payment.create({
        user: meta.userId,
        car: meta.carId,
        amount: response.data.amount,
        status: 'paid',
        tx_ref: txRef,
        flutterwaveTransactionId: response.data.id,
        currency: response.data.currency,
        rentalStartDate: rentalStart,
        rentalEndDate: rentalEnd,
        isTest
      });
    }

    // Update car status
    const car = await Car.findById(meta.carId);
    if (car) {
      car.isRented = true;
      car.rentedBy = meta.userId;
      car.status = 'approved';
      car.startDate = rentalStart;
      car.endDate = rentalEnd;
      car.totalPrice = response.data.amount;
      await car.save();
    }

    // Send receipt email
    const user = await User.findById(meta.userId);
    const templatePath = path.join(__dirname, '../emailTemplates/receipt.html');
    let htmlTemplate = fs.readFileSync(templatePath, 'utf-8');

    htmlTemplate = htmlTemplate
      .replace('{{customer_name}}', user?.name || 'User')
      .replace('{{customer_email}}', user?.email || 'N/A')
      .replace('{{customer_phone}}', user?.phoneNumber || 'N/A')
      .replace('{{car_make}}', car?.make || '')
      .replace('{{car_model}}', car?.model || '')
      .replace('{{car_year}}', car?.year || '')
      .replace('{{start_date}}', formatDate(rentalStart))
      .replace('{{end_date}}', formatDate(rentalEnd))
      .replace('{{amount}}', response.data.amount)
      .replace('{{tx_ref}}', txRef)
      .replace('{{transaction_id}}', response.data.id);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Techy Car Rentals" <${process.env.MAIL_USER}>`,
      to: user?.email,
      subject: isTest ? '[TEST] Car Rental Payment Receipt' : 'Car Rental Payment Receipt',
      html: htmlTemplate,
    });

    // Send SMS
    if (user?.phoneNumber) {
      try {
        await client.messages.create({
          body: `Hi ${user.name}, your payment for renting ${car.make} ${car.model} was successful. Ref: ${txRef}. Rental: ${formatDate(rentalStart)} to ${formatDate(rentalEnd)}.`,
          from: process.env.TWILIO_PHONE,
          to: user.phoneNumber,
        });
      } catch (smsErr) {
        console.error('SMS send failed:', smsErr.message);
      }
    }

    // Redirect to dynamic success.html
    return res.redirect(`/success.html?car=${car.make} ${car.model}&amount=${response.data.amount}&tx=${txRef}&start=${formatDate(rentalStart)}&end=${formatDate(rentalEnd)}`);

  } catch (err) {
    console.error('Payment verification error:', err?.response?.data || err.message);
    return res.status(500).json({
      message: 'Payment verification failed.',
      error: err?.response?.data?.message || err.message,
    });
  }
};


//Handles webhook
exports.handleFlutterwaveWebhook = async (req, res) => {
  try {
    const flutterwaveSignature = req.headers['verif-hash'];

    const hash = crypto
      .createHmac('sha256', process.env.FLW_WEBHOOK_SECRET)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (!flutterwaveSignature || flutterwaveSignature !== hash) {
      return res.status(401).json({ message: 'Invalid or missing webhook signature.' });
    }

    const { event: eventType, data } = req.body;

    if (eventType === 'charge.completed' && data.status === 'successful') {
      const meta = data.meta || {};

      if (!meta.userId || !meta.carId) {
        console.warn('Webhook payload missing meta.userId or meta.carId');
        return res.status(400).json({ message: 'Invalid metadata in webhook.' });
      }

      // Avoid duplicate payment records
      let payment = await Payment.findOne({ tx_ref: data.tx_ref });

      if (!payment) {
        payment = await Payment.create({
          user: meta.userId,
          car: meta.carId,
          amount: data.amount,
          currency: data.currency,
          tx_ref: data.tx_ref,
          flutterwaveTransactionId: data.id,
          status: 'paid',
          rentalStartDate: meta.startDate || null,
          rentalEndDate: meta.endDate || null,
          isTest: data.amount <= 10
        });
      }

      // Update Car Rental Status
      const car = await Car.findById(meta.carId);
      if (car && !car.isRented) {
        car.isRented = true;
        car.rentedBy = meta.userId;
        car.status = 'approved';
        car.startDate = meta.startDate || new Date();
        car.endDate = meta.endDate || null;
        car.totalPrice = data.amount;
        await car.save();
      }

      return res.status(200).json({ message: 'Payment and rental successfully recorded.' });
    }

    // For all other events
    return res.status(200).json({ message: 'Webhook received but no action taken.' });
  } catch (err) {
    console.error('Webhook processing failed:', err.message || err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};
