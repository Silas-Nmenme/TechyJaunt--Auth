const Car = require("../models/car.schema");
const Payment = require("../models/payment.model");

// 🟢 Standard rental (without payment check)
exports.rentCar = async (req, res) => {
  const userId = req.user._id;
  const { carId } = req.params;
  const { startDate, endDate, totalPrice } = req.body;

  try {
    const car = await Car.findById(carId);
    if (!car) return res.status(404).json({ message: "Car not found" });

    if (car.isRented) return res.status(400).json({ message: "Car is already rented" });

    car.isRented = true;
    car.rentedBy = userId;
    car.startDate = startDate;
    car.endDate = endDate;
    car.totalPrice = totalPrice;
    car.status = "pending";

    await car.save();

    return res.status(200).json({ message: "Car rented successfully", car });
  } catch (error) {
    console.error("Error renting car:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// 🟢 Rental with verified Flutterwave payment
exports.rentCarWithPayment = async (req, res) => {
  const userId = req.user._id;
  const { carId } = req.params;
  const { paymentId } = req.body;

  try {
    // Check for a valid successful payment
    const payment = await Payment.findOne({
      _id: paymentId,
      user: userId,
      car: carId,
      status: "paid", // or "successful" if that's your DB field
    });

    if (!payment) {
      return res.status(400).json({ message: "Valid payment required to rent this car" });
    }

    const car = await Car.findById(carId);
    if (!car) return res.status(404).json({ message: "Car not found" });

    if (car.isRented) {
      return res.status(400).json({ message: "Car is already rented" });
    }

    // Assign car rental based on payment
    car.isRented = true;
    car.rentedBy = userId;
    car.startDate = payment.rentalStartDate || new Date(); // fallback
    car.endDate = payment.rentalEndDate || null;
    car.totalPrice = payment.amount;
    car.status = "approved"; // Payment-based rental is auto-approved

    await car.save();

    return res.status(200).json({
      message: "Car rented successfully with payment",
      car,
      payment: {
        id: payment._id,
        amount: payment.amount,
        currency: payment.currency || "NGN",
        transactionId: payment.flutterwaveTransactionId || null,
      },
    });
  } catch (error) {
    console.error("Error renting car with payment:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
