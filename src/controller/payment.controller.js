const axios = require('axios');
const Flutterwave = require('flutterwave-node-v3');
const Payment = require('../models/payment.schema.js');
const Car = require('../models/car.schema.js');
const User = require('../models/user.schema.js');
const sendSms = require('../utils/sendSms.js');
const sendEmail = require('../utils/sendEmail.js');

const flw = new Flutterwave(process.env.FLW_PUBLIC_KEY, process.env.FLW_SECRET_KEY);

// Utility to format date
function formatDate(date) {
  return new Date(date).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Initiate Flutterwave Payment
exports.makePayment = async (req, res) => {
  try {
    const carId = req.params.carId;
    const { email, phone_number, startDate, endDate } = req.body;

    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'Unauthorized. User not logged in.' });
    }

    // Input validation
    if (!email || !phone_number || !startDate || !endDate) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const car = await Car.findById(carId);
    if (!car) return res.status(404).json({ message: 'Car not found.' });

    const tx_ref = `tx-${Date.now()}-${req.user._id}`;

    await Payment.create({
      user: req.user._id,
      car: carId,
      amount: car.price,
      currency: 'NGN',
      tx_ref,
      status: 'pending',
      email,
      phone_number,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      flutterwaveTransactionId: undefined, // avoid null insert
    });

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

// Handle Flutterwave Webhook
exports.handleFlutterwaveWebhook = async (req, res) => {
  try {
    const event = req.body;

    if (!event?.data?.tx_ref) {
      return res.status(400).json({ message: 'Invalid webhook data' });
    }

    const txRef = event.data.tx_ref;
    // Check if payment record exists
    const payment = await Payment.findOne({ tx_ref: txRef });
    if (!payment) return res.status(404).json({ message: 'Payment record not found' });

    if (payment.status === 'successful') {
      return res.status(200).json({ message: 'Payment already processed' });
    }

    if (event.data.status === 'successful' && event.data.amount >= payment.amount) {
      payment.status = 'successful';

      // Avoid saving null or duplicate transaction ID
      if (event.data.id) {
        payment.flutterwaveTransactionId = event.data.id;
      }

      await payment.save();

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

        const emailHtml = `
          <div style="font-family: Arial, sans-serif; color: #333; padding: 20px; background-color: #f9f9f9;">
            <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
              <div style="background-color: #10182F; padding: 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0;">TechyJaunt Car Rentals</h1>
              </div>
              <div style="padding: 30px;">
                <h2 style="color: #10182F;">Hi ${user.name},</h2>
                <p style="font-size: 16px;">Your payment for the car rental has been successfully processed. Below are your rental details:</p>
                <table style="width: 100%; margin-top: 20px; border-collapse: collapse;">
                  <tr><td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Car:</strong></td><td style="padding: 10px; border-bottom: 1px solid #eee;">${car.make} ${car.model}</td></tr>
                  <tr><td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Start Date:</strong></td><td style="padding: 10px; border-bottom: 1px solid #eee;">${formatDate(car.startDate)}</td></tr>
                  <tr><td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>End Date:</strong></td><td style="padding: 10px; border-bottom: 1px solid #eee;">${formatDate(car.endDate)}</td></tr>
                  <tr><td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Total Price:</strong></td><td style="padding: 10px; border-bottom: 1px solid #eee;">₦${payment.amount}</td></tr>
                  <tr><td style="padding: 10px;"><strong>Transaction ID:</strong></td><td style="padding: 10px;">${event.data.id}</td></tr>
                </table>
                <p style="margin-top: 30px; font-size: 16px;">We appreciate your business and look forward to serving you again.</p>
                <div style="margin-top: 40px; text-align: center;">
                  <a href="https://techyjaunt.com" style="background-color: #10182F; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Visit Our Website</a>
                </div>
              </div>
              <div style="background-color: #f1f1f1; text-align: center; padding: 15px; font-size: 12px; color: #777;">
                &copy; ${new Date().getFullYear()} TechyJaunt. All rights reserved.
              </div>
            </div>
          </div>
        `;

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
