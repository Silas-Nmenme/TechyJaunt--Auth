const Flutterwave = require('flutterwave-node-v3');
const Payment = require('../models/payment.model.js');
const Car = require('../models/car.schema.js');


const flw = new Flutterwave(process.env.FLW_PUBLIC_KEY, process.env.FLW_SECRET_KEY);

// INITIATE PAYMENT
exports.makePayment = async (req, res) => {
  const carId = req.params.carId;

  // Make sure the user is authenticated and has email
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
      redirect_url: 'https://techyjaunt-auth-go43.onrender.com/api/payment/verify',
      customer: {
        email,
        phonenumber: phone_number,
        name: req.user.fullName || "Customer"
      },
      meta: {
        carId,
        userId: userId.toString(),
      },
      customizations: {
        title: 'Car Rental Payment',
        description: `Payment for renting ${car.name}`,
        logo: 'https://your-logo-url.com/logo.png',
      },
    };

   const response = await flw.PaymentInitiation.create(payload);

    if (response.status === 'success') {
      res.status(200).json({ redirectLink: response.data.link });
    } else {
      res.status(500).json({ message: 'Payment initiation failed.' });
    }
  } catch (err) {
    console.error('Flutterwave payment error:', err);
    res.status(500).json({ message: 'Payment error.', error: err.message });
  }
};

// VERIFY PAYMENT AFTER REDIRECT
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
    .update(req.body)
    .digest('hex');

  if (!flutterwaveSignature || flutterwaveSignature !== hash) {
    return res.status(401).json({ message: 'Invalid or missing webhook signature.' });
  }

  const event = JSON.parse(req.body.toString());
  const { event: eventType, data } = event;

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
