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

// Helper to format dates
function formatDate(date) {
  return new Date(date).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// ===================
// MAKE PAYMENT
// ===================
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

    // Temporary test price (remove or update later)
    car.price = 10;

    const tx_ref = `tx-${Date.now()}-${userId}`;

    const payload = {
      tx_ref,
      amount: car.price,
      currency: 'NGN',
      redirect_url: `https://techyjaunt-auth-go43.onrender.com/api/payment/verify`,
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
        logo: 'https://yourdomain.com/logo/car-logo.webp' // change to your real hosted logo
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

// ===================
// VERIFY PAYMENT
// ===================
exports.verifyPayment = async (req, res) => {
  const { transaction_id } = req.query;

  if (!transaction_id) return res.status(400).json({ message: 'Missing transaction_id in query.' });

  const txId = Number(transaction_id);
  if (isNaN(txId)) return res.status(400).json({ message: 'Invalid transaction ID. Must be a number.' });

  try {
    const response = await flw.Transaction.verify({ id: txId });

    if (response.data.status !== 'successful') {
      return res.redirect('/failed');
    }

    const data = response.data;
    const txRef = data.tx_ref;
    const meta = data.meta || {};
    const amount = data.amount;

    if (!meta.userId || !meta.carId) {
      console.error('Missing userId or carId in meta');
      return res.status(400).json({ message: 'Invalid payment metadata.' });
    }

    const rentalStart = meta.startDate ? new Date(meta.startDate) : new Date();
    const rentalEnd = meta.endDate ? new Date(meta.endDate) : null;
    const isTest = amount <= 10;

    let payment = await Payment.findOne({ tx_ref: txRef });
    if (!payment) {
      try {
        payment = await Payment.create({
          user: meta.userId,
          car: meta.carId,
          amount,
          currency: data.currency,
          tx_ref: txRef,
          flutterwaveTransactionId: data.id,
          status: 'paid',
          rentalStartDate: rentalStart,
          rentalEndDate: rentalEnd,
          isTest
        });
        console.log("Payment saved:", payment);
      } catch (err) {
        console.error("Payment save failed:", err.message);
      }
    }

    // Update car
    const car = await Car.findById(meta.carId);
    if (car) {
      car.isRented = true;
      car.rentedBy = meta.userId;
      car.status = 'approved';
      car.startDate = rentalStart;
      car.endDate = rentalEnd;
      car.totalPrice = amount;
      await car.save();
      console.log("Car updated:", car);
    }

    // Send email
    const user = await User.findById(meta.userId);
    if (!user) {
      console.error("User not found for ID:", meta.userId);
    } else {
      const templatePath = path.join(__dirname, '../emailTemplates/receipt.html');
      if (!fs.existsSync(templatePath)) {
        console.error("Receipt template not found:", templatePath);
      } else {
        let htmlTemplate = fs.readFileSync(templatePath, 'utf-8');
        htmlTemplate = htmlTemplate
          .replace('{{customer_name}}', user.name || 'User')
          .replace('{{customer_email}}', user.email || 'N/A')
          .replace('{{customer_phone}}', user.phoneNumber || 'N/A')
          .replace('{{car_make}}', car?.make || '')
          .replace('{{car_model}}', car?.model || '')
          .replace('{{car_year}}', car?.year || '')
          .replace('{{start_date}}', formatDate(rentalStart))
          .replace('{{end_date}}', formatDate(rentalEnd))
          .replace('{{amount}}', amount)
          .replace('{{tx_ref}}', txRef)
          .replace('{{transaction_id}}', data.id);

        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS
          }
        });

        try {
          await transporter.sendMail({
            from: `"Techy Car Rentals" <${process.env.MAIL_USER}>`,
            to: user.email,
            subject: isTest ? '[TEST] Car Rental Payment Receipt' : 'Car Rental Payment Receipt',
            html: htmlTemplate
          });
          console.log("Email sent to:", user.email);
        } catch (mailErr) {
          console.error("Email send failed:", mailErr.message);
        }
      }
    }

    // Send SMS
    if (user?.phoneNumber) {
      try {
        await client.messages.create({
          body: `Hi ${user.name}, your payment for renting ${car.make} ${car.model} was successful. Ref: ${txRef}. Rental: ${formatDate(rentalStart)} to ${formatDate(rentalEnd)}.`,
          from: process.env.TWILIO_PHONE,
          to: user.phoneNumber
        });
        console.log("SMS sent to:", user.phoneNumber);
      } catch (smsErr) {
        console.error("SMS failed:", smsErr.message);
      }
    }

    return res.status(200).json({
      message: "Car rented successfully with payment.",
      car,
      payment: {
        id: payment._id,
        amount: payment.amount,
        status: payment.status,
        rentalStartDate: payment.rentalStartDate,
        rentalEndDate: payment.rentalEndDate,
        tx_ref: payment.tx_ref,
        transaction_id: payment.flutterwaveTransactionId || null,
      },
    });
  } catch (error) {
    console.error("Error during paid rental:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.handleFlutterwaveWebhook = async (req, res) => {
  try {
    const flutterwaveSignature = req.headers['verif-hash'];
    const expectedHash = crypto
      .createHmac('sha256', process.env.FLW_WEBHOOK_SECRET)
      .update(JSON.stringify(req.body))
      .digest('hex');

    // Validate signature
    if (!flutterwaveSignature || flutterwaveSignature !== expectedHash) {
      return res.status(401).json({ message: 'Invalid or missing webhook signature.' });
    }

    const { event: eventType, data } = req.body;
    if (eventType !== 'charge.completed' || data.status !== 'successful') {
      return res.status(200).json({ message: 'Webhook received but no matching action taken.' });
    }

    const meta = data.meta || {};
    const txRef = data.tx_ref;
    const amount = data.amount;

    if (!meta.userId || !meta.carId) {
      console.warn('Webhook meta missing userId or carId:', meta);
      return res.status(400).json({ message: 'Invalid metadata in webhook.' });
    }

    const rentalStart = meta.startDate ? new Date(meta.startDate) : new Date();
    const rentalEnd = meta.endDate ? new Date(meta.endDate) : null;
    const isTest = amount <= 10;

    console.log('Webhook received for payment:', {
      txRef,
      userId: meta.userId,
      carId: meta.carId,
      amount,
      startDate: rentalStart,
      endDate: rentalEnd
    });

    // Create or find payment
    let payment = await Payment.findOne({ tx_ref: txRef });

    if (!payment) {
      try {
        payment = await Payment.create({
          user: meta.userId,
          car: meta.carId,
          amount,
          currency: data.currency,
          tx_ref: txRef,
          flutterwaveTransactionId: data.id,
          status: 'paid',
          rentalStartDate: rentalStart,
          rentalEndDate: rentalEnd,
          isTest
        });
        console.log('Payment stored from webhook:', payment);
      } catch (err) {
        console.error('Payment save failed (webhook):', err.message);
      }
    }

    // Update the car
    try {
      const car = await Car.findById(meta.carId);
      if (car) {
        car.isRented = true;
        car.rentedBy = meta.userId;
        car.status = 'approved';
        car.startDate = rentalStart;
        car.endDate = rentalEnd;
        car.totalPrice = amount;
        await car.save();
        console.log('Car updated from webhook:', car);
      } else {
        console.error('Car not found for ID:', meta.carId);
      }
    } catch (err) {
      console.error('Failed to update car from webhook:', err.message);
    }

    return res.status(200).json({ message: 'Payment and rental successfully recorded via webhook.' });

  } catch (err) {
    console.error('Webhook processing error:', err.message || err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};
