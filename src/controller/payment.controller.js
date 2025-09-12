const axios = require('axios');
const Flutterwave = require('flutterwave-node-v3');
const Payment = require('../models/payment.schema.js');
const Car = require('../models/car.schema.js');
const User = require('../models/user.schema.js');
const sendSms = require('../utils/sendSms.js');
const sendEmail = require('../utils/sendEmail.js');
const fs = require('fs');
const path = require('path');

const flw = new Flutterwave(process.env.FLW_PUBLIC_KEY, process.env.FLW_SECRET_KEY);

// Format date
const formatDate = (date) => new Date(date).toLocaleDateString('en-NG', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

// Initiate Flutterwave Payment
exports.makePayment = async (req, res) => {
  try {
    const carId = req.params.carId;
    const { email, phone_number, startDate, endDate } = req.body;

    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'Unauthorized. User not logged in.' });
    }

    if (!email || !phone_number || !startDate || !endDate) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const car = await Car.findById(carId);
    if (!car) return res.status(404).json({ message: 'Car not found.' });

    const tx_ref = `tx-${Date.now()}-${req.user._id}`;

    // Create pending payment record (without flutterwaveTransactionId)
    const paymentData = {
      user: req.user._id,
      car: carId,
      amount: car.price,
      currency: 'NGN',
      tx_ref,
      status: 'pending',
      email,
      phone_number,
      startDate: new Date(startDate),
      endDate: new Date(endDate)
    };

    await Payment.create(paymentData);

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
      customizations: {
        title: 'Car Rental Payment',
        description: `Payment for ${car.make} ${car.model}`,
        logo: '../logo/car-logo.webp'
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

// Flutterwave Webhook
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
      // Update payment record safely
      payment.status = 'successful';
      payment.flutterwaveTransactionId = flutterwaveId;
      await payment.save();

      // Update car status
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

      const user = await User.findById(payment.user);
      if (user) {
        const sms = `Hi ${user.name}, your payment for ${car.make} ${car.model} was successful.\nRef: ${txRef}\nAmount: ₦${payment.amount}`;
        if (user.phoneNumber) {
          await sendSms(user.phoneNumber, sms, user._id);
        }

        // Read receipt template
        const templatePath = path.join(__dirname, '../../templates/receipt.html');
        let emailHtml = fs.readFileSync(templatePath, 'utf-8');

        // Prepare car details HTML
        const carDetailsHtml = `
          <div class="info-pair"><span class="label">Car:</span><span class="value">${car.make} ${car.model}</span></div>
          <div class="info-pair"><span class="label">Start Date:</span><span class="value">${formatDate(car.startDate)}</span></div>
          <div class="info-pair"><span class="label">End Date:</span><span class="value">${formatDate(car.endDate)}</span></div>
          <div class="info-pair"><span class="label">Amount:</span><span class="value">₦${payment.amount}</span></div>
        `;

        // Replace placeholders in template
        emailHtml = emailHtml.replace('{{customer_name}}', user.name)
                             .replace('{{customer_email}}', user.email || '')
                             .replace('{{customer_phone}}', user.phoneNumber || '')
                             .replace('{{car_details}}', carDetailsHtml)
                             .replace('{{tx_ref}}', txRef)
                             .replace('{{transaction_id}}', flutterwaveId)
                             .replace('{{total_amount}}', payment.amount)
                             .replace('&copy; 2025 Silas Car Rentals', `&copy; ${new Date().getFullYear()} TechyJaunt Car Rentals`);

        if (user.email) {
          await sendEmail(user.email, 'Rental Payment Confirmation - TechyJaunt', emailHtml);
        }
      }

      return res.status(200).json({ message: 'Payment processed and car rented' });

    } else {
      payment.status = 'failed';
      await payment.save();
      return res.status(200).json({ message: 'Payment failed or amount mismatch' });
    }

  } catch (error) {
    console.error('Flutterwave webhook error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};
