// routes/contact.routes.js
const express = require("express");
const router = express.Router();
const { sendMessage, getAllMessages } = require("../controller/contact.controller");
const { isAuth } = require("../middlewares/auth");

// POST /api/contact
router.post("/contact", sendMessage);

// Admin-only route (view all messages)
router.get("/contact/messages", isAuth, getAllMessages);

module.exports = router;
