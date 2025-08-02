const Car = require("../models/car.schema");
const Payment = require("../models/payment.schema.js");
const User = require("../models/user.schema.js");
const sendEmail = require("../utils/sendEmail.js");

// Manual Rental (Without Payment Verification) 
exports.rentCar = async (req, res) => {
  const userId = req.user._id;
  const { carId } = req.params;
  const { startDate, endDate, totalPrice } = req.body;

  try {
    const car = await Car.findById(carId);
    if (!car) return res.status(404).json({ message: "Car not found." });
    if (car.isRented) return res.status(400).json({ message: "Car is already rented." });

    car.isRented = true;
    car.rentedBy = userId;
    car.startDate = new Date(startDate);
    car.endDate = new Date(endDate);
    car.totalPrice = totalPrice;
    car.status = "approved";

    await car.save();

    const user = await User.findById(userId);
    const html = `
      <h2>Manual Rental Confirmation</h2>
      <p>Hello ${user?.name || 'User'},</p>
      <p>Your manual rental of <strong>${car.make} ${car.model}</strong> has been confirmed.</p>
      <ul>
        <li>Start Date: ${new Date(startDate).toDateString()}</li>
        <li>End Date: ${new Date(endDate).toDateString()}</li>
        <li>Total Price: ₦${totalPrice}</li>
      </ul>
      <p>Thank you for choosing TechyJaunt Car Rentals!</p>
    `;

    await sendEmail(user.email, 'Manual Rental Confirmation', html);

    return res.status(200).json({ message: "Car rented successfully", car });
  } catch (error) {
    console.error("Error during manual rental:", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Rental After Successful Payment
exports.rentCarWithPayment = async (req, res) => {
  const userId = req.user._id;
  const { carId } = req.params;
  const { paymentId } = req.body;

  try {
    const payment = await Payment.findOne({
      _id: paymentId,
      user: userId,
      car: carId,
      status: "paid",
    });

    if (!payment) {
      return res.status(400).json({ message: "Valid payment required to rent this car." });
    }

    const car = await Car.findById(carId);
    if (!car) return res.status(404).json({ message: "Car not found." });
    if (car.isRented) return res.status(400).json({ message: "Car is already rented." });

    car.isRented = true;
    car.rentedBy = userId;
    car.startDate = payment.rentalStartDate || new Date();
    car.endDate = payment.rentalEndDate || null;
    car.totalPrice = payment.amount;
    car.status = "approved";

    await car.save();

    const user = await User.findById(userId);

    const html = `
      <h2>Rental Confirmation</h2>
      <p>Hello ${user?.name || 'User'},</p>
      <p>Your rental for <strong>${car.make} ${car.model}</strong> has been successfully confirmed.</p>
      <ul>
        <li>Rental Start: ${car.startDate.toDateString()}</li>
        <li>Rental End: ${car.endDate?.toDateString() || 'Not specified'}</li>
        <li>Total Price: ₦${car.totalPrice}</li>
        <li>Transaction ID: ${payment.flutterwaveTransactionId || 'N/A'}</li>
      </ul>
      <p>Thank you for choosing TechyJaunt Car Rentals!</p>
    `;

    await sendEmail(user.email, 'Rental Confirmation - TechyJaunt', html);

    return res.status(200).json({
      message: "Car rented successfully with payment.",
      car,
      payment: {
        id: payment._id,
        amount: payment.amount,
        currency: payment.currency || "NGN",
        transactionId: payment.flutterwaveTransactionId || null,
      },
    });
  } catch (error) {
    console.error("Error during paid rental:", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
