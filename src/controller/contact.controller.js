// controllers/contact.controller.js

const Contact = require("../models/contact.schema");
const sendEmail = require("../utils/sendEmail");
const emailTemplates = require("../../templates/emailTemplates");

// Handle Contact Form Submission
const sendMessage = async (req, res) => {
  try {
    const { fullName, email, phoneNumber, message } = req.body;

    // Validation
    if (!fullName || !email || !phoneNumber || !message) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    // Save to DB
    const contact = new Contact({ fullName, email, phoneNumber, message });
    await contact.save();

    // Send Email to User confirming receipt
    const userEmailContent = emailTemplates.contactUserTemplate(fullName);
    await sendEmail(email, userEmailContent.subject, userEmailContent.html, userEmailContent.text);

    // Send Email to Admin with contact details
    const adminEmailContent = emailTemplates.contactAdminTemplate(fullName, email, phoneNumber, message);
    await sendEmail(process.env.ADMIN_EMAIL, adminEmailContent.subject, adminEmailContent.html, adminEmailContent.text);

    return res.status(201).json({ success: true, message: "Message sent successfully" });
  } catch (error) {
    console.error("Error sending message:", error);
    return res.status(500).json({ success: false, message: "Server error. Try again later." });
  }
};

//Fetch all contact messages - Admin only
const getAllMessages = async (req, res) => {
  try {
    const messages = await Contact.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

module.exports = {
  sendMessage,
  getAllMessages
};
