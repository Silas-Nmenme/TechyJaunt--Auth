// src/controllers/rental.controller.js
const Car = require("../models/car.schema");
const User = require("../models/user.schema.js");
const sendEmail = require("../utils/sendEmail.js");

// Helper: Format dates
function formatDate(date) {
  return new Date(date).toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// MANUAL RENTAL 
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
    if (!user) return res.status(404).json({ message: "User not found." });

    const html = `
      <h2>Manual Rental Confirmation</h2>
      <p>Hello ${user.name || "User"},</p>
      <p>Your rental for <strong>${car.make} ${car.model}</strong> has been confirmed manually.</p>
      <ul>
        <li>Rental Start: ${formatDate(car.startDate)}</li>
        <li>Rental End: ${formatDate(car.endDate)}</li>
        <li>Total Price: ₦${car.totalPrice}</li>
      </ul>
      <p>Thank you for choosing TechyJaunt Car Rentals!</p>
    `;

    await sendEmail(user.email, "Manual Rental Confirmation - TechyJaunt", html);

    return res.status(200).json({ message: "Car rented successfully", car });
  } catch (error) {
    console.error("Error during manual rental:", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
