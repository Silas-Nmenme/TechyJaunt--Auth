const express = require('express');
const { signUp, login, makeAdmin } = require('../controller/user.controller');
const router = express.Router();



router.post('/signup', signUp);
router.post('/login', login);
router.patch('/make-admin/:userId', makeAdmin );






module.exports = router;