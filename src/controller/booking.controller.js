const Payment = require('../models/payment.schema');
const Car = require('../models/car.schema');
const User = require('../models/user.schema');

// Update a booking (cancel, update dates, etc.)
const updateBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const { action, startDate, endDate, status } = req.body;

    // FIXED: Use Booking model instead of Payment
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Check if user owns the booking or is admin
    const userId = req.user._id.toString();
    const isAdmin = req.user.isAdmin;
    const isOwner = booking.user.toString() === userId;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to update this booking" });
    }

    switch (action) {
      case 'cancel':
        // Cancel the booking
        booking.status = 'cancelled';
        await booking.save();

        // Update car status if it was rented
        const car = await Car.findById(booking.car);
        if (car && car.isRented) {
          car.isRented = false;
          car.rentedBy = null;
          car.startDate = null;
          car.endDate = null;
          car.totalPrice = null;
          car.status = 'available';
          await car.save();
        }

        return res.status(200).json({ 
          message: "Booking cancelled successfully",
          booking: booking 
        });

      case 'updateDates':
        // Update rental dates
        if (!startDate || !endDate) {
          return res.status(400).json({ message: "Start date and end date are required" });
        }

        const newStartDate = new Date(startDate);
        const newEndDate = new Date(endDate);

        if (newStartDate >= newEndDate) {
          return res.status(400).json({ message: "End date must be after start date" });
        }

        booking.startDate = newStartDate;
        booking.endDate = newEndDate;
        await booking.save();

        // Update car dates
        const carForDates = await Car.findById(booking.car);
        if (carForDates) {
          carForDates.startDate = newStartDate;
          carForDates.endDate = newEndDate;
          await carForDates.save();
        }

        return res.status(200).json({ 
          message: "Booking dates updated successfully",
          booking: booking 
        });

      case 'updateStatus':
        // Admin can update status directly
        if (!isAdmin) {
          return res.status(403).json({ message: "Only admins can update booking status" });
        }

        if (!status) {
          return res.status(400).json({ message: "Status is required" });
        }

        booking.status = status;
        await booking.save();

        return res.status(200).json({ 
          message: "Booking status updated successfully",
          booking: booking 
        });

      default:
        return res.status(400).json({ message: "Invalid action. Use 'cancel', 'updateDates', or 'updateStatus'" });
    }

  } catch (error) {
    console.error("Error updating booking:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};


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
  getBookingStats,
  updateBooking
};

