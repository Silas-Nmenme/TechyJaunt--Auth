const Flutterwave = require('flutterwave-node-v3');
const crypto = require('crypto');
const Payment = require('../models/payment.model.js');
const Car = require('../models/car.schema.js');

const flw = new Flutterwave(process.env.FLW_PUBLIC_KEY, process.env.FLW_SECRET_KEY);

exports.makePayment = async (req, res) => {
  const carId = req.params.carId;
  const userId = req.user._id;
  const { email, phone_number } = req.body; // must be provided in request
  

  try {
    const car = await Car.findById(carId);
    if (!car) return res.status(404).json({ message: 'Car not found.' });

    const tx_ref = `tx-${Date.now()}-${userId}`;

   const payload = {
      tx_ref,
      amount: car.price,
      currency: "NGN",
      redirect_url: "https://techyjaunt-auth-go43.onrender.com/api/payment/verify", // or your frontend page
      customer: {
        email,
        phonenumber: phone_number,
        name: req.user.fullName || "Customer",
      },
       meta: {
        carId,
        userId: userId.toString()
      },
      customizations: {
        title: "Car Rental Payment",
        description: `Payment for renting ${car.name}`,
        logo: "https://your-logo-url.com/logo.png"
      }
    };

    const response = await flw.PaymentInitiation.payment(payload);
    if (response.status === "success") {
      res.status(200).json({ redirectLink: response.data.link });
    } else {
      res.status(500).json({ message: 'Payment initiation failed.' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Payment error.', error: err.message });
  }
};

exports.verifyPayment = async (req, res) => {
  const { transaction_id } = req.query;

  try {
    const response = await flw.Transaction.verify({ id: transaction_id });

    if (response.data.status === "successful") {
      const existing = await Payment.findOne({ tx_ref: response.data.tx_ref });
      if (!existing) {
        await Payment.create({
          user: req.user._id,
          car: response.data.meta?.carId || null,
          amount: response.data.amount,
          status: 'paid',
          tx_ref: response.data.tx_ref,
        });
      }

      return res.redirect(`/success?tx_ref=${response.data.tx_ref}`); // Or send a frontend link
    } else {
      return res.redirect('/failed');
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Verification failed.' });
  }
};
exports.handleFlutterwaveWebhook = async (req, res) => {
  const hash = crypto
    .createHmac('sha256', process.env.FLW_WEBHOOK_SECRET)
    .update(req.body)
    .digest('hex');

  const flutterwaveSignature = req.headers['verif-hash'];

  if (!flutterwaveSignature || flutterwaveSignature !== hash) {
    return res.status(401).json({ message: 'Invalid or missing webhook signature.' });
  }

  const event = JSON.parse(req.body.toString());
  const { event: eventType, data } = event;

  if (eventType === 'charge.completed' && data.status === 'successful') {
    try {
      // Prevent duplicate records
      const existing = await Payment.findOne({ tx_ref: data.tx_ref });
      if (!existing) {
        await Payment.create({
          user: data.customer?.id, // You can use metadata to match user/car
          car: data.meta?.carId,
          amount: data.amount,
          currency: data.currency,
          tx_ref: data.tx_ref,
          flutterwaveTransactionId: data.id,
          status: 'paid',
          rentalStartDate: data.meta?.startDate,
          rentalEndDate: data.meta?.endDate,
        });
      }

      return res.status(200).json({ message: 'Payment recorded successfully.' });
    } catch (err) {
      console.error('Webhook processing failed:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  return res.status(200).json({ message: 'Webhook received.' });
};

