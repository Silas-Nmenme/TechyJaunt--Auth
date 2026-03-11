const express = require('express');
const { getCurrentUser } = require('../controller/user.controller');
const { isAuth } = require('../middlewares/auth');

const router = express.Router();

// Get current authenticated user
router.get('/me', isAuth, getCurrentUser);

module.exports = router;

