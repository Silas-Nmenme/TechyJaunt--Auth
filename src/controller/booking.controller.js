const Payment = require('../models/payment.schema');
const Car = require('../models/car.schema');
const User = require('../models/user.schema');

// Get all bookings (for admin dashboard)
const getAllBookings = async (req, res) => {
  try {
    // Get all successful payments (bookings)
    const bookings = await Payment.find({ status: 'successful' })
      .populate('user', 'name email phoneNumber')
      .populate('car', 'make model year image')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Bookings fetched successfully",
      bookings
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get user's own bookings
const getUserBookings = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const bookings = await Payment.find({ user: userId, status: 'successful' })
      .populate('car', 'make model year image price')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "User bookings fetched successfully",
      bookings
    });
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get booking stats (for admin)
const getBookingStats = async (req, res) => {
  try {
    const totalBookings = await Payment.countDocuments({ status: 'successful' });
    
    const revenueResult = await Payment.aggregate([
      { $match: { status: 'successful' } },
      { $group: { _id: null, totalRevenue: { $sum: '$amount' } } }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    // Get active rentals (cars that are currently rented)
    const activeRentals = await Car.countDocuments({ isRented: true });

    // Get pending payments
    const pendingPayments = await Payment.countDocuments({ status: 'pending' });

    return res.status(200).json({
      totalBookings,
      totalRevenue,
      activeRentals,
      pendingPayments
    });
  } catch (error) {
    console.error("Error fetching booking stats:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  getAllBookings,
  getUserBookings,
  getBookingStats
};

