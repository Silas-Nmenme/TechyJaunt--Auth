const Payment = require('../models/payment.schema');
const Booking = require('../models/booking.schema');
const Car = require('../models/car.schema');

/**
 * Get all orders (rentals) for the logged-in user
 * Displays all rental orders with complete details
 */
const getUserOrders = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status } = req.query;

    // Build query - get orders for the logged-in user
    let query = { user: userId };
    
    // Filter by status if provided
    if (status && ['pending', 'successful', 'failed'].includes(status)) {
      query.status = status;
    }

    // Fetch all payments/orders for the user with car details
    const orders = await Payment.find(query)
      .populate({
        path: 'car',
        select: 'make model year image color price description'
      })
      .sort({ createdAt: -1 });

    // Get additional booking details if available
    const ordersWithBookingDetails = await Promise.all(
      orders.map(async (order) => {
        const booking = await Booking.findOne({ payment: order._id });
        return {
          ...order.toObject(),
          bookingDetails: booking ? {
            bookingId: booking._id,
            bookingStatus: booking.status,
            notes: booking.notes,
            adminNotes: booking.adminNotes
          } : null
        };
      })
    );

    return res.status(200).json({
      message: 'Orders fetched successfully',
      totalOrders: ordersWithBookingDetails.length,
      orders: ordersWithBookingDetails
    });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

/**
 * Get a specific order by ID for the logged-in user
 */
const getOrderById = async (req, res) => {
  try {
    const userId = req.user._id;
    const { orderId } = req.params;

    const order = await Payment.findOne({ _id: orderId, user: userId })
      .populate({
        path: 'car',
        select: 'make model year image color price description brand'
      });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Get booking details if available
    const booking = await Booking.findOne({ payment: order._id });

    return res.status(200).json({
      message: 'Order fetched successfully',
      order: {
        ...order.toObject(),
        bookingDetails: booking ? {
          bookingId: booking._id,
          bookingStatus: booking.status,
          notes: booking.notes,
          adminNotes: booking.adminNotes,
          approvedBy: booking.approvedBy,
          rejectedBy: booking.rejectedBy,
          approvedAt: booking.approvedAt,
          rejectedAt: booking.rejectedAt
        } : null,
        transactionId: order.flutterwaveTransactionId || null,
        paymentMethod: order.paymentMethod || 'N/A'
      }
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

/**
 * Get order statistics for the logged-in user
 */
const getOrderStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get counts for different payment statuses
    const totalOrders = await Payment.countDocuments({ user: userId });
    const pendingOrders = await Payment.countDocuments({ user: userId, status: 'pending' });
    const completedOrders = await Payment.countDocuments({ user: userId, status: 'successful' });
    const failedOrders = await Payment.countDocuments({ user: userId, status: 'failed' });

    // Calculate total spending
    const spendingResult = await Payment.aggregate([
      { $match: { user: userId, status: 'successful' } },
      { $group: { _id: null, totalSpent: { $sum: '$amount' } } }
    ]);
    const totalSpent = spendingResult.length > 0 ? spendingResult[0].totalSpent : 0;

    // Get active rentals (currently rented cars)
    const activeRentals = await Car.countDocuments({ 
      rentedBy: userId, 
      isRented: true 
    });

    return res.status(200).json({
      totalOrders,
      pendingOrders,
      completedOrders,
      failedOrders,
      totalSpent,
      activeRentals
    });
  } catch (error) {
    console.error('Error fetching order stats:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

/**
 * Get all completed orders (rentals history) for the logged-in user
 */
const getOrderHistory = async (req, res) => {
  try {
    const userId = req.user._id;

    const completedOrders = await Payment.find({ 
      user: userId, 
      status: 'successful' 
    })
      .populate({
        path: 'car',
        select: 'make model year image color'
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: 'Order history fetched successfully',
      totalOrders: completedOrders.length,
      orders: completedOrders
    });
  } catch (error) {
    console.error('Error fetching order history:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

/**
 * Get active rentals for the logged-in user
 */
const getActiveRentals = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find cars currently rented by the user
    const activeRentals = await Car.find({ 
      rentedBy: userId, 
      isRented: true 
    })
      .populate('rentedBy', 'name email phoneNumber');

    // Also get pending payments that haven't been approved yet
    const pendingPayments = await Payment.find({
      user: userId,
      status: 'pending'
    })
      .populate({
        path: 'car',
        select: 'make model year image'
      });

    return res.status(200).json({
      message: 'Active rentals fetched successfully',
      activeRentals,
      pendingPayments,
      hasActiveRentals: activeRentals.length > 0,
      hasPendingPayments: pendingPayments.length > 0
    });
  } catch (error) {
    console.error('Error fetching active rentals:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = {
  getUserOrders,
  getOrderById,
  getOrderStats,
  getOrderHistory,
  getActiveRentals
};

