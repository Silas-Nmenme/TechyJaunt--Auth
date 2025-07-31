const axios = require('axios');
const Flutterwave = require('flutterwave-node-v3');
const Payment = require('../models/payment.model.js');
const Car = require('../models/car.schema.js');
const User = require('../models/user.schema.js');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const flw = new Flutterwave(process.env.FLW_PUBLIC_KEY, process.env.FLW_SECRET_KEY);

// INITIATE PAYMENT
exports.makePayment = async (req, res) => {
  const carId = req.params.carId;

  if (!req.user || !req.user._id || !req.user.email) {
    return res.status(401).json({ message: 'User authentication failed.' });
  }

  const userId = req.user._id;
  const { email, phone_number } = req.body;

  try {
    const car = await Car.findById(carId);
    if (!car) return res.status(404).json({ message: 'Car not found.' });

    const tx_ref = `tx-${Date.now()}-${userId}`;

    const payload = {
      tx_ref,
      amount: car.price,
      currency: 'NGN',
      redirect_url: `${process.env.BASE_URL}/api/payment/verify`,
      customer: {
        email,
        phonenumber: phone_number,
        name: req.user.name || "Customer"
      },
      meta: {
        carId: carId.toString(),
        userId: userId.toString(),
        startDate: car.startDate,
        endDate: car.endDate
      },
      customizations: {
        title: 'Car Rental Payment',
        description: `Payment for renting ${car.make} ${car.model}`,
        logo: 'https://your-logo-url.com/logo.png',
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

// VERIFY PAYMENT
exports.verifyPayment = async (req, res) => {
  const { transaction_id } = req.query;

  try {
    const response = await flw.Transaction.verify({ id: transaction_id });

    if (response.data.status === 'successful') {
      const existing = await Payment.findOne({ tx_ref: response.data.tx_ref });

      if (!existing) {
        await Payment.create({
          user: response.data.meta?.userId,
          car: response.data.meta?.carId,
          amount: response.data.amount,
          status: 'paid',
          tx_ref: response.data.tx_ref,
          flutterwaveTransactionId: response.data.id,
          currency: response.data.currency,
          rentalStartDate: response.data.meta?.startDate || null,
          rentalEndDate: response.data.meta?.endDate || null,
        });

        const user = await User.findById(response.data.meta?.userId);
        const car = await Car.findById(response.data.meta?.carId);

        const templatePath = path.join(__dirname, '../emailTemplates/receipt.html');
        let htmlTemplate = fs.readFileSync(templatePath, 'utf-8');

        htmlTemplate = htmlTemplate
          .replace('{{customer_name}}', user.name)
          .replace('{{customer_email}}', user.email)
          .replace('{{customer_phone}}', 'N/A')
          .replace('{{car_make}}', car.make)
          .replace('{{car_model}}', car.model)
          .replace('{{car_year}}', car.year)
          .replace('{{start_date}}', formatDate(car.startDate))
          .replace('{{end_date}}', formatDate(car.endDate))
          .replace('{{amount}}', response.data.amount)
          .replace('{{tx_ref}}', response.data.tx_ref)
          .replace('{{transaction_id}}', response.data.id);

        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS,
          },
        });

        await transporter.sendMail({
          from: `"Techy Rentals" <${process.env.MAIL_USER}>`,
          to: user.email,
          subject: 'Car Rental Payment Receipt',
          html: htmlTemplate,
        });
      }

      return res.redirect(`/success?tx_ref=${response.data.tx_ref}`);
    } else {
      return res.redirect('/failed');
    }
  } catch (err) {
    console.error('Payment verification failed:', err);
    return res.status(500).json({ message: 'Verification failed.', error: err.message });
  }
};

// HANDLE FLUTTERWAVE WEBHOOK
exports.handleFlutterwaveWebhook = async (req, res) => {
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
    try {
      const existing = await Payment.findOne({ tx_ref: data.tx_ref });

      if (!existing) {
        await Payment.create({
          user: data.meta?.userId,
          car: data.meta?.carId,
          amount: data.amount,
          currency: data.currency,
          tx_ref: data.tx_ref,
          flutterwaveTransactionId: data.id,
          status: 'paid',
          rentalStartDate: data.meta?.startDate || null,
          rentalEndDate: data.meta?.endDate || null,
        });
      }

      return res.status(200).json({ message: 'Payment recorded successfully.' });
    } catch (err) {
      console.error('Webhook processing failed:', err);
      return res.status(500).json({ message: 'Internal server error.' });
    }
  }

  return res.status(200).json({ message: 'Webhook received.' });
};

const formatDate = (date) => new Date(date).toLocaleDateString('en-NG', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});
