const express = require('express');
const router = express.Router();
const { getAllBookings, getUserBookings, getBookingStats } = require('../controller/booking.controller');
const { isAuth, isAdmin } = require('../middlewares/auth');

// Get all bookings (admin only)
router.get('/', isAuth, isAdmin, getAllBookings);

// Get user's own bookings
router.get('/my-bookings', isAuth, getUserBookings);

// Get booking stats (admin only)
router.get('/stats', isAuth, isAdmin, getBookingStats);

module.exports = router;

