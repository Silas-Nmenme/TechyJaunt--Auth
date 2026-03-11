const express = require('express');
const { 
  signup, 
  login, 
  makeAdmin, 
  forgotPassword, 
  resetPassword, 
  verifyOtp, 
  verifyEmail, 
  initiateGoogleAuth,
  handleGoogleCallback,
  unlinkGoogle, 
  setPasswordForGoogleUser,
  uploadProfilePicture,
  getUserProfile,
  deleteProfilePicture,
  updateProfile,
  getAllUsers,
  searchUsers,
  getStats
} = require('../controller/user.controller');
const { 
  getUserOrders, 
  getOrderById, 
  getOrderStats, 
  getOrderHistory, 
  getActiveRentals 
} = require('../controller/order.controller');
const { isAuth, isAdmin } = require('../middlewares/auth');
const { upload } = require('../config/cloudinary');
const router = express.Router();

// Regular authentication routes
router.post('/signup', signup);
router.post('/login', login);
router.patch('/make-admin/:userId', isAuth, isAdmin, makeAdmin);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:userId', resetPassword);
router.post('/verify-otp', verifyOtp);
router.post('/verify-email/:token', verifyEmail);

//Users 
router.get('/get-users', isAuth, getAllUsers);
router.get('/search-users', searchUsers);
router.get('/stats', isAuth, getStats);

// Server-side Google OAuth routes
router.get('/google', initiateGoogleAuth);
router.get('/google/callback', handleGoogleCallback);
router.delete('/unlink-google/:userId', isAuth, unlinkGoogle);
router.post('/set-password/:userId', isAuth, setPasswordForGoogleUser);

// Profile management routes (protected)
router.get('/profile', isAuth, getUserProfile);
router.put('/profile', isAuth, updateProfile);
router.post('/profile/picture', isAuth, upload.single('profilePicture'), uploadProfilePicture);
router.delete('/profile/picture', isAuth, deleteProfilePicture);

// Order/Rental management routes (protected)
router.get('/orders', isAuth, getUserOrders);
router.get('/orders/stats', isAuth, getOrderStats);
router.get('/orders/history', isAuth, getOrderHistory);
router.get('/orders/active', isAuth, getActiveRentals);
router.get('/orders/:orderId', isAuth, getOrderById);

module.exports = router
