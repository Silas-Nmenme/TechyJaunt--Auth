const express = require('express');
const router = express.Router();

const {
  Newsletter,
  getAllSubscribers,
  unsubscribeUser,
  updateSubscription
} = require('../controller/newsletter.controller');

const { isAuthenticated } = require('../middlewares/isAuth');

// Public routes
router.post('/subscribe', Newsletter);
router.get('/subscribers', getAllSubscribers);

// Protected routes
router.put('/update/:subscriberId', isAuthenticated, updateSubscription);
router.delete('/unsubscribe/:subscriberId', isAuthenticated, unsubscribeUser);

module.exports = router;
